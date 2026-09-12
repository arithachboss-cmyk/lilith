import type { Metadata } from "next";
import { ConnectExplorer } from "@/src/components/connect/explorer";
import "./connect.css";

export const metadata: Metadata = {
  title: "Lilithconnect | Explore the world's capitals with Lili",
  description:
    "Let Lili introduce your next city. Explore world capitals, local languages, currencies and sourced residential information for your next chapter abroad.",
  alternates: { canonical: "/connect" },
};

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : undefined;
  return (
    <ConnectExplorer
      initialCountry={value("country")}
      initialLanguage={value("lang")}
      initialAuto={value("auto")}
    />
  );
}
