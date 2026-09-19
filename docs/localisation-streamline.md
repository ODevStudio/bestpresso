# Four-language translation seed

Branch: `feature/add-four-locales`. This is a partial translation seed, not a complete or published language release.

## Source and permission

Selected translations come from Decent Espresso's Streamline.js translation contributors:
[de1 gui translation - Sheet1.csv](https://github.com/decentespresso/streamline-js/blob/c47156be646168bd89587e69c9ec511867658a90/src/ui/de1%20gui%20translation%20-%20Sheet1.csv), pinned to commit `c47156be646168bd89587e69c9ec511867658a90`.

The project owner confirmed permission to reuse this content on 19 September 2026. Upstream carries a GPL-3.0-or-later notice. This import does not change Bestpresso's project licence or claim ownership of the source translations. Keep the separate reuse permission with project records.

`streamline-translation-provenance.json` records each chosen English source, CSV record number (including the header, not physical lines inside quoted cells), destination token, and languages that reuse it. No network request or CSV parsing happens at runtime.

## Deliberately partial

- French and Italian each start with 145 context-matched tokens.
- Traditional and Simplified Chinese each start with 130 context-matched tokens.
- Temperature, pressure, flow, device states and other unambiguous matching labels are reused as complete messages.
- Matching English alone is not enough. Source-code “Source”, a scheduled-switch “Timer”, generic “Insight”, line-weight “Medium”, and ambiguous transition terms are left unfilled. Chinese bean-dose wording, in-progress cleaning/descaling labels used as nouns, generic existence detection and “MAX TIME” translated merely as “time” are not imported.
- Duplicate source rows are explicitly selected, not first-match guesses. For example, the espresso beverage uses the beverage entry, not the similarly named coffee circuit; manual mode does not use the hand-brewing entry.
- Untranslated runtime keys are **absent**, not empty strings. This retains usable English fallback. `localisation-pending.json` contains genuinely blank translation fields for the follow-up writing pass, alongside the English source and any already imported sibling-language entries.
- Imported entries remain marked **needs review** until an explicit wording review baseline is acknowledged. A native-speaker review is still desirable; neither an exact match nor a passing test certifies translation quality.

## Locale behaviour

Catalogs are lazy-loaded like German. Regional preferences are retained: for example French Canada, Italian Switzerland, Traditional Chinese Hong Kong and Simplified Chinese Singapore. Explicit Chinese script tags take precedence over a conflicting region. Bare Chinese defaults to Simplified Chinese.

Number punctuation and grouping use Intl; measurements remain numeric in storage and API payloads. The input keypad uses the selected locale's decimal mark. Dates and date ranges use locale formatting even where prose remains English. Chinese month/year ordering and day-period placement are not assembled using English word order. Explicit 12/24-hour settings still win; “follow device” retains the device's clock convention. Older WebViews receive an uncompressed, localised date-range fallback and retain Chinese script selection without Intl.Locale.

No release, version bump, remote push or merge is included in this work.

## Follow-up writing and verification

`localisation-pending.json` is an editing worklist, not a runtime catalog. Once a blank is agreed, place the complete message under the same key in the relevant `src/i18n/<language>/<feature>.ts` file. Keep placeholders intact and use full locale plural messages where needed. Run `npm run i18n:check`, update the coverage report, then acknowledge only explicitly reviewed tokens through the existing review command. Do not copy English strings into empty entries just to improve coverage numbers.

Initial checks: all 562 regression tests pass, catalog validation and the production build pass, and browser checks cover all four language selectors, lazy loading, live label changes, decimal display, unchanged profile names, preference persistence and phone settings layout. Tablet screenshots were inspected for French and Traditional Chinese. Existing preview lint and bundle-size warnings remain unchanged. No native-speaker certification or physical-machine test is claimed.
