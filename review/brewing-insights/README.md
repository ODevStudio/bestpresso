# Brewing insights design preview

Product spec: [brewing-insights-v1.md](../../docs/brewing-insights-v1.md).

Run the normal Vite development server and open `/review/brewing-insights/index.html`.
This is a separate entry, not a production route. The normal build does not bundle this prototype.

## Demonstrated

- Existing coverflow and utilities, with paired seven-day insight and latest-shot entry cards matching the supplied reference.
- Computed 7/28-day summaries from 56 days of fictional espresso records, anchored to 12 September 2026.
- Weekday, time-band and profile drill-down; comparison evidence sets; profile search and clear filter.
- Existing shot-detail graph and stage components; returning retains the contextual filter.
- Page-local dark/light toggle. No machine connection, commands or settings writes.
- Shared rounded, solid-fill bars across the home entry, weekday comparison, time bands and profile usage. Previous-period bars and their legend use a muted fill, not an outline; telemetry curves are unchanged.

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
