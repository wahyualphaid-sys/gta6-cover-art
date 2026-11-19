// cover.js — renders a finished cover from an editor state: multi-panel poster
// layouts with white keylines, a Vice City colour grade per panel, film grain and
// a vignette, then the lettering block (gradient main title, script subtitle) and
// a caption bar along the bottom. Pure canvas, no libraries, no network.

import { paintScene } from './scene.js';

// Panel rectangles in relative (0..1) coordinates for each layout.
export const LAYOUTS = {
  poster: {
    label: 'Poster · 5 panel',
    rects: [
      [0, 0, 0.62, 0.6],
      [0.62, 0, 0.38, 0.3],
      [0.62, 0.3, 0.38, 0.3],
      [0, 0.6, 0.5, 0.4],
      [0.5, 0.6, 0.5, 0.4],
    ],
  },
  hero: {
    label: 'Hero · 1 + 2',
    rects: [
      [0, 0, 1, 0.68],
      [0, 0.68, 0.5, 0.32],
      [0.5, 0.68, 0.5, 0.32],
    ],
  },
  duo: {
    label: 'Duo · 2 panel',
    rects: [
      [0, 0, 0.5, 1],
      [0.5, 0, 0.5, 1],
    ],
  },
  grid: {
    label: 'Grid · 6 panel',
    rects: [
      [0, 0, 1 / 3, 0.5],
      [1 / 3, 0, 1 / 3, 0.5],
      [2 / 3, 0, 1 / 3, 0.5],
      [0, 0.5, 1 / 3, 0.5],
      [1 / 3, 0.5, 1 / 3, 0.5],
      [2 / 3, 0.5, 1 / 3, 0.5],
    ],
  },
};

// Colour grades: a wash gradient plus an optional blend pass, applied per panel.
export const GRADES = {
  sunset: { label: 'Sunset Grade', top: 'rgba(255,110,127,0.20)', bottom: 'rgba(43,16,85,0.28)', sat: 1.15 },
  neon: { label: 'Neon Night', top: 'rgba(34,211,238,0.14)', bottom: 'rgba(255,46,136,0.20)', sat: 1.3 },
  pink: { label: 'Miami Pink', top: 'rgba(255,93,162,0.26)', bottom: 'rgba(80,10,60,0.22)', sat: 1.1 },
  noir: { label: 'Noir', top: 'rgba(20,20,30,0.10)', bottom: 'rgba(0,0,0,0.42)', sat: 0.55 },
};

export const SIZES = [
  [1080, 1080, 'Square · 1080×1080'],
  [1080, 1350, 'Portrait · 1080×1350'],
  [1200, 1600, 'Poster · 1200×1600'],
  [1920, 1080, 'Wide · 1920×1080'],
];

const sceneCache = new Map();
function sceneCanvas(variant, w, h) {
  const key = `${variant}:${Math.round(w)}x${Math.round(h)}`;
  if (!sceneCache.has(key)) {
    const c = document.createElement('canvas');
    c.width = Math.max(2, Math.round(w));
    c.height = Math.max(2, Math.round(h));
    paintScene(c.getContext('2d'), c.width, c.height, variant);
    sceneCache.set(key, c);
  }
  return sceneCache.get(key);
}

let noiseCanvas = null;
function grain(ctx, W, H, alpha) {
  if (!noiseCanvas) {
    noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 180;
    noiseCanvas.height = 180;
    const nctx = noiseCanvas.getContext('2d');
    const img = nctx.createImageData(180, 180);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    nctx.putImageData(img, 0, 0);
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'overlay';
  const pat = ctx.createPattern(noiseCanvas, 'repeat');
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Draw one panel's source (a photo image or a painted scene) cover-fit inside its
// rect, honouring the panel's zoom and offset, then lay the grade wash over it.
function drawPanel(ctx, rect, panel, grade, photos, W, H) {
  const [rx, ry, rw, rh] = rect;
  const x = rx * W;
  const y = ry * H;
  const w = rw * W;
  const h = rh * H;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  let src = null;
  let sw = 0;
  let sh = 0;
  if (panel.kind === 'photo' && photos[panel.photoIndex]) {
    src = photos[panel.photoIndex].img;
    sw = src.naturalWidth;
    sh = src.naturalHeight;
  } else {
    src = sceneCanvas(panel.variant ?? 0, w, h);
    sw = src.width;
    sh = src.height;
  }
  const zoom = panel.zoom ?? 1;
  const scale = Math.max(w / sw, h / sh) * zoom;
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = x + (w - dw) / 2 + (panel.ox ?? 0) * w * 0.4;
  const dy = y + (h - dh) / 2 + (panel.oy ?? 0) * h * 0.4;
  if (grade.sat !== 1) ctx.filter = `saturate(${grade.sat})`;
  ctx.drawImage(src, dx, dy, dw, dh);
  ctx.filter = 'none';

  const wash = ctx.createLinearGradient(0, y, 0, y + h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  // The poster's white keyline around every panel.
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(2, W * 0.005);
  ctx.strokeRect(x, y, w, h);
}

// Letterspaced centred text: canvas has no letter-spacing on every browser, so
// draw word by word with a manual advance when spacing is requested.
function spacedText(ctx, text, cx, y, spacing) {
  if (!spacing) {
    ctx.fillText(text, cx, y);
    return;
  }
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let x = cx - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + spacing;
  });
  ctx.textAlign = prevAlign;
}

function strokeSpaced(ctx, text, cx, y, spacing) {
  // Same walk as spacedText but stroking, for the lettering outline pass.
  if (!spacing) {
    ctx.strokeText(text, cx, y);
    return;
  }
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let x = cx - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  [...text].forEach((ch, i) => {
    ctx.strokeText(ch, x, y);
    x += widths[i] + spacing;
  });
  ctx.textAlign = prevAlign;
}

// The full render. state: {layout, grade, title, subtitle, caption, panels[]}.
export function drawCover(ctx, W, H, state, photos) {
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.poster;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  ctx.fillStyle = '#160a2e';
  ctx.fillRect(0, 0, W, H);

  layout.rects.forEach((rect, i) => {
    const panel = state.panels[i] ?? { kind: 'scene', variant: i % 4, zoom: 1, ox: 0, oy: 0 };
    drawPanel(ctx, rect, panel, grade, photos, W, H);
  });

  grain(ctx, W, H, 0.07);
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(5,0,16,0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // --- Lettering block, top centre ---
  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    const words = title.split(/\s+/);
    const lines = words.length > 1 && W < H ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [title];
    let fontSize = Math.min(W * 0.135, (H * 0.16) / lines.length);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const setFont = (s) => {
      ctx.font = `900 ${s}px "Arial Narrow", "Liberation Sans Narrow", "Helvetica Neue", sans-serif`;
    };
    setFont(fontSize);
    // Shrink until the widest line fits inside the margins.
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width + l.length * fontSize * 0.04));
    if (widest > W * 0.92) {
      fontSize *= (W * 0.92) / widest;
      setFont(fontSize);
    }
    const spacing = fontSize * 0.04;
    lines.forEach((line, i) => {
      const y = H * 0.055 + fontSize * (i + 1);
      const grad = ctx.createLinearGradient(0, y - fontSize, 0, y);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.55, '#ffd97b');
      grad.addColorStop(1, '#ff2e88');
      ctx.lineWidth = fontSize * 0.14;
      ctx.strokeStyle = '#1b0533';
      ctx.lineJoin = 'round';
      strokeSpaced(ctx, line, W / 2, y, spacing);
      ctx.fillStyle = grad;
      spacedText(ctx, line, W / 2, y, spacing);
    });

    if (state.subtitle) {
      const subSize = fontSize * 0.42;
      ctx.font = `italic 700 ${subSize}px "Segoe Script", "Brush Script MT", cursive`;
      ctx.lineWidth = subSize * 0.16;
      ctx.strokeStyle = '#1b0533';
      const y = H * 0.055 + fontSize * lines.length + subSize * 1.15;
      ctx.strokeText(state.subtitle, W / 2, y);
      ctx.fillStyle = '#22d3ee';
      ctx.fillText(state.subtitle, W / 2, y);
    }
  }

  // Small maker's mark, top-left — our own badge, not any game's logo.
  ctx.textAlign = 'left';
  ctx.font = `700 ${Math.max(13, W * 0.016)}px "Helvetica Neue", sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('NEON SHORES · COVER LAB', W * 0.022, H * 0.032);

  // --- Caption bar along the bottom ---
  if (state.caption) {
    const barH = H * 0.075;
    ctx.fillStyle = 'rgba(8,2,20,0.78)';
    ctx.fillRect(0, H - barH, W, barH);
    ctx.fillStyle = '#ff2e88';
    ctx.fillRect(0, H - barH, W, Math.max(2, H * 0.004));
    ctx.font = `800 ${barH * 0.44}px "Arial Narrow", "Liberation Sans Narrow", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(state.caption.toUpperCase(), W * 0.03, H - barH * 0.32);
    ctx.textAlign = 'right';
    ctx.font = `600 ${barH * 0.3}px "Helvetica Neue", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText(`${W} × ${H}`, W * 0.97, H - barH * 0.36);
    ctx.textAlign = 'center';
  }
}
