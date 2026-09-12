"use client";
import {
  cloneElement,
  useEffect,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { api } from "./api";
export function useRemote<T>(path: string) {
  const [result, setResult] = useState<{
    path: string;
    data?: T;
    error?: string;
  }>({ path });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    api<T>(path)
      .then((data) => {
        if (active) setResult({ path, data });
      })
      .catch((error: unknown) => {
        if (active)
          setResult({
            path,
            error: error instanceof Error ? error.message : "Unable to load",
          });
      });
    return () => {
      active = false;
    };
  }, [path, revision]);
  return {
    data: result.path === path ? result.data : undefined,
    error: result.path === path ? result.error : undefined,
    refresh: () => setRevision((value) => value + 1),
  };
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`middle-notice ${error ? "is-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="middle-empty">
      <span className="middle-eyebrow">ROOM FOR POSSIBILITY</span>
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
export function Loading() {
  return (
    <p className="middle-loading" role="status">
      Loading your workspace…
    </p>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactElement<{ id?: string; "aria-describedby"?: string }>;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="middle-field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, {
        id,
        ...(hint ? { "aria-describedby": `${id}-hint` } : {}),
      })}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="middle-page-heading">
      <p className="middle-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </header>
  );
}
export function humanize(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (text) => text.toUpperCase());
}
export function moneyLabel(value: string): string {
  const [whole, fraction = "00"] = value.split(".");
  return `฿${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${fraction !== "00" ? `.${fraction}` : ""}`;
}
