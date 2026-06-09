# simple-prerender

Post-build prerendering script for legacy React SPAs

It's a simple way to make the important sections of the site crawlable, without needing to refactor or migrate to a new framework.

> [!NOTE]  
> This is **not** SSR. Nothing runs at request time. Puppeteer runs once in CI or on your machine, writes HTML files into `dist/`, and your static host serves them like any other asset.

### What it does

1. Serves `dist/` locally (via `vite preview`)
2. Opens each target route in headless Chromium
3. Waits for page content to render
4. Saves the resulting HTML to the correct path under `dist/`
5. You deploy `dist/` as usual (Cloudflare Pages, Netlify, Vercel, etc.)

### Requirements

- Node.js 18+
- A frontend that builds to a `dist/` folder (Vite, or any static export)
- `puppeteer` installed in the project where the script runs

## Contents

- [Quick start](#quick-start)

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
