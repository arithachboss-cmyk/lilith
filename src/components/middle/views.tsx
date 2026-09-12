"use client";
import Link from "next/link";
import { useState } from "react";
import type { Actor } from "../../domain/platform/contracts";
import type {
  MatchView,
  Property,
  Requirement,
  RoomView,
} from "../../services/platform/records";
import { api } from "./api";
import {
  Empty,
  Loading,
  Notice,
  PageHeading,
  humanize,
  moneyLabel,
  useRemote,
} from "./primitives";
import { PropertyCard } from "./property-card";
interface Page<T> {
  items: T[];
  nextCursor: number | null;
}
export function Discover({
  account,
  seed,
}: {
  account: Actor;
  seed?: { kind: string; id: string };
}) {
  const [cursor, setCursor] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [feedback, setFeedback] = useState("");
  const [selected, setSelected] = useState(seed?.id ?? ""),
    [generationCursor, setGenerationCursor] = useState(0);
  const [mutual, setMutual] = useState<{
    roomId: string;
    match: MatchView;
  } | null>(null);
  const isOwner = account.role === "OWNER",
    kind = isOwner ? "property" : "requirement";
  const inventory = useRemote<Page<Property | Requirement>>(
    `/api/${isOwner ? "properties" : "requirements"}`,
  );
  const matches = useRemote<Page<MatchView>>(`/api/discover?cursor=${cursor}`);
  async function generate() {
    setBusy(true);
    setError("");
    try {
      const result = await api<{
        evaluated: number;
        nextCursor: number | null;
      }>("/api/matches/generate", {
        kind,
        id: selected,
        cursor: generationCursor,
      });
      setGenerationCursor(result.nextCursor ?? 0);
      setFeedback(
        `${result.evaluated} candidates evaluated.${result.nextCursor !== null ? " Select Find matches again to evaluate the next candidates." : " Matching complete for this selection."}`,
      );
      setCursor(0);
      matches.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Matching failed");
    } finally {
      setBusy(false);
    }
  }
  async function interest(
    match: MatchView,
    decision: "PASS" | "INTERESTED" | "SUPER_MATCH",
  ) {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ mutual: boolean; roomId: string | null }>(
        `/api/matches/${match.id}/interests`,
        { decision },
      );
      if (result.mutual && result.roomId)
        setMutual({ roomId: result.roomId, match });
      else
        setFeedback(
          decision === "PASS"
            ? "Passed. You can revisit this property in Matches."
            : "Interest saved. The other party can respond from Matches.",
        );
      setCursor(0);
      matches.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save interest",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="CURATED BY YOUR REQUIREMENTS"
        title="Discover the right connection."
      >
        Relevant properties. Clear reasons. Space to decide.
      </PageHeading>
      <div className="middle-match-toolbar">
        <label>
          <span>{isOwner ? "Your property" : "Your requirement"}</span>
          <select
            value={selected}
            onChange={(event) => {
              setSelected(event.target.value);
              setGenerationCursor(0);
            }}
          >
            <option value="">Choose to find matches</option>
            {inventory.data?.items.map((item) => (
              <option key={item.id} value={item.id}>
                {"name" in item ? item.name : item.title}
              </option>
            ))}
          </select>
        </label>
        <button
          className="middle-button"
          disabled={!selected || busy}
          onClick={generate}
        >
          {busy ? "Working…" : "Find matches"}
        </button>
      </div>
      {(error || matches.error || inventory.error) && (
        <Notice error>{error || matches.error || inventory.error}</Notice>
      )}
      {feedback && <Notice>{feedback}</Notice>}
      {mutual && (
        <section className="middle-mutual" aria-live="polite">
          <span className="middle-eyebrow">A SHARED INTEREST</span>
          <h2>It’s a match.</h2>
          <p>
            {mutual.match.property.name} · {mutual.match.counterparty}
          </p>
          <p>
            {mutual.match.result.reasons
              .filter((reason) => reason.matched)
              .slice(0, 3)
              .map((reason) => reason.text)
              .join(". ")}
            .
          </p>
          <a
            className="middle-button champagne"
            href={`/middle/deals/${mutual.roomId}`}
          >
            Start deal →
          </a>
        </section>
      )}
      {!matches.data && !matches.error && <Loading />}
      {matches.data && (
        <>
          {matches.data.items.length ? (
            <div className="middle-card-grid">
              {matches.data.items.map((match) => (
                <PropertyCard
                  key={match.id}
                  property={match.property}
                  match={match}
                  onInterest={(decision) => interest(match, decision)}
                  busy={busy}
                />
              ))}
            </div>
          ) : (
            <Empty title="Your next connection starts with a brief.">
              <p>
                {inventory.data?.items.length
                  ? "Select your property or requirement above, then find matches. Only candidates that pass your must-haves appear here."
                  : "Add a property or requirement to begin. Real listings will appear when both supply and demand are available."}
              </p>
              <Link className="middle-button" href="/middle/add">
                Add {isOwner ? "property" : "requirement"} →
              </Link>
            </Empty>
          )}
          <div className="middle-pagination">
            {cursor > 0 && (
              <button
                className="middle-button secondary"
                onClick={() => setCursor(Math.max(0, cursor - 10))}
              >
                Previous
              </button>
            )}
            {matches.data.nextCursor !== null && (
              <button
                className="middle-button secondary"
                onClick={() => setCursor(matches.data!.nextCursor!)}
              >
                Next matches →
              </button>
            )}
          </div>
        </>
      )}
      <aside className="middle-note">
        <strong>A considered introduction.</strong>
        <p>
          Super Match signals strong interest. It never bypasses the other
          party’s consent or changes the matching score.
        </p>
      </aside>
    </>
  );
}
export function MatchInbox() {
  const [cursor, setCursor] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [mutualRoom, setMutualRoom] = useState<string | null>(null);
  const matches = useRemote<Page<MatchView>>(`/api/matches?cursor=${cursor}`);
  async function respond(
    match: MatchView,
    decision: "PASS" | "INTERESTED" | "SUPER_MATCH",
  ) {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ mutual: boolean; roomId: string | null }>(
        `/api/matches/${match.id}/interests`,
        { decision },
      );
      if (result.mutual) setMutualRoom(result.roomId);
      matches.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading eyebrow="YOUR CONNECTIONS" title="A little closer.">
        Review interest, respond to introductions, and continue a mutual match.
      </PageHeading>
      {(error || matches.error) && (
        <Notice error>{error || matches.error}</Notice>
      )}
      {mutualRoom && (
        <section className="middle-mutual">
          <h2>It’s a match.</h2>
          <p>Both parties are interested. Your private deal room is ready.</p>
          <a
            className="middle-button champagne"
            href={`/middle/deals/${mutualRoom}`}
          >
            Start deal →
          </a>
        </section>
      )}
      {!matches.data && !matches.error && <Loading />}
      {matches.data?.items.length === 0 && (
        <Empty title="No introductions yet.">
          <Link className="middle-button" href="/middle/discover">
            Discover matches →
          </Link>
        </Empty>
      )}
      <div className="middle-card-grid">
        {matches.data?.items.map((match) => (
          <PropertyCard
            key={match.id}
            property={match.property}
            match={match}
            busy={busy}
            onInterest={
              match.roomId || !match.result.hardConstraintPassed
                ? undefined
                : (decision) => respond(match, decision)
            }
          />
        ))}
      </div>
      <div className="middle-pagination">
        {cursor > 0 && (
          <button
            onClick={() => setCursor(Math.max(0, cursor - 10))}
            className="middle-button secondary"
          >
            Previous
          </button>
        )}
        {matches.data?.nextCursor != null && (
          <button
            className="middle-button secondary"
            onClick={() => setCursor(matches.data!.nextCursor!)}
          >
            Next →
          </button>
        )}
      </div>
    </>
  );
}
export function PropertyDetail({ id }: { id: string }) {
  const { data, error } = useRemote<Property>(`/api/properties/${id}`);
  if (error) return <Notice error>{error}</Notice>;
  if (!data) return <Loading />;
  return (
    <>
      <Link className="middle-text-link" href="/middle/discover">
        ← Discover
      </Link>
      <PageHeading
        eyebrow={`${data.location} · ${humanize(data.transactionType)}`}
        title={data.name}
      >
        {moneyLabel(data.price)}
        {data.transactionType === "RENT" ? " / month" : " sale price"}
      </PageHeading>
      <div className="middle-detail-grid">
        <PropertyCard property={data} />
        <div className="middle-panel">
          <h2>Overview</h2>
          <p className="middle-preserve">
            {data.description || "No additional description provided."}
          </p>
          <dl className="middle-details">
            <dt>Location</dt>
            <dd>{data.location}</dd>
            <dt>Area</dt>
            <dd>{data.areaSqm} m²</dd>
            <dt>Bedrooms</dt>
            <dd>{data.bedrooms}</dd>
            <dt>Verification</dt>
            <dd>{data.verified ? "Verified" : "Not yet verified"}</dd>
          </dl>
          <h2>Facilities</h2>
          <p>{data.facilities.join(" · ") || "No facilities recorded"}</p>
          <h2>Documents</h2>
          <p>Documents have not been made available for this listing.</p>
          <Link className="middle-button" href="/middle/matches">
            View your matching introductions →
          </Link>
        </div>
      </div>
    </>
  );
}
export function DealList() {
  const [cursor, setCursor] = useState(0);
  const { data, error } = useRemote<
    Page<{ id: string; state: string; propertyName: string; location: string }>
  >(`/api/deals?cursor=${cursor}`);
  return (
    <>
      <PageHeading
        eyebrow="FROM CONNECTION TO CONVERSATION"
        title="Your deal rooms."
      >
        Private spaces shared only with the participants.
      </PageHeading>
      {error && <Notice error>{error}</Notice>}
      {!data && !error && <Loading />}
      {data?.items.length === 0 && (
        <Empty title="A mutual yes opens the door.">
          <p>
            Express interest in a match. When the other party responds
            positively, a deal room is created automatically.
          </p>
          <Link className="middle-button" href="/middle/matches">
            View matches →
          </Link>
        </Empty>
      )}
      <div className="middle-room-list">
        {data?.items.map((room) => (
          <a href={`/middle/deals/${room.id}`} key={room.id}>
            <div>
              <span className="middle-eyebrow">{room.location}</span>
              <h2>{room.propertyName}</h2>
            </div>
            <span className="middle-badge">{humanize(room.state)}</span>
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
      <div className="middle-pagination">
        {cursor > 0 && (
          <button
            className="middle-button secondary"
            onClick={() => setCursor(cursor - 20)}
          >
            Previous
          </button>
        )}
        {data?.nextCursor != null && (
          <button
            className="middle-button secondary"
            onClick={() => setCursor(data.nextCursor!)}
          >
            Next →
          </button>
        )}
      </div>
    </>
  );
}
export function AccountView({
  account,
  analytics = false,
}: {
  account: Actor;
  analytics?: boolean;
}) {
  const { data, error } = useRemote<{
    properties: number;
    requirements: number;
    matches: number;
    deals: number;
    viewings: number;
  }>("/api/analytics");
  return (
    <>
      <PageHeading
        eyebrow={analytics ? "YOUR ACTIVITY" : "YOUR TRUST PROFILE"}
        title={analytics ? "The picture so far." : account.displayName}
      >
        {analytics
          ? "Counts from your stored properties, requirements, matches, and deals."
          : `${humanize(account.role)} · ${account.email}`}
      </PageHeading>
      {error && <Notice error>{error}</Notice>}
      {!data && !error && <Loading />}
      {data && (
        <div className="middle-metrics">
          {Object.entries(data).map(([key, value]) => (
            <div key={key}>
              <span>{humanize(key)}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}
      <div className="middle-two-column">
        <section className="middle-panel">
          <h2>Your workspace</h2>
          <p>
            Signed-in identity and your saved role determine access. Your deal
            rooms are shared only with their participants.
          </p>
          <Link className="middle-text-link" href="/middle/inventory">
            View your {account.role === "OWNER" ? "properties" : "requirements"}{" "}
            →
          </Link>
        </section>
        <section className="middle-panel">
          <h2>Trust, with evidence.</h2>
          <p>
            Your identity is signed in. Property ownership and professional
            credentials have not yet been verified by THE MIDDLE.
          </p>
          <span className="middle-badge">Verification pending</span>
        </section>
      </div>
      <a
        className="middle-text-link"
        href="/signout-with-chatgpt?return_to=%2Fmiddle"
        target="_top"
      >
        Sign out
      </a>
    </>
  );
}
export function InventoryList({ account }: { account: Actor }) {
  const owner = account.role === "OWNER",
    [cursor, setCursor] = useState(0);
  const { data, error } = useRemote<Page<Property | Requirement>>(
    `/api/${owner ? "properties" : "requirements"}?cursor=${cursor}`,
  );
  return (
    <>
      <PageHeading
        eyebrow={owner ? "YOUR SUPPLY" : "YOUR DEMAND"}
        title={owner ? "Your properties." : "Your requirements."}
      />
      <Link className="middle-button" href="/middle/add">
        Add {owner ? "property" : "requirement"}
      </Link>
      {error && <Notice error>{error}</Notice>}
      {!data && !error && <Loading />}
      {data?.items.length === 0 && (
        <Empty title="A fresh start.">
          <p>
            Your saved {owner ? "properties" : "requirements"} will appear here.
          </p>
        </Empty>
      )}
      <div className="middle-room-list">
        {data?.items.map((item) => (
          <a
            key={item.id}
            href={`/middle/discover?kind=${owner ? "property" : "requirement"}&id=${item.id}`}
          >
            <div>
              <span className="middle-eyebrow">
                {humanize(item.transactionType)}
              </span>
              <h2>{"name" in item ? item.name : item.title}</h2>
              <p>
                {"price" in item
                  ? moneyLabel(item.price)
                  : `Budget up to ${moneyLabel(item.budgetMax)}`}
              </p>
            </div>
            <span>Find matches ↗</span>
          </a>
        ))}
      </div>
      <div className="middle-pagination">
        {cursor > 0 && (
          <button
            className="middle-button secondary"
            onClick={() => setCursor(cursor - 20)}
          >
            Previous
          </button>
        )}
        {data?.nextCursor != null && (
          <button
            className="middle-button secondary"
            onClick={() => setCursor(data.nextCursor!)}
          >
            Next →
          </button>
        )}
      </div>
    </>
  );
}
export function NotificationList() {
  const [cursor, setCursor] = useState(0),
    [error, setError] = useState("");
  const list = useRemote<
    Page<{
      id: string;
      title: string;
      href: string;
      readAt: string | null;
      createdAt: string;
    }>
  >(`/api/notifications?cursor=${cursor}`);
  async function read(id: string) {
    try {
      await api("/api/notifications", { id }, "PATCH");
      list.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not update notification",
      );
    }
  }
  return (
    <>
      <PageHeading eyebrow="STAY IN THE LOOP" title="Notifications." />
      {(error || list.error) && <Notice error>{error || list.error}</Notice>}
      {!list.data && !list.error && <Loading />}
      {list.data?.items.length === 0 && (
        <Empty title="All quiet for now.">
          <p>Mutual matches and viewing requests will appear here.</p>
        </Empty>
      )}
      <div className="middle-notification-list">
        {list.data?.items.map((item) => (
          <div className="middle-panel" key={item.id}>
            <a href={item.href}>{item.title}</a>
            <time>{new Date(item.createdAt).toLocaleString()}</time>
            {!item.readAt && (
              <button
                className="middle-button secondary"
                onClick={() => read(item.id)}
              >
                Mark as read
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="middle-pagination">
        {cursor > 0 && (
          <button
            className="middle-button secondary"
            onClick={() => setCursor(cursor - 20)}
          >
            Previous
          </button>
        )}
        {list.data?.nextCursor != null && (
          <button
            className="middle-button secondary"
            onClick={() => setCursor(list.data!.nextCursor!)}
          >
            Next →
          </button>
        )}
      </div>
    </>
  );
}
export type { RoomView };
