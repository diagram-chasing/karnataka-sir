# No eligible citizen is left out (?)

A [Diagram Chasing](https://diagramchasing.fun) data story that tests the
Election Commission's claim about Karnataka's final voter roll after the 2026
Special Intensive Revision. It's published at
[diagramchasing.fun/2026/karnataka-sir](https://diagramchasing.fun/2026/karnataka-sir).

## Before you begin

- Install Node.js 22 or later.
- Install [pnpm](https://pnpm.io).

## Run the story locally

1. Install the dependencies:

   ```bash
   pnpm install
   ```

2. Start the dev server:

   ```bash
   pnpm dev
   ```

3. Open the URL that the dev server prints. Locally, the story is served at the
   root, without the `/2026/karnataka-sir` path.

## Commands

| Command         | What it does                                                          |
| --------------- | --------------------------------------------------------------------- |
| `pnpm dev`      | Starts the dev server.                                                |
| `pnpm build`    | Builds the static site into `build/`.                                 |
| `pnpm preview`  | Serves the build. Open `/2026/karnataka-sir`.                         |
| `pnpm check`    | Type-checks the project with `svelte-check`.                          |
| `pnpm social`   | Redraws the share images. Requires Google Chrome on this machine.     |
| `pnpm rss`      | Refreshes the "More from us" posts in the footer.                     |
| `pnpm receipts` | Archives every linked document and records its hash. See `receipts/`. |

## Where things are

- `story.config.js`: The title, description, authors, publish date, and URL.
  Everything else reads these values from here.
- `src/lib/content.md`: The story text, with its charts placed inline.
- `src/lib/components/charts/`: One component per chart, plus the shared frame,
  hover card, and colour scales.
- `src/lib/data/`: The data the charts read. `constituencies.js` and
  `totals.js` derive the per-constituency rates and statewide counts that
  several charts share.
- `data/boundaries/`: The constituency boundaries and the script that packs
  them into the smaller files the map loads
  (`python3 data/boundaries/encode-boundaries.py`).
- `src/lib/assets/images/exhibits/`: The scanned roll pages shown as evidence,
  each in a wide and a narrow version, with their sizes in `manifest.json`.
- `src/story.css` and `src/typography.css`: The story's styles and colour
  tokens.
- `src/lib/social.js`: The share image formats and charts. `pnpm social` writes
  the link preview to `static/og/card.jpg` and the rest to `social/`.

## Data and sources

The rolls come from CEO Karnataka and were digitized with Mathakaavalu and
Edellu Karnataka. The anonymized final-roll dataset is
[on GitHub](https://github.com/diagram-chasing/karnataka-sir-voter-rolls-data).
The story's methodology section describes how the rolls were matched.

Claude Opus 5.5 was used for development and analysis.

## License

The code is under the [MIT License](LICENSE). The story's text, charts and the
derived data in `src/lib/data/` are under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The full dataset is
under the ODbL in its own repository.

These are not covered by either license and belong to their owners:

- The film posters in `src/lib/assets/images/posters/`.
- The news outlet icons in `src/lib/assets/favicons/`.
- The electoral roll pages in `src/lib/assets/images/exhibits/` and the
  booklet page in `src/lib/assets/images/booklet-page-6.png`, which are
  excerpts of documents published by the Chief Electoral Officer, Karnataka.
- The constituency boundaries in `data/boundaries/`.
