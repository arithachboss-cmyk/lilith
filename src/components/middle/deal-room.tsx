"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { Actor } from "../../domain/platform/contracts";
import type { RoomView } from "../../services/platform/records";
import { api } from "./api";
import {
  Empty,
  Field,
  Loading,
  Notice,
  PageHeading,
  humanize,
  useRemote,
} from "./primitives";
import { PropertyCard } from "./property-card";
const tabs = ["Chat", "Property", "Viewing", "Timeline", "Documents"] as const;
export function DealRoom({ account, id }: { account: Actor; id: string }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Chat"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [viewingRequest] = useState(() => crypto.randomUUID()),
    [messageRequest, setMessageRequest] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState("");
  const {
    data,
    error: loadError,
    refresh,
  } = useRemote<RoomView>(`/api/deals/${id}`);
  async function perform(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }
  function viewing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const scheduledAt = new Date(String(form.get("scheduledAt"))).toISOString();
    void perform(() =>
      api(`/api/deals/${id}/viewings`, {
        scheduledAt,
        notes: form.get("notes"),
        requestId: viewingRequest,
      }),
    );
  }
  function transition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void perform(() =>
      api(`/api/deals/${id}/transitions`, {
        to: form.get("to"),
        reason: form.get("reason"),
      }),
    );
  }
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void perform(async () => {
      await api(`/api/deals/${id}/messages`, {
        body: message,
        requestId: messageRequest,
      });
      setMessage("");
      setMessageRequest(crypto.randomUUID());
    });
  }
  if (loadError) return <Notice error>{loadError}</Notice>;
  if (!data) return <Loading />;
  return (
    <>
      <Link href="/middle/deals" className="middle-text-link">
        ← Your deal rooms
      </Link>
      <PageHeading eyebrow="YOUR PRIVATE DEAL ROOM" title={data.property.name}>
        {data.participants.map((person) => person.displayName).join(" + ")}
      </PageHeading>
      <div className="middle-room-meta">
        <span className="middle-badge">{humanize(data.state)}</span>
        <button
          className="middle-button secondary"
          disabled={busy}
          onClick={refresh}
        >
          Refresh conversation
        </button>
      </div>
      {error && <Notice error>{error}</Notice>}
      <div className="middle-room-layout">
        <div>
          <div className="middle-tabs" aria-label="Deal room sections">
            {tabs.map((value) => (
              <button
                key={value}
                className={tab === value ? "active" : ""}
                onClick={() => setTab(value)}
                aria-pressed={tab === value}
              >
                {value}
              </button>
            ))}
          </div>
          <section className="middle-room-content" aria-label={tab}>
            {tab === "Chat" && (
              <>
                <div className="middle-messages">
                  {data.messages.length === 0 && (
                    <Empty title="Start the conversation.">
                      <p>Introduce yourself and agree on the next step.</p>
                    </Empty>
                  )}
                  {data.messages.map((item) => (
                    <article
                      key={item.id}
                      className={`middle-message ${item.senderId === account.id ? "own" : ""}`}
                    >
                      <strong>
                        {data.participants.find(
                          (person) => person.userId === item.senderId,
                        )?.displayName ?? "Participant"}
                      </strong>
                      <p>{item.body}</p>
                      <time>{new Date(item.createdAt).toLocaleString()}</time>
                    </article>
                  ))}
                </div>
                {!["CANCELLED", "DEAL_CLOSED"].includes(data.state) && (
                  <form className="middle-compose" onSubmit={send}>
                    <Field label="Your message">
                      <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        required
                        maxLength={4000}
                        rows={3}
                      />
                    </Field>
                    <button
                      className="middle-button"
                      disabled={busy || !message.trim()}
                    >
                      Send message
                    </button>
                  </form>
                )}
              </>
            )}
            {tab === "Property" && <PropertyCard property={data.property} />}
            {tab === "Viewing" && (
              <>
                {data.viewings.map((item) => (
                  <article className="middle-viewing" key={item.id}>
                    <span className="middle-eyebrow">
                      {humanize(item.status)}
                    </span>
                    <h2>{new Date(item.scheduledAt).toLocaleString()}</h2>
                    <p>{item.notes || "No additional notes"}</p>
                    <small>
                      Shown in your device’s time zone. A request becomes
                      confirmed only after the other party accepts.
                    </small>
                  </article>
                ))}
                {data.allowedActions.includes("VIEWING_REQUESTED") ? (
                  <form className="middle-form" onSubmit={viewing}>
                    <h2>Request a viewing</h2>
                    <Field
                      label="Date and time"
                      hint="Use your local time zone."
                    >
                      <input
                        name="scheduledAt"
                        type="datetime-local"
                        required
                      />
                    </Field>
                    <Field label="Viewing notes">
                      <textarea name="notes" maxLength={2000} rows={3} />
                    </Field>
                    <button className="middle-button" disabled={busy}>
                      Request viewing
                    </button>
                  </form>
                ) : (
                  data.viewings.length === 0 && <p>No viewing requested.</p>
                )}
                {data.allowedActions.some(
                  (action) =>
                    action === "VIEWING_CONFIRMED" ||
                    action === "VIEWING_COMPLETED",
                ) && (
                  <form className="middle-form" onSubmit={transition}>
                    <Field label="Viewing action">
                      <select name="to">
                        {data.allowedActions
                          .filter(
                            (action) =>
                              action === "VIEWING_CONFIRMED" ||
                              action === "VIEWING_COMPLETED",
                          )
                          .map((action) => (
                            <option key={action} value={action}>
                              {humanize(action)}
                            </option>
                          ))}
                      </select>
                    </Field>
                    <Field label="Confirmation note">
                      <input
                        name="reason"
                        minLength={3}
                        maxLength={1000}
                        required
                      />
                    </Field>
                    <button className="middle-button" disabled={busy}>
                      Confirm viewing action
                    </button>
                  </form>
                )}
              </>
            )}
            {tab === "Timeline" && (
              <ol className="middle-timeline">
                {data.timeline.map((event, index) => (
                  <li key={`${event.createdAt}-${index}`}>
                    <span className="middle-timeline-dot" />
                    <div>
                      <strong>{humanize(event.name)}</strong>
                      <time>{new Date(event.createdAt).toLocaleString()}</time>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {tab === "Documents" && (
              <Empty title="No documents shared.">
                <p>
                  Property documents have not been made available. Please
                  discuss the documents you need in the conversation.
                </p>
              </Empty>
            )}
          </section>
        </div>
        <aside>
          <div className="middle-panel middle-concierge">
            <span className="middle-eyebrow">THE MIDDLE</span>
            <h2>A considered next step.</h2>
            <p>
              {data.allowedActions.includes("VIEWING_REQUESTED")
                ? "Agree on a suitable time, then request a viewing."
                : data.state === "VIEWING_REQUESTED"
                  ? "Waiting for the other participant to confirm the viewing."
                  : data.state === "VIEWING_COMPLETED"
                    ? "Use the conversation to discuss the outcome. Offer and closing workflows are not available in this batch."
                    : "Keep the conversation and property details together as you move forward."}
            </p>
            <small>Workflow guidance based on deal status.</small>
          </div>
          <section className="middle-panel">
            <h2>Participants</h2>
            {data.participants.map((person) => (
              <p key={person.userId}>
                <strong>{person.displayName}</strong>
                <br />
                <small>
                  {person.side === "SUPPLY"
                    ? "Property owner"
                    : "Requirement representative"}
                </small>
              </p>
            ))}
          </section>
          {data.allowedActions.includes("CANCELLED") && (
            <details className="middle-panel">
              <summary>Cancel this deal</summary>
              <form className="middle-form" onSubmit={transition}>
                <input type="hidden" name="to" value="CANCELLED" />
                <p>
                  Cancellation closes the conversation and is recorded in the
                  timeline.
                </p>
                <Field label="Reason for cancellation">
                  <textarea
                    name="reason"
                    required
                    minLength={3}
                    maxLength={1000}
                  />
                </Field>
                <button className="middle-button secondary" disabled={busy}>
                  Cancel deal
                </button>
              </form>
            </details>
          )}
        </aside>
      </div>
    </>
  );
}
