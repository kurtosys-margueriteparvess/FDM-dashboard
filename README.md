# Fund Data Assurance: Overview (round 2 prototype)

Clickable prototype of the Overview page, built from an internal design. All data is invented and generated in the browser. Nothing is sent anywhere.

## Run

```bash
npm install
npm run dev        # development
npm run build      # type-check and build to dist/
npm run preview    # serve dist/ on http://localhost:4173
npm run check:data # asserts the data invariants over every available date
npm run verify     # browser journeys (needs a preview server on 4173 and Google Chrome)
```

`dist/index.html` is a single self-contained file (scripts, styles and fonts inlined) with hash routing. Double-click it to open it, or put it on any static host. Share just that one file.

## Change "today"

Edit `src/config.ts`:

- `TODAY` (currently 2026-08-14, a Friday). Every date on the page is derived from it.
- `DATA_HORIZON_DAYS` (16): how far back the date picker and graph allow.
- `GRAPH_DAYS` (13): days shown on the graph.
- `LAST_REFRESHED_MORNING` / `LAST_REFRESHED_PAST`: the "Last refreshed at" times.
- `TILES_NAVIGATE` (currently `false`): figure tiles are not clickable. Set to `true` to open the placeholder pages.

## How the data works

`src/data.ts` generates each day from a seed based on the date, so the same date always shows the same numbers.

- Not processed + Rejected + Processed = Received
- Scheduled + Failed + Delivered = Owed
- Matched + Mismatched = Checked
- Accuracy = Matched / Checked, rounded. Target 97%.
- Weekly change = average accuracy of the last 7 days minus the previous 7 days, in percentage points.
- The failure banner shows only when Failed is above 0.
- Table rows, file names and the graph points all use the selected date.
- Saturdays have data. Sundays are all zeros.
- Today, early morning: Received and Owed have figures. Delivered, Failed, Checked and Accuracy are 0, and accuracy shows a placeholder until checks arrive.
- Failures sit at today minus 2, 6 and 10, each with a different cause.

`scripts/consistency.ts` checks all of this.

## Navigation

Side navigation items are listed in `NAV_ITEMS` in `src/config.ts`. All are visible but not clickable (`enabled: false`). Add, remove or rename items there. The menu opens on hover and can be pinned open.

## Not clickable / placeholders

With `TILES_NAVIGATE` on, the figure tiles open placeholder pages (`/files-received`, `/deliveries`, `/golden-source`) with `date` and `filter` in the URL. Each has a "Back to Overview" link.
