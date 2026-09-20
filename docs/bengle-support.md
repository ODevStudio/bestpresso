# Bengle support candidate

This is a local test candidate, not a hardware-certified release. No firmware,
heating, dispensing, tare, calibration, or settings writes were sent to a real
machine during development. The standalone fixture only stores values in memory.

## Implementation order

1. Machine identity, capability gating, water readings, refill-kit detection,
   reconnect handling, and advisory-only low-water warnings.
2. Integrated scale recognition, machine weight-flow precedence, workflow
   target-yield readback, and guided load-cell calibration.
3. Explicit cup-warmer enable/setpoint controls and firmware-owned scheduled
   preheat through the dedicated endpoint.
4. Sensor discovery and temperature display, plus persistent front/back lighting
   palettes. Front-switch colors remain read-only.

Keep these release stages ordered. Do not publish a stage as verified on Bengle
until its manual checks below pass. This checkout combines the stages for testing;
it does not publish four releases or migrate hardware settings automatically.

## Contracts and compatibility

- Source baseline: Bestpresso `9200c68352bedfe884c968f31a284cbda950ae7f`.
- API reference: Decaid lab checkout `a6e2a0594c8a3cd96c58a75279d2b8a2f29a1651`,
  `assets/api/rest_v1.yml` and `assets/api/websocket_v1.yml`. The Decaid app was not
  running during verification; backend integration on that revision remains open.
- Missing capabilities never enable hardware writes. An empty capability list
  preserves DE1 behavior. Missing optional endpoints display unavailable.
- Water shows measured height and lookup-estimated volume. Neither the lookup
  maximum nor the old 43 mm reading defines a verified capacity.
- The old local critical-water preference remains stored for compatibility but
  no longer creates a machine-out-of-water state or constrains the warning threshold.
- Sensor discovery accepts Decaid's top-level `id` and `info.data`, as well as
  the legacy embedded ID and `dataChannels` representation. Selection prefers
  the current machine's milk probe, then a named probe, then a generic temperature
  sensor; machine-derived probe IDs belonging to other machines are excluded.
- Sensor readings require finite non-placeholder temperatures and timestamps
  within five seconds of the browser clock. Stale/detached probes disappear.
- Lighting Apply persists immediately; Reload reads the current palette. There
  is no simulated commit or rollback operation.
- New locale entries are contextual drafts requiring native-speaker review.

## Automated verification

Run `npm test`, `npm run build`, `npm run lint`, and `npm run i18n:check`.
The suite covers water boundaries, invalid telemetry, session changes, surviving
sockets, readback mismatches, command serialization, calibration API validation,
explicit heater state, target yield, color conversion, and sensor freshness.

For browser checks, start `node test/bengle-api-fixture.mjs` and `npm run dev --
--host 127.0.0.1 --port 5173 --strictPort`. Run `node test/bengle-browser.mjs` with
Playwright available on the module search path and Microsoft Edge installed.
Do not replace the fixture address with a real machine gateway.
Set `BENGLE_FIXTURE_PORT` for both fixture and browser processes to use a separate
fixture when another preview is open; subscription counts must be test-local.

Browser checks cover writes and readback, calibration progress/abort, power cycle,
machine swap, unsupported preheat, sensor detachment, and 1280x800, 1024x768,
and 390x844 layouts. Screenshots and test output go into ignored `artifacts/`.
The narrow home dashboard scrolls vertically so brewing controls, water readings,
and the steam probe retain usable widths instead of clipping sideways.

The candidate ZIP contains production `dist` contents at its root and a
`build-info.json` identifying the source baseline and full working-source hash.
Use the built ZIP with the isolated Decaid Test installation, not a GitHub source
archive. Do not overwrite the regular tablet installation.

## Manual release gates

- Compare 43, 50, and 60 mm readings against Decaid. Check threshold changes,
  tank removal, firmware needs-water, and a detected automatic refill kit.
- Power-cycle Bengle and swap between Bengle and DE1. Confirm that old readings
  disappear, features follow capabilities, and only one water subscription remains.
- Check integrated and external scale selection, tare protection, live flow,
  target-yield readback, and machine-owned shot completion. The user operates shots.
- With the user present and the machine idle, zero unloaded cells and latch a
  known mass on each cell. Check progress, rejected loads, abort, and reconnect.
- Let the user enable the cup warmer, change its target, and test a wake schedule.
  Confirm that manual heating stays off after a power cycle and a missing
  preheat endpoint never causes writes to a guessed alternative endpoint.
- Apply awake/sleep lighting colors, reconnect, and confirm persistence. Verify
  that Reload does not claim to undo persisted changes.
- Display a real probe only when a supported sensor and valid data exist.
  Do not claim milk-temperature stopping support.

Firmware management, Wi-Fi scale administration, refill-threshold writes,
general sensor calibration, history/profile parity, lighting sequences, and
milk-temperature stopping remain deferred.
