export type CapitalCountry = {
  id: string;
  country: string;
  capitals: string[];
  region: string;
  currencies: { code: string; name: string }[];
  languages: { code: string; name: string }[];
  latlng?: number[];
  note?: string;
  sourceUrl: string;
  sources?: { title: string; url: string }[];
};

export type ConnectCopy = {
  nativeName: string;
  direction: "ltr" | "rtl";
  explore: string;
  search: string;
  allRegions: string;
  country: string;
  capital: string;
  language: string;
  currency: string;
  homes: string;
  housingSource: string;
  noHomes: string;
  officialWebsite: string;
  storyTitle: string;
  storyIntro: string;
  chapter: string;
  nextCity: string;
  stay: string;
  source: string;
  localLanguage: string;
  fallback: string;
  learnCity: string;
  referenceNote: string;
};

export type Residence = {
  name: string;
  city: string;
  countryId: string;
  neighborhood?: string;
  type: string;
  description: string;
  sourceUrl: string;
  checkedAt: string;
};
