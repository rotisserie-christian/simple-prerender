# simple-prerender

Post-build prerendering script for legacy React SPAs

It's a simple way to make the important sections of the site crawlable, without needing to refactor or migrate to a new framework.

> [!NOTE]  
> This is **not** SSR. Nothing runs at request time. Puppeteer runs once in CI or on your machine, writes HTML files into `dist/`, and your static host serves them like any other asset.

## What it does

1. Serves `dist/` locally (via `vite preview`)
2. Opens each target route in headless Chromium
3. Waits for page content to render
4. Saves the resulting HTML to the correct path under `dist/`
5. You deploy `dist/` as usual (Cloudflare Pages, Netlify, Vercel, etc.)

## Contents

- [Quick start](#quick-start)
