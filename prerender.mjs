import puppeteer from 'puppeteer';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Constants 
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');
const PORT = 4173;
const BASE = `http://localhost:${PORT}`;
const SERVER_READY_TIMEOUT_MS = 30_000;
const PAGE_TIMEOUT_MS = 60_000;

const PRERENDER_ROUTES = [
    '/',
    '/placeholder',
];

function routeToOutputPath(route) {
    if (route === '/') {
        return path.join(DIST, 'index.html');
    }
    return path.join(DIST, route.slice(1), 'index.html');
}

async function waitForServer(url, timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const response = await fetch(url);
            if (response.ok || response.status === 404) {
                return;
            }
        } catch {
            // Server not ready yet
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`Preview server did not become ready at ${url}`);
}

function startPreviewServer() {
    const viteBin = path.resolve(__dirname, '..', 'node_modules', 'vite', 'bin', 'vite.js');
    const child = spawn(process.execPath, [viteBin, 'preview', '--port', String(PORT), '--strictPort'], {
        cwd: path.resolve(__dirname, '..'),
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (chunk) => {
        process.stdout.write(`[preview] ${chunk}`);
    });
    child.stderr.on('data', (chunk) => {
        process.stderr.write(`[preview] ${chunk}`);
    });

    return child;
}

async function prerenderRoute(page, route) {
    const url = `${BASE}${route}`;
    console.log(`Prerendering ${url}`);

    await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: PAGE_TIMEOUT_MS,
    });
    await page.waitForSelector('h1', { timeout: PAGE_TIMEOUT_MS });

    const html = await page.content();
    const outputPath = routeToOutputPath(route);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html, 'utf8');

    console.log(`  -> ${path.relative(process.cwd(), outputPath)}`);
}

async function main() {
    try {
        await fs.access(DIST);
    } catch {
        console.error('dist/ not found. Run "vite build" before prerendering.');
        process.exit(1);
    }

    const preview = startPreviewServer();

    const shutdown = () => {
        if (!preview.killed) {
            preview.kill();
        }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    let browser;

    try {
        await waitForServer(BASE, SERVER_READY_TIMEOUT_MS);

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        const failed = [];

        for (const route of PRERENDER_ROUTES) {
            try {
                await prerenderRoute(page, route);
            } catch (error) {
                failed.push({ route, error });
                console.error(`  x ${route}: ${error.message}`);
            }
        }

        const succeeded = PRERENDER_ROUTES.length - failed.length;
        console.log(`Prerendered ${succeeded}/${PRERENDER_ROUTES.length} routes.`);

        if (failed.length > 0) {
            process.exit(1);
        }
    } finally {
        if (browser) {
            await browser.close();
        }
        shutdown();
    }
}

main().catch((error) => {
    console.error('Prerender failed:', error);
    process.exit(1);
});
