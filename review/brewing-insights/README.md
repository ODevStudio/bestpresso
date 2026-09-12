# Brewing insights design preview

Product spec: [brewing-insights-v1.md](../../docs/brewing-insights-v1.md).

Run the normal Vite development server and open `/review/brewing-insights/index.html`.
This is a separate entry, not a production route. The normal build does not bundle this prototype.

## Demonstrated

- Existing coverflow and utilities, with paired seven-day insight and latest-shot entry cards matching the supplied reference.
- Computed 7/28-day summaries from 56 days of fictional espresso records, anchored to 12 September 2026.
- Weekday, two-hour window and profile drill-down; comparison evidence sets; profile search and clear filter.
- Existing shot-detail graph and stage components; returning retains the contextual filter.
- Page-local dark/light toggle. No machine connection, commands or settings writes.
- Shared rounded, solid-fill bars across the home entry, weekday comparison and profile usage. Previous-period bars and their legend use a muted fill, not an outline; telemetry curves are unchanged.
- A 24-hour heat strip compares twelve two-hour windows using the same color scale for current and previous periods.

The detail curves are illustrative demo telemetry, not real measurements for the fictional shots.
Backend aggregation, beverage filters, pagination, caching, full browser navigation and production integration remain specified work.

## Verification — 12 September 2026

- All 300 repository tests passed, including prototype aggregate/filter/average and shared navigation guards.
- Production build passed; existing bundle-size warning remains.
- Separate prototype TypeScript check and targeted lint passed.
- Actual browser clicks exercised home → overview → history → detail → back.
- Switched 7/28 days; checked 37 current profile matches versus 9 previous matches.
- Checked weekday filtering, empty search, clearing search/filter, chart legend toggle and stage selection.
- Corrected the demo timestamp mapping and verified the list/detail local times match.
- Visually checked dark/light at 1194×834 and the dark overview/history at 1024×768; no document-width overflow at 1024.
- Home layout was corrected after visual inspection so the new module does not clip the utilities.

Entry refinement checks:

- Both whole-card buttons open their intended destinations; the insight card selects seven days, and the latest-shot card opens the correct profile/time/yield.
- The coverflow and entry-row bounds remained identical at the initial 1120×897 viewport.
- At 1024×768 the entry cards align with the scale card's bottom edge, with no horizontal overflow. The insight card remained clickable.
- Dark/light entry visuals checked at 1194×834. The preview now opens on Home.
- The home average is a mean, not the overview median; missing yield is excluded. Dose in the chip is explicitly fictional shot metadata.

Current entry evidence: `home-entry-dark.png`, `home-entry-light.png`, `home-entry-1024.png`.
Earlier overview/detail evidence: `overview-dark.png`, `overview-light.png`, `history-dark.png`, `shot-detail-dark.png`. `home-dark.png` preserves the initial entry design for comparison.

These checks verify the design prototype, not a Decaid aggregation implementation or real hardware behaviour.

## Shared navigation and standalone detail refinement

- Insights and the actual Settings screen use the same `SidebarBrand` and `SidebarNavItem` components.
- Both close controls are 42×42px. Selected items share their green color, solid surface, thin outline, 14px radius and 46px height.
- Only Insights opts into the standalone shot-detail layout. The legacy main-app history route retains its existing list browser until integration.
- Actual clicks verified Settings section selection, Insights Overview/History selection, and Close from a latest shot returning to Insights History.
- A filtered Adaptive V2 history retained its filter after detail; repeated detail visits restored a 273px list scroll position exactly.
- Visually checked full-width detail and navigation in light mode at 1024×768 and dark mode at 1194×834.
- Settings was checked in local/disconnected mode. No settings were saved and no machine operations were performed.

Evidence: `detail-full-width-dark.png`, `detail-full-width-light-1024.png`, `sidebar-insights-dark.png`, `sidebar-settings-dark.png`.

## Filled bar styling refinement

- Home, weekday and horizontal bars share one rounded solid-fill rule; comparison bars and legend markers use a theme-specific muted fill. No bar borders, shadows or gradients.
- Actual browser clicks verified Monday → nine matching brews and the home insight card → seven-day Overview.
- Visually checked dark/light at 1194×834 and light at 1024×768, including the zero-count Tuesday. No horizontal document overflow at 1024px; computed bar borders are 0px.
- All 300 tests and the production build passed. Existing bundle-size warning remains. No telemetry, filters or aggregation logic changed.

Evidence: `bars-unified-dark.png`, `bars-unified-light.png`, `bars-unified-light-1024.png`.

## Home bar and period-control consistency

- Removed the remaining home-only opacity scaling. Nonzero bars now share solid theme color, 20px width and 7px rounding with Overview; both use neutral baseline ticks for zero counts.
- Home remains seven chronological dates; Overview remains weekday aggregates with previous-period comparison. The compact home chart keeps its smaller available height.
- Period select uses an inset custom chevron (18px from the right before rotation), with space reserved for its label at compact widths. The native select behavior and keyboard focus indication remain.
- Browser clicks opened the menu, switched 7/28 days and opened Overview from Home. Verified dark/light at 1016×720 and the compact light layout at 640×900; no horizontal overflow at 640px. All 300 tests and the separate preview TypeScript check passed.

Evidence: `bars-matched-home-dark.png`, `bars-matched-home-light.png`, `bars-matched-overview-dark.png`, `period-chevron-light-compact.png`.

Current observation scope: the prototype chooses one profile-share increase story, otherwise a dominant time-band routine summary, otherwise brewing-days fallback. Time-band changes are specified but not implemented. These are deterministic fictional-data examples, not connected machine analytics.

## Shared home surfaces and 24-hour heat strip — 13 September 2026

- The neutral home profile panel, insight entry and latest-shot entry share an identical opaque surface per theme. The selected profile's animated gradient art remains unchanged.
- The insight entry chart has 24px top padding at both regular and short-screen breakpoints.
- Current and previous heat-strip rows share one count-to-color scale. Empty windows are neutral; selecting a cell shows its exact count. View brews opens that time window in the selected reporting period.
- Actual browser clicks verified prior-period 14:00–16:00 → 9 brews, switching that filter to the current period → 8 brews, and prior-period 10:00–12:00 → an empty list.
- Visually checked dark/light at 1194×834 and dark home/overview at 1024×768. Home entry content and the heat strip had no horizontal overflow; top padding remained 24px. Temporary viewport overrides were reset after testing.
- All 302 tests, production build, separate preview TypeScript check and targeted lint passed. Existing production bundle-size warning remains.
- This remains a fictional-data design preview on the Insights branch, with no machine connection. Touch targeting on real tablet hardware and backend aggregation are not verified.

Evidence: `heat-strip-dark.png`, `heat-strip-light.png`, `heat-strip-1024.png`, `shared-home-surfaces-dark.png`, `shared-home-surfaces-light.png`, `shared-home-surfaces-1024.png`.

## Open charts above the summary — 13 September 2026

- Weekly rhythm and When you brew now precede the four summary metrics in both visual and document order. Both chart sections have transparent backgrounds and no card outlines; the summary retains its divided card.
- The two charts use a wider gutter and 28px separation from the summary. Below 1000px they stack before the summary without changing data or filtering behavior.
- Browser verification checked both themes at 1054×901 and the stacked light layout at 980×800, including scrolling to the summary. No horizontal document overflow at the narrow breakpoint.
- Actual clicks verified Monday → two matching brews and the previous-period 14:00–16:00 heat cell → three matching brews. All 303 tests, separate preview typecheck, targeted lint and production build passed; the existing bundle-size warning remains.
- This is still a local fictional-data preview, not a connected-machine or hardware-touch verification.

Evidence: `open-charts-dark.png`, `open-charts-light.png`, `open-charts-light-stacked.png`, `open-charts-light-stacked-summary.png`.
