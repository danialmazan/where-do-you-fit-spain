# ¿Dónde encajas en España?

Spanish-first interactive statistical tool showing where an adult sits relative to Spain and how many adults in private households share a similar profile.

The interface uses a deployment-safe local snapshot of the core typography and colour tokens from the sibling `dani-style` project: Plus Jakarta Sans for headings, Geist for text, Roboto Mono for figures, and its light analytical palette.

## Architecture

Official INE ECV 2025 microdata are transformed by a reproducible R pipeline into compact, aggregate JSON lookups. The React/TypeScript frontend queries those files locally; form answers are never transmitted or stored.

## Data

```bash
Rscript scripts/00_download_sources.R
Rscript scripts/01_build_lookups.R
Rscript scripts/02_validate_outputs.R
```

The first command downloads the official 2025 ECV archive to `data/raw/`, which is gitignored. The generated public files contain aggregate counts only.

The statistical definitions, publication thresholds, source-to-output mapping and known limitations are documented in [`docs/methodology.md`](docs/methodology.md).

## Frontend

```bash
npm install
npm run dev
npm run check
npm run test:e2e
```

Production builds use the base path `/where-do-you-fit-spain/`.

`npm run check` validates the aggregate data, runs unit tests and creates the production bundle. `npm run test:e2e` checks the Spanish and English experiences, responsive overflow, deterministic broadening and sparse-cell suppression in desktop and mobile Chrome.
