/* Vestiário ZAPE — arara com as camisas reais do CLO.
   Cada camisa é uma sequência pré-renderizada do 3D: de 0° (frente) a 232° (costas, de lado), de 4 em 4 graus. */
(() => {
const root = document.getElementById('vest'); if (!root) return;
const M = {
  m23:       {name:'M-23',               gola:'Gola V'},
  santiago:  {name:'Santiago',           gola:'Gola V'},
  retro:     {name:'Dynamic Retrô',      gola:'Gola V'},
  sobreposta:{name:'Dynamic Sobreposta', gola:'Gola V sobreposta'},
  campnou:   {name:'Camp Nou',           gola:'Gola V transpassada'},
  canarinho: {name:'Canarinho',          gola:'Gola polo · raglan'},
  fusion:    {name:'Fusion',             gola:'Gola V · raglan'}
};
const GROUPS = [{key:'v', label:'Gola V', ids:['m23','santiago','retro','sobreposta','campnou']}, {key:'r', label:'Raglan', ids:['canarinho','fusion']}];
const ORDER = GROUPS.flatMap(g => g.ids.map(id => ({id, g})));
ORDER.forEach((o, i) => { o.n = String(i + 1).padStart(2, '0'); o.m = M[o.id]; });
const SW = 516, SH = 740, NX = 258, NY = 119, REST = 232, HOVER = 210, BACK = 180;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = u => u < .5 ? 4*u*u*u : 1 - Math.pow(-2*u + 2, 3)/2;
const q4 = y => Math.max(0, Math.min(232, Math.round(y/4)*4));
const cache = {};
const img = (id, y) => { const k = id + q4(y); if (!cache[k]) cache[k] = new Promise(r => { const i = new Image(); i.decoding = 'async'; i.onload = () => r(i); i.onerror = () => r(null); i.src = `assets/arara/${id}/${String(q4(y)).padStart(3,'0')}.webp`; }); return cache[k]; };
const preload = (id, a, b) => { const p = []; for (let y = Math.min(a,b); y <= Math.max(a,b); y += 4) p.push(img(id, y)); return Promise.all(p); };

const $ = s => root.querySelector(s);
const stage = $('.v-stage'), track = $('.v-track'), rail = $('.v-rail'), wall = $('.v-wall'), props = $('.v-props'), card = $('.v-card');
$('.v-ticker div').innerHTML = Array(2).fill('Vista o seu time <i>✦</i> Uniformes sob encomenda <i>✦</i> ZAPE Sport Wear <i>✦</i> Catálogo 2026 <i>✦</i> Praia Grande · SP <i>✦</i> Monte a sua em 3D <i>✦</i>').join(' ');
$('.v-pills').innerHTML = `<button type="button" data-g="" aria-pressed="true">Todos<span>${ORDER.length}</span></button>` + GROUPS.map(g => `<button type="button" data-g="${g.key}" aria-pressed="false">${g.label}<span>${g.ids.length}</span></button>`).join('');

const hookSVG = () => '<svg class="v-hook" aria-hidden="true"><defs><linearGradient id="vch" x1="0" x2="1"><stop offset="0" stop-color="#9a7a2c"/><stop offset=".5" stop-color="#ffe9a8"/><stop offset="1" stop-color="#8a6a20"/></linearGradient></defs><path class="v-h1" fill="none" stroke="url(#vch)" stroke-linecap="round"/><path class="v-h2" fill="none" stroke="#2c2016" stroke-linecap="round"/></svg>';
const items = ORDER.map((o, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'v-shirt'; b.setAttribute('aria-label', `${o.m.name}, ${o.m.gola}`);
  b.innerHTML = `<canvas></canvas>${hookSVG()}<span class="v-tag">${o.n}</span>`; track.appendChild(b);
  return {...o, el:b, cv:b.querySelector('canvas'), rest: REST - (i % 2) * 4, yaw: REST - (i % 2) * 4, swing: i * 1.7};
});
// gancho dourado + ombreira do cabide (encolhe de perfil)
function hang(svg, w, h, yaw, railGap){ const cx = w/2, ny = NY/SH*h, top = -railGap, sw = Math.max(1.6, w*.012);
  const bw = w*.43*Math.max(.12, Math.abs(Math.cos((yaw-180)*Math.PI/180)));
  svg.setAttribute('width', w); svg.setAttribute('height', h); svg.style.top = '0';
  svg.querySelector('.v-h1').setAttribute('d', `M${cx} ${ny-4} L${cx} ${top+railGap*.55} C${cx} ${top+railGap*.1} ${cx-railGap*.32} ${top} ${cx-railGap*.36} ${top+railGap*.28}`);
  svg.querySelector('.v-h1').setAttribute('stroke-width', sw);
  svg.querySelector('.v-h2').setAttribute('d', `M${cx-bw} ${ny+7} Q${cx} ${ny-8} ${cx+bw} ${ny+7}`); svg.querySelector('.v-h2').setAttribute('stroke-width', sw*2.6); }
async function paint(it){ const y = q4(it.yaw); const im = await img(it.id, y); if (q4(it.yaw) !== y || !im) return; const x = it.cv.getContext('2d'); x.clearRect(0,0,it.cv.width,it.cv.height); x.drawImage(im, 0, 0, it.cv.width, it.cv.height); hang(it.el.querySelector('.v-hook'), G.w, G.h, it.yaw, G.hk); }

let G = {};
function layout(){
  const S = root.clientHeight - 44, W = root.clientWidth, mob = W < 820;
  const h = S * (mob ? .5 : .48), w = h*SW/SH, railY = S*(mob ? .2 : .24), hk = h*.085, top = railY + hk - NY/SH*h;
  const gap = w*(mob ? .3 : .26), pad = w*.25, deco = w*(mob ? .7 : .6);
  G = {...G, S, W, h, w, railY, hk, top, gap, mob};
  rail.style.top = (railY - 4) + 'px';
  const dpr = Math.min(2, devicePixelRatio || 1);
  // compartimentos: decorativo | Gola V | Raglan | decorativo
  wall.innerHTML = ''; let x = 0; const bays = [];
  const addBay = (bw, label) => { const d = document.createElement('div'); d.className = 'v-bay'; d.style.left = x + 'px'; d.style.width = bw + 'px';
    if (label) d.innerHTML = `<span class="v-lbl">${label}</span>`; wall.appendChild(d); bays.push({x, w:bw}); x += bw; };
  addBay(deco);
  GROUPS.forEach(g => { const n = g.ids.length, bw = (n-1)*gap + w + pad*2, x0 = x;
    addBay(bw, `${g.label} <b>${n}</b>`); g.cx = x0 + bw/2;
    items.filter(it => it.g === g).forEach((it, k) => { it.x = x0 + pad + k*gap; }); });
  addBay(deco);
  G.total = x; track.style.width = wall.style.width = x + 'px';
  items.forEach(it => { Object.assign(it.el.style, {left: it.x+'px', top: top+'px', width: w+'px', height: h+'px'}); it.el.style.zIndex = 100 - items.indexOf(it);
    it.el.querySelector('.v-tag').style.top = (NY/SH*h - hk*.62) + 'px';
    it.cv.width = Math.round(w*dpr); it.cv.height = Math.round(h*dpr); paint(it); });
  props.style.width = x + 'px';
  props.innerHTML = towels(bays[0].x + bays[0].w*.12, w) + ball(bays[bays.length-1].x + bays[bays.length-1].w*.12, w) + boots(bays[1].x + bays[1].w*.62, w);
  G.min = Math.min(0, W - x); G.max = Math.max(0, (W - x)/2); if (x <= W) G.min = G.max = (W - x)/2;
  if (G.x == null || x <= W) G.x = x <= W ? (W - x)/2 : Math.max(G.min, Math.min(G.max, W/2 - GROUPS[0].cx));
  G.x = clamp(G.x); apply();
}
const towels = (x, w) => `<svg style="left:${x}px;width:${w*.62}px" viewBox="0 0 200 90"><rect x="8" y="58" width="184" height="28" rx="7" fill="#e9e5dc"/><rect x="8" y="58" width="184" height="6" rx="3" fill="#cfc9bc"/><rect x="14" y="32" width="172" height="28" rx="7" fill="#181512"/><rect x="14" y="32" width="172" height="5" rx="2" fill="#daa520"/><rect x="20" y="8" width="160" height="26" rx="7" fill="#daa520"/><rect x="20" y="8" width="160" height="5" rx="2" fill="#f3d27a"/><image href="assets/info/sym_gold.png" x="88" y="38" width="22" height="22"/></svg>`;
const ball = (x, w) => `<svg style="left:${x}px;width:${w*.46}px" viewBox="0 0 100 100"><defs><radialGradient id="vbl" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#d8d4cc"/><stop offset="1" stop-color="#6f6b64"/></radialGradient></defs><circle cx="50" cy="50" r="47" fill="url(#vbl)"/><path d="M50 30 68 43 61 64 39 64 32 43Z" fill="#141414"/><path d="M50 3v27M68 43 94 35M61 64l15 24M39 64 24 88M32 43 6 35" stroke="#141414" stroke-width="2.2" fill="none"/><path d="M17 17 29 25 25 39 10 39ZM83 17 71 25 75 39 90 39ZM39 93 43 80 57 80 61 93Z" fill="#141414" opacity=".85"/></svg>`;
const boots = (x, w) => `<svg style="left:${x}px;width:${w*.62}px" viewBox="0 0 160 60"><g fill="#111"><path d="M6 40c0-10 8-16 22-17l26-2c6 0 10-6 14-12 3-4 9-5 13-1l6 7c3 3 3 8 1 11l-6 10c-2 4-6 6-10 6H14c-5 0-8-1-8-2Z"/><path d="M78 46c0-9 7-14 20-15l24-2c6 0 9-5 13-11 3-4 8-4 12-1l5 6c3 3 3 7 1 10l-6 9c-2 4-5 6-9 6H86c-5 0-8-1-8-2Z" fill="#1c1c1c"/></g><g fill="#daa520"><path d="M14 44h62v3H14z"/><path d="M86 50h58v3H86z"/></g><g fill="#f2eee5"><circle cx="20" cy="50" r="2"/><circle cx="34" cy="50" r="2"/><circle cx="50" cy="50" r="2"/><circle cx="94" cy="56" r="2"/><circle cx="108" cy="56" r="2"/><circle cx="124" cy="56" r="2"/></g></svg>`;
const clamp = v => Math.max(G.min, Math.min(G.max, v));
function apply(){ const t = `translate3d(${G.x.toFixed(1)}px,0,0)`; track.style.transform = wall.style.transform = props.style.transform = t;
  if (G.mob && !open){ let best = null, bd = 1e9; items.forEach(it => { const d = Math.abs(G.x + it.x + G.w/2 - G.W/2); if (d < bd){ bd = d; best = it; } });
    if (best !== near){ if (near){ near.el.classList.remove('v-near'); near.target = near.rest; } near = best; if (near){ near.el.classList.add('v-near'); near.target = HOVER; } kick(); } } }
let near = null;

/* balanço sutil + giro ao passar o mouse */
let raf = 0, t0 = performance.now(), v = 0;
const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
function tick(now){ raf = 0; let busy = false;
  items.forEach(it => { const tg = it.target ?? it.rest; if (Math.abs(it.yaw - tg) > 1){ it.yaw += (tg - it.yaw)*.16; busy = true; paint(it); }
    if (!reduce && !open){ const s = Math.sin((now - t0)/1700 + it.swing)*.35; it.el.style.transform = `rotate(${s.toFixed(2)}deg)`; } });
  if (v && !dragging){ G.x = clamp(G.x + v); v *= .93; if (Math.abs(v) < .15) v = 0; apply(); busy = true; }
  if (busy || !reduce) raf = requestAnimationFrame(tick); }
items.forEach(it => { it.el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !open){ it.target = HOVER; kick(); } });
  it.el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !open){ it.target = it.rest; kick(); } }); });

/* arrastar */
let dragging = false, moved = false, sx = 0, sxo = 0, lx = 0, lt = 0;
stage.addEventListener('pointerdown', e => { if (open || e.button !== 0) return; dragging = true; moved = false; sx = lx = e.clientX; sxo = G.x; lt = performance.now(); v = 0; });
stage.addEventListener('pointermove', e => { if (!dragging) return; const dx = e.clientX - sx;
  if (!moved && Math.abs(dx) > 6){ moved = true; stage.classList.add('v-drag'); try{ stage.setPointerCapture(e.pointerId) }catch(_){} }
  if (moved){ const n = performance.now(); v = (e.clientX - lx)/Math.max(1, n - lt)*16; lx = e.clientX; lt = n; G.x = clamp(sxo + dx); apply(); } });
const end = () => { if (!dragging) return; dragging = false; stage.classList.remove('v-drag'); kick(); setTimeout(() => moved = false, 0); };
['pointerup','pointercancel','lostpointercapture'].forEach(ev => stage.addEventListener(ev, end));
stage.addEventListener('wheel', e => { if (open) return; if (Math.abs(e.deltaX) > Math.abs(e.deltaY)){ e.preventDefault(); G.x = clamp(G.x - e.deltaX); apply(); } }, {passive:false});
const glide = to => { const from = G.x, a = performance.now(); to = clamp(to); (function f(n){ const u = Math.min(1, (n - a)/650); G.x = from + (to - from)*ease(u); apply(); if (u < 1) requestAnimationFrame(f); })(a); };
root.querySelectorAll('.v-pills button').forEach(b => b.addEventListener('click', () => {
  root.querySelectorAll('.v-pills button').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
  const g = GROUPS.find(g => g.key === b.dataset.g); root.classList.toggle('v-filtering', !!g);
  items.forEach(it => it.el.classList.toggle('v-off', !!g && it.g !== g)); if (g) glide(G.W/2 - g.cx); }));

/* abrir uma camisa: ela sai da arara e gira até ficar de costas, como no vestiário */
let open = null, busy = false, side = BACK;
const show = document.createElement('div'); show.className = 'v-show'; show.innerHTML = `<canvas></canvas>${hookSVG()}<span class="v-tag"></span>`; root.appendChild(show); show.style.display = 'none';
const scv = show.querySelector('canvas');
function spot(){ const S = G.S, W = G.W; if (G.mob){ const h = S*.5, w = h*SW/SH; return {x:(W - w)/2, y:S*.08, w, h}; }
  const h = S*.8, w = h*SW/SH; return {x:Math.max(16, W*.34 - w/2), y:S*.1, w, h}; }
function drawShow(r, im, yaw){ Object.assign(show.style, {left:r.x+'px', top:r.y+'px', width:r.w+'px', height:r.h+'px'});
  const x = scv.getContext('2d'); if (im){ x.clearRect(0,0,scv.width,scv.height); x.drawImage(im, 0, 0, scv.width, scv.height); }
  const hk = r.h*.085; hang(show.querySelector('.v-hook'), r.w, r.h, yaw, hk); show.querySelector('.v-tag').style.top = (NY/SH*r.h - hk*.5) + 'px'; }
function tween(dur, fn){ return new Promise(res => { const a = performance.now(); (function f(n){ const u = reduce ? 1 : Math.min(1, (n - a)/dur); fn(ease(u)); if (u < 1) requestAnimationFrame(f); else res(); })(a); }); }
async function travel(it, dir){ const rb = root.getBoundingClientRect(), r0 = it.el.getBoundingClientRect();
  const A = {x:r0.left - rb.left, y:r0.top - rb.top, w:r0.width, h:r0.height}, B = spot(), [P, Q] = dir > 0 ? [A, B] : [B, A];
  const dpr = Math.min(2, devicePixelRatio || 1); scv.width = Math.round(B.w*dpr); scv.height = Math.round(B.h*dpr); show.style.display = 'block';
  show.querySelector('.v-tag').textContent = it.n;
  const y0 = dir > 0 ? it.yaw : side, y1 = dir > 0 ? BACK : it.rest; const ims = {}; await preload(it.id, y0, y1);
  await tween(900, async e => { const r = {x:P.x+(Q.x-P.x)*e, y:P.y+(Q.y-P.y)*e, w:P.w+(Q.w-P.w)*e, h:P.h+(Q.h-P.h)*e}, yaw = y0 + (y1 - y0)*e; drawShow(r, await img(it.id, yaw), yaw); }); }
function fill(it){ $('.v-grp').textContent = it.g.label; $('.v-num').textContent = it.n; $('.v-card h3').textContent = it.m.name; $('.v-sub').textContent = 'Sob encomenda · catálogo 2026'; $('.v-gola').textContent = it.m.gola; card.classList.remove('v-p'); links(); }
function links(){ if (!open) return; const nome = $('#vNome').value.trim(), num = $('#vNum').value.replace(/\D/g,''); const q = new URLSearchParams({m:open.id}); if (nome) q.set('nome', nome); if (num) q.set('num', num); $('[data-go]').href = 'estudio3d/?' + q; }
root.querySelectorAll('.v-card input').forEach(i => i.addEventListener('input', links));
$('[data-go]').addEventListener('click', e => { if (!card.classList.contains('v-p')){ e.preventDefault(); card.classList.add('v-p'); $('[data-go]').textContent = 'Abrir no estúdio 3D'; setTimeout(() => $('#vNome').focus(), 50); } });
async function openIt(it){ if (busy || moved || open) return; busy = true; open = it; side = BACK; fill(it); $('[data-go]').textContent = 'Personalizar';
  it.el.style.visibility = 'hidden'; root.classList.add('v-open'); await travel(it, 1); busy = false; }
async function closeIt(){ if (!open || busy) return; busy = true; const it = open; root.classList.remove('v-open'); await travel(it, -1);
  it.el.style.visibility = ''; show.style.display = 'none'; open = null; busy = false; it.target = it.rest; kick(); }
async function flip(){ if (!open || busy) return; busy = true; const it = open, a = side, b = side === BACK ? 0 : BACK; await preload(it.id, 0, BACK); const r = spot();
  await tween(1100, async e => { const yaw = a + (b - a)*e; drawShow(r, await img(it.id, yaw), yaw); }); side = b; busy = false; }
async function step(d){ if (!open || busy) return; const i = (items.indexOf(open) + d + items.length) % items.length; await closeIt(); glide(G.W/2 - items[i].x - G.w/2); setTimeout(() => openIt(items[i]), 680); }
items.forEach(it => it.el.addEventListener('click', () => { if (!moved) openIt(it); }));
$('.v-card .v-x').onclick = closeIt; $('[data-flip]').onclick = flip; $('[data-p]').onclick = () => step(-1); $('[data-n]').onclick = () => step(1);
root.querySelector('.v-dim').addEventListener('click', closeIt);
stage.addEventListener('click', e => { if (open && !busy) closeIt(); });
addEventListener('keydown', e => { if (!open) return; if (e.key === 'Escape') closeIt(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (!open) layout(); }, 120); });
layout(); kick();
setTimeout(() => items.reduce((p, it) => p.then(() => preload(it.id, BACK, 232)), Promise.resolve()), 2000);
})();
