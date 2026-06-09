# simple-prerender

Post-build prerendering script for legacy React SPAs

It's a simple way to make the important sections of the site crawlable, without needing to refactor or migrate to a new framework.

> [!NOTE]  
> This is **not** SSR. Nothing runs at request time. Puppeteer runs once in CI or on your machine, writes HTML files into `dist/`, and your static host serves them like any other asset.

### Requirements

- Node.js 18+
- A frontend that builds to a `dist/` folder (Vite, or any static export)
- `puppeteer` installed in the project where the script runs

## Contents

- [Quick start](#quick-start)
- [How it works](#how-it-works)
- [Configuration](#configuration)
- [Output layout](#output-layout)
- [Wait strategy](#wait-strategy)
- [Limitations](#limitations)
  
## Quick start

**1) Copy into your project**

Place `prerender.mjs` wherever you keep build scripts (ex: `scripts/prerender.mjs`).

**2) Install Puppeteer**

```bash
npm install puppeteer --save-dev
```

**3) Add to the build**

```json
{
  "scripts": {
    "build": "vite build && node scripts/prerender.mjs",
    "prerender": "node scripts/prerender.mjs"
  }
}
```

**4) Edit the route list**

Open `prerender.mjs` and set `PRERENDER_ROUTES` to the pages you want crawlable

## How it works

- Serves `dist/` locally (via `vite preview`)
- Opens each target route in headless Chromium
- Waits for page content to render
- Saves the resulting HTML to the correct path under `dist/`
- You deploy `dist/` as usual (Cloudflare Pages, Netlify, Vercel, etc.)

## Configuration

Edit the constants at the top of `prerender.mjs`:

- **`PRERENDER_ROUTES`** - Paths to prerender
- **`DIST`** - Build output directory (default = ../dist)
- **`PORT`** - Local preview server port (default = 4173)
- **`PAGE_TIMEOUT_MS`** - Timeout per page (default = 60000)
- **`SERVER_READY_TIMEOUT_MS`** - Server startup timeout (default = 30000)

## Output layout

```
dist/
  index.html  # homepage (if / is in your route list)
  dogs/
    index.html
  cats/
    index.html
    cheetahs/
      index.html
```
  
## Wait strategy 

Pages that load content asynchronously (lazy routes, code-split chunks, etc) need a wait beyond `domcontentloaded`, or you may snapshot a loading state instead of real content.

This script waits for **`h1`** on every route. That is simple and works for most text-heavy pages.

## Limitations 

- Overwriting `dist/index.html` with full-page HTML makes that file large, it becomes the SPA shell for all non-prerendered routes until React replaces `#root`
- Meta tags from libraries like `react-helmet-async` may update after `h1`, add a longer wait or wait on a head-specific selector if that matters
- Prerender only affects the initial HTML snapshot
