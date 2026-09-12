import type { CapitalCountry, ConnectCopy } from "./types";

export function hasTranslation(
  copies: Record<string, ConnectCopy>,
  locale: string,
) {
  return Object.hasOwn(copies, locale);
}

export function automaticLocale(
  country: CapitalCountry,
  copies: Record<string, ConnectCopy>,
) {
  const primary: Record<string, string> = {
    th: "th",
    jp: "ja",
    kr: "ko",
    cn: "zh",
    tw: "zh",
    sg: "en",
    my: "ms",
    in: "hi",
    lk: "si",
    ch: "de",
    be: "nl",
    ca: "en",
    za: "en",
    nz: "en",
    ie: "en",
    lu: "lb",
    id: "id",
    il: "he",
    pk: "ur",
    af: "ps",
    bo: "es",
    uz: "uz",
    kz: "kk",
    kg: "ky",
    tj: "tg",
    tm: "tk",
    na: "en",
    no: "nb",
    gq: "es",
    es: "es",
    ar: "es",
    pe: "es",
    py: "es",
    rw: "rw",
    bi: "rn",
    mg: "mg",
    so: "so",
    ke: "sw",
    tz: "sw",
  };
  // Select the country's language even when its translation is not available.
  // The UI must then disclose the English fallback, rather than label English as local.
  return (
    primary[country.id] ??
    country.languages.find((item) => hasTranslation(copies, item.code))?.code ??
    country.languages[0]?.code ??
    "en"
  );
}

export function countryName(country: CapitalCountry, locale: string) {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "region" }).of(
        country.id.toUpperCase(),
      ) || country.country
    );
  } catch {
    return country.country;
  }
}

export function capitalName(city: string, locale: string) {
  const names: Record<string, Record<string, string>> = {
    Bangkok: {
      th: "กรุงเทพมหานคร",
      ja: "バンコク",
      ko: "방콕",
      zh: "曼谷",
      ar: "بانكوك",
      ru: "Бангкок",
    },
    Tokyo: {
      th: "โตเกียว",
      ja: "東京",
      ko: "도쿄",
      zh: "东京",
      ar: "طوكيو",
      ru: "Токио",
    },
    Seoul: {
      th: "โซล",
      ja: "ソウル",
      ko: "서울",
      zh: "首尔",
      ar: "سيول",
      ru: "Сеул",
    },
    London: {
      th: "ลอนดอน",
      ja: "ロンドン",
      ko: "런던",
      zh: "伦敦",
      ar: "لندن",
      ru: "Лондон",
    },
    Paris: {
      th: "ปารีส",
      ja: "パリ",
      ko: "파리",
      zh: "巴黎",
      ar: "باريس",
      ru: "Париж",
    },
    Singapore: {
      th: "สิงคโปร์",
      ja: "シンガポール",
      ko: "싱가포르",
      zh: "新加坡",
      ar: "سنغافورة",
      ru: "Сингапур",
    },
  };
  return names[city]?.[locale] ?? city;
}

export function matchCountries(
  countries: CapitalCountry[],
  query: string,
  region: string,
  locale: string,
) {
  const needle = query.trim().toLocaleLowerCase();
  return countries.filter(
    (country) =>
      (!region || country.region === region) &&
      [
        country.id,
        country.country,
        countryName(country, locale),
        ...country.capitals,
        ...country.capitals.map((city) => capitalName(city, locale)),
        ...country.languages.map((item) => item.name),
        ...country.currencies.map((item) => item.code),
      ].some((value) => value.toLocaleLowerCase().includes(needle)),
  );
}

export function readSelection(
  countryId: string | undefined,
  language: string | undefined,
  auto: string | undefined,
  countries: CapitalCountry[],
  copies: Record<string, ConnectCopy>,
) {
  const country =
    countries.find((item) => item.id === countryId?.toLowerCase()) ??
    countries.find((item) => item.id === "th") ??
    countries[0];
  const autoLanguage = auto !== "0";
  language = language?.toLowerCase();
  const locale =
    language &&
    (hasTranslation(copies, language) ||
      country.languages.some((item) => item.code === language))
      ? language
      : autoLanguage
        ? automaticLocale(country, copies)
        : "th";
  return { country, locale, autoLanguage };
}
