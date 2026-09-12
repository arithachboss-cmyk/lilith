import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";
import { ConnectExplorer } from "../../src/components/connect/explorer";
import locales from "../../src/data/connect/locales.json";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));
afterEach(cleanup);

describe("Lilithconnect explorer", () => {
  it("switches to Japanese on selection and keeps a manual language choice", () => {
    render(<ConnectExplorer />);
    fireEvent.click(screen.getByRole("button", { name: "🇯🇵 โตเกียว" }));
    expect(
      screen.getByRole("heading", { name: "東京" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("lang", "ja");
    fireEvent.change(
      screen.getByRole("combobox", { name: locales.ja.language }),
      { target: { value: "en" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "🇰🇷 Seoul" }));
    expect(screen.getByRole("main")).toHaveAttribute("lang", "en");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(new URL(window.location.href).searchParams.get("country")).toBe(
      "kr",
    );
    expect(new URL(window.location.href).searchParams.get("lang")).toBe("en");
  });

  it("clears a translated search when automatic language changes", () => {
    render(<ConnectExplorer />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "ฝรั่งเศส" },
    });
    fireEvent.click(screen.getByRole("button", { name: /ปารีส.*ฝรั่งเศส/ }));
    expect(screen.getByRole("main")).toHaveAttribute("lang", "fr");
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(
      screen.getByRole("button", { name: /Paris.*France/ }),
    ).toBeInTheDocument();
  });

  it("uses RTL for Arabic and a truthful empty housing state", () => {
    render(<ConnectExplorer initialCountry="sa" />);
    expect(screen.getByRole("main")).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("main")).toHaveAttribute("lang", "ar");
    expect(screen.getByText(locales.ar.noHomes)).toBeInTheDocument();
  });

  it("renders safely for hostile language parameters", () => {
    render(<ConnectExplorer initialCountry="jp" initialLanguage="__proto__" />);
    expect(
      screen.getByRole("heading", { name: "東京" }),
    ).toBeInTheDocument();
  });
});
