import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:8081';
const port = Number(process.env.QA_CHROME_PORT || 9335);
const screenshotsEnabled = process.env.QA_SCREENSHOTS !== '0';

const chromeCandidates = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const chromeBin = chromeCandidates.find((candidate) => existsSync(candidate));
if (!chromeBin) {
  throw new Error('Chrome/Chromium not found. Set CHROME_BIN to run web QA.');
}

const profileDir = join(tmpdir(), `sabaitalk-qa-chrome-${process.pid}`);
const screenshotDir = join(process.cwd(), '.qa-artifacts');
if (screenshotsEnabled) mkdirSync(screenshotDir, { recursive: true });

const browser = spawn(chromeBin, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  'about:blank',
], { stdio: ['ignore', 'ignore', 'ignore'] });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForJson(url, attempts = 50) {
  let lastError;
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw lastError || new Error(`Could not reach ${url}`);
}

const pages = await waitForJson(`http://127.0.0.1:${port}/json`);
const page = pages.find((item) => item.type === 'page');
if (!page?.webSocketDebuggerUrl) throw new Error('No debuggable Chrome page found.');

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let nextId = 1;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const entry = pending.get(message.id);
  if (!entry) return;
  pending.delete(message.id);
  if (message.error) entry.reject(new Error(message.error.message));
  else entry.resolve(message.result);
});

function cdp(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function waitForRenderable(attempts = 30) {
  for (let index = 0; index < attempts; index += 1) {
    const { result } = await cdp('Runtime.evaluate', {
      expression: `(() => {
        const root = document.getElementById('root');
        const text = document.body?.innerText?.trim() || '';
        return document.readyState === 'complete' && Boolean(root) && text.length > 0;
      })()`,
      returnByValue: true,
    });

    if (result.value === true) return;
    await sleep(100);
  }
}

await cdp('Page.enable');
await cdp('Runtime.enable');

const viewports = [
  { name: '360x800', width: 360, height: 800, mobile: true },
  { name: '390x844', width: 390, height: 844, mobile: true },
  { name: '412x915', width: 412, height: 915, mobile: true },
  { name: '1440x900', width: 1440, height: 900, mobile: false },
];

const routes = [
  '/',
  '/login',
  '/register',
  '/profile-setup',
  '/interests',
  '/location',
  '/discover',
  '/matches',
  '/chats',
  '/profile',
  '/profile/demo-ton',
  '/chat/demo-ton',
  '/match/demo-match?profileId=demo-ton&name=Ton',
  '/meeting/demo-ton',
];

const visualRoutes = new Set([
  '/login',
  '/register',
  '/discover',
  '/profile',
  '/profile/demo-ton',
  '/match/demo-match?profileId=demo-ton&name=Ton',
  '/meeting/demo-ton',
]);

const failures = [];
const results = [];

function slug(value) {
  return value
    .replace(/^\//, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'home';
}

async function evaluatePage(route, viewport, phase) {
  const expression = `(() => {
    const root = document.getElementById('root');
    const doc = document.documentElement;
    const bodyText = document.body?.innerText || '';
    const errorText = /Uncaught Error|Log \\d+ of \\d+|Application error/i.test(bodyText);
    const scrollWidth = Math.max(doc.scrollWidth, document.body?.scrollWidth || 0);
    return {
      route: location.pathname + location.search,
      title: document.title,
      innerWidth,
      innerHeight,
      scrollWidth,
      scrollHeight: Math.max(doc.scrollHeight, document.body?.scrollHeight || 0),
      overflowX: scrollWidth > innerWidth + 1,
      hasRoot: Boolean(root),
      textLength: bodyText.trim().length,
      errorText
    };
  })()`;

  const { result } = await cdp('Runtime.evaluate', {
    expression,
    returnByValue: true,
  });
  const value = result.value;
  const row = { viewport: viewport.name, route, phase, ...value };
  results.push(row);

  if (!value.hasRoot || value.textLength === 0 || value.overflowX || value.errorText) {
    failures.push(row);
  }
}

try {
  for (const viewport of viewports) {
    await cdp('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
    });

    for (const route of routes) {
      const url = new URL(route, baseUrl).toString();
      await cdp('Page.navigate', { url });
      await waitForRenderable();
      await evaluatePage(route, viewport, 'direct');

      await cdp('Page.reload', { ignoreCache: true });
      await waitForRenderable();
      await evaluatePage(route, viewport, 'refresh');

      if (screenshotsEnabled && visualRoutes.has(route)) {
        const shot = await cdp('Page.captureScreenshot', { format: 'png', fromSurface: true });
        const filename = `${viewport.name}-${slug(route)}.png`;
        writeFileSync(join(screenshotDir, filename), Buffer.from(shot.data, 'base64'));
      }
    }
  }
} finally {
  socket.close();
  browser.kill('SIGTERM');
  await sleep(100);
  rmSync(profileDir, { recursive: true, force: true });
}

const summary = {
  baseUrl,
  checked: results.length,
  failures: failures.length,
  screenshots: screenshotsEnabled ? screenshotDir : null,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length) {
  console.error('\nQA failures:');
  for (const failure of failures) {
    console.error(JSON.stringify(failure));
  }
  process.exitCode = 1;
}
