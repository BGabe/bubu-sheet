import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const listed = [...sw.matchAll(/^\s+'([^']+)',$/gm)].map((m) => m[1]).filter((p) => p !== './');

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const shipped = ['index.html', 'manifest.webmanifest', ...['css', 'js', 'icons'].flatMap((d) => walk(join(root, d)))]
  .map((p) => relative(root, p).split(sep).join('/')).sort();

test('service worker precaches exactly the files the app ships', () => {
  assert.deepEqual([...listed].sort(), shipped);
});

test('every module imported by the app is shipped', () => {
  for (const f of shipped.filter((p) => p.endsWith('.js'))) {
    const src = readFileSync(join(root, f), 'utf8');
    for (const m of src.matchAll(/from '(\.[^']+)'/g)) {
      const target = join(f, '..', m[1]).split(sep).join('/');
      const norm = target.split('/').reduce((acc, seg) => { if (seg === '..') acc.pop(); else if (seg !== '.') acc.push(seg); return acc; }, []).join('/');
      assert.ok(shipped.includes(norm), `${f} imports ${m[1]} → ${norm} not shipped`);
    }
  }
});

test('manifest icons exist and html links manifest', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'));
  for (const i of manifest.icons) assert.ok(shipped.includes(i.src), i.src);
  assert.match(readFileSync(join(root, 'index.html'), 'utf8'), /rel="manifest"/);
});

test('app makes no network calls to other origins', () => {
  for (const f of shipped.filter((p) => /\.(js|html|css)$/.test(p))) {
    const src = readFileSync(join(root, f), 'utf8');
    assert.ok(!/https?:\/\//.test(src.replace(/<!--.*?-->/gs, '')), `${f} references an absolute URL`);
  }
});
