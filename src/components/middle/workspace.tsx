/* eslint-disable @next/next/no-html-link-for-pages -- The legacy homepage is served as a separate static Worker asset. */
"use client";
import Link from "next/link";
import { useState } from "react";
import type { Actor } from "../../domain/platform/contracts";
import { RoleSelection, InventoryForm } from "./forms";
import { Loading, Notice, useRemote } from "./primitives";
import {
  AccountView,
  DealList,
  Discover,
  InventoryList,
  MatchInbox,
  NotificationList,
  PropertyDetail,
} from "./views";
import { DealRoom } from "./deal-room";
const navigation = [
  { route: "discover", label: "Discover", icon: "◈" },
  { route: "matches", label: "Matches", icon: "◇" },
  { route: "add", label: "Add", icon: "+" },
  { route: "deals", label: "Deals", icon: "▤" },
  { route: "profile", label: "Profile", icon: "○" },
];
export default function Workspace({
  section,
  id,
  seed,
}: {
  section: string;
  id?: string;
  seed?: { kind: string; id: string };
}) {
  const profile = useRemote<{ profile: Actor | null }>("/api/profile");
  const [registered, setRegistered] = useState<Actor | null>(null);
  const account = registered ?? profile.data?.profile;
  return (
    <div className="middle-app">
      <header className="middle-topbar">
        <Link className="middle-brand" href="/middle/discover">
          <span>LILITH</span>
          <small>by THE MIDDLE</small>
        </Link>
        <nav aria-label="Workspace utilities">
          <Link href="/middle/analytics">Analytics</Link>
          <Link href="/middle/notifications">Notifications</Link>
          <Link href="/middle/profile" className="middle-account-link">
            {account?.displayName ?? "Your account"}
          </Link>
        </nav>
      </header>
      <div className="middle-shell">
        <aside className="middle-sidebar">
          <p className="middle-eyebrow">PROPERTY MATCHING</p>
          <nav aria-label="Main navigation">
            {navigation.map((item) => (
              <a
                key={item.route}
                aria-current={section === item.route ? "page" : undefined}
                href={`/middle/${item.route}`}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="middle-sidebar-footer">
            <span className="middle-monogram">M</span>
            <p>
              The right place.
              <br />
              The right people.
            </p>
            <a href="/">Lilith Homes ↗</a>
          </div>
        </aside>
        <main className="middle-main" id="middle-content">
          {profile.error ? (
            <Notice error>{profile.error}</Notice>
          ) : !profile.data && !registered ? (
            <Loading />
          ) : !account ? (
            <RoleSelection onSaved={setRegistered} />
          ) : section === "add" ? (
            <InventoryForm
              kind={account.role === "OWNER" ? "property" : "requirement"}
            />
          ) : section === "matches" ? (
            <MatchInbox />
          ) : section === "deals" ? (
            id ? (
              <DealRoom account={account} id={id} />
            ) : (
              <DealList />
            )
          ) : section === "properties" && id ? (
            <PropertyDetail id={id} />
          ) : section === "profile" || section === "analytics" ? (
            <AccountView
              account={account}
              analytics={section === "analytics"}
            />
          ) : section === "notifications" ? (
            <NotificationList />
          ) : section === "inventory" ? (
            <InventoryList account={account} />
          ) : (
            <Discover account={account} seed={seed} />
          )}
          <footer className="middle-footer">
            <span>LILITH by THE MIDDLE</span>
            <span>Thoughtful connections in property.</span>
          </footer>
        </main>
      </div>
      <nav className="middle-bottom-nav" aria-label="Mobile navigation">
        {navigation.map((item) => (
          <a
            key={item.route}
            aria-current={section === item.route ? "page" : undefined}
            href={`/middle/${item.route}`}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
