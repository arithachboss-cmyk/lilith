"use client";
import { useState } from "react";
import { api } from "./api";
import type { MatchView, Property } from "../../services/platform/records";
import { humanize, moneyLabel } from "./primitives";
export function PropertyCard({
  property,
  match,
  onInterest,
  busy = false,
}: {
  property: Property;
  match?: MatchView;
  onInterest?: (decision: "PASS" | "INTERESTED" | "SUPER_MATCH") => void;
  busy?: boolean;
}) {
  const [viewRequest] = useState(() => crypto.randomUUID());
  const [viewError, setViewError] = useState("");
  return (
    <article className="middle-property-card">
      <div className="middle-property-photo">
        <span className="middle-photo-label">
          {humanize(property.propertyType)} ·{" "}
          {humanize(property.transactionType)}
        </span>
        <div>
          <span className="middle-photo-mark">L</span>
          <p>Property photography pending</p>
        </div>
        {match && (
          <span className="middle-score">
            {match.result.score}
            <small>/100 match</small>
          </span>
        )}
      </div>
      <div className="middle-card-body">
        <div className="middle-row">
          <span className="middle-eyebrow">{property.location}</span>
          <span className="middle-badge">
            {property.verified ? "Verified" : "Not yet verified"}
          </span>
        </div>
        <h2>
          <a href={`/middle/properties/${property.id}`}>{property.name}</a>
        </h2>
        <p className="middle-price">
          {moneyLabel(property.price)}{" "}
          <small>
            {property.transactionType === "RENT" ? "/ month" : "sale price"}
          </small>
        </p>
        <p className="middle-attributes">
          {property.bedrooms} bedrooms <span>·</span> {property.areaSqm} m²{" "}
          <span>·</span> {humanize(property.propertyType)}
        </p>
        {match && (
          <>
            <p className="middle-brief">
              For: {match.requirementTitle}
              <br />
              <span>With {match.counterparty}</span>
            </p>
            <details
              className="middle-reasons"
              onToggle={(event) => {
                if (event.currentTarget.open)
                  void api(`/api/matches/${match.id}/view`, {
                    requestId: viewRequest,
                  }).catch(() =>
                    setViewError(
                      "Your view could not be recorded. The match details remain available.",
                    ),
                  );
              }}
            >
              <summary>Why this match</summary>
              <ul>
                {match.result.reasons.map((reason) => (
                  <li
                    key={reason.code}
                    className={reason.matched ? "" : "middle-tradeoff"}
                  >
                    {reason.text}
                  </li>
                ))}
              </ul>
              <p>
                Preference completeness:{" "}
                {Math.round(match.result.confidence * 100)}%. Deterministic
                matching; not a probability of completing a deal.
              </p>
              {viewError && <p role="status">{viewError}</p>}
            </details>
          </>
        )}
        {onInterest && (
          <div className="middle-interest-actions">
            <button
              className="middle-button secondary"
              disabled={busy}
              onClick={() => onInterest("PASS")}
            >
              Pass
            </button>
            <button
              className="middle-button"
              disabled={busy}
              onClick={() => onInterest("INTERESTED")}
            >
              Interested
            </button>
            <button
              className="middle-button champagne"
              disabled={busy}
              onClick={() => onInterest("SUPER_MATCH")}
            >
              Super Match
            </button>
          </div>
        )}
        {match && (match.decision || match.counterpartyDecision) && (
          <p className="middle-status">
            You:{" "}
            {match.decision ? humanize(match.decision) : "Awaiting response"} ·
            Counterparty:{" "}
            {match.counterpartyDecision
              ? humanize(match.counterpartyDecision)
              : "Awaiting response"}
          </p>
        )}
        {match?.roomId && (
          <a className="middle-button" href={`/middle/deals/${match.roomId}`}>
            Open deal room →
          </a>
        )}
        <a
          className="middle-text-link"
          href={`/middle/properties/${property.id}`}
        >
          View property details ↗
        </a>
      </div>
    </article>
  );
}
