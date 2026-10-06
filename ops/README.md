# Hawaii Soul Surfer Ops

Private instructor report for Canoes, Waikīkī. Layout and design are a clone of Surf Report Live (mockup v5 plus the UI + Build handoff spec).

- `index.html`: the app. One self-contained page. It shows the report built into it, then loads `data/latest.json` when hosted, so it updates without a rebuild.
- `data/latest.json`: the newest report. Each scheduled brief (about 6:30 AM and 6:30 PM HST) replaces it and adds a dated copy, `data/YYYY-MM-DD-morning.json` or `-evening.json`.
- `SCHEMA.md`: the report format (`hss-ops/1`) the briefs must follow.
- `src/`: page source. `build.py` combines it with the design system in `design/surf-report-live-mockup.html` and the newest report: `python3 build.py design/surf-report-live-mockup.html data/latest.json`.

The satellite map in the design file is a low-resolution placeholder and not licensed for production.
