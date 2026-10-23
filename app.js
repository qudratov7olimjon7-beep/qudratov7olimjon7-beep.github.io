import Globe from 'globe.gl';
import { feature } from 'topojson-client';
import { profile, achievements, certificates, projects, websites } from './data.js';

const $ = (s) => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ACCENT = '#2dd4bf';
const byCountry = achievements.reduce((m, a) => ((m[a.country] ??= []).push(a), m), {});

/* ---------- Profile ---------- */
$('#name').textContent = profile.name;
const avatar = $('#avatar');
const initials = profile.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const img = new Image();
img.alt = `Profile photo of ${profile.name}`;
img.onload = () => avatar.replaceChildren(img);
img.onerror = () => { avatar.textContent = initials; avatar.setAttribute('role', 'img'); avatar.setAttribute('aria-label', `${profile.name} (initials)`); };
img.src = profile.avatar;

/* ---------- Starfield ---------- */
const cv = $('#stars'), ctx = cv.getContext('2d');
let stars = [], W, H, mouse = { x: -1e4, y: -1e4 }, par = { x: 0, y: 0 };
function resize() {
  const dpr = Math.min(devicePixelRatio, 2);
  W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  stars = Array.from({ length: Math.round(W * H / 2200) }, () => ({
    x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.2 + 0.2,
    z: Math.random() * 0.8 + 0.2, a: Math.random() * 0.6 + 0.3, ox: 0, oy: 0, tw: Math.random() * 6.28,
  }));
}
addEventListener('resize', resize); resize();
addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
function drawStars(t) {
  ctx.clearRect(0, 0, W, H);
  const tx = mouse.x > -1e3 ? (mouse.x / W - 0.5) * -20 : 0, ty = mouse.y > -1e3 ? (mouse.y / H - 0.5) * -20 : 0;
  par.x += (tx - par.x) * 0.05; par.y += (ty - par.y) * 0.05;
  for (const s of stars) {
    const px = s.x + par.x * s.z, py = s.y + par.y * s.z;
    const dx = px + s.ox - mouse.x, dy = py + s.oy - mouse.y, d = Math.hypot(dx, dy), R = 110;
    let glow = 0;
    if (d < R && !reduced) { const f = (1 - d / R); glow = f; s.ox += (dx / (d || 1)) * f * 1.6; s.oy += (dy / (d || 1)) * f * 1.6; }
    s.ox *= 0.94; s.oy *= 0.94;
    const tw = reduced ? 1 : 0.8 + 0.2 * Math.sin(t / 900 + s.tw);
    ctx.globalAlpha = Math.min(1, s.a * tw + glow * 0.7);
    ctx.fillStyle = glow > 0.05 ? '#c9fff6' : '#fff';
    ctx.beginPath(); ctx.arc(px + s.ox, py + s.oy, s.r * (1 + glow), 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(drawStars);
}
requestAnimationFrame(drawStars);

/* ---------- Globe ---------- */
const tip = $('#tip');
const has = (f) => !!byCountry[f.properties.name];
let hovered = null, selected = null;
const globe = Globe()($('#globe'))
  .backgroundColor('rgba(0,0,0,0)')
  .showAtmosphere(true).atmosphereColor('#7fb8ff').atmosphereAltitude(0.18)
  .polygonCapColor((f) => has(f) ? (f === hovered || f === selected ? 'rgba(45,212,191,.95)' : 'rgba(45,212,191,.7)') : '#06080b')
  .polygonSideColor((f) => has(f) ? 'rgba(45,212,191,.35)' : 'rgba(0,0,0,.6)')
  .polygonStrokeColor((f) => has(f) ? '#a7fff1' : 'rgba(140,160,190,.18)')
  .polygonAltitude((f) => has(f) ? (f === hovered || f === selected ? 0.03 : 0.018) : 0.006)
  .polygonsTransitionDuration(reduced ? 0 : 300)
  .onPolygonHover((f) => {
    hovered = f && has(f) ? f : null;
    document.body.style.cursor = hovered ? 'pointer' : '';
    if (f) { const n = byCountry[f.properties.name]?.length || 0; tip.innerHTML = `${f.properties.name}${n ? ` · <b>${n} achievement${n > 1 ? 's' : ''}</b>` : ''}`; tip.hidden = false; }
    else tip.hidden = true;
    globe.polygonAltitude(globe.polygonAltitude());
  })
  .onPolygonClick((f) => has(f) && selectCountry(f.properties.name));
// ocean slightly lighter than space, faint specular sheen
const mat = globe.globeMaterial();
mat.color.set('#0b1a2e'); mat.emissive?.set('#050b16'); if ('shininess' in mat) { mat.specular.set('#1c3350'); mat.shininess = 12; }
const ctl = globe.controls();
Object.assign(ctl, { enableDamping: true, dampingFactor: 0.08, autoRotate: !reduced, autoRotateSpeed: 0.35, minDistance: 140, maxDistance: 600 });
addEventListener('pointermove', (e) => { tip.style.left = e.clientX + 14 + 'px'; tip.style.top = e.clientY + 14 + 'px'; });
const fit = () => globe.width(innerWidth).height(innerHeight);
addEventListener('resize', fit); fit();
globe.pointOfView({ lat: 15, lng: 90, altitude: innerWidth < 700 ? 3.2 : 2.2 });

let features = [];
fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json').then((r) => r.json()).then((topo) => {
  features = feature(topo, topo.objects.countries).features;
  globe.polygonsData(features);
  const missing = Object.keys(byCountry).filter((c) => !features.some((f) => f.properties.name === c));
  if (missing.length) console.warn('Countries not found in map data:', missing);
});

function extent(f) {
  // rough angular size (degrees) of the country's bounding box
  const pts = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).flatMap((p) => p[0]);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2;
}

function centroid(f) {
  // centroid of the largest ring (good enough for camera targeting)
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const ring = polys.map((p) => p[0]).sort((a, b) => b.length - a.length)[0];
  const [x, y] = ring.reduce(([sx, sy], [lng, lat]) => [sx + lng, sy + lat], [0, 0]);
  return { lng: x / ring.length, lat: y / ring.length };
}

/* ---------- Country chips (keyboard path) ---------- */
const list = $('#countryList');
for (const c of Object.keys(byCountry)) {
  const b = document.createElement('button');
  b.className = 'chip'; b.textContent = `${c} (${byCountry[c].length})`; b.dataset.country = c; b.setAttribute('aria-pressed', 'false');
  b.onclick = () => selectCountry(c);
  list.append(b);
}

/* ---------- Panel ---------- */
const panel = $('#panel');
function selectCountry(name) {
  selected = features.find((f) => f.properties.name === name) || null;
  globe.polygonAltitude(globe.polygonAltitude());
  ctl.autoRotate = false;
  if (selected) {
    const { lat, lng } = centroid(selected);
    // On desktop shift view so the country sits left of the panel
    globe.pointOfView({ lat: lat - (innerWidth > 700 ? 0 : 6), lng: lng + (innerWidth > 700 ? 6 : 0), altitude: Math.min(Math.max(extent(selected) * 0.08, 0.35), 1.7) * (innerWidth < 700 ? 1.5 : 1) }, reduced ? 0 : 1200);
  }
  list.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.country === name)));
  $('#panelTitle').textContent = name;
  $('#cards').replaceChildren(...byCountry[name].sort((a, b) => b.year - a.year).map((a) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.className = 'card';
    b.innerHTML = `<span class="t"></span><span class="m"></span><span class="r"></span>`;
    b.querySelector('.t').textContent = a.name; b.querySelector('.m').textContent = `${a.year} · ${a.short}`; b.querySelector('.r').textContent = a.result;
    b.onclick = () => openDetail(a, b);
    li.append(b); return li;
  }));
  panel.hidden = false;
  panel.querySelector('.card')?.focus({ preventScroll: true });
}
$('#panelClose').onclick = () => { panel.hidden = true; selected = null; globe.polygonAltitude(globe.polygonAltitude()); list.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', 'false')); };

/* ---------- Detail (FLIP app-open) ---------- */
const detail = $('#detail'), inner = detail.querySelector('.detail-inner');
const EASE = 'cubic-bezier(.32,1.28,.48,1)', DUR = reduced ? 0 : 520;
let origin = null;
function flipFrom(el) {
  const a = el.getBoundingClientRect(), b = inner.getBoundingClientRect();
  return `translate(${a.left - b.left}px,${a.top - b.top}px) scale(${a.width / b.width},${a.height / b.height})`;
}
function openDetail(a, cardEl) {
  origin = cardEl;
  const img = $('#dImg'), facts = $('#dFacts'), link = $('#dLink');
  img.hidden = !a.image; if (a.image) { img.src = a.image; img.alt = a.title; }
  $('#dMeta').textContent = a.country ? `${a.country} · ${a.year}` : fmtDate(a.date);
  $('#dTitle').textContent = a.name || a.title;
  $('#dResult').textContent = a.result || a.subtitle || ''; $('#dBody').textContent = a.details || '';
  facts.replaceChildren(...(a.facts || []).flatMap(([k, v]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = k; dd.textContent = v; return [dt, dd]; }));
  facts.hidden = !a.facts; link.hidden = !a.link; if (a.link) link.href = a.link;
  detail.hidden = false; detail.classList.remove('closing'); inner.scrollTop = 0;
  inner.animate([{ transform: flipFrom(cardEl), opacity: 0.2, borderRadius: '14px' }, { transform: 'none', opacity: 1, borderRadius: '24px' }],
    { duration: DUR, easing: EASE });
  detail.animate([{ background: 'rgba(0,0,0,0)' }, { background: 'rgba(0,0,0,.6)' }], { duration: DUR * 0.6 });
  $('#detailClose').focus();
}
function closeDetail() {
  if (detail.hidden) return;
  const anim = inner.animate([{ transform: 'none', opacity: 1 }, { transform: flipFrom(origin), opacity: 0 }],
    { duration: DUR * 0.75, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
  detail.classList.add('closing');
  anim.onfinish = () => { detail.hidden = true; anim.cancel(); origin?.focus(); };
  if (!DUR) anim.onfinish();
}
$('#detailClose').onclick = closeDetail;
detail.addEventListener('click', (e) => e.target === detail && closeDetail());
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') detail.hidden ? (tab === 'achievements' && $('#panelClose').click()) : closeDetail();
  if (e.key === 'Tab' && !detail.hidden) { e.preventDefault(); $('#detailClose').focus(); }
});

/* ---------- Tabs (hash-routed) ---------- */
const sections = { certificates, projects, websites };
const TABS = ['achievements', 'projects', 'websites', 'certificates'];
const tabs = [...document.querySelectorAll('.tab')];
const globeView = $('#view-achievements'), gridView = $('#view-grid');
let tab = null;
function fmtDate(d) { return /^\d{4}$/.test(d || '') ? d : d ? new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }
function showTab(name, focus) {
  if (!TABS.includes(name)) name = 'achievements';
  if (name === tab) return;
  tab = name;
  tabs.forEach((t) => { const on = t.dataset.tab === name; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on) { t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); if (focus) t.focus(); } });
  const isGlobe = name === 'achievements';
  globeView.classList.toggle('off', !isGlobe); globeView.inert = !isGlobe;
  ctl.autoRotate = isGlobe && !reduced && !selected;
  gridView.hidden = isGlobe;
  if (!isGlobe) renderGrid(name);
}
function renderGrid(name) {
  const items = [...sections[name]].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  gridView.setAttribute('aria-labelledby', 'tab-' + name);
  $('#empty').hidden = items.length > 0;
  $('#emptyText').textContent = `${name[0].toUpperCase() + name.slice(1)} will appear here.`;
  $('#grid').replaceChildren(...items.map((it) => {
    const li = document.createElement('li'), b = document.createElement('button');
    b.className = 'card tile';
    b.innerHTML = `<span class="thumb"></span><span class="t"></span><span class="m"></span>`;
    if (it.thumb || it.image) { const im = new Image(); im.src = it.thumb || it.image; im.alt = ''; im.loading = 'lazy'; b.querySelector('.thumb').append(im); }
    b.querySelector('.t').textContent = it.title;
    b.querySelector('.m').textContent = [fmtDate(it.date), it.subtitle].filter(Boolean).join(' · ');
    b.onclick = () => openDetail(it, b);
    li.append(b); return li;
  }));
  gridView.classList.remove('in'); void gridView.offsetWidth; gridView.classList.add('in');
}
tabs.forEach((t, i) => {
  t.onclick = () => { location.hash = t.dataset.tab; };
  t.onkeydown = (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return;
    e.preventDefault(); location.hash = tabs[(i + d + tabs.length) % tabs.length].dataset.tab; showTab(location.hash.slice(1), true);
  };
});
addEventListener('hashchange', () => { if (!detail.hidden) closeDetail(); showTab(location.hash.slice(1)); });
showTab(location.hash.slice(1));
