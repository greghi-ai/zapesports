/* Vestiário ZAPE — arara com as camisas reais do CLO.
   Cada camisa é uma sequência pré-renderizada do 3D, a volta inteira de 4 em 4 graus (0° = frente, 180° = costas).
   Na arara elas ficam de lado; ao rolar a página a arara passa e a camisa da vez se abre. */
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
const SW = 516, SH = 740, NY = 119;                 // sprite e altura do pescoço
const SIDE = 268, OPEN = 206, BACK = 180;           // de lado, aberta na arara, de costas
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = u => u < .5 ? 4*u*u*u : 1 - Math.pow(-2*u + 2, 3)/2;
const wrap = y => ((y % 360) + 360) % 360;
const q4 = y => (Math.round(wrap(y)/4)*4) % 360;
const cache = {};
const img = (id, y) => { const k = id + '_' + q4(y); if (!cache[k]) cache[k] = new Promise(r => { const i = new Image(); i.decoding = 'async'; i.onload = () => r(i); i.onerror = () => r(null); i.src = `assets/arara/${id}/${String(q4(y)).padStart(3,'0')}.webp`; }); return cache[k]; };
const range = (id, a, b) => { const p = []; for (let y = Math.min(a,b); y <= Math.max(a,b); y += 4) p.push(img(id, y)); return Promise.all(p); };
const $ = s => root.querySelector(s);
const pin = $('.v-pin'), stage = $('.v-stage'), track = $('.v-track'), wall = $('.v-wall'), card = $('.v-card'), prog = $('.v-prog i');
$('.v-ticker div').innerHTML = Array(2).fill('Vista o seu time <i>✦</i> Uniformes sob encomenda <i>✦</i> ZAPE Sport Wear <i>✦</i> Catálogo 2026 <i>✦</i> Praia Grande · SP <i>✦</i> Monte a sua em 3D <i>✦</i>').join(' ');
$('.v-pills').innerHTML = `<button type="button" data-g="" aria-pressed="true">Todos<span>${ORDER.length}</span></button>` + GROUPS.map(g => `<button type="button" data-g="${g.key}" aria-pressed="false">${g.label}<span>${g.ids.length}</span></button>`).join('');

const HOOK = '<svg class="v-hook" aria-hidden="true"><defs><linearGradient id="vch" x1="0" x2="1"><stop offset="0" stop-color="#9a7a2c"/><stop offset=".5" stop-color="#ffe9a8"/><stop offset="1" stop-color="#8a6a20"/></linearGradient></defs><path fill="none" stroke="url(#vch)" stroke-linecap="round"/></svg>';
function hook(svg, w, h, hk){ const cx = w/2, ny = NY/SH*h, sw = Math.max(1.6, w*.012);
  svg.setAttribute('width', w); svg.setAttribute('height', h);
  const p = svg.querySelector('path'); p.setAttribute('stroke-width', sw);
  p.setAttribute('d', `M${cx} ${ny-3} L${cx} ${ny-hk*.62} C${cx} ${ny-hk*1.05} ${cx-hk*.34} ${ny-hk*1.12} ${cx-hk*.38} ${ny-hk*.82}`); }
const items = ORDER.map((o, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'v-shirt'; b.setAttribute('aria-label', `${o.m.name}, ${o.m.gola}`);
  b.innerHTML = `<canvas></canvas>${HOOK}<span class="v-tag">${o.n}</span>`; track.appendChild(b);
  return {...o, el:b, cv:b.querySelector('canvas'), yaw:SIDE, shown:-1, sway:i*1.9};
});
async function paint(it){ const y = q4(it.yaw); if (y === it.shown) return; const im = await img(it.id, y); if (q4(it.yaw) !== y || !im) return;
  it.shown = y; const x = it.cv.getContext('2d'); x.clearRect(0,0,it.cv.width,it.cv.height); x.drawImage(im, 0, 0, it.cv.width, it.cv.height); }

let G = {};
function layout(){
  const head = document.querySelector('header'); const hh = head ? head.offsetHeight : 66;
  pin.style.top = hh + 'px'; pin.style.height = `calc(100svh - ${hh}px)`;
  const S = pin.clientHeight - 44, W = pin.clientWidth, mob = W < 820;
  const h = S*(mob ? .52 : .55), w = h*SW/SH, railY = S*(mob ? .22 : .25), hk = h*.1, top = railY + hk - NY/SH*h;
  const gap = w*(mob ? .3 : .24), gGap = w*(mob ? .75 : .7), side = mob ? W*.5 - w*.5 : w*.4;
  G = {...G, S, W, h, w, railY, hk, top, gap, mob};
  track.querySelectorAll('.v-rail,.v-lbl').forEach(e => e.remove());
  let x = side;
  GROUPS.forEach((g, gi) => { const ids = items.filter(it => it.g === g);
    ids.forEach((it, k) => { it.x = x + k*gap; it.c = it.x + w/2; });
    const a = ids[0].c - w*.42, b = ids[ids.length-1].c + w*.42; g.cx = (a + b)/2;
    const r = document.createElement('div'); r.className = 'v-rail'; Object.assign(r.style, {left:a+'px', width:(b-a)+'px', top:(railY-4)+'px'}); track.appendChild(r);
    const l = document.createElement('div'); l.className = 'v-lbl'; l.innerHTML = `${g.label} <b>${ids.length}</b>`; Object.assign(l.style, {left:g.cx+'px', top:(railY - S*.075)+'px'}); track.appendChild(l);
    x = ids[ids.length-1].x + w + (gi < GROUPS.length-1 ? gGap - w*.5 : side); });
  G.total = x; track.style.width = x + 'px';
  const dpr = Math.min(2, devicePixelRatio || 1);
  items.forEach((it, i) => { Object.assign(it.el.style, {left:it.x+'px', top:top+'px', width:w+'px', height:h+'px', zIndex:String(10 + i)});
    hook(it.el.querySelector('.v-hook'), w, h, hk); it.el.querySelector('.v-tag').style.top = (NY/SH*h - hk*.62 - 12) + 'px';
    it.cv.width = Math.round(w*dpr); it.cv.height = Math.round(h*dpr); it.shown = -1; paint(it); });
  G.fits = x <= W; G.first = items[0].c; G.last = items[items.length-1].c;
  onScroll(true);
}

/* rolagem: a arara passa e a camisa da vez abre */
let P = -1, hoverX = null;
const pinTop = () => parseFloat(pin.style.top) || 66;
function progress(){ const r = root.getBoundingClientRect(), span = root.offsetHeight - pin.offsetHeight; return Math.max(0, Math.min(1, (pinTop() - r.top)/Math.max(1, span))); }
function onScroll(force){ const p = progress(); if (!force && Math.abs(p - P) < .0005) return; P = p; prog.style.width = (p*100).toFixed(1) + '%';
  const F = G.first + (G.last - G.first)*ease(p);
  G.focus = F; G.x = G.fits ? (G.W - G.total)/2 : Math.max(G.W - G.total, Math.min(0, G.W/2 - F));
  track.style.transform = `translate3d(${G.x.toFixed(1)}px,0,0)`; wall.style.transform = `translate3d(${(G.x*.08).toFixed(1)}px,0,0)`;
  kick(); }
function targetYaw(it){ const f = hoverX != null ? hoverX : G.focus; const d = (it.c - f)/(G.gap*1.15); return SIDE + (OPEN - SIDE)*Math.exp(-d*d); }
addEventListener('scroll', () => { if (!open) onScroll(); }, {passive:true});

let raf = 0, t0 = performance.now();
const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
function tick(now){ raf = 0; let moving = false;
  items.forEach(it => { if (it === open) return; const tg = targetYaw(it); const d = tg - it.yaw;
    if (Math.abs(d) > .4){ it.yaw += d*.14; moving = true; } it.el.classList.toggle('v-hot', tg < SIDE - 30); paint(it);
    if (!reduce){ const s = Math.sin((now - t0)/1800 + it.sway)*.3; it.el.style.transform = `rotate(${s.toFixed(2)}deg)`; } });
  if (moving || !reduce) raf = requestAnimationFrame(tick); }
stage.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || open) return; hoverX = e.clientX - pin.getBoundingClientRect().left - G.x; kick(); });
stage.addEventListener('pointerleave', () => { hoverX = null; kick(); });

root.querySelectorAll('.v-pills button').forEach(b => b.addEventListener('click', () => {
  root.querySelectorAll('.v-pills button').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
  const g = GROUPS.find(g => g.key === b.dataset.g); root.classList.toggle('v-filtering', !!g); items.forEach(it => it.el.classList.toggle('v-off', !!g && it.g !== g));
  if (g) goto(Math.max(0, Math.min(1, (g.cx - G.first)/(G.last - G.first)))); }));
function goto(p){ const span = root.offsetHeight - pin.offsetHeight, top = root.getBoundingClientRect().top + scrollY - pinTop();
  let lo = 0, hi = 1; for (let k = 0; k < 24; k++){ const m = (lo + hi)/2; if (ease(m) < p) lo = m; else hi = m; }
  scrollTo({top: top + span*lo, behavior: reduce ? 'auto' : 'smooth'}); }

/* abrir: a camisa sai da arara, vem pra frente e gira até ficar de costas; dá pra arrastar para girar */
let open = null, busy = false, cur = BACK, R = null;
const show = document.createElement('div'); show.className = 'v-show'; show.innerHTML = `<canvas></canvas>${HOOK}<span class="v-tag"></span><span class="v-spin">Arraste para girar</span>`; pin.appendChild(show); show.style.display = 'none';
const scv = show.querySelector('canvas');
function spot(){ const S = G.S, W = G.W; if (G.mob){ const h = S*.5, w = h*SW/SH; return {x:(W - w)/2, y:S*.1, w, h}; }
  const h = S*.78, w = h*SW/SH; return {x:Math.max(16, W*.36 - w/2), y:S*.12, w, h}; }
let drawId = 0;
async function drawShow(it, r, yaw){ R = r; Object.assign(show.style, {left:r.x+'px', top:r.y+'px', width:r.w+'px', height:r.h+'px'});
  const hk = r.h*.1; hook(show.querySelector('.v-hook'), r.w, r.h, hk); show.querySelector('.v-tag').style.top = (NY/SH*r.h - hk*.62 - 12) + 'px';
  const id = ++drawId, im = await img(it.id, yaw); if (id !== drawId || !im) return; const x = scv.getContext('2d'); x.clearRect(0,0,scv.width,scv.height); x.drawImage(im, 0, 0, scv.width, scv.height); }
const tween = (dur, fn) => new Promise(res => { const a = performance.now(); (function f(n){ const u = reduce ? 1 : Math.min(1, (n - a)/dur); fn(ease(u)); if (u < 1) requestAnimationFrame(f); else res(); })(a); });
async function travel(it, dir){ const pb = pin.getBoundingClientRect(), r0 = it.el.getBoundingClientRect();
  const A = {x:r0.left - pb.left, y:r0.top - pb.top, w:r0.width, h:r0.height}, B = spot(), [Pa, Q] = dir > 0 ? [A, B] : [B, A];
  const dpr = Math.min(2, devicePixelRatio || 1); scv.width = Math.round(B.w*dpr); scv.height = Math.round(B.h*dpr); show.style.display = 'block'; show.querySelector('.v-tag').textContent = it.n;
  // abre: do ângulo da arara até as costas. fecha: do ângulo atual de volta (pelo caminho mais curto)
  let y0, y1; if (dir > 0){ y0 = it.yaw; y1 = BACK; } else { y1 = targetYaw(it); y0 = wrap(cur); if (y0 - y1 > 180) y0 -= 360; if (y1 - y0 > 180) y0 += 360; }
  await range(it.id, Math.min(y0, y1), Math.max(y0, y1));
  await tween(900, e => { const r = {x:Pa.x+(Q.x-Pa.x)*e, y:Pa.y+(Q.y-Pa.y)*e, w:Pa.w+(Q.w-Pa.w)*e, h:Pa.h+(Q.h-Pa.h)*e}; cur = y0 + (y1 - y0)*e; drawShow(it, r, cur); }); }
function fill(it){ $('.v-grp').textContent = it.g.label; $('.v-num').textContent = it.n; $('.v-card h3').textContent = it.m.name; $('.v-sub').textContent = 'Sob encomenda · catálogo 2026'; $('.v-gola').textContent = it.m.gola; card.classList.remove('v-p'); $('[data-go]').textContent = 'Personalizar'; links(); }
function links(){ if (!open) return; const nome = $('#vNome').value.trim(), num = $('#vNum').value.replace(/\D/g,''); const q = new URLSearchParams({m:open.id}); if (nome) q.set('nome', nome); if (num) q.set('num', num); $('[data-go]').href = 'estudio3d/?' + q; }
root.querySelectorAll('.v-card input').forEach(i => i.addEventListener('input', links));
$('[data-go]').addEventListener('click', e => { if (!card.classList.contains('v-p')){ e.preventDefault(); card.classList.add('v-p'); $('[data-go]').textContent = 'Abrir no estúdio 3D'; setTimeout(() => $('#vNome').focus(), 50); } });
async function openIt(it){ if (busy || open) return; busy = true; open = it; fill(it); it.el.style.visibility = 'hidden'; root.classList.add('v-open'); show.querySelector('.v-spin').style.opacity = 1;
  await travel(it, 1); cur = BACK; busy = false; }
async function closeIt(){ if (!open || busy) return; busy = true; const it = open; root.classList.remove('v-open'); await travel(it, -1);
  it.el.style.visibility = ''; it.yaw = wrap(cur); it.shown = -1; show.style.display = 'none'; open = null; busy = false; kick(); }
async function flip(){ if (!open || busy) return; busy = true; const a = cur, w0 = wrap(cur), b = (w0 > 90 && w0 < 270) ? a + (360 - w0) : a + (180 - (w0 >= 270 ? w0 - 360 : w0));
  await range(open.id, 0, 356);
  await tween(1100, e => { cur = a + (b - a)*e; drawShow(open, R, cur); }); cur = wrap(cur); busy = false; }
async function step(d){ if (!open || busy) return; const i = (items.indexOf(open) + d + items.length) % items.length; await closeIt(); openIt(items[i]); }
// arrastar a camisa aberta para girar
let dragX = null, dragY0 = 0;
show.addEventListener('pointerdown', e => { if (!open || busy) return; dragX = e.clientX; dragY0 = cur; show.classList.add('v-drag'); try{ show.setPointerCapture(e.pointerId) }catch(_){} show.querySelector('.v-spin').style.opacity = 0; });
show.addEventListener('pointermove', e => { if (dragX == null) return; cur = wrap(dragY0 - (e.clientX - dragX)*.55); drawShow(open, R, cur); });
const endDrag = () => { if (dragX == null) return; dragX = null; show.classList.remove('v-drag'); };
['pointerup','pointercancel','lostpointercapture'].forEach(ev => show.addEventListener(ev, endDrag));

items.forEach(it => it.el.addEventListener('click', () => openIt(it)));
$('.v-card .v-x').onclick = closeIt; $('[data-flip]').onclick = flip; $('[data-p]').onclick = () => step(-1); $('[data-n]').onclick = () => step(1);
$('.v-dim').addEventListener('click', closeIt);
addEventListener('keydown', e => { if (!open) return; if (e.key === 'Escape') closeIt(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (!open) layout(); }, 120); });
layout(); kick();
// pré-carrega o trecho usado na arara (de lado até aberta) e, depois, a volta completa
items.reduce((p, it) => p.then(() => range(it.id, 200, 272)), Promise.resolve()).then(() => setTimeout(() => items.reduce((p, it) => p.then(() => range(it.id, 0, 356)), Promise.resolve()), 1500));
})();
