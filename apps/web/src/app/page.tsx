import { foundationCopy, systemStatusCopy } from "@lilith/i18n";
import { readSystemHealth } from "@/lib/server/system";

// The status below is read from the database on every request.
export const dynamic = "force-dynamic";

export default async function FoundationPage() {
  const health = await readSystemHealth();
  const th = systemStatusCopy.th;
  const en = systemStatusCopy.en;
  const rows = [
    { key: "db", th: th.database, en: en.database, state: health.db },
    { key: "queue", th: th.queue, en: en.queue, state: health.queue },
    { key: "ai", th: th.ai, en: en.ai, state: health.ai },
  ] as const;

  return (
    <main>
      <p className="brand">
        LILITH <span>by THE MIDDLE</span>
      </p>
      <p className="status">ARCH-001 · Foundation</p>
      <h1>{foundationCopy.th.title}</h1>
      <p>{foundationCopy.th.description}</p>
      <p lang="en">{foundationCopy.en.description}</p>

      <section
        className="system"
        aria-labelledby="system-heading"
        data-status={health.status}
      >
        <h2 id="system-heading">
          {th.heading} <span lang="en">{en.heading}</span>
        </h2>
        <p className="overall" data-testid="overall">
          {th.overall[health.status]}{" "}
          <span lang="en">{en.overall[health.status]}</span>
        </p>
        <dl>
          {rows.map((row) => (
            <div key={row.key} data-testid={row.key} data-state={row.state}>
              <dt>
                {row.th} <span lang="en">{row.en}</span>
              </dt>
              <dd>
                {th.state[row.state]}{" "}
                <span lang="en">{en.state[row.state]}</span>
              </dd>
            </div>
          ))}
          <div data-testid="version">
            <dt>
              {th.version} <span lang="en">{en.version}</span>
            </dt>
            <dd>{health.version}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
