# Brewing Insights — RC device test

This build uses your existing Decaid saved shots. It does not modify that history or upload it anywhere. The package installs as **RC Bestpresso · Insights**, with skin ID `rc-bestpresso`, separate from the public `bestpresso` skin. It replaces an older RC skin with the same ID if one is installed.

## Start

1. Import the supplied RC ZIP into Decaid and select **RC Bestpresso · Insights**.
2. Keep Decaid available and open **Past 7 days insight** from Home. Check the last-sync time and saved-record count (up to 100).
3. Compare the count, dose and yield against known shots. Select Pour-over for tea/pour-over recipes. Choose History → All cached history to include today's shots.

## Things to test

- Tap a weekday, hourly sector/history link, or profile; the resulting list must match its count and selected period.
- Open a known shot. Check its recorded curve, final yield and stage cards against Decaid. Close should return to the same filtered list.
- Open several graphs while connected, then disconnect the history source while keeping the installed skin available. Reload: the 100 summaries and those graphs should remain. An unopened graph should ask to reconnect.
- Reconnect and Refresh. New/corrected/deleted records should be reflected; retained unchanged graphs should stay cached.
- Complete a new shot and check Latest shot / All cached history. The seven-day report intentionally excludes today's incomplete day.
- Try both themes and tablet orientations. Counts should not change when changing layout or theme.

## Expected limitations

- The 100-record window can cover less than 7/28 days on a busy machine. Partial coverage is labelled, and comparisons are withheld unless both periods are covered.
- Duration may initially show `—`: the list API does not provide it. Opening the actual graph fills it. Missing yield is also `—`, never a target substituted as an actual result.
- Dose can be the historical target, not a weighed dose. Older records may lack beverage type or simulation flags; Other / unknown and the provenance note make this explicit.
- Exact saved recipe versions are counted separately until Decaid supplies reliable profile lineage.
- Cache is per browser/device and gateway. Clearing browser storage or changing skin origin/gateway can start a fresh cache. This is not an offline install/service worker for the app assets.

## Verification before packaging

Read-only integration follows the current Decaid source schema. Automated tests cover normalization, bounded coverage, daylight-saving dates, offline restart, source isolation, edits/deletions, corrupt storage, request deduplication and route preservation. Browser checks use a local HTTP fixture implementing the real saved-shot contract, including a server-off/reload/reconnect cycle and tablet/phone views. **No physical machine or running Decaid instance was available for this verification.** This ZIP is for that next device test, not a published release.
