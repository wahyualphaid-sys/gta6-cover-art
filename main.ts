// Neon Shores — Cover Lab: entry program for gta6-cover-art-01 (Node 22, standard library only).
//
// The product is the static web app in app/: it turns a person's own photo plus a caption into
// multi-panel, Vice-City-graded cover art and exports a PNG, all offline in the browser.
// This program is only the hand-in plumbing: it copies app/ and screenshots/ into the output
// directory and writes dossier.json with the kit's vendored buildDossier, byte for byte the
// way the grader rebuilds it.
//
// Run it the way the grader does (MAKEFUN_OUTPUT_DIR stands in for /output locally):
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });

// The app ships exactly as the browser loads it: plain static files, no build step.
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

// Screenshots travel beside the app; the first by name is the cover the judge sees first.
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
const shotsDir = join(repoRoot, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps: text_max_bytes shapes the dossier text; the rest refuse an entry
// the scorer would refuse (too many or too heavy screenshots, an oversized app tree).
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
