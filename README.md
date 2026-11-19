# Neon Shores — Cover Lab

An offline web app that turns **your own photo and a caption** into multi-panel
cover art in the style of a Vice City game poster — bold gradient lettering, a
script subtitle, white panel keylines, sunset/neon colour grades — and exports
it as a PNG to share. Everything is original: no Rockstar Games logo, artwork
or fonts, and no image assets at all. Even the sample "photos" are painted
procedurally on canvas at runtime.

Built for make.fun competition **gta6-cover-art-01** ("Make GTA 6 Cover Art").

## Run the app

```sh
node serve.ts          # then open http://localhost:8080 in a desktop browser
```

Or serve `app/` with any static file server. The app works fully offline from
its own files; photos are read from your machine and never uploaded.

1. **Load photos** (or drag them onto the cover). Without photos, four painted
   Vice City scenes — Sunset Shore, Neon Street, Beach Duo, Pier Nights — fill
   the panels.
2. **Pick a layout** (Poster 5-panel, Hero 1+2, Duo, Grid 6), a **colour
   grade** (Sunset, Neon Night, Miami Pink, Noir) and an **export size**
   (1080×1080, 1080×1350, 1200×1600, 1920×1080).
3. **Set the lettering**: title, script subtitle, caption bar.
4. **Arrange each panel**: click it, drag the picture inside it, zoom and
   shift with the sliders, or swap in a painted scene.
5. **Export PNG.**

## Hand-in program

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json` with the kit's vendored
`buildDossier` (`vendor/makefun-app.ts`, copied from the kit unchanged).

## Key art (bonus)

`cover.png` at the repository root is a standalone poster drawn by
`scripts/make_cover.py` — a Python (stdlib + Pillow) procedural generator:
neon sunset gradient, sliced sun, sea reflections, beach, neon skyline,
palms, a sports-car silhouette, two figure silhouettes, and the title
lettering rendered by Pillow. Regenerate it with:

```sh
python3 scripts/make_cover.py
```

## Screenshots

`screenshots/` holds captures of this app taken with a headless browser via
`scripts/shoot.mjs` (driven by `shots.json`): `1-cover.jpg` is an exported
1080×1350 cover, `2-editor.jpg` the editor with a cover arranged,
`3-cover.jpg` a square Hero-layout cover, `4-cover.jpg` a wide Duo cover.

## License

MIT — see `LICENSE`.
