# SOCIAL_PUBLISHING

## MVP mode (default, no provider key)
Download rendered video → copy caption → copy disclosure → copy affiliate link/code → open the platform composer → post natively → record the live URL in the Share Center. This is fully functional in the demo.

## Connected mode (AYRSHARE_API_KEY set, DEMO_MODE=false)
- Each creator connects and authorizes THEIR OWN social accounts (Ayrshare business-user profiles). "One click to every platform" cannot operate lawfully or reliably without those per-creator grants.
- Flow: select platforms → review platform-specific copy → creator explicitly presses publish/schedule (`creatorApproved: true` is required by the API schema — publishing without it is rejected).
- Provider response IDs are stored; metrics import via `capture-social-metrics` (source `provider_import`).
- Platform support differs (YouTube, TikTok, Instagram, Facebook, X, LinkedIn, Pinterest where supported) — the UI does not promise identical capabilities everywhere.

## Media rendering
`render-media` adapts to Creatomate or Shotstack via `MEDIA_RENDER_PROVIDER`. Without keys it returns an explicit "not configured" mock — it never fakes a successful render. Optional lazy-loaded browser FFmpeg for short clips is an enhancement point; the app must never depend on FFmpeg loading successfully.
