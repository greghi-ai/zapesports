/* Vestiário ZAPE — arara em 3D de verdade (WebGL próprio, sem bibliotecas).
   As camisas são as malhas do CLO (só a camisa, simplificada) com a textura original.
   Rolando a página a câmera passa pela arara; só a camisa da vez sai para frente.
   Ao tocar, ela vem para o centro, fica de costas e dá para girar arrastando. */
(() => {
const root = document.getElementById('vest'); if (!root) return;
const $ = s => root.querySelector(s);
const pin = $('.v-pin'), stage = $('.v-stage'), wall = $('.v-wall'), card = $('.v-card'), progBar = $('.v-prog i');
const M = {
  m23:{name:'M-23',gola:'Gola V'}, santiago:{name:'Santiago',gola:'Gola V'}, retro:{name:'Dynamic Retrô',gola:'Gola V'},
  sobreposta:{name:'Dynamic Sobreposta',gola:'Gola V sobreposta'}, campnou:{name:'Camp Nou',gola:'Gola V transpassada'},
  canarinho:{name:'Canarinho',gola:'Gola polo · raglan'}, fusion:{name:'Fusion',gola:'Gola V · raglan'}
};
const GROUPS = [{key:'v',label:'Gola V',ids:['m23','santiago','retro','sobreposta','campnou']},{key:'r',label:'Raglan',ids:['canarinho','fusion']}];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const D2R = Math.PI/180, clamp = (v,a,b) => Math.max(a, Math.min(b, v)), lerp = (a,b,u) => a + (b-a)*u;
const ease = u => u < .5 ? 4*u*u*u : 1 - Math.pow(-2*u + 2, 3)/2;
$('.v-ticker div').innerHTML = Array(2).fill('Vista o seu time <i>✦</i> Uniformes sob encomenda <i>✦</i> ZAPE Sport Wear <i>✦</i> Catálogo 2026 <i>✦</i> Praia Grande · SP <i>✦</i> Monte a sua em 3D <i>✦</i>').join(' ');
const shirtsN = GROUPS.reduce((s,g) => s + g.ids.length, 0);
$('.v-pills').innerHTML = `<button type="button" data-g="" aria-pressed="true">Todos<span>${shirtsN}</span></button>` + GROUPS.map(g => `<button type="button" data-g="${g.key}" aria-pressed="false">${g.label}<span>${g.ids.length}</span></button>`).join('');

/* ---------- WebGL ---------- */
const cv = document.createElement('canvas'); cv.className = 'v-gl'; stage.prepend(cv);
const gl = cv.getContext('webgl', {antialias:true, alpha:true, premultipliedAlpha:true});
if (!gl){ root.classList.add('v-nogl'); return; }
gl.getExtension('OES_element_index_uint'); const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
const VS = `attribute vec3 p;attribute vec3 n;attribute vec2 uv;uniform mat4 VP;uniform mat4 Mo;varying vec3 vN;varying vec3 vP;varying vec2 vUV;
void main(){vec4 w=Mo*vec4(p,1.0);vN=mat3(Mo)*n;vP=w.xyz;vUV=uv;gl_Position=VP*w;}`;
const FS = `precision highp float;varying vec3 vN;varying vec3 vP;varying vec2 vUV;uniform sampler2D T;uniform float uTex;uniform vec3 uCol;uniform vec3 uEye;uniform float uDim;uniform float uMetal;
vec3 toLin(vec3 c){return pow(c,vec3(2.2));}
void main(){vec3 N=normalize(vN);vec3 V=normalize(uEye-vP);float inside=1.0;if(!gl_FrontFacing){N=-N;inside=0.55;}
 vec3 base=toLin(uTex>0.5?texture2D(T,vUV).rgb:uCol);
 vec3 L1=normalize(vec3(0.1,1.0,0.6)),L2=normalize(vec3(-0.7,0.35,-0.5)),L3=normalize(vec3(0.55,0.2,0.85));
 float d1=max(dot(N,L1),0.0),d2=max(dot(N,L2),0.0),d3=max(dot(N,L3),0.0),hemi=0.5+0.5*N.y;
 vec3 col=base*(0.16*hemi+0.07+1.1*d1+0.38*d3)+vec3(1.0,0.84,0.55)*base*0.5*d2;
 vec3 Hh=normalize(L1+V);float sp=pow(max(dot(N,Hh),0.0),mix(24.0,60.0,uMetal))*mix(0.1,1.2,uMetal);
 float rim=pow(1.0-max(dot(N,V),0.0),3.0)*0.25;
 col+=vec3(1.0,0.9,0.7)*sp+vec3(1.0,0.85,0.55)*rim*0.5;col*=inside;
 col*=mix(0.75,1.06,smoothstep(85.0,155.0,vP.y));
 col=col/(col+vec3(0.8))*1.5;col=pow(col,vec3(1.0/2.2));col*=uDim;gl_FragColor=vec4(col,1.0);}`;
function sh(t, s){ const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; }
const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
const A = {p:gl.getAttribLocation(prog,'p'), n:gl.getAttribLocation(prog,'n'), uv:gl.getAttribLocation(prog,'uv')};
const U = {}; ['VP','Mo','T','uTex','uCol','uEye','uDim','uMetal'].forEach(k => U[k] = gl.getUniformLocation(prog, k));
const buf = (d, t = gl.ARRAY_BUFFER) => { const b = gl.createBuffer(); gl.bindBuffer(t, b); gl.bufferData(t, d, gl.STATIC_DRAW); return b; };
function normals(pos, idx){ const n = new Float32Array(pos.length); for (let i = 0; i < idx.length; i += 3){ const a = idx[i]*3, b = idx[i+1]*3, c = idx[i+2]*3;
  const ux = pos[b]-pos[a], uy = pos[b+1]-pos[a+1], uz = pos[b+2]-pos[a+2], vx = pos[c]-pos[a], vy = pos[c+1]-pos[a+1], vz = pos[c+2]-pos[a+2];
  const nx = uy*vz-uz*vy, ny = uz*vx-ux*vz, nz = ux*vy-uy*vx; for (const k of [a,b,c]){ n[k]+=nx; n[k+1]+=ny; n[k+2]+=nz; } }
  for (let i = 0; i < n.length; i += 3){ const l = Math.hypot(n[i],n[i+1],n[i+2]) || 1; n[i]/=l; n[i+1]/=l; n[i+2]/=l; } return n; }
function mesh(pos, idx, uv){ return {p:buf(pos), n:buf(normals(pos, idx)), uv:buf(uv || new Float32Array(pos.length/3*2)), i:buf(idx, gl.ELEMENT_ARRAY_BUFFER), count:idx.length, type:idx instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT}; }
// matrizes (coluna-maior)
const mul = (a,b) => { const o = new Float32Array(16); for (let i=0;i<4;i++) for (let j=0;j<4;j++){ let s=0; for (let k=0;k<4;k++) s += a[k*4+j]*b[i*4+k]; o[i*4+j]=s; } return o; };
const persp = (f,a,n,fr) => { const t = 1/Math.tan(f/2); return new Float32Array([t/a,0,0,0, 0,t,0,0, 0,0,(fr+n)/(n-fr),-1, 0,0,2*fr*n/(n-fr),0]); };
const look = (e,c) => { const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nr=a=>{const l=Math.hypot(...a);return a.map(v=>v/l)},dt=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const z = nr(sub(e,c)), x = nr(cr([0,1,0],z)), y = cr(z,x); return new Float32Array([x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -dt(x,e),-dt(y,e),-dt(z,e),1]); };
const trs = (tx,ty,tz,yaw,s=1) => { const c = Math.cos(yaw)*s, n = Math.sin(yaw)*s; return new Float32Array([c,0,-n,0, 0,s,0,0, n,0,c,0, tx,ty,tz,1]); };
const T0 = (x,y,z) => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]);
// peças da cena: trilho (caixa), varões do teto, gancho (tubo)
function box(w,h,d){ const x=w/2,y=h/2,z=d/2; const P=[], I=[]; const f=(a,b,c,dd)=>{const k=P.length/3;P.push(...a,...b,...c,...dd);I.push(k,k+1,k+2,k,k+2,k+3);};
  f([-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]); f([x,-y,-z],[-x,-y,-z],[-x,y,-z],[x,y,-z]); f([-x,y,z],[x,y,z],[x,y,-z],[-x,y,-z]); f([-x,-y,-z],[x,-y,-z],[x,-y,z],[-x,-y,z]); f([x,-y,z],[x,-y,-z],[x,y,-z],[x,y,z]); f([-x,-y,-z],[-x,-y,z],[-x,y,z],[-x,y,-z]);
  return mesh(new Float32Array(P), new Uint16Array(I)); }
function tube(pts, r, seg = 8){ const P=[], I=[]; for (let i=0;i<pts.length;i++){ const a=pts[Math.max(0,i-1)], b=pts[Math.min(pts.length-1,i+1)]; let t=[b[0]-a[0],b[1]-a[1],b[2]-a[2]]; const l=Math.hypot(...t); t=t.map(v=>v/l);
    let u=[0,0,1]; let v=[t[1]*u[2]-t[2]*u[1],t[2]*u[0]-t[0]*u[2],t[0]*u[1]-t[1]*u[0]]; const lv=Math.hypot(...v)||1; v=v.map(q=>q/lv); u=[v[1]*t[2]-v[2]*t[1],v[2]*t[0]-v[0]*t[2],v[0]*t[1]-v[1]*t[0]];
    for (let k=0;k<seg;k++){ const ang=k/seg*Math.PI*2, c=Math.cos(ang)*r, s=Math.sin(ang)*r; P.push(pts[i][0]+u[0]*c+v[0]*s, pts[i][1]+u[1]*c+v[1]*s, pts[i][2]+u[2]*c+v[2]*s); } }
  for (let i=0;i<pts.length-1;i++) for (let k=0;k<seg;k++){ const a=i*seg+k, b=i*seg+(k+1)%seg, c=a+seg, d=b+seg; I.push(a,c,b,b,c,d); }
  return mesh(new Float32Array(P), new Uint16Array(I)); }
const HOOK = (() => { const pts=[]; for (let i=0;i<=8;i++) pts.push([0, i*0.8, 0]); for (let i=1;i<=16;i++){ const a=Math.PI*(i/16); pts.push([-1.5+1.5*Math.cos(a), 6.4+1.9*Math.sin(a), 0]); } pts.push([-3.0, 5.9, 0]); return tube(pts, .3, 8); })();
const ROD = box(0.8, 400, 0.8);

/* ---------- carregamento das camisas ---------- */
const SH = []; let layoutDone = false;
GROUPS.forEach(g => g.ids.forEach(id => SH.push({id, g, m:M[id], n:String(SH.length+1).padStart(2,'0'), ready:false, out:0, vo:0, open:0, yaw:0, spin:0, spinV:0})));
const loadTex = src => new Promise(res => { const i = new Image(); i.decoding = 'async'; i.onload = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, i); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8); res(t); }; i.onerror = () => res(null); i.src = src; });
async function loadShirt(s){ const [hdr, bin, tex] = await Promise.all([fetch(`assets/arara3d/${s.id}.json`).then(r => r.json()), fetch(`assets/arara3d/${s.id}.bin`).then(r => r.arrayBuffer()), loadTex(`assets/arara3d/${s.id}.webp`)]);
  let o = 0, mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9]; s.parts = [];
  hdr.forEach(h => { const P = new Int16Array(bin, o, h.nv*3); o += h.nv*6; const X = new Uint16Array(bin, o, h.nv*2); o += h.nv*4; const I = new Uint16Array(bin.slice(o, o + h.ni*2)); o += h.ni*2; o = (o + 3) & ~3;
    const pos = new Float32Array(h.nv*3); for (let k = 0; k < pos.length; k++){ pos[k] = P[k]/100; const d = k%3; if (pos[k] < mn[d]) mn[d] = pos[k]; if (pos[k] > mx[d]) mx[d] = pos[k]; }
    const uv = new Float32Array(h.nv*2); for (let k = 0; k < uv.length; k++) uv[k] = X[k]/65535; s.parts.push({...mesh(pos, I, uv), out:h.out}); });
  s.tex = tex; s.c = [(mn[0]+mx[0])/2, mx[1], (mn[2]+mx[2])/2]; s.ready = true; need = true; }

/* ---------- arara: posições ---------- */
const RAIL_Y = 170, SPACING = 15, GROUP_GAP = 62, SIDE = 246*D2R, OUTYAW = 208*D2R, BACKYAW = 180*D2R;
let X0 = 0, X1 = 0;
(function place(){ let x = 0; GROUPS.forEach((g, gi) => { const list = SH.filter(s => s.g === g); list.forEach((s, k) => { s.x = x + k*SPACING; });
  g.a = list[0].x - 26; g.b = list[list.length-1].x + 26; g.cx = (g.a + g.b)/2; g.rail = box(g.b - g.a, 1.1, 1.1); x = list[list.length-1].x + GROUP_GAP; });
  X0 = SH[0].x; X1 = SH[SH.length-1].x; })();

/* ---------- câmera, rolagem e foco ---------- */
let W = 1, H = 1, dpr = 1, mob = false, fov = 30*D2R, dist = 330, camX = 0, camXt = 0, focus = 0, hover = null, open = null, P = 0;
const tags = SH.map(s => { const t = document.createElement('span'); t.className = 'v-tag'; t.textContent = s.n; stage.appendChild(t); return t; });
const labels = GROUPS.map(g => { const l = document.createElement('span'); l.className = 'v-lbl'; l.innerHTML = `${g.label} <b>${g.ids.length}</b>`; stage.appendChild(l); return l; });
const pinTop = () => parseFloat(pin.style.top) || 66;
function resize(){ const head = document.querySelector('header'); const hh = head ? head.offsetHeight : 66; pin.style.top = hh + 'px'; pin.style.height = `calc(100svh - ${hh}px)`;
  W = stage.clientWidth; H = stage.clientHeight; mob = W < 820; dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr); cv.style.width = W+'px'; cv.style.height = H+'px';
  // distância para a arara caber bem: altura visível ~ 2,1x a camisa (computador) e largura mínima no celular
  const aspect = W/H; dist = mob ? Math.max(300, 95/(2*Math.tan(fov/2)*aspect)) : Math.max(300, 175/(2*Math.tan(fov/2))); scroll(true); need = true; }
function progress(){ const r = root.getBoundingClientRect(), span = root.offsetHeight - pin.offsetHeight; return clamp((pinTop() - r.top)/Math.max(1, span), 0, 1); }
function scroll(force){ const p = progress(); if (!force && Math.abs(p - P) < 1e-4) return; P = p; progBar.style.width = (p*100).toFixed(1) + '%';
  focus = X0 + (X1 - X0)*ease(p); const halfW = Math.tan(fov/2)*dist*(W/H); const span = X1 - X0 + 60;
  camXt = span < halfW*2 ? (X0 + X1)/2 : clamp(focus, X0 - 30 + halfW, X1 + 30 - halfW); need = true; }
addEventListener('scroll', () => scroll(), {passive:true});

/* ---------- desenho ---------- */
let VP = null, eye = [0,0,0], need = true, last = performance.now();
function project(x,y,z){ const v = VP; const cx = v[0]*x+v[4]*y+v[8]*z+v[12], cy = v[1]*x+v[5]*y+v[9]*z+v[13], w = v[3]*x+v[7]*y+v[11]*z+v[15]; return [(cx/w*.5+.5)*W, (1-(cy/w*.5+.5))*H, w]; }
function draw(m, Mo, opt){ gl.uniformMatrix4fv(U.Mo, false, Mo); gl.uniform1f(U.uTex, opt.tex ? 1 : 0); gl.uniform3fv(U.uCol, opt.col || [.08,.08,.08]); gl.uniform1f(U.uDim, opt.dim ?? 1); gl.uniform1f(U.uMetal, opt.metal || 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, m.p); gl.enableVertexAttribArray(A.p); gl.vertexAttribPointer(A.p, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, m.n); gl.enableVertexAttribArray(A.n); gl.vertexAttribPointer(A.n, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, m.uv); gl.enableVertexAttribArray(A.uv); gl.vertexAttribPointer(A.uv, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.i); gl.drawElements(gl.TRIANGLES, m.count, m.type, 0); }
const GOLD = [.86,.66,.26];
function frame(now){ requestAnimationFrame(frame); const dt = Math.min(.05, (now - last)/1000); last = now;
  // molas suaves
  const k = reduce ? 1 : 1 - Math.exp(-dt*7), k2 = reduce ? 1 : 1 - Math.exp(-dt*5);
  camX += (camXt - camX)*k;
  const f = hover != null ? hover : focus; let best = null, bd = 1e9; SH.forEach(s => { const d = Math.abs(s.x - f); if (d < bd){ bd = d; best = s; } });
  let moving = Math.abs(camXt - camX) > .05;
  SH.forEach(s => { const tgOut = (!open && s === best) ? 1 : 0, tgOpen = s === open ? 1 : 0;
    const o0 = s.out, p0 = s.open; s.out += (tgOut - s.out)*k2; s.open += (tgOpen - s.open)*k2;
    if (s !== open || drag == null){ s.spin += s.spinV*dt; s.spinV *= Math.pow(.04, dt); if (s !== open) s.spin += (0 - s.spin)*k2; }
    if (Math.abs(s.out - o0) > 1e-4 || Math.abs(s.open - p0) > 1e-4 || Math.abs(s.spinV) > .01 || (s !== open && Math.abs(s.spin) > 1e-3)) moving = true; });
  if (!moving && !need) return; need = false;
  gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
  eye = [camX, 128, dist]; VP = mul(persp(fov, W/H, 20, 3000), look(eye, [camX, 122, 0])); gl.uniformMatrix4fv(U.VP, false, VP); gl.uniform3fv(U.uEye, eye);
  const anyOpen = SH.some(s => s.open > .02); const dimO = 1 - .62*Math.max(...SH.map(s => s.open));
  // trilhos e varões
  GROUPS.forEach(g => { draw(g.rail, T0(g.cx, RAIL_Y, 0), {col:GOLD, metal:1, dim:dimO}); draw(ROD, T0(g.a + 6, RAIL_Y + 200, 0), {col:GOLD, metal:1, dim:dimO}); draw(ROD, T0(g.b - 6, RAIL_Y + 200, 0), {col:GOLD, metal:1, dim:dimO}); });
  // camisas: posição na arara -> para fora -> aberta no centro
  const halfW = Math.tan(fov/2)*dist*(W/H), openX = mob ? camX : camX - halfW*.32, openZ = mob ? dist*.38 : dist*.42, openY = mob ? -6 : -10;
  SH.forEach((s, i) => { if (!s.ready) return; const e = ease(clamp(s.open, 0, 1));
    const yawRack = lerp(SIDE, OUTYAW, s.out), yaw = lerp(yawRack, BACKYAW, e) + s.spin;
    const x = lerp(s.x, openX, e), y = lerp(s.out*2.5, openY, e), z = lerp(s.out*32, openZ, e);
    const Mo = mul(trs(x, y + (RAIL_Y - 8), z, yaw), T0(-s.c[0], -s.c[1], -s.c[2]));
    const dim = s === open || s.open > .02 ? 1 : dimO;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, s.tex); gl.uniform1i(U.T, 0);
    s.parts.forEach(pt => draw(pt, Mo, {tex:!pt.out, col:[.07,.07,.07], dim}));
    draw(HOOK, trs(x, y + RAIL_Y - 8, z, yaw), {col:GOLD, metal:1, dim});
    const [tx, ty] = project(x, y + RAIL_Y - 4.5, z); tags[i].style.transform = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px)`; tags[i].style.opacity = (anyOpen && s !== open) ? .15 : 1;
    s.sx = project(x, y + RAIL_Y - 45, z); });
  GROUPS.forEach((g, gi) => { const [lx, ly] = project(g.cx, RAIL_Y + 12, 0); labels[gi].style.transform = `translate(${lx.toFixed(1)}px,${ly.toFixed(1)}px) translate(-50%,-100%)`; labels[gi].style.opacity = anyOpen ? 0 : 1; });
  wall.style.transform = `translate3d(${(-camX*.25).toFixed(1)}px,0,0)`; }

/* ---------- interação ---------- */
function pick(px){ let best = null, bd = 1e9; SH.forEach(s => { if (!s.sx) return; const d = Math.abs(s.sx[0] - px); if (d < bd){ bd = d; best = s; } }); return bd < (mob ? 90 : 70) ? best : null; }
cv.addEventListener('pointermove', e => { if (open || drag != null || e.pointerType !== 'mouse') return; const r = cv.getBoundingClientRect(); const s = pick(e.clientX - r.left); hover = s ? s.x : null; cv.style.cursor = s ? 'pointer' : 'default'; });
cv.addEventListener('pointerleave', () => { hover = null; });
let drag = null, dragX = 0, dragS = 0, lastX = 0, lastT = 0, downX = 0, downT = 0;
cv.addEventListener('pointerdown', e => { downX = e.clientX; downT = performance.now(); if (!open || (open.sx && Math.abs(open.sx[0] - (e.clientX - cv.getBoundingClientRect().left)) > Math.min(W*.22, 260))) return; drag = e.pointerId; dragX = lastX = e.clientX; dragS = open.spin; lastT = downT; open.spinV = 0; try{ cv.setPointerCapture(e.pointerId) }catch(_){} $('.v-spin') && ($('.v-spin').style.opacity = 0); });
cv.addEventListener('pointermove', e => { if (drag == null || !open) return; const now = performance.now(); open.spin = dragS + (e.clientX - dragX)*.012; open.spinV = (e.clientX - lastX)*.012/Math.max(.001, (now - lastT)/1000); lastX = e.clientX; lastT = now; });
const up = e => { if (drag == null) return; drag = null; };
['pointerup','pointercancel','lostpointercapture'].forEach(ev => cv.addEventListener(ev, up));
cv.addEventListener('click', e => { if (Math.abs(e.clientX - downX) > 6 || performance.now() - downT > 400) return; const r = cv.getBoundingClientRect();
  if (!open){ const s = pick(e.clientX - r.left); if (s) openIt(s); } else if (open.sx && Math.abs(open.sx[0] - (e.clientX - r.left)) > Math.min(W*.22, 260)) closeIt(); });
function fill(s){ $('.v-grp').textContent = s.g.label; $('.v-num').textContent = s.n; $('.v-card h3').textContent = s.m.name; $('.v-sub').textContent = 'Sob encomenda · catálogo 2026'; $('.v-gola').textContent = s.m.gola; card.classList.remove('v-p'); $('[data-go]').textContent = 'Personalizar'; links(); }
function links(){ if (!open) return; const nome = $('#vNome').value.trim(), num = $('#vNum').value.replace(/\D/g,''); const q = new URLSearchParams({m:open.id}); if (nome) q.set('nome', nome); if (num) q.set('num', num); $('[data-go]').href = 'estudio3d/?' + q; }
root.querySelectorAll('.v-card input').forEach(i => i.addEventListener('input', links));
$('[data-go]').addEventListener('click', e => { if (!card.classList.contains('v-p')){ e.preventDefault(); card.classList.add('v-p'); $('[data-go]').textContent = 'Abrir no estúdio 3D'; setTimeout(() => $('#vNome').focus(), 50); } });
function openIt(s){ if (!s.ready) return; open = s; s.spin = 0; s.spinV = 0; hover = null; fill(s); root.classList.add('v-open'); cv.style.cursor = 'grab'; need = true; }
function closeIt(){ if (!open) return; open.spinV = 0; open = null; root.classList.remove('v-open'); cv.style.cursor = 'default'; need = true; }
function flip(){ if (!open) return; const t = Math.round((open.spin + Math.PI)/(Math.PI*2))*Math.PI*2 + (Math.abs(((open.spin % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI) - Math.PI) < Math.PI/2 ? 0 : Math.PI); const a = open.spin, s = open, t0 = performance.now();
  const target = Math.abs(Math.cos(a)) > .5 && Math.cos(a) > 0 ? a + Math.PI : a + (Math.PI - (((a % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI)));
  (function f(n){ const u = Math.min(1, (n - t0)/900); s.spin = a + (target - a)*ease(u); need = true; if (u < 1 && open === s) requestAnimationFrame(f); })(t0); }
function step(d){ if (!open) return; const i = (SH.indexOf(open) + d + SH.length) % SH.length; const s = SH[i]; closeIt(); setTimeout(() => openIt(s), 380); }
$('.v-card .v-x').onclick = closeIt; $('[data-flip]').onclick = flip; $('[data-p]').onclick = () => step(-1); $('[data-n]').onclick = () => step(1);
$('.v-dim').addEventListener('click', closeIt);
addEventListener('keydown', e => { if (!open) return; if (e.key === 'Escape') closeIt(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
root.querySelectorAll('.v-pills button').forEach(b => b.addEventListener('click', () => { root.querySelectorAll('.v-pills button').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
  const g = GROUPS.find(g => g.key === b.dataset.g); if (!g) return; const p = clamp((g.cx - X0)/(X1 - X0), 0, 1); let lo = 0, hi = 1; for (let k = 0; k < 24; k++){ const m = (lo+hi)/2; if (ease(m) < p) lo = m; else hi = m; }
  const span = root.offsetHeight - pin.offsetHeight, top = root.getBoundingClientRect().top + scrollY - pinTop(); scrollTo({top: top + span*lo, behavior: reduce ? 'auto' : 'smooth'}); }));
let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 100); });
resize(); requestAnimationFrame(frame);
// carrega na ordem da arara
SH.reduce((p, s) => p.then(() => loadShirt(s)), Promise.resolve()).then(() => root.classList.add('v-ready'));
window.__vest = {SH, get open(){ return open; }, openIt, closeIt, flip};
})();
