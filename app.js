import Globe from 'globe.gl';
import { feature } from 'topojson-client';
import { profile, achievements, upcoming, certificates, projects, websites } from './data.js';
import { answer, suggestions } from './assistant.js';

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
  .onPolygonClick((f) => has(f) && go(path('achievements', f.properties.name)));
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
  if (panelCountry) focusCountry(panelCountry);
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
  b.onclick = () => go(path('achievements', c));
  list.append(b);
}

/* ---------- Upcoming ---------- */
$('#upcoming').replaceChildren(...upcoming.map((u) => Object.assign(document.createElement('span'), { className: 'up', textContent: `${u.note}: ${u.name}` })));
$('#upcoming').hidden = !upcoming.length;

/* ---------- Panel ---------- */
const panel = $('#panel');
let panelCountry = null;
function focusCountry(name) {
  selected = features.find((f) => f.properties.name === name) || null;
  globe.polygonAltitude(globe.polygonAltitude());
  ctl.autoRotate = false;
  if (!selected) return;
  const { lat, lng } = centroid(selected);
  // On desktop shift view so the country sits left of the panel
  globe.pointOfView({ lat: lat - (innerWidth > 700 ? 0 : 6), lng: lng + (innerWidth > 700 ? 6 : 0), altitude: Math.min(Math.max(extent(selected) * 0.08, 0.35), 1.7) * (innerWidth < 700 ? 1.5 : 1) }, reduced ? 0 : 1200);
}
function selectCountry(name) {
  panelCountry = name;
  focusCountry(name);
  list.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.country === name)));
  $('#panelTitle').textContent = name;
  $('#cards').replaceChildren(...byCountry[name].sort((a, b) => b.date.localeCompare(a.date)).map((a) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.className = 'card'; b.dataset.id = a.id;
    b.innerHTML = `<span class="t"></span><span class="m"></span><span class="r"></span>`;
    b.querySelector('.t').textContent = a.name; b.querySelector('.m').textContent = `${fmtDate(a.date)} · ${a.short}`; b.querySelector('.r').textContent = a.result;
    b.onclick = () => go(path('achievements', name, a.id));
    li.append(b); return li;
  }));
  panel.hidden = false;
  panel.querySelector('.card')?.focus({ preventScroll: true });
}
function closePanel() {
  if (!panelCountry) return;
  panel.hidden = true; panelCountry = selected = null; globe.polygonAltitude(globe.polygonAltitude());
  list.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', 'false'));
}
$('#panelClose').onclick = () => closeTo(path('achievements'));

/* ---------- Detail (FLIP app-open) ---------- */
const detail = $('#detail'), inner = detail.querySelector('.detail-inner');
const EASE = 'cubic-bezier(.32,1.28,.48,1)', DUR = reduced ? 0 : 520;
let origin = null, openId = null;
function flipFrom(el) {
  const a = el.getBoundingClientRect(), b = inner.getBoundingClientRect();
  return `translate(${a.left - b.left}px,${a.top - b.top}px) scale(${a.width / b.width},${a.height / b.height})`;
}
function openDetail(a, cardEl) {
  origin = cardEl; openId = a.id;
  const img = $('#dImg'), facts = $('#dFacts'), link = $('#dLink');
  img.hidden = !a.image; if (a.image) { img.src = a.image; img.alt = a.title; }
  $('#dMeta').textContent = [a.country, fmtDate(a.date)].filter(Boolean).join(' · ');
  $('#dTitle').textContent = a.name || a.title;
  $('#dResult').textContent = a.result || a.subtitle || ''; $('#dBody').textContent = a.details || '';
  $('#dRole').hidden = !a.role; $('#dRole').textContent = a.role ? `Role: ${a.role}` : '';
  $('#dRobot').hidden = !a.robot; $('#dRobot').replaceChildren(...(a.robot ? [Object.assign(document.createElement('b'), { textContent: 'Robot' }), ' ' + a.robot] : []));
  facts.replaceChildren(...(a.facts || []).flatMap(([k, v]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = k; dd.textContent = v; return [dt, dd]; }));
  const tb = $('#dTable'); tb.hidden = !a.table; tb.replaceChildren();
  if (a.table) { const row = (cells, tag) => { const tr = document.createElement('tr'); for (const c of cells) { const td = document.createElement(tag); td.textContent = c; tr.append(td); } return tr; };
    const th = document.createElement('thead'), bd = document.createElement('tbody'); th.append(row(a.table.head, 'th')); bd.append(...a.table.rows.map(r => row(r, 'td'))); tb.append(th, bd); }
  facts.hidden = !a.facts; link.hidden = !a.link; if (a.link) link.href = a.link;
  detail.hidden = false; detail.classList.remove('closing'); inner.scrollTop = 0;
  inner.animate([{ transform: flipFrom(cardEl), opacity: 0.2, borderRadius: '14px' }, { transform: 'none', opacity: 1, borderRadius: '24px' }],
    { duration: DUR, easing: EASE });
  detail.animate([{ background: 'rgba(0,0,0,0)' }, { background: 'rgba(0,0,0,.6)' }], { duration: DUR * 0.6 });
  $('#detailClose').focus();
}
function closeDetail() {
  if (detail.hidden) return;
  openId = null;
  const anim = inner.animate([{ transform: 'none', opacity: 1 }, { transform: flipFrom(origin), opacity: 0 }],
    { duration: DUR * 0.75, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
  detail.classList.add('closing');
  // timer, not onfinish: state must settle even if frames are starved
  setTimeout(() => { anim.cancel(); if (openId) return; detail.hidden = true; origin?.isConnected && origin.focus(); }, DUR * 0.75);
}
const parentHash = () => route().slice(0, -1).join('/');
const closeCard = () => closeTo(parentHash());
$('#detailClose').onclick = closeCard;
detail.addEventListener('click', (e) => e.target === detail && closeCard());
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (!detail.hidden) closeCard(); else if (tab === 'achievements' && panelCountry) closeTo(path('achievements')); }
  if (e.key === 'Tab' && !detail.hidden) { e.preventDefault(); $('#detailClose').focus(); }
});

/* ---------- Router: #tab[/country][/itemId], every step is a history entry ---------- */
const sections = { certificates, projects, websites };
const TABS = ['achievements', 'projects', 'websites', 'certificates', 'contact', 'ai'];
const path = (...parts) => parts.map(encodeURIComponent).join('/');
const route = () => location.hash.slice(1).split('/').filter(Boolean).map(decodeURIComponent);
const here = () => location.hash.slice(1);
function go(hash) {
  if (hash === here()) return;
  history.pushState({ from: here() }, '', '#' + hash); render();
}
// Leave a card/panel: step back if we came from exactly there, otherwise replace so Back never loops.
function closeTo(hash) {
  if (history.state?.from === hash) history.back();
  else { history.replaceState(history.state, '', '#' + hash); render(); }
}
function render() {
  const [t = 'achievements', a, b] = route();
  showTab(TABS.includes(t) ? t : 'achievements');
  let item = null;
  if (tab === 'achievements') {
    if (byCountry[a]) { if (panelCountry !== a) selectCountry(a); item = byCountry[a].find((x) => x.id === b); }
    else closePanel();
  } else if (sections[tab]) item = sections[tab].find((x) => x.id === a && !x.soon);
  if (item) { if (openId !== item.id) openDetail(item, document.querySelector(`[data-id="${CSS.escape(item.id)}"]`) || $('#tab-' + tab)); }
  else closeDetail();
}
addEventListener('popstate', render);

/* ---------- Tabs ---------- */
const tabs = [...document.querySelectorAll('.tab[role=tab]')];
const views = { achievements: $('#view-achievements'), contact: $('#view-contact'), ai: $('#view-ai') };
const gridView = $('#view-grid');
let tab = null;
function fmtDate(d) { return /^\d{4}$/.test(d || '') ? d : d ? new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }
function showTab(name, focus) {
  if (name === tab) return;
  tab = name;
  tabs.forEach((t) => { const on = t.dataset.tab === name; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
  const isGlobe = name === 'achievements';
  views.achievements.classList.toggle('off', !isGlobe); views.achievements.inert = !isGlobe;
  ctl.autoRotate = isGlobe && !reduced && !selected;
  views.contact.hidden = name !== 'contact'; views.ai.hidden = name !== 'ai';
  gridView.hidden = !sections[name];
  if (sections[name]) renderGrid(name);
  const v = sections[name] ? gridView : views[name];
  if (!isGlobe) { v.classList.remove('in'); void v.offsetWidth; v.classList.add('in'); }
  if (name === 'ai' && !msgs.children.length) say('bot', `Hi! I can answer questions about ${profile.name.split(/\s+/).pop()} using the info on this site.`);
}
function renderGrid(name) {
  const items = [...sections[name]].sort((a, b) => !!a.soon - !!b.soon || (b.date || '').localeCompare(a.date || ''));
  gridView.setAttribute('aria-labelledby', 'tab-' + name);
  $('#empty').hidden = items.length > 0;
  $('#emptyText').textContent = `${name[0].toUpperCase() + name.slice(1)} will appear here.`;
  $('#grid').replaceChildren(...items.map((it) => {
    const li = document.createElement('li'), b = document.createElement('button');
    b.className = 'card tile'; b.dataset.id = it.id;
    b.innerHTML = `<span class="thumb"></span><span class="t"></span><span class="m"></span>`;
    if (it.thumb || it.image) { const im = new Image(); im.src = it.thumb || it.image; im.alt = ''; im.loading = 'lazy'; b.querySelector('.thumb').append(im); }
    b.querySelector('.t').textContent = it.title;
    b.querySelector('.m').textContent = it.soon ? '' : [fmtDate(it.date), it.subtitle].filter(Boolean).join(' · ');
    if (it.soon) { b.disabled = true; b.classList.add('soon'); b.querySelector('.thumb').textContent = 'Coming soon'; }
    else b.onclick = () => go(path(name, it.id));
    li.append(b); return li;
  }));
}
tabs.forEach((t, i) => {
  t.onclick = () => go(t.dataset.tab);
  t.onkeydown = (e) => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
    e.preventDefault(); const n = tabs[(i + d + tabs.length) % tabs.length]; go(n.dataset.tab); n.focus();
  };
});
$('#tabs').setAttribute('aria-orientation', 'vertical');

/* ---------- Collapse toggle ---------- */
const rail = $('#rail'), toggle = $('#railToggle');
function setCollapsed(c) {
  rail.classList.toggle('collapsed', c); $('#tabs').inert = c;
  toggle.setAttribute('aria-expanded', String(!c)); toggle.setAttribute('aria-label', c ? 'Show sections' : 'Hide sections');
  toggle.firstElementChild.textContent = c ? '›' : '‹';
  try { localStorage.setItem('tabsCollapsed', c ? '1' : '0'); } catch {}
}
toggle.onclick = () => setCollapsed(!rail.classList.contains('collapsed'));
try { setCollapsed(localStorage.getItem('tabsCollapsed') === '1'); } catch { setCollapsed(false); }

/* ---------- Contact ---------- */
const ICON = {
  email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  telegram: '<path d="M21 4 3 11l6 2 2 6 3-4 5 4z"/><path d="m9 13 12-9"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
  github: '<path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5a3 3 0 0 0-.8-2.3c2.7-.3 5.5-1.3 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.6 2.5 5.6 2.8 5.6 2.8a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.2 9.2c0 4.6 2.8 5.7 5.5 6A3 3 0 0 0 9 17.5V21"/>',
};
$('#contacts').replaceChildren(...profile.contacts.map((c) => {
  const li = document.createElement('li'), a = document.createElement('a');
  a.className = 'contact'; a.href = c.href;
  if (c.type !== 'email') { a.target = '_blank'; a.rel = 'noopener'; }
  a.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[c.type] || ICON.email}</svg><span><b></b><span></span></span>`;
  a.querySelector('b').textContent = c.label; a.querySelector('span span').textContent = c.value;
  li.append(a); return li;
}));

/* ---------- Search: countries, competitions, certificates, websites, projects, sections ---------- */
const searchBox = $('#search'), sq = $('#sq'), sres = $('#sres'), sBtn = $('#searchBtn');
const label = (t) => $('#tab-' + t).dataset.tip;
const index = [
  ...Object.keys(byCountry).map((c) => ({ t: c, k: 'Country', to: path('achievements', c), s: c + ' ' + byCountry[c].map((a) => a.short).join(' ') })),
  ...achievements.map((a) => ({ t: a.name, k: a.result, to: path('achievements', a.country, a.id), s: [a.name, a.short, a.country, a.result, a.role, a.robot].join(' ') })),
  ...Object.entries(sections).flatMap(([sec, items]) => items.map((it) => ({ t: it.title, k: label(sec), to: it.soon ? sec : path(sec, it.id), s: [it.title, it.subtitle, it.details, sec].join(' ') }))),
  ...TABS.map((t) => ({ t: label(t), k: 'Section', to: t, s: label(t) + ' ' + t })),
  ...upcoming.map((u) => ({ t: u.name, k: 'Coming soon', to: 'achievements', s: u.name + ' ' + (u.note || '') })),
];
let hits = [], sel = 0;
function runSearch() {
  const words = sq.value.toLowerCase().split(/\s+/).filter(Boolean);
  hits = words.length ? index.filter((x) => words.every((w) => x.s.toLowerCase().includes(w))).slice(0, 8) : index.filter((x) => x.k === 'Country');
  sel = 0; drawHits();
}
function drawHits() {
  if (!hits.length) { sres.replaceChildren(Object.assign(document.createElement('li'), { className: 'none', textContent: 'Nothing found' })); sq.removeAttribute('aria-activedescendant'); return; }
  sres.replaceChildren(...hits.map((x, i) => {
    const li = document.createElement('li'); li.id = 'sr' + i; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === sel));
    li.append(x.t, Object.assign(document.createElement('span'), { textContent: x.k }));
    li.onmousedown = (e) => { e.preventDefault(); pick(x); }; li.onmousemove = () => { if (sel !== i) { sel = i; drawHits(); } };
    return li;
  }));
  sq.setAttribute('aria-activedescendant', 'sr' + sel);
  sres.children[sel]?.scrollIntoView({ block: 'nearest' });
}
function openSearch() { if (rail.classList.contains('collapsed')) setCollapsed(false); searchBox.hidden = false; sBtn.setAttribute('aria-expanded', 'true'); sq.value = ''; runSearch(); sq.focus(); }
function closeSearch(refocus) { if (searchBox.hidden) return; searchBox.hidden = true; sBtn.setAttribute('aria-expanded', 'false'); if (refocus) sBtn.focus(); }
function pick(x) { closeSearch(); go(x.to); }
sBtn.onclick = () => (searchBox.hidden ? openSearch() : closeSearch(true));
sq.oninput = runSearch;
sq.onkeydown = (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (hits.length) { sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length; drawHits(); } }
  else if (e.key === 'Enter') { e.preventDefault(); hits[sel] && pick(hits[sel]); }
  else if (e.key === 'Escape') { e.stopPropagation(); closeSearch(true); }
};
sq.onblur = () => setTimeout(() => { if (!searchBox.contains(document.activeElement) && document.activeElement !== sBtn) closeSearch(); }, 0);
addEventListener('keydown', (e) => {
  const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName);
  if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); openSearch(); }
}, true);

/* ---------- Ask AI (real model on Olimjon's laptop; falls back to local answers from data.js) ---------- */
const AI_URL = 'https://daily-cleft-babbling.ngrok-free.dev/chat';
const msgs = $('#msgs'), q = $('#q'), convo = [];
function say(who, text) {
  const li = document.createElement('li'); li.className = 'msg ' + who; li.textContent = text;
  msgs.append(li); li.scrollIntoView({ block: 'end', behavior: reduced ? 'auto' : 'smooth' }); return li;
}
async function remote() {
  const r = await fetch(AI_URL, { method: 'POST', signal: AbortSignal.timeout(90000),
    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
    body: JSON.stringify({ messages: convo.slice(-8) }) });
  if (!r.ok) throw new Error(r.status);
  const { reply } = await r.json(); if (!reply) throw new Error('empty');
  return reply;
}
async function ask(text) {
  text = text.trim(); if (!text) return;
  say('me', text); q.value = ''; convo.push({ role: 'user', content: text });
  const typing = say('bot typing', ''); typing.innerHTML = '<i></i><i></i><i></i>'; typing.setAttribute('aria-label', 'Typing');
  let reply; try { reply = await remote(); } catch { reply = answer(text); }
  convo.push({ role: 'assistant', content: reply });
  typing.remove(); say('bot', reply);
}
$('#ask').onsubmit = (e) => { e.preventDefault(); ask(q.value); };
$('#suggest').replaceChildren(...suggestions.map((s) => Object.assign(document.createElement('button'), { type: 'button', className: 'chip', textContent: s, onclick: () => ask(s) })));

history.replaceState(history.state, '', '#' + (here() || 'achievements'));
render();
