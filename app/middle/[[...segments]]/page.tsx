/* eslint-disable @next/next/no-html-link-for-pages -- The legacy homepage is a separate static Worker asset; auth uses top-level navigation. */
import { notFound } from "next/navigation";
import { getChatGPTUser, chatGPTSignInPath } from "../../chatgpt-auth";
import Workspace from "../../../src/components/middle/workspace";
import { idSchema } from "../../../src/domain/platform/contracts";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "LILITH by THE MIDDLE | Property Matching",
  robots: { index: false, follow: false },
};
const sections = new Set([
  "discover",
  "matches",
  "add",
  "deals",
  "properties",
  "profile",
  "analytics",
  "notifications",
  "inventory",
  "welcome",
  "login",
  "roles",
]);
export default async function MiddlePage({
  params,
  searchParams,
}: {
  params: Promise<{ segments?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { segments = [] } = await params;
  const section = segments[0] ?? "discover",
    id = segments[1];
  if (
    !sections.has(section) ||
    segments.length > 2 ||
    (id &&
      (!["deals", "properties"].includes(section) ||
        !idSchema.safeParse(id).success)) ||
    (section === "properties" && !id)
  )
    notFound();
  const query = await searchParams;
  const seed =
    typeof query.id === "string" &&
    idSchema.safeParse(query.id).success &&
    (query.kind === "property" || query.kind === "requirement")
      ? { id: query.id, kind: query.kind }
      : undefined;
  return <SignedInWorkspace section={section} id={id} seed={seed} />;
}
async function SignedInWorkspace({
  section,
  id,
  seed,
}: {
  section: string;
  id?: string;
  seed?: { kind: string; id: string };
}) {
  const user = await getChatGPTUser();
  if (!user)
    return (
      <main className="middle-app middle-welcome">
        <a className="middle-brand" href="/">
          <span>LILITH</span>
          <small>by THE MIDDLE</small>
        </a>
        <div>
          <p className="middle-eyebrow">PROPERTY MATCHING, WITH INTENTION.</p>
          <h1>
            The right place.
            <br />
            The right people.
          </h1>
          <p>
            Connect property owners, agents, and clients around a shared brief.
            Discover relevant properties and move forward together.
          </p>
          <a
            className="middle-button"
            href={chatGPTSignInPath(`/middle/${section}${id ? `/${id}` : ""}`)}
            target="_top"
          >
            Sign in to your workspace →
          </a>
          <small>Use your ChatGPT account to sign in securely.</small>
        </div>
        <footer>LILITH by THE MIDDLE · Owner · Agent · Client</footer>
      </main>
    );
  return <Workspace section={section} id={id} seed={seed} />;
}
