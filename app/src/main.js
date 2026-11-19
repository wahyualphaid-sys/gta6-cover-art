// main.js — the Cover Lab editor: load photos, arrange them (or the built-in
// painted scenes) across a poster layout, grade them, set the lettering, and
// export a PNG. Everything runs locally; photos are read from the user's own
// machine and never uploaded anywhere.

import { drawCover, LAYOUTS, GRADES, SIZES } from './cover.js';
import { SCENE_NAMES } from './scene.js';

const $ = (id) => document.getElementById(id);
const canvas = $('stage');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);

const photos = []; // {img, name} — the user's own pictures, in load order

const state = {
  layout: 'poster',
  grade: 'sunset',
  size: [1080, 1350],
  title: 'Neon Shores',
  subtitle: 'Vice City Heat',
  caption: 'Sunset heist season',
  panels: [
    { kind: 'scene', variant: 0, zoom: 1, ox: 0, oy: 0 },
    { kind: 'scene', variant: 1, zoom: 1, ox: 0, oy: 0 },
    { kind: 'scene', variant: 3, zoom: 1, ox: 0, oy: 0 },
    { kind: 'scene', variant: 2, zoom: 1, ox: 0, oy: 0 },
    { kind: 'scene', variant: 1, zoom: 1, ox: 0, oy: 0 },
    { kind: 'scene', variant: 0, zoom: 1, ox: 0, oy: 0 },
  ],
};
let selected = 0;

function render() {
  const [W, H] = state.size;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  drawCover(ctx, W, H, state, photos);
  markSelected();
}

function markSelected() {
  const list = $('panelList');
  if (!list) return;
  [...list.children].forEach((el, i) => el.classList.toggle('active', i === selected));
}

function ensurePanels() {
  const need = LAYOUTS[state.layout].rects.length;
  while (state.panels.length < need) {
    state.panels.push({ kind: 'scene', variant: state.panels.length % 4, zoom: 1, ox: 0, oy: 0 });
  }
}

function buildPanelList() {
  const list = $('panelList');
  list.innerHTML = '';
  LAYOUTS[state.layout].rects.forEach((_, i) => {
    const p = state.panels[i];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'panelChip';
    btn.textContent = `Panel ${i + 1} · ${p.kind === 'photo' ? 'Photo ' + ((p.photoIndex ?? 0) + 1) : SCENE_NAMES[p.variant ?? 0]}`;
    btn.addEventListener('click', () => {
      selected = i;
      syncPanelControls();
      markSelected();
    });
    list.appendChild(btn);
  });
  markSelected();
}

function syncPanelControls() {
  const p = state.panels[selected];
  if (!p) return;
  $('zoom').value = p.zoom ?? 1;
  $('offX').value = p.ox ?? 0;
  $('offY').value = p.oy ?? 0;
  $('scenePick').value = String(p.variant ?? 0);
}

function fillSelect(el, entries) {
  el.innerHTML = '';
  entries.forEach(([value, label]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    el.appendChild(opt);
  });
}

function wire() {
  fillSelect($('layoutPick'), Object.entries(LAYOUTS).map(([k, v]) => [k, v.label]));
  fillSelect($('gradePick'), Object.entries(GRADES).map(([k, v]) => [k, v.label]));
  fillSelect($('sizePick'), SIZES.map(([w, h, label]) => [`${w}x${h}`, label]));
  fillSelect($('scenePick'), SCENE_NAMES.map((n, i) => [String(i), n]));
  $('layoutPick').value = state.layout;
  $('gradePick').value = state.grade;
  $('sizePick').value = state.size.join('x');

  $('layoutPick').addEventListener('change', (e) => {
    state.layout = e.target.value;
    ensurePanels();
    selected = 0;
    buildPanelList();
    syncPanelControls();
    render();
  });
  $('gradePick').addEventListener('change', (e) => {
    state.grade = e.target.value;
    render();
  });
  $('sizePick').addEventListener('change', (e) => {
    state.size = e.target.value.split('x').map(Number);
    render();
  });

  for (const [id, key] of [['titleIn', 'title'], ['subtitleIn', 'subtitle'], ['captionIn', 'caption']]) {
    $(id).value = state[key];
    $(id).addEventListener('input', (e) => {
      state[key] = e.target.value;
      render();
    });
  }

  $('scenePick').addEventListener('change', (e) => {
    const p = state.panels[selected];
    p.kind = 'scene';
    p.variant = Number(e.target.value);
    buildPanelList();
    render();
  });
  for (const [id, key] of [['zoom', 'zoom'], ['offX', 'ox'], ['offY', 'oy']]) {
    $(id).addEventListener('input', (e) => {
      state.panels[selected][key] = Number(e.target.value);
      render();
    });
  }

  // Photos: file picker and drag-and-drop onto the stage.
  $('photoIn').addEventListener('change', (e) => addPhotos(e.target.files));
  const stageWrap = $('stageWrap');
  stageWrap.addEventListener('dragover', (e) => e.preventDefault());
  stageWrap.addEventListener('drop', (e) => {
    e.preventDefault();
    addPhotos(e.dataTransfer.files);
  });

  // Click a panel on the canvas to select it; drag to reposition its picture.
  let drag = null;
  const toState = (e) => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };
  canvas.addEventListener('pointerdown', (e) => {
    const [fx, fy] = toState(e);
    const rects = LAYOUTS[state.layout].rects;
    const idx = rects.findIndex(([x, y, w, h]) => fx >= x && fx <= x + w && fy >= y && fy <= y + h);
    if (idx >= 0) {
      selected = idx;
      syncPanelControls();
      markSelected();
      drag = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = canvas.getBoundingClientRect();
    const p = state.panels[selected];
    p.ox = Math.max(-1, Math.min(1, (p.ox ?? 0) + (e.clientX - drag.x) / r.width));
    p.oy = Math.max(-1, Math.min(1, (p.oy ?? 0) + (e.clientY - drag.y) / r.height));
    drag = { x: e.clientX, y: e.clientY };
    syncPanelControls();
    render();
  });
  canvas.addEventListener('pointerup', () => (drag = null));

  $('exportBtn').addEventListener('click', exportPng);
}

function addPhotos(files) {
  const imgs = [...files].filter((f) => f.type.startsWith('image/'));
  let pending = imgs.length;
  if (!pending) return;
  imgs.forEach((file) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      photos.push({ img, name: file.name });
      // Fill panels in order: the first photos take the first empty slots.
      const slot = state.panels.findIndex((p) => p.kind !== 'photo');
      if (slot >= 0) {
        state.panels[slot] = { kind: 'photo', photoIndex: photos.length - 1, zoom: 1, ox: 0, oy: 0 };
      }
      if (--pending === 0) {
        buildPanelList();
        render();
      }
    };
    img.src = url;
  });
  $('photoNote').textContent = `${photos.length + imgs.length} photo(s) loaded — they stay on this machine.`;
}

function exportPng() {
  const [W, H] = state.size;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  drawCover(out.getContext('2d'), W, H, state, photos);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-shores-cover-${W}x${H}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}

// --- Screenshot mode -------------------------------------------------------
// ?shot=cover renders one finished cover full-bleed at an exact size;
// ?shot=editor shows the editor with a demo cover arranged. Used to take the
// entry's screenshots from the app itself, exactly as a user would see it.
function applyShotMode() {
  const shot = params.get('shot');
  if (!shot) return false;
  if (params.get('layout')) state.layout = params.get('layout');
  if (params.get('grade')) state.grade = params.get('grade');
  if (params.get('title')) state.title = params.get('title');
  if (params.get('subtitle')) state.subtitle = params.get('subtitle');
  if (params.get('caption')) state.caption = params.get('caption');
  if (params.get('size')) state.size = params.get('size').split('x').map(Number);
  ensurePanels();
  if (shot === 'cover') {
    document.body.classList.add('shotCover');
  } else if (shot === 'editor') {
    document.body.classList.add('shotEditor');
    state.panels[0] = { kind: 'scene', variant: 1, zoom: 1, ox: 0, oy: 0 };
    state.panels[1] = { kind: 'scene', variant: 0, zoom: 1, ox: 0, oy: 0 };
  }
  return true;
}

applyShotMode();
wire();
ensurePanels();
buildPanelList();
syncPanelControls();
render();
window.__coverReady = true;
