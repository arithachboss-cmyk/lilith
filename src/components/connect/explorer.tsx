"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import countryData from "@/src/data/connect/countries.json";
import copyData from "@/src/data/connect/locales.json";
import residenceData from "@/src/data/connect/residences.json";
import portalData from "@/src/data/connect/portals.json";
import {
  automaticLocale,
  capitalName,
  countryName,
  hasTranslation,
  matchCountries,
  readSelection,
} from "@/src/domain/connect/locale";
import type {
  CapitalCountry,
  ConnectCopy,
  Residence,
} from "@/src/domain/connect/types";

const countries = countryData as CapitalCountry[];
const copies = copyData as Record<string, ConnectCopy>;
const residences = residenceData as Residence[];
const portals = portalData as {
  countryId: string;
  name: string;
  url: string;
}[];
const regionCodes: Record<string, string> = {
  Africa: "002",
  Asia: "142",
  Europe: "150",
  "North America": "003",
  "South America": "005",
  Oceania: "009",
};

function flag(id: string) {
  return String.fromCodePoint(
    ...id
      .toUpperCase()
      .split("")
      .map((character) => 127397 + character.charCodeAt(0)),
  );
}

function localizedRegion(region: string, locale: string) {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "region" }).of(
        regionCodes[region] ?? region,
      ) ?? region
    );
  } catch {
    return region;
  }
}

export function ConnectExplorer({
  initialCountry,
  initialLanguage,
  initialAuto,
}: {
  initialCountry?: string;
  initialLanguage?: string;
  initialAuto?: string;
}) {
  const initial = readSelection(
    initialCountry,
    initialLanguage,
    initialAuto,
    countries,
    copies,
  );
  const [selectedId, setSelectedId] = useState(initial.country.id);
  const [locale, setLocale] = useState(initial.locale);
  const [autoLanguage, setAutoLanguage] = useState(initial.autoLanguage);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [journey, setJourney] = useState([initial.country.id]);
  const selected =
    countries.find((country) => country.id === selectedId) ?? initial.country;
  const translated = hasTranslation(copies, locale);
  const t = translated ? copies[locale] : copies.en;
  const contentLocale = translated ? locale : "en";
  const city = selected.capitals
    .map((capital) => capitalName(capital, contentLocale))
    .join(" · ");
  const found = useMemo(
    () => matchCountries(countries, query, region, contentLocale),
    [query, region, contentLocale],
  );
  const homes = residences.filter(
    (residence) => residence.countryId === selected.id,
  );
  const localPortals = portals.filter(
    (portal) => portal.countryId === selected.id,
  );
  const regions = [
    ...new Set(countries.map((country) => country.region)),
  ].sort();
  const highlighted = ["kr", "jp", "th"];
  const nextId = highlighted.includes(selected.id)
    ? highlighted[(highlighted.indexOf(selected.id) + 1) % highlighted.length]
    : countries[(countries.indexOf(selected) + 1) % countries.length].id;
  const next = countries.find((country) => country.id === nextId)!;

  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = contentLocale;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [contentLocale]);

  function updateUrl(
    country: CapitalCountry,
    language: string,
    automatic: boolean,
  ) {
    const url = new URL(window.location.href);
    url.searchParams.set("country", country.id);
    url.searchParams.set("lang", language);
    url.searchParams.set("auto", automatic ? "1" : "0");
    window.history.replaceState(null, "", url);
  }

  function selectCountry(country: CapitalCountry) {
    setQuery("");
    if (region && country.region !== region) setRegion("");
    const language = autoLanguage ? automaticLocale(country, copies) : locale;
    setSelectedId(country.id);
    setLocale(language);
    setJourney((previous) =>
      previous.at(-1) === country.id
        ? previous
        : [...previous.slice(-3), country.id],
    );
    updateUrl(country, language, autoLanguage);
  }

  function selectLanguage(language: string) {
    setLocale(language);
    setAutoLanguage(false);
    updateUrl(selected, language, false);
  }

  return (
    <main className="connect-app" lang={contentLocale} dir={t.direction}>
      <a className="connect-skip" href="#connect-explore">
        {t.explore}
      </a>
      <header className="connect-nav">
        <a href="/connect" className="connect-brand" aria-label="Lilithconnect">
          <span>l.</span>
          <div>
            Lilith<span>connect</span>
            <small>by Middleproperty</small>
          </div>
        </a>
        <div className="connect-nav-end">
          <Link className="connect-home-link" href="/">
            Lilith Homes ↗
          </Link>
          <label className="connect-locale">
            <span>{t.language}</span>
            <select
              aria-label={t.language}
              value={locale}
              onChange={(event) => selectLanguage(event.target.value)}
            >
              {!translated && (
                <option value={locale}>{locale.toUpperCase()} · EN</option>
              )}
              {Object.entries(copies)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([code, copy]) => (
                  <option value={code} key={code}>
                    {code.toUpperCase()} · {copy.nativeName}
                  </option>
                ))}
            </select>
          </label>
        </div>
      </header>

      <section className="connect-intro" aria-labelledby="connect-title">
        <div className="connect-intro-copy">
          <p className="connect-eyebrow">LILI AI / LILITHCONNECT</p>
          <h1 id="connect-title">{t.storyTitle}</h1>
          <p className="connect-lede">{t.storyIntro}</p>
          <div className="connect-route" aria-label={t.nextCity}>
            {highlighted.map((id, index) => {
              const country = countries.find((item) => item.id === id)!;
              return (
                <span key={id}>
                  <button
                    type="button"
                    onClick={() => selectCountry(country)}
                    aria-pressed={selectedId === id}
                  >
                    {flag(id)} {capitalName(country.capitals[0], contentLocale)}
                  </button>
                  {index < highlighted.length - 1 && (
                    <i aria-hidden="true">↗</i>
                  )}
                </span>
              );
            })}
          </div>
        </div>
        <figure className="connect-panorama">
          <Image
            src="/assets/connect/bangkok-panorama.jpg"
            alt="Bangkok skyline and Chao Phraya River"
            fill
            sizes="(max-width: 740px) 100vw, 42vw"
            priority
          />
          <figcaption lang="en">
            Bangkok · A city to call home{" "}
            <a
              href="https://commons.wikimedia.org/wiki/File:Bangkok_skyline_view_from_Mahanakhon_Tower.jpg"
              target="_blank"
              rel="noreferrer"
            >
              Bigcitydata / Wikimedia Commons ↗
            </a>
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY 4.0 · cropped for display
            </a>
          </figcaption>
        </figure>
      </section>

      <section
        className="connect-explorer"
        id="connect-explore"
        aria-labelledby="connect-explorer-title"
      >
        <div className="connect-section-heading">
          <div>
            <p className="connect-eyebrow">
              {countries.length} / {t.country}
            </p>
            <h2 id="connect-explorer-title">{t.explore}</h2>
          </div>
          <label className="connect-auto">
            <input
              type="checkbox"
              checked={autoLanguage}
              onChange={(event) => {
                const enabled = event.target.checked;
                const language = enabled
                  ? automaticLocale(selected, copies)
                  : locale;
                setAutoLanguage(enabled);
                setLocale(language);
                updateUrl(selected, language, enabled);
              }}
            />
            {t.localLanguage}
          </label>
        </div>
        <div className="connect-grid">
          <aside className="connect-directory" aria-label={t.country}>
            <div className="connect-filters">
              <label className="connect-search">
                <span>{t.search}</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.search}
                />
              </label>
              <select
                aria-label={t.allRegions}
                value={region}
                onChange={(event) => setRegion(event.target.value)}
              >
                <option value="">{t.allRegions}</option>
                {regions.map((value) => (
                  <option key={value} value={value}>
                    {localizedRegion(value, contentLocale)}
                  </option>
                ))}
              </select>
              <div className="connect-count" role="status">
                {found.length} / {countries.length} · {t.country}
              </div>
            </div>
            <div className="connect-country-list">
              {found.map((country) => (
                <button
                  type="button"
                  className="connect-country"
                  key={country.id}
                  onClick={() => selectCountry(country)}
                  aria-pressed={selected.id === country.id}
                >
                  <span className="connect-flag" aria-hidden="true">
                    {flag(country.id)}
                  </span>
                  <span>
                    <strong>
                      {country.capitals
                        .map((capital) => capitalName(capital, contentLocale))
                        .join(" / ") || countryName(country, contentLocale)}
                    </strong>
                    <small>{countryName(country, contentLocale)}</small>
                  </span>
                  <span className="connect-code">
                    {automaticLocale(country, copies).toUpperCase()}
                  </span>
                </button>
              ))}
              {found.length === 0 && (
                <div className="connect-empty-search">
                  <p>0 / {t.country}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setRegion("");
                    }}
                  >
                    {t.allRegions}
                  </button>
                </div>
              )}
            </div>
          </aside>

          <article className="connect-city" aria-labelledby="connect-city-name">
            {!translated && (
              <p className="connect-fallback" role="status" lang="en">
                {locale.toUpperCase()} → EN · {copies.en.fallback}
              </p>
            )}
            <div className="connect-city-header">
              <span className="connect-country-kicker">
                {flag(selected.id)} {countryName(selected, contentLocale)} /{" "}
                {selected.id.toUpperCase()}
              </span>
              <span className="connect-language-stamp">
                {contentLocale.toUpperCase()}
              </span>
            </div>
            <h2 id="connect-city-name">
              {city || countryName(selected, contentLocale)}
            </h2>
            <div className="connect-city-languages" aria-label={t.language}>
              {selected.languages.map((language) => (
                <button
                  type="button"
                  key={language.code}
                  aria-pressed={locale === language.code}
                  onClick={() => selectLanguage(language.code)}
                >
                  {language.code.toUpperCase()}
                  <span>
                    {copies[language.code]?.nativeName ?? language.name}
                  </span>
                </button>
              ))}
            </div>
            <dl className="connect-facts">
              <div>
                <dt>{t.capital}</dt>
                <dd>{city || "—"}</dd>
              </div>
              <div>
                <dt>{t.currency}</dt>
                <dd>
                  {selected.currencies
                    .map((currency) => currency.code)
                    .join(" · ") || "—"}
                </dd>
              </div>
              <div>
                <dt>{t.language}</dt>
                <dd>
                  {selected.languages
                    .map((language) => language.code.toUpperCase())
                    .join(" · ")}
                </dd>
              </div>
            </dl>
            {selected.note && (
              <p className="connect-note" lang="en">
                <b>EN</b> {selected.note}
              </p>
            )}
            <div className="connect-story" aria-live="polite">
              <div className="connect-lili-mark" aria-hidden="true">
                l.
              </div>
              <div>
                <span className="connect-eyebrow">LILI</span>
                <p>
                  {t.chapter.replace(
                    "{city}",
                    city || countryName(selected, contentLocale),
                  )}
                </p>
                <div className="connect-journey">
                  {journey.map((id, index) => {
                    const stop = countries.find(
                      (country) => country.id === id,
                    )!;
                    return (
                      <span key={`${id}-${index}`}>
                        {index > 0 && <i aria-hidden="true">→ </i>}
                        {stop.capitals
                          .map((capital) => capitalName(capital, contentLocale))
                          .join(" / ") || countryName(stop, contentLocale)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="connect-homes-heading">
              <h3>{t.homes}</h3>
              <span>{homes.length.toString().padStart(2, "0")}</span>
            </div>
            {homes.length > 0 ? (
              <div className="connect-residences">
                {homes.map((home) => (
                  <article className="connect-residence" key={home.name}>
                    <div className="connect-residence-type" lang="en">
                      {home.type} <span>↗</span>
                    </div>
                    <h4 lang="en">{home.name}</h4>
                    {home.neighborhood && (
                      <p lang="en">
                        {home.neighborhood} · {home.city}
                      </p>
                    )}
                    <p lang="en">{home.description}</p>
                    <a href={home.sourceUrl} target="_blank" rel="noreferrer">
                      {t.officialWebsite} ↗
                    </a>
                    <small>
                      {t.source} · {home.checkedAt}
                    </small>
                  </article>
                ))}
              </div>
            ) : (
              <p className="connect-empty-homes">{t.noHomes}</p>
            )}
            <p className="connect-reference-note">{t.referenceNote}</p>
            <div className="connect-source-links">
              <span>{t.housingSource}</span>
              {localPortals.map((portal) => (
                <a
                  href={portal.url}
                  target="_blank"
                  rel="noreferrer"
                  key={portal.name}
                >
                  {portal.name} ↗
                </a>
              ))}
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(`${selected.capitals[0] || selected.country} ${selected.country} apartments condominiums long term rental`)}`}
                target="_blank"
                rel="noreferrer"
              >
                {t.search} ↗
              </a>
            </div>
            <div className="connect-city-bottom">
              <a href={selected.sourceUrl} target="_blank" rel="noreferrer">
                {t.source} ↗
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selected.capitals[0] || selected.country}, ${selected.country}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                {t.learnCity} ↗
              </a>
              <button type="button" onClick={() => selectCountry(next)}>
                {t.nextCity}:{" "}
                {capitalName(next.capitals[0] || next.country, contentLocale)} ↗
              </button>
            </div>
            {!!selected.sources?.length && (
              <ul className="connect-fact-sources" lang="en">
                {selected.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>
      <footer className="connect-footer">
        <Link href="/">Lilith Homes</Link>
        <p lang="en">
          195 countries · UN members and observer states. Country facts and
          public housing references; language lists are not exhaustive.{" "}
          <a
            href="https://github.com/mledoze/countries"
            target="_blank"
            rel="noreferrer"
          >
            mledoze/countries
          </a>{" "}
          · <a href="/connect-countries-license.txt">ODbL-1.0</a> ·{" "}
          <a href="/connect-countries.json" download>
            Country data
          </a>
        </p>
        <a
          href="https://www.middleproperty.com/"
          target="_blank"
          rel="noreferrer"
        >
          Middleproperty ↗
        </a>
      </footer>
    </main>
  );
}
