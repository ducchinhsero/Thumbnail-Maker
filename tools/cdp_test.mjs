// CDP driver: exercises the running Thumbnail Maker window end-to-end,
// including real mouse input (drag/zoom) delivered through the DevTools protocol.
import fs from 'node:fs';
import path from 'node:path';

const PORT = process.env.CDP_PORT || 9333;
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, '.build', 'shots');
const IMGDIR = path.join(ROOT, '.build', 'testimg');
fs.mkdirSync(OUT, { recursive: true });

const sleep0 = ms => new Promise(r => setTimeout(r, ms));

async function findTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const t = l.find(t => t.type === 'page' && String(t.url).includes('app.local'));
      if (t) return t;
    } catch { }
    await sleep0(500);
  }
  throw new Error('app.local target never appeared');
}
const target = await findTarget();
console.log('target:', target.url);

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws error')); });

let id = 0;
const pending = new Map();
const errors = [];
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description || ''));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(JSON.stringify(m.params.args.map(a => a.value)));
};
const send = (method, params = {}) => new Promise(res => {
  const mid = ++id; pending.set(mid, res);
  ws.send(JSON.stringify({ id: mid, method, params }));
});

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, timeout: 120000 });
  const ex = r.result && r.result.exceptionDetails;
  if (ex) throw new Error('eval: ' + ((ex.exception && ex.exception.description) || JSON.stringify(ex)));
  return r.result.result.value;
}
async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  if (!r.result?.data) throw new Error('shot failed');
  fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.result.data, 'base64'));
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function mouse(type, x, y, extra = {}) {
  await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1, pointerType: 'mouse', ...extra });
}

await send('Page.enable');
await send('Runtime.enable');

// ── reset & load ─────────────────────────────────────────────────────────
await evaluate(`(()=>{document.getElementById('btnClear').click(); window.__tf=[]; return 1;})()`);
for (const f of ['A.png', 'B.png', 'C.png', 'D.png']) {
  const b64 = fs.readFileSync(path.join(IMGDIR, f)).toString('base64');
  await evaluate(`(()=>{const b=atob(${JSON.stringify(b64)});const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);window.__tf.push(new File([u],${JSON.stringify(f)},{type:'image/png'}));return 1;})()`);
}
await evaluate(`(async()=>{window.__tm.setCount(4); window.__tm.setLayout('4-grid'); document.getElementById('btnClear').click(); await window.__tm.addFiles(window.__tf,null); return 1;})()`);
await sleep(400);
console.log('A. images loaded:', await evaluate('window.__tm.images.size'), 'cells:', await evaluate('JSON.stringify(window.__tm.state.cells.map(c=>c.imgId))'));
await shot('10-loaded');

// ── assignment persistence across layout changes ─────────────────────────
await evaluate(`window.__tm.setCount(2)`); await sleep(150);
await evaluate(`window.__tm.setCount(4)`); await sleep(150);
const restored = await evaluate('JSON.stringify(window.__tm.state.cells.map(c=>c.imgId))');
console.log('B. after 4→2→4:', restored);

// ── real drag (pan) on cell 2 after zooming in (slack on both axes) ──────
await evaluate(`(()=>{window.__tm.state.cells[1].zoom=1.6; window.__tm.render(); return 1;})()`);
await sleep(120);
const rect = await evaluate(`JSON.stringify(document.getElementById('cv').getBoundingClientRect())`)
  .then(JSON.parse);
console.log('   canvas rect:', rect.width.toFixed(0) + 'x' + rect.height.toFixed(0));
const before = await evaluate(`JSON.stringify({p:window.__tm.state.cells[1].panX, z:window.__tm.state.cells[1].zoom})`).then(JSON.parse);

const cx = rect.x + rect.width * 0.75;   // cell 2 = top-right quadrant
const cy = rect.y + rect.height * 0.25;
await mouse('mousePressed', cx, cy, { buttons: 1 });
await mouse('mouseMoved', cx - 40, cy + 18, { buttons: 1 });
await mouse('mouseMoved', cx - 80, cy + 30, { buttons: 1 });
await mouse('mouseReleased', cx - 80, cy + 30, { buttons: 0 });
await sleep(150);
const afterDrag = await evaluate(`JSON.stringify({p:window.__tm.state.cells[1].panX, y:window.__tm.state.cells[1].panY, sel:window.__tm.state.sel})`).then(JSON.parse);
console.log(`C. drag pan cell2: panX ${before.p.toFixed(3)} → ${afterDrag.p.toFixed(3)}, panY ${afterDrag.y.toFixed(3)}, sel=${afterDrag.sel}`);
console.log('   pan applied:', Math.abs(afterDrag.p - before.p) > 0.01 ? 'OK' : 'FAIL');
await shot('11-panned');

// ── real wheel zoom on cell 1 ────────────────────────────────────────────
const cx1 = rect.x + rect.width * 0.25;
const cy1 = rect.y + rect.height * 0.25;
await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: cx1, y: cy1, deltaX: 0, deltaY: -240, pointerType: 'mouse' });
await sleep(200);
const afterWheel = await evaluate(`JSON.stringify({z:window.__tm.state.cells[0].zoom, sel:window.__tm.state.sel})`).then(JSON.parse);
console.log(`D. wheel zoom: 1.000 → ${afterWheel.z.toFixed(3)}`, afterWheel.z > 1.05 ? 'OK' : 'FAIL');
await shot('12-zoomed');

// ── click empty cell 3 → should select it ────────────────────────────────
await evaluate(`(()=>{const s=window.__tm.state; s.cells[2].imgId=null; s.cells[3].imgId=null; window.__tm.render(); return 1;})()`);
await mouse('mousePressed', rect.x + rect.width * 0.25, rect.y + rect.height * 0.75, { buttons: 1 });
await mouse('mouseReleased', rect.x + rect.width * 0.25, rect.y + rect.height * 0.75, { buttons: 0 });
await sleep(120);
const selEmpty = await evaluate('window.__tm.state.sel');
console.log('E. select empty cell 3 → sel =', selEmpty, selEmpty === 2 ? 'OK' : 'FAIL');
await shot('13-emptycell');

// ── reset framing + layout sweep ─────────────────────────────────────────
await evaluate(`window.__tm.setCount(4); window.__tm.setLayout('4-grid'); window.__tm.state.cells.forEach((c,i)=>{c.zoom=1;c.panX=0;c.panY=0;}); window.__tm.render()`);
await sleep(200);
await shot('14-grid');

for (const [lid, name] of [['4-hero-l', '15-4herol'], ['4-hero-t', '16-4herot'], ['3-hero-r', '17-3heror'], ['2-hero-l', '18-2herol']]) {
  await evaluate(`window.__tm.setLayout(${JSON.stringify(lid)})`);
  await sleep(250);
  await shot(name);
}

// ── native "Thêm ảnh" dialog path (real files from disk) ─────────────────
await evaluate(`(()=>{document.getElementById('btnClear').click(); return 1;})()`);
const doc = await send('DOM.getDocument', { depth: -1 });
const node = await send('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: '#fileInput' });
await send('DOM.setFileInputFiles', {
  nodeId: node.result.nodeId,
  files: ['E.png', 'F.png'].map(f => path.join(IMGDIR, f))
});
await sleep(1200);
const afterInput = await evaluate('window.__tm.images.size');
console.log('H. file input import:', afterInput, afterInput === 2 ? 'OK' : 'FAIL (got ' + afterInput + ')');
await shot('20-inputimport');

// ── export all three formats ─────────────────────────────────────────────
await evaluate(`(async()=>{document.getElementById('btnClear').click(); window.__tf=[];})()`);
for (const f of ['A.png', 'B.png', 'C.png', 'D.png']) {
  const b64 = fs.readFileSync(path.join(IMGDIR, f)).toString('base64');
  await evaluate(`(()=>{const b=atob(${JSON.stringify(b64)});const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);window.__tf.push(new File([u],${JSON.stringify(f)},{type:'image/png'}));return 1;})()`);
}
await evaluate(`(async()=>{await window.__tm.addFiles(window.__tf,null);return 1;})()`);
await sleep(400);
await evaluate(`window.__tm.setCount(4); window.__tm.setLayout('4-grid')`);
await sleep(200);
for (const [fmt, w, h, ext] of [['png', 1280, 720, 'png'], ['jpg', 1920, 1080, 'jpg'], ['webp', 1200, 630, 'webp']]) {
  const p = path.join(OUT, `x-${fmt}.${ext}`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
  const t0 = Date.now();
  await evaluate(`(async()=>{const s=window.__tm.state; s.format=${JSON.stringify(fmt)}; s.quality=92; window.__tm.setSize(${w},${h}); await window.__tm.exportTo(${JSON.stringify(p)}); return 1;})()`);
  await sleep(900);
  console.log(`F. export ${fmt} ${w}x${h}:`, fs.existsSync(p) ? `${(fs.statSync(p).size / 1024).toFixed(0)}KB in ${Date.now() - t0}ms OK` : 'MISSING');
}

// ── perf: 60 consecutive renders of the preview ──────────────────────────
const perf = await evaluate(`(()=>{
  const t0=performance.now();
  for(let i=0;i<60;i++){ window.__tm.state.cells[0].zoom = 1 + (i%10)*0.05; }
  window.__tm.render();
  return new Promise(r=>requestAnimationFrame(()=>r(performance.now()-t0)));
})()`);
const perf2 = await evaluate(`(async()=>{
  const t0=performance.now();
  for(let i=0;i<30;i++){
    window.__tm.state.cells[0].zoom = 1.2 + i*0.02;
    window.__tm.render();
    await new Promise(r=>requestAnimationFrame(r));
  }
  return (performance.now()-t0)/30;
})()`);
console.log(`G. render cost ≈ ${perf2.toFixed(2)} ms/frame (budget 16.7)`);

await evaluate(`window.__tm.setSize(1280,720); window.__tm.state.cells.forEach(c=>{c.zoom=1;c.panX=0;c.panY=0;}); window.__tm.render()`);
await sleep(250);
await shot('19-final');

console.log('errors:', errors.length ? errors.slice(0, 5) : 'none');
ws.close();
