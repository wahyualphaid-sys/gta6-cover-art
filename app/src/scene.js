// scene.js — the built-in "Vice City" sample scenes, painted procedurally on canvas.
// Every shape here is original code-drawn geometry (gradients, polygons, arcs): no image
// files, no artwork from any game. The editor uses these scenes as ready-made panel
// material so a cover looks complete before the user adds a photo of their own, and
// each variant recolours the same shoreline so several panels can share one mood.

const PALETTES = {
  sunset: {
    sky: ['#2b1055', '#7597de', '#ff6e7f', '#feb47b'],
    sun: '#ffd97b',
    sea: '#3a1c71',
    sand: '#f7a072',
    neonA: '#ff2e88',
    neonB: '#22d3ee',
    dark: '#160a2e',
  },
  neon: {
    sky: ['#0b0033', '#3b0066', '#8b008b', '#ff2e88'],
    sun: '#ff5da2',
    sea: '#1b0533',
    sand: '#5b2a86',
    neonA: '#22d3ee',
    neonB: '#ffe74c',
    dark: '#0d021f',
  },
  lagoon: {
    sky: ['#012a4a', '#01497c', '#2a6f97', '#ffb703'],
    sun: '#ffe8a3',
    sea: '#01497c',
    sand: '#e9c46a',
    neonA: '#fb8500',
    neonB: '#8ecae6',
    dark: '#02141f',
  },
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// A palm: curved trunk plus a fan of fronds, drawn as one dark silhouette with a
// thin neon rim on the sun side.
function palm(ctx, x, y, s, pal, flip) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip * s, s);
  ctx.strokeStyle = pal.dark;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -70, 34, -128);
  ctx.stroke();
  ctx.lineWidth = 5;
  const fronds = 7;
  for (let i = 0; i < fronds; i++) {
    const a = Math.PI * (0.08 + (0.84 * i) / (fronds - 1));
    const fx = 34 + Math.cos(a) * 62;
    const fy = -128 - Math.sin(a) * 34 + 16;
    ctx.beginPath();
    ctx.moveTo(34, -128);
    ctx.quadraticCurveTo(34 + Math.cos(a) * 40, -128 - Math.sin(a) * 40, fx, fy + 18);
    ctx.stroke();
  }
  ctx.fillStyle = pal.dark;
  ctx.beginPath();
  ctx.arc(28, -122, 7, 0, Math.PI * 2);
  ctx.arc(42, -118, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// One skyline block with lit windows and, on some, a neon sign bar.
function building(ctx, x, baseY, w, h, pal, rng) {
  ctx.fillStyle = pal.dark;
  ctx.fillRect(x, baseY - h, w, h);
  const cols = Math.max(2, Math.floor(w / 16));
  const rows = Math.max(3, Math.floor(h / 22));
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (rng() < 0.42) continue;
      ctx.fillStyle = rng() < 0.16 ? pal.neonB : 'rgba(255,214,140,0.85)';
      ctx.fillRect(x + 5 + c * ((w - 8) / cols), baseY - h + 8 + r * ((h - 14) / rows), 5, 7);
    }
  }
  if (rng() < 0.4) {
    ctx.fillStyle = rng() < 0.5 ? pal.neonA : pal.neonB;
    ctx.fillRect(x + 3, baseY - h + 10, Math.min(w - 6, 34), 5);
  }
}

// Deterministic little random source so a variant paints the same skyline every time.
function seeded(seed) {
  let s = seed * 2654435761 % 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// A low sports-car silhouette: wedge body, cabin glass, two wheels, neon underglow.
function sportsCar(ctx, cx, groundY, w, pal) {
  const h = w * 0.22;
  ctx.save();
  ctx.translate(cx, groundY);
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, w * 0.55);
  glow.addColorStop(0, pal.neonA + 'aa');
  glow.addColorStop(1, pal.neonA + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(-w * 0.55, -h * 0.5, w * 1.1, h * 0.62);
  ctx.fillStyle = pal.dark;
  ctx.beginPath();
  ctx.moveTo(-w * 0.5, -h * 0.18);
  ctx.lineTo(-w * 0.42, -h * 0.52);
  ctx.lineTo(-w * 0.16, -h * 0.58);
  ctx.lineTo(-w * 0.05, -h * 0.92);
  ctx.lineTo(w * 0.16, -h * 0.95);
  ctx.lineTo(w * 0.3, -h * 0.6);
  ctx.lineTo(w * 0.47, -h * 0.5);
  ctx.lineTo(w * 0.5, -h * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(140,220,255,0.5)';
  ctx.beginPath();
  ctx.moveTo(-w * 0.03, -h * 0.86);
  ctx.lineTo(w * 0.13, -h * 0.87);
  ctx.lineTo(w * 0.24, -h * 0.62);
  ctx.lineTo(-w * 0.1, -h * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0a0618';
  for (const wx of [-w * 0.3, w * 0.3]) {
    ctx.beginPath();
    ctx.arc(wx, -h * 0.16, h * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = pal.neonB;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wx, -h * 0.16, h * 0.1, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = pal.neonA;
  ctx.fillRect(w * 0.44, -h * 0.42, w * 0.055, h * 0.09);
  ctx.restore();
}

// Two standing figures in flat poster silhouette: one with long hair, one taller
// with a cap brim. Abstract shapes only — no likeness of any real or game person.
function figures(ctx, cx, groundY, s, pal) {
  ctx.fillStyle = pal.dark;
  const person = (x, tall, hair) => {
    const headR = 11 * s * tall;
    ctx.beginPath();
    ctx.arc(x, groundY - 118 * s * tall, headR, 0, Math.PI * 2);
    ctx.fill();
    if (hair) {
      ctx.fillRect(x - headR, groundY - 118 * s * tall, headR * 0.9, 44 * s);
    } else {
      ctx.fillRect(x - headR * 1.25, groundY - 118 * s * tall - headR * 0.9, headR * 2.5, 4 * s);
    }
    ctx.beginPath();
    ctx.moveTo(x - 15 * s, groundY);
    ctx.lineTo(x - 11 * s, groundY - 100 * s * tall);
    ctx.quadraticCurveTo(x, groundY - 108 * s * tall, x + 11 * s, groundY - 100 * s * tall);
    ctx.lineTo(x + 16 * s, groundY);
    ctx.lineTo(x + 5 * s, groundY);
    ctx.lineTo(x + 3 * s, groundY - 52 * s);
    ctx.lineTo(x - 4 * s, groundY - 52 * s);
    ctx.lineTo(x - 6 * s, groundY);
    ctx.closePath();
    ctx.fill();
  };
  person(cx - 30 * s, 0.94, true);
  person(cx + 26 * s, 1.05, false);
}

// Paint one scene variant into a w x h box. variant: 0 shoreline hero, 1 skyline
// street with the car, 2 beach duo with palms, 3 pier at neon night.
export function paintScene(ctx, w, h, variant = 0) {
  const names = ['sunset', 'neon', 'lagoon', 'neon'];
  const pal = PALETTES[names[variant % names.length]];
  const rng = seeded(1234 + variant * 777);
  const horizon = h * (variant === 1 ? 0.72 : 0.62);

  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  pal.sky.forEach((c, i) => sky.addColorStop(i / (pal.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, horizon + 2);

  // Sun disc with retro slice gaps, sitting on the horizon.
  const sunR = Math.min(w, h) * (variant === 3 ? 0.2 : 0.27);
  const sunX = w * (variant === 2 ? 0.68 : 0.5);
  const sunY = horizon - sunR * 0.25;
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.clip();
  const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  sunGrad.addColorStop(0, pal.sun);
  sunGrad.addColorStop(1, pal.neonA);
  ctx.fillStyle = sunGrad;
  ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
  ctx.fillStyle = 'rgba(20,4,40,0.55)';
  for (let i = 0; i < 5; i++) {
    const gy = sunY + sunR * (0.08 + i * 0.17);
    ctx.fillRect(sunX - sunR, gy, sunR * 2, sunR * (0.028 + i * 0.012));
  }
  ctx.restore();

  // Sea with a broken reflection column under the sun.
  ctx.fillStyle = pal.sea;
  ctx.fillRect(0, horizon, w, h - horizon);
  ctx.fillStyle = 'rgba(255,190,120,0.5)';
  for (let i = 0; i < 26; i++) {
    const ry = horizon + 6 + rng() * (h - horizon - 14);
    const rw = (sunR * 1.5) * (1 - (ry - horizon) / (h - horizon)) * (0.3 + rng() * 0.7);
    ctx.fillRect(sunX - rw / 2 + (rng() - 0.5) * 22, ry, rw, 2.4);
  }

  if (variant === 1) {
    // Street level: skyline behind, wet road in front, the car centre stage.
    let bx = -10;
    while (bx < w) {
      const bw = 40 + rng() * 90;
      building(ctx, bx, horizon + 4, bw, h * (0.34 + rng() * 0.3), pal, rng);
      bx += bw + 6;
    }
    ctx.fillStyle = '#12041f';
    ctx.fillRect(0, horizon, w, h - horizon);
    ctx.fillStyle = pal.neonB + '55';
    ctx.fillRect(0, horizon + 3, w, 3);
    sportsCar(ctx, w * 0.5, h * 0.9, Math.min(w * 0.78, 560), pal);
    palm(ctx, w * 0.1, h * 0.86, Math.min(w, h) / 340, pal, 1);
    palm(ctx, w * 0.93, h * 0.88, Math.min(w, h) / 380, pal, -1);
    return;
  }

  // Shoreline variants: skyline far left/right, sand strip, palms, maybe the duo.
  let bx = -6;
  while (bx < w * 0.4) {
    const bw = 30 + rng() * 60;
    building(ctx, bx, horizon, bw, h * (0.2 + rng() * 0.22), pal, rng);
    bx += bw + 5;
  }
  ctx.fillStyle = pal.sand;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, horizon + (h - horizon) * 0.45);
  ctx.quadraticCurveTo(w * 0.5, horizon + (h - horizon) * 0.2, w, horizon + (h - horizon) * 0.55);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  if (variant === 0) {
    sportsCar(ctx, w * 0.62, h * 0.93, Math.min(w * 0.6, 470), pal);
    palm(ctx, w * 0.14, h * 0.97, Math.min(w, h) / 300, pal, 1);
    palm(ctx, w * 0.3, h * 0.9, Math.min(w, h) / 420, pal, -1);
  } else if (variant === 2) {
    figures(ctx, w * 0.44, h * 0.94, Math.min(w, h) / 330, pal);
    palm(ctx, w * 0.82, h * 0.98, Math.min(w, h) / 290, pal, -1);
    palm(ctx, w * 0.1, h * 0.92, Math.min(w, h) / 400, pal, 1);
  } else {
    // Pier: posts into the water and a string of neon bulbs.
    ctx.strokeStyle = pal.dark;
    ctx.lineWidth = 7;
    for (let i = 0; i < 5; i++) {
      const px = w * (0.08 + i * 0.2);
      ctx.beginPath();
      ctx.moveTo(px, horizon + 8);
      ctx.lineTo(px, h * 0.98);
      ctx.stroke();
    }
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(0, horizon + 10);
    ctx.lineTo(w, horizon + 4);
    ctx.stroke();
    for (let i = 0; i <= 16; i++) {
      const px = (w / 16) * i;
      ctx.fillStyle = i % 2 ? pal.neonA : pal.neonB;
      ctx.beginPath();
      ctx.arc(px, horizon + 22 + Math.sin(i * 0.7) * 4, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    figures(ctx, w * 0.55, h * 0.97, Math.min(w, h) / 360, pal);
  }
}

export const SCENE_NAMES = ['Sunset Shore', 'Neon Street', 'Beach Duo', 'Pier Nights'];
