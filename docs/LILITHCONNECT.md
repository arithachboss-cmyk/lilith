# Lilithconnect — Lili's capital-city explorer

Added 2026-09-10 at `/connect`. This page extends the existing Lilith Homes site with Lili's continuing city story, country selection, local-language switching and sourced residential references. The original lead intake and matching system remain separate.

## Owner's launch decision — 2026-09-10

The owner explicitly deferred publication: “ยังครับ เอาไว้ เปิดตัวประเทศละ เดือน” — keep the work for later and launch one country per month.

- Keep Lilithconnect unpublished for now. The 195-country directory is preparation material, not an announcement that all markets have launched.
- The owner subsequently specified the first four narration releases: month 1 Thai (TH), month 2 Korean (KO), month 3 Japanese (JA), month 4 Vietnamese (VI). The first clip introduces finding a condominium for a one-year stay in Bangkok, starting at Connect.
- The current script treatment keeps Bangkok as the common destination and changes the narration language for each audience. Months 2–4 specify languages, not a confirmed move to Seoul, Tokyo or Hanoi. Worldwide capital exploration remains the broader product direction.
- The start month and publication dates remain unset. Episode numbering is relative, not a scheduled release date.
- No automatic publication or recurring automation is scheduled by this decision. Resume publication only when the owner requests it.

Script and monthly sequence: [Lili's launch episodes](LILITHCONNECT_LILI_EPISODES.md).

## Storytelling roles

The owner supplies the memories and source information, The Middle supplies the voiceover scripts, and **Lili / ลิลิ** is the presenting character. Existing episode drafts are preparation material, not scripts already supplied by The Middle. See [role definition](LILI_STORY_ROLES.md) and the [five-city story collection](LILI_CUSTOMER_STORY_DRAFTS.md).

## Content and scope

- **195 countries:** 193 UN members plus Holy See/Vatican City and Palestine. Dependent territories and other non-UN states are outside this directory's stated scope.
- Country and capital names, reference currencies, selected country languages, source links and explanatory notes for multiple capitals and recent transitions.
- **73 locale packs:** interface labels, Lili's narrative and the housing-reference note. Country names use `Intl.DisplayNames`; the six initial city names have additional localized forms. Other proper names, source descriptions, detailed geography notes and attribution remain in English and are marked with `lang="en"`.
- Native-language defaults can be overridden. Selecting a language manually disables automatic switching until the checkbox is re-enabled. Language codes such as JA and KO remain distinct from JP and KR country codes. Multiple country languages appear as individual buttons.
- Unsupported selected languages show an explicit English fallback. In particular, Dzongkha (DZ) and Divehi (DV) have no translated pack. The selected-country language list contains additional languages without UI translations; no claim of universal translation is made. Translations have not received native-speaker review.
- Lili's story is authored, deterministic text with the selected city inserted. A short in-memory trail connects successive choices. This is not a connected generative AI assistant or a persistent travel profile.
- **8 reference projects in 6 cities:** Bangkok, Tokyo, Seoul, London, Paris and Singapore. Condominiums, rental apartments and serviced residences are labelled according to their source. These are not available units, partnership claims or confirmed one-year leases.
- **18 local property portals** provide further research. Other countries have a labelled external search link and an honest empty reference state; they are not described as having verified inventory.
- No prices, room availability, live exchange rates, bookings, legal advice or provider handoffs are inferred. eSIM integration remains outside this change.

## Source provenance

Country data derives from [mledoze/countries](https://github.com/mledoze/countries), under ODbL-1.0. The modified database is available at `/connect-countries.json` with `/connect-countries-license.txt`; the footer links to both. Targeted capital and currency corrections, membership scope and research limits are recorded in `src/data/connect/countries.metadata.json`. Some country notes link directly to government sources. Swiss standard German was added using the [Swiss Federal Department of Foreign Affairs](https://www.aboutswitzerland.eda.admin.ch/en/language).

Full project and portal research is retained in `src/data/connect/housing-sources.json`. The source date records when project descriptions were checked, not current vacancy.

The Bangkok panorama is by Bigcitydata on Wikimedia Commons, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The page links to its author/source and licence and notes cropping for display. A 1280-pixel Wikimedia thumbnail is served locally; it is city photography, not an image of a listed residence. Provenance is in `src/data/connect/image-source.json`.

## Data maintenance

Update `countries.json` and its public downloadable copy together. Keep explanatory notes for capital roles, source URLs and metadata in sync. Changes to housing references belong in `residences.json` with a source and review date; use `portals.json` for search sites, never available-unit cards. Real inventory needs a separate verified feed with unit IDs, permission to display, price, currency, lease length and availability timestamp.

## Validation

`vitest run --config vitest.connect.config.ts` covers country coverage, non-ASCII search, multi-capital data, distinct country/language codes, prototype-key URL attacks, manual language overrides, automatic language switching, Arabic RTL, empty housing states and clearing a search after a language change. These are component tests, not browser tests.

The whole-workspace TypeScript check currently includes unrelated `work/ARCH-002-shared-kernel` code that needs ES2020 and TypeScript-extension settings. The added application slice is also checked independently; do not attribute the existing workspace errors to this feature or silently change the other project's configuration.

Publication is on hold at the owner's explicit request. The local implementation is retained for a future one-country-per-month rollout; the existing live URL does not yet contain this new route.
