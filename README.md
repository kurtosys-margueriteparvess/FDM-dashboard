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
- `TODAY_STATE` and `LAST_REFRESHED`: which view today shows, and the "Last refreshed at" time for each.
- `TILES_NAVIGATE` (currently `false`): figure tiles are not clickable. Set to `true` to open the placeholder pages.

## How the data works

`src/data.ts` generates each day from a seed based on the date, so the same date always shows the same numbers.

Main tiles show a part out of a whole: **Processed / Received**, **Delivered / Owed**, **Checked / Checkable**.

- Today, Processed + Not processed + Rejected = Received. Delivered + Scheduled + Failed = Owed. Matched + Mismatched = Checked.
- Finished days (every day before today): everything is processed and delivered. Problems that came up are shown as **Rejected resolved**, **Failures resolved** and **Mismatches resolved**, and there is no banner.
- Accuracy is shown as two cards, **Static data** and **Dynamic data** (percent of checked values). They appear once checks exist; until then a placeholder shows.
- The graph's Processed and Delivered points equal the tiles for that day. The Deliveries table shows at most 5 rows, latest first; the column headers re-sort them.
- Saturdays have data. Sundays are all zeros.

Today has two states. Open the page with `?state=morning` or `?state=afternoon`, or change the default in `src/config.ts`:

- **morning** (default): files received and scheduled, nothing delivered or checked yet, no accuracy.
- **afternoon**: part delivered, part scheduled, a live failure with the alert banner, some checks in, accuracy 100% / 99%.

`npm run check:data` checks all of this. `TODAY_STATE=afternoon npm run check:data` checks the afternoon state.

## Navigation

Side navigation items are listed in `NAV_ITEMS` in `src/config.ts`. All are visible but not clickable (`enabled: false`). Add, remove or rename items there. The menu opens on hover and can be pinned open.

## Not clickable / placeholders

With `TILES_NAVIGATE` on, the figure tiles open placeholder pages (`/files-received`, `/deliveries`, `/golden-source`) with `date` and `filter` in the URL. Each has a "Back to Overview" link.

The range control above the graph (2W, 1M, 6M, 1Y) is shown as designed, but only two weeks has data, so the other ranges are not clickable.
