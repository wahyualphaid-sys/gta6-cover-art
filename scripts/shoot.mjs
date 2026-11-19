// shoot.mjs — takes the entry's screenshots from the app itself with a headless
// Chromium: serves app/ locally, opens each view listed in shots.json at its exact
// window size, saves a PNG, then converts it to a JPEG under the scorer's 256 KiB
// cap in screenshots/. Run: node scripts/shoot.mjs

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = 8901;
const tmp = join(root, 'scripts', '.shots-tmp');
mkdirSync(tmp, { recursive: true });
mkdirSync(join(root, 'screenshots'), { recursive: true });

const chromeCandidates = [
  process.env.CHROME_BIN,
  join(homedir(), '.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell'),
  join(homedir(), '.cache/ms-playwright/chromium-1255/chrome-linux64/chrome'),
].filter(Boolean);
const chrome = chromeCandidates.find((p) => existsSync(p));
if (!chrome) {
  console.error('no chromium binary found; set CHROME_BIN');
  process.exit(1);
}

const server = spawn('node', [join(root, 'serve.ts')], {
  env: { ...process.env, PORT: String(port) },
  stdio: 'ignore',
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  // Wait until the server answers.
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://localhost:${port}/index.html`);
      if (res.ok) break;
    } catch {
      await sleep(250);
    }
  }

  const shots = JSON.parse(readFileSync(join(root, 'shots.json'), 'utf8'));
  for (const shot of shots) {
    const png = join(tmp, shot.name.replace(/\.jpg$/, '.png'));
    const url = `http://localhost:${port}/index.html${shot.query}`;
    const args = [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${shot.w},${shot.h}`,
      '--virtual-time-budget=9000',
      `--screenshot=${png}`,
      url,
    ];
    const run = spawnSync(chrome, args, { stdio: 'inherit', timeout: 60000 });
    if (run.status !== 0 || !existsSync(png)) {
      console.error(`screenshot failed for ${shot.name}`);
      process.exit(1);
    }
    console.log(`captured ${shot.name} (${shot.w}x${shot.h})`);
  }

  // PNG -> JPEG under 256 KiB, stepping quality down until it fits.
  const convert = spawnSync(
    'python3',
    [
      '-c',
      `
import os, sys
from PIL import Image
src_dir, dst_dir = sys.argv[1], sys.argv[2]
for name in sorted(os.listdir(src_dir)):
    if not name.endswith('.png'):
        continue
    img = Image.open(os.path.join(src_dir, name)).convert('RGB')
    out = os.path.join(dst_dir, name[:-4] + '.jpg')
    q = 88
    while q >= 40:
        img.save(out, 'JPEG', quality=q)
        if os.path.getsize(out) <= 256 * 1024:
            break
        q -= 8
    print(out, os.path.getsize(out), 'bytes @q', q)
`,
      tmp,
      join(root, 'screenshots'),
    ],
    { stdio: 'inherit' },
  );
  if (convert.status !== 0) process.exit(1);
} finally {
  server.kill('SIGTERM');
  rmSync(tmp, { recursive: true, force: true });
}
