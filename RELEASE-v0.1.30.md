# Bestpresso v0.1.30 — Understand each stage

- See why a stage moved on in live brew and shot history: time, pressure, flow, yield, volume, or manual advance.
- Compact condition labels sit beneath each stage title, with advance and stop icons. Active stages show a green indicator and timer.
- Multiple plausible conditions share a concise “or” explanation; unavailable reasons show “Unknown.”
- Existing cached graphs are reconciled quietly in the background, including offline. Other shots are analysed when their details are opened.
- Stage cards and the manual-advance button share a content-sized height in both dark and Light Beta themes.

Recorded stage-matched events take priority where available. Other explanations are inferred from the saved recipe and telemetry, rather than reported directly by the machine. Older or incomplete records may show “Unknown.” Brewing behavior and profile execution are unchanged.

Install `bestpresso-v0.1.30.zip` in Decaid.

## Patch 002 — Profile loading and tablet compatibility

- Fixed loading cleaning and other profiles without a target yield on newer Decaid versions.
- Preserved each stage's temperature when selecting a profile. Temperature adjustments now retain the recipe's differences between stages.
- Kept Decaid's current profile and yield on startup, instead of overwriting them with remembered settings.
- Fixed older-tablet browser compatibility affecting live shots, the Stop button, cached history, and profile editing.
- Cleaning now shows loading and failure states clearly, offers retry, and only displays start instructions after loading succeeds.

This patch addresses confirmed compatibility and profile-handling bugs. The separate intermittent issue requiring an app/machine restart remains under investigation.

Install `bestpresso-v0.1.30-patch002.zip` in Decaid.

## Patch 003 — Lighter animations and tablet reliability

- Added an Animations switch in App experience. Turn it off to reduce device workload: status and favorite-card effects become static, and steam readings update without smoothing or crossfades.
- The choice is saved on each device. Live readings and operational indicators remain active; the device's reduced-motion preference is also respected.
- Improved layout compatibility with older tablet browsers.
- Automatic scale searches now back off, pause during brewing, and recover after wake or reconnect.
- Automatic tare is limited to shot preparation, avoiding a mid-shot tare when reconnecting.
- Stop confirmation now requires fresh machine feedback. Unconfirmed stops remain clearly indicated and can be retried.

Install `bestpresso-v0.1.30-patch003.zip` in Decaid.
