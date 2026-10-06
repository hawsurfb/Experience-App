# HSS Ops report data format (`hss-ops/1`)

Every scheduled brief (6:30 AM and 6:30 PM HST) produces **one JSON document** in this shape. The Ops app renders it directly, so field names and value types matter. The reference example is `data/2026-10-06-morning.json`; copy its structure exactly and replace the content.

## Where each run writes it

1. Artifact database of the Ops app: collection `reports`, document `latest` (full replace with `set`), plus an archive copy at `reports/<YYYY-MM-DD>-<morning|evening>`.
2. This repo: `ops/data/<YYYY-MM-DD>-<morning|evening>.json` and `ops/data/latest.json`, committed to `main`.

## Top level

| Field | Type | Notes |
|---|---|---|
| `schema` | `"hss-ops/1"` | Always this value. |
| `run` | `"MORNING"` or `"EVENING"` | |
| `report_date` | `YYYY-MM-DD` | Day the brief was produced (HST). |
| `target_date` | `YYYY-MM-DD` | Day the lesson windows apply to. Morning: today. Evening: tomorrow. |
| `generated_at` | ISO time with `-10:00` | When the data was refreshed. The app marks the report stale after 14 hours. |
| `next_update` | ISO time with `-10:00` | Next scheduled run. |

## Status labels

Use one of these wherever a `status` field appears: `VERIFIED`, `OBSERVED`, `FORECAST`, `REPORTED`, `INFERRED`, `NOT_VERIFIED`, `UNAVAILABLE`. Current is `INFERRED` unless directly measured. Water quality is `NOT_VERIFIED` unless the full live DOH list was read.

Hazard `state` values: `ACTIVE`, `NOT_ACTIVE`, `NONE_VERIFIED`, `UNAVAILABLE`.

## Sections

- `beginner`: `call` (`GO` | `CONDITIONAL` | `NO_GO`), `confidence`, `best_window {start,end}` (24 h `HH:MM`, or `null`), `headline`, `recommendation`, `reasons[]`, `precheck[]`, `decisive[]`, `no_go[]`.
- `general`: `rating` (`EXCELLENT` | `GOOD` | `FAIR` | `POOR` | `FLAT`), `headline`, `size_ft`, `size_note`, `surface`, `favored[]`, `waikiki_note`, `trend`.
- `canoes`: `size_ft`, `face`, `quality`, `status`, `note`.
- `breaks[]`: `{name, ft, zone}` with zone `Waikīkī` or `Town`.
- `regional`: `am_ft`, `pm_ft`, `status`, `scope`.
- `swell`: `status`, `components[] {ft, s, deg, dir, role}` (first = primary), `offshore {ft, s, dir, source, status}`, `trend`, `trend_prev`, `trend_next`, `effects[]`, `warning`.
- `wind`: `dir`, `deg`, `kt`, `gust_kt` (or `null`), `status`, `effect`, `forecast`, `trend`, `note`. The app converts knots to mph.
- `surface`: `state`, `drift`, `limiting`, `status`.
- `tide`: `station`, `status`, `events[] {date, time, type: "H"|"L", ft}` (include every high/low for the target date, plus the one before and after if known), `phase`, `positives[]`, `conflict`, `rule`.
- `current`: `state`, `confidence`, `status`, `drivers[]`, `between_sets`, `during_sets`, `post_set`, `field_test`, `one_student`, `multi_student`.
- `windows[]`: `{start, end, rating: "BEST"|"CONDITIONAL"|"AVOID", label, go, reasons[], precheck[]?, effort {student, coach}?, notes[]?, workable_for[]?, avoid_for[]?}`. Hours 6 AM–6 PM outside every window show as "Not rated".
- `avoid_triggers[]`, `effort[] {when, student, coach}`, `effort_rule`.
- `boards`: `canoes[] {board, fit}`, `town`.
- `weather`: `sky`, `showers`, `rain_pct`, `wind`, `upcoming {when, items[], note}` (or `null`).
- `alerts[]`: **official, active, verified** watches/warnings/advisories only: `{kind, head, issuer, in_effect, scope, details}`. Shown as red boxes. Empty array when none.
- `watch[]`: `{head, body}` heads-up items that are not active advisories.
- `hazards[]`: `{name, state, note?}` the full checked inventory.
- `tropical`: `active`, `note`.
- `water`: `status`, `inventory_verified`, `headline`, `statement`, `why`, `checked {brown_water, bacteria, sewage, beach}`, `runoff`. Also optional `notices[] {scope: "Waikīkī"|"Oʻahu"|"Statewide", head, issued}` for verified notices, scope stated exactly.
- `changes`: `previous {date, swell, canoes_ft, period_s}`, `items[]`, `next`.
- `sources[] {name, status}` and `gaps[]`.

## Rules the content must follow

Never equate the regional South Shore forecast or offshore swell height with Canoes. Never call 1–2 ft long-period surf low-energy by default. Never say "safe"; use workable, conditional, not recommended. Never say the water is clean or that there are no statewide or Oʻahu advisories unless the full live DOH list was read. Never invent a value: use `null` or `UNAVAILABLE` and add the gap to `gaps[]`. Keep the beginner call and the general-surfer outlook separate. Instructor on-site judgment overrides the report.
