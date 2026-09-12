"use client";
import { useState, type FormEvent } from "react";
import type { Actor } from "../../domain/platform/contracts";
import { api } from "./api";
import { Field, Notice, PageHeading } from "./primitives";

export function RoleSelection({
  onSaved,
}: {
  onSaved: (account: Actor) => void;
}) {
  const [role, setRole] = useState("AGENT"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      onSaved(
        await api<Actor>("/api/profile", {
          role,
          displayName: form.get("displayName"),
        }),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to save your profile",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading eyebrow="YOUR PLACE IN THE MIDDLE" title="Choose your role.">
        Bring a property. Represent a client. Find your next place.
      </PageHeading>
      <form onSubmit={submit} className="middle-form">
        <Field label="Your display name">
          <input
            name="displayName"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
          />
        </Field>
        <fieldset className="middle-role-options">
          <legend>I am joining as</legend>
          {[
            {
              role: "AGENT",
              title: "Agent",
              text: "Create client requirements and connect with owners.",
            },
            {
              role: "OWNER",
              title: "Owner",
              text: "Publish your property and meet relevant demand.",
            },
            {
              role: "CLIENT",
              title: "Client",
              text: "Create your own brief and explore matching properties.",
            },
          ].map((option) => (
            <label
              key={option.role}
              className={role === option.role ? "selected" : ""}
            >
              <input
                type="radio"
                name="role"
                value={option.role}
                checked={role === option.role}
                onChange={() => setRole(option.role)}
              />
              <strong>{option.title}</strong>
              <span>{option.text}</span>
            </label>
          ))}
        </fieldset>
        <p className="middle-muted">
          Your role controls which resources you can create. It is saved to your
          signed-in account.
        </p>
        {error && <Notice error>{error}</Notice>}
        <button className="middle-button" disabled={busy}>
          {busy ? "Saving…" : "Create my profile"}
        </button>
      </form>
    </>
  );
}
export function InventoryForm({ kind }: { kind: "property" | "requirement" }) {
  const [transaction, setTransaction] = useState("RENT"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    const text = (key: string) => String(form.get(key) ?? "");
    const common = {
      transactionType: transaction,
      propertyType: text("propertyType"),
      currency: "THB",
      facilities: text("facilities")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      description: text("description"),
    };
    const body =
      kind === "property"
        ? {
            ...common,
            name: text("title"),
            location: text("location"),
            price: text("amount"),
            bedrooms: Number(text("bedrooms")),
            areaSqm: Number(text("areaSqm")),
          }
        : {
            ...common,
            title: text("title"),
            locations: text("location")
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean),
            budgetMax: text("amount"),
            minBedrooms: Number(text("bedrooms")),
            hardBudget: form.has("hardBudget"),
            hardLocation: form.has("hardLocation"),
            clientConsent: form.has("consent"),
          };
    try {
      const result = await api<{ id: string }>(
        kind === "property" ? "/api/properties" : "/api/requirements",
        body,
      );
      setSaved(result.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }
  if (saved)
    return (
      <div className="middle-success">
        <p className="middle-eyebrow">
          {kind === "property" ? "SUPPLY PUBLISHED" : "REQUIREMENT SAVED"}
        </p>
        <h1>
          {kind === "property"
            ? "Your property is in."
            : "A clearer brief. A better match."}
        </h1>
        <p>Your {kind} is saved to your account. Find relevant matches next.</p>
        <a
          className="middle-button"
          href={`/middle/discover?kind=${kind}&id=${saved}`}
        >
          Find matches →
        </a>
      </div>
    );
  return (
    <>
      <PageHeading
        eyebrow={kind === "property" ? "ADD YOUR SUPPLY" : "DEFINE YOUR DEMAND"}
        title={
          kind === "property"
            ? "A place worth finding."
            : "What are you looking for?"
        }
      >
        Use accurate details. Matching starts with the essentials.
      </PageHeading>
      <form className="middle-form" onSubmit={submit}>
        <Field
          label={kind === "property" ? "Property name" : "Requirement title"}
          hint={
            kind === "requirement"
              ? "Use a neutral title. Do not include client names or contact details."
              : undefined
          }
        >
          <input name="title" required minLength={3} maxLength={160} />
        </Field>
        <div className="middle-form-grid">
          <Field label="Transaction">
            <select
              value={transaction}
              onChange={(event) => setTransaction(event.target.value)}
              name="transactionType"
            >
              <option value="RENT">Rent</option>
              <option value="SALE">Buy / sell</option>
            </select>
          </Field>
          <Field label="Property type">
            <select name="propertyType">
              <option value="CONDO">Condo</option>
              <option value="HOUSE">House</option>
              <option value="HOTEL">Hotel</option>
              <option value="LAND">Land</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
          </Field>
        </div>
        <Field
          label={
            kind === "property"
              ? "Location / district"
              : "Preferred locations / districts"
          }
          hint={
            kind === "requirement"
              ? "Separate districts with commas. Use the same district names as the property listings."
              : "Use a district name, for example Sukhumvit, Bangkok."
          }
        >
          <input
            name="location"
            required
            minLength={2}
            maxLength={kind === "property" ? 120 : 1200}
          />
        </Field>
        <div className="middle-form-grid">
          <Field
            label={`${kind === "property" ? "Asking price" : "Maximum budget"} (THB${transaction === "RENT" ? " / month" : " total"})`}
          >
            <input
              name="amount"
              required
              inputMode="decimal"
              pattern="[0-9]+(\.[0-9]{1,2})?"
              placeholder="45000.00"
            />
          </Field>
          <Field label={kind === "property" ? "Bedrooms" : "Minimum bedrooms"}>
            <input
              name="bedrooms"
              type="number"
              required
              min={0}
              max={1000}
              defaultValue={1}
            />
          </Field>
        </div>
        {kind === "property" && (
          <Field label="Area (m²)">
            <input
              name="areaSqm"
              type="number"
              min="0.01"
              max={10000000}
              step="0.01"
              required
            />
          </Field>
        )}
        <Field
          label="Facilities"
          hint="Separate with commas, for example pool, gym, parking."
        >
          <input name="facilities" maxLength={1800} />
        </Field>
        <Field
          label="Additional details"
          hint={
            kind === "requirement"
              ? "Private to your account. Avoid unnecessary personal data."
              : "Visible to signed-in people who view this property."
          }
        >
          <textarea name="description" rows={4} maxLength={4000} />
        </Field>
        {kind === "requirement" && (
          <>
            <fieldset className="middle-checks">
              <legend>Must-haves</legend>
              <label>
                <input type="checkbox" name="hardBudget" defaultChecked /> Stay
                within the maximum budget
              </label>
              <label>
                <input type="checkbox" name="hardLocation" defaultChecked />{" "}
                Only the specified locations
              </label>
            </fieldset>
            <label className="middle-consent">
              <input type="checkbox" name="consent" required /> I have
              permission to represent this requirement, or I am creating it for
              myself.
            </label>
          </>
        )}
        {kind === "property" && (
          <Notice>
            Publishing confirms these are your property details. Verification
            and photography are not yet provided.
          </Notice>
        )}
        {error && <Notice error>{error}</Notice>}
        <button className="middle-button" disabled={busy}>
          {busy
            ? "Saving…"
            : kind === "property"
              ? "Publish property"
              : "Save requirement"}
        </button>
      </form>
    </>
  );
}
