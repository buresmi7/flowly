// Run from any cwd. UI_DEPS points to an isolated npm prefix (see README.md).
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, shot, pageText, SIDEBAR_WIDTH } from '../../promo/shot-lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const deps = createRequire(resolve(process.env.UI_DEPS, 'package.json'));
const { build } = deps('esbuild');
process.env.PLAYWRIGHT_MODULE ||= deps.resolve('playwright');
const out = resolve(process.env.EVIDENCE_DIR || join(here, 'screenshots'));
const work = await mkdtemp(join(tmpdir(), 'flowly-external-browser-'));
let browser, server;
let checks = 0;
try {
  const native = join(work, 'native.ts');
  await writeFile(native, `export * from ${JSON.stringify(deps.resolve('react-native-web'))};\nexport { Linking } from ${JSON.stringify(join(here, 'host.tsx'))};`);
  const result = await build({
    entryPoints: [join(here, 'fixture.tsx')], bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
    absWorkingDir: root, nodePaths: [join(root, 'node_modules')],
    alias: {
      react: dirname(deps.resolve('react/package.json')),
      'react-dom': dirname(deps.resolve('react-dom/package.json')),
      'react-native': native,
      'react-native-web': deps.resolve('react-native-web'),
      '@getpaseo/plugin/client': join(here, 'host.tsx'),
      '@getpaseo/plugin/client/react-native': join(here, 'host.tsx'),
    },
    define: { 'process.env.NODE_ENV': '"test"', __DEV__: 'true' },
  });
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Flowly component verification</title></head><body style="margin:0;background:#fff"><div id="root" style="margin-left:${SIDEBAR_WIDTH}px"></div><script src="/fixture.js"></script></body></html>`;
  server = createServer((req, res) => {
    res.setHeader('Content-Type', req.url === '/fixture.js' ? 'application/javascript' : 'text/html');
    res.end(req.url === '/fixture.js' ? result.outputFiles[0].text : html);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  await mkdir(out, { recursive: true });
  browser = await launch();
  for (const width of [960, 390]) {
    const context = await browser.newContext({ viewport: { width: width + SIDEBAR_WIDTH, height: 940 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
    // No real external navigation or daemon requests are allowed in this fixture.
    await context.route('**/*', route => route.request().url().startsWith(origin + '/') || route.request().url().startsWith('data:') ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /Input: Paseo documentation/ }).waitFor();
    const session = { page, context, w: width + SIDEBAR_WIDTH, h: 940, project: '__isolated_fixture__', clip: { x: SIDEBAR_WIDTH, y: 0, width, height: 940 } };
    const state = () => page.evaluate(() => JSON.parse(JSON.stringify(window.fixture)));
    const set = props => page.evaluate(props => Object.assign(window.fixture, props), props);
    const same = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };
    const clickOpen = async (locator, url) => {
      const before = (await state()).calls.length;
      await locator.click();
      const after = await state();
      same(after.calls.slice(before), [{ url, duringClick: true }]);
      same(after.legacy, []);
    };
    const artifact = page.getByRole('link', { name: /Input: Paseo documentation/ });
    const artifactUrl = 'https://paseo.sh/docs?source=flowly#links';
    await clickOpen(artifact, artifactUrl);
    await set({ failOpen: true });
    await clickOpen(artifact, artifactUrl);
    same((await state()).toasts, [{ text: 'Could not open the link.', variant: 'error' }]);
    await set({ failOpen: false });
    await clickOpen(artifact, artifactUrl);
    same((await state()).toasts.length, 1);
    await shot(session, join(out, `${width}-links.png`));

    const beforePreview = (await state()).calls.length;
    await page.getByRole('button', { name: /Input: GitHub issue #42/ }).click();
    const preview = page.getByRole('dialog', { name: 'GitHub issue #42' });
    await preview.getByText('Keep external issue links in the system browser.').waitFor();
    same((await state()).calls.length, beforePreview);
    const external = preview.getByRole('button', { name: 'Open in GitHub' });
    const externalUrl = 'https://github.com/example/project/issues/42';
    await clickOpen(external, externalUrl);
    await set({ failOpen: true });
    await clickOpen(external, externalUrl);
    same((await state()).toasts, Array(2).fill({ text: 'Could not open the link.', variant: 'error' }));
    await set({ failOpen: false, failRead: true });
    await preview.getByRole('button', { name: 'Refresh' }).click();
    await preview.getByText(/This connection was removed/).waitFor();
    await clickOpen(external, externalUrl);
    same((await state()).toasts.length, 2);
    await shot(session, join(out, `${width}-external-preview.png`));
    await preview.getByRole('button', { name: 'Close preview' }).click();

    const beforeFile = (await state()).calls.length;
    await page.getByRole('button', { name: /Input: Implementation notes/ }).click();
    const file = page.getByRole('dialog', { name: 'Implementation notes' });
    await file.getByText('Local file preview stays in Flowly.').waitFor();
    same((await state()).calls.length, beforeFile);
    await file.getByRole('button', { name: 'Close preview' }).click();

    const markdown = page.getByRole('link', { name: 'HTTPS reference', exact: true });
    await clickOpen(markdown, 'https://example.org/review?task=42#result');
    await clickOpen(page.getByRole('link', { name: 'HTTP reference', exact: true }), 'http://example.org/help');
    same(await page.getByRole('link', { name: /Email contact|Local reference/ }).count(), 0);
    const beforeUnsupported = (await state()).calls.length;
    await page.getByText('Email contact (mailto:test@example.org)', { exact: true }).click();
    await page.getByText('Local reference (file:///tmp/example.txt)', { exact: true }).click();
    same((await state()).calls.length, beforeUnsupported);
    await set({ failOpen: true });
    await clickOpen(markdown, 'https://example.org/review?task=42#result');
    await page.getByText('Unable to open this link.', { exact: true }).waitFor();
    await shot(session, join(out, `${width}-markdown-error.png`));
    await set({ failOpen: false });
    await clickOpen(markdown, 'https://example.org/review?task=42#result');
    same((await state()).toasts.length, 2);
    same(errors, []);
    same((await state()).reads.filter(name => !['connectors.connections', 'connectors.card', 'connectors.read', 'artifacts.status', 'artifacts.preview'].includes(name)), []);
    await writeFile(join(out, `${width}-visible-text.txt`), await pageText(session));
    await context.close();
    console.log(`PASS ${width}px: real artifact, external-preview and Markdown clicks; errors, retry, preview isolation and unsupported schemes`);
  }
  console.log(`PASS ${checks} assertions; Chromium ${browser.version()}; 6 screenshots; no real host/browser launch claimed`);
} finally {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
  await rm(work, { recursive: true, force: true });
}
