import { describe, expect, it } from "vitest";
import countriesJson from "../../src/data/connect/countries.json";
import localesJson from "../../src/data/connect/locales.json";
import residences from "../../src/data/connect/residences.json";
import {
  automaticLocale,
  hasTranslation,
  matchCountries,
  readSelection,
} from "../../src/domain/connect/locale";
import type {
  CapitalCountry,
  ConnectCopy,
} from "../../src/domain/connect/types";

const countries = countriesJson as CapitalCountry[];
const copies = localesJson as Record<string, ConnectCopy>;
const country = (id: string) => countries.find((item) => item.id === id)!;

describe("Lilithconnect country and language model", () => {
  it("covers 193 UN members and two observers without duplicate countries", () => {
    expect(countries).toHaveLength(195);
    expect(new Set(countries.map((item) => item.id)).size).toBe(195);
    expect(country("va")).toBeDefined();
    expect(country("ps")).toBeDefined();
    expect(country("hk")).toBeUndefined();
    for (const item of countries) {
      expect(item.languages.length).toBeGreaterThan(0);
      expect(item.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it("distinguishes language codes from country codes and uses deliberate local defaults", () => {
    for (const [id, expected] of [
      ["jp", "ja"],
      ["kr", "ko"],
      ["gb", "en"],
      ["th", "th"],
      ["uz", "uz"],
      ["na", "en"],
      ["ch", "de"],
      ["af", "ps"],
      ["gq", "es"],
    ]) {
      expect(automaticLocale(country(id), copies)).toBe(expected);
    }
    for (const item of countries) {
      expect(
        item.languages.map((language) => language.code),
        item.country,
      ).toContain(automaticLocale(item, copies));
    }
  });

  it("rejects inherited object keys and invalid URL parameters", () => {
    for (const unsafe of ["__proto__", "constructor", "toString", "<script>"]) {
      expect(hasTranslation(copies, unsafe)).toBe(false);
      expect(readSelection("jp", unsafe, "1", countries, copies).locale).toBe(
        "ja",
      );
    }
    expect(
      readSelection("not-a-country", "TH", "0", countries, copies).country.id,
    ).toBe("th");
    expect(readSelection("JP", "JA", "0", countries, copies).locale).toBe("ja");
  });

  it("retains a requested country language when an English fallback must be shown", () => {
    const selection = readSelection("mv", "dv", "1", countries, copies);
    expect(selection.locale).toBe("dv");
    expect(selection.country.id).toBe("mv");
  });

  it("searches country codes, Thai country names, currencies, and every capital", () => {
    expect(
      matchCountries(countries, "ฝรั่งเศส", "", "th").map((item) => item.id),
    ).toContain("fr");
    expect(
      matchCountries(countries, "โตเกียว", "", "th").map((item) => item.id),
    ).toEqual(["jp"]);
    expect(
      matchCountries(countries, "Cape Town", "Africa", "en").map(
        (item) => item.id,
      ),
    ).toEqual(["za"]);
    expect(
      matchCountries(countries, "JPY", "Asia", "en").map((item) => item.id),
    ).toContain("jp");
    expect(matchCountries(countries, "Tokyo", "Europe", "en")).toHaveLength(0);
  });

  it("preserves sourced distinctions for changed and multiple capitals", () => {
    expect(country("gq").capitals).toEqual(["Ciudad de la Paz"]);
    expect(country("za").capitals).toHaveLength(3);
    expect(country("nr").note).toContain("no official capital");
    expect(country("id").note).toContain("transfer decree");
  });

  it("has complete copy keys and does not embed invented available units or prices", () => {
    const keys = Object.keys(copies.en).sort();
    for (const copy of Object.values(copies)) {
      expect(Object.keys(copy).sort()).toEqual(keys);
      expect(copy.chapter).toContain("{city}");
      expect(["rtl", "ltr"]).toContain(copy.direction);
    }
    for (const home of residences) {
      expect(country(home.countryId)).toBeDefined();
      expect(home.sourceUrl).toMatch(/^https:\/\//);
      expect(home).not.toHaveProperty("available");
      expect(home).not.toHaveProperty("price");
    }
  });
});
