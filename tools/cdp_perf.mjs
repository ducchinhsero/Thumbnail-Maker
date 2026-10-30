// Perf + responsiveness probe against the running app.
import fs from 'node:fs';
import path from 'node:path';

const PORT = 9333;
const ROOT = path.resolve(import.meta.dirname, '..');
const IMGDIR = path.join(ROOT, '.build', 'testimg');

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function findTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const t = l.find(x => x.type === 'page' && String(x.url).includes('app.local'));
      if (t) return t;
    } catch { }
    await sleep(400);
  }
  throw new Error('no target');
}
const target = await findTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise(res => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, timeout: 180000 });
  if (r.result?.exceptionDetails) throw new Error('eval: ' + (r.result.exceptionDetails.exception?.description || ''));
  return r.result.result.value;
}
await send('Runtime.enable');

// ── live render cost ─────────────────────────────────────────────────────
const cost = await evaluate(`(()=>{const a=[];for(let i=0;i<40;i++){window.__tm.state.cells[0].zoom=1+(i%7)*0.03;a.push(window.__tm.renderSync());}a.sort((x,y)=>x-y);return {med:+a[20].toFixed(2),p95:+a[38].toFixed(2),max:+a[39].toFixed(2)};})()`);
console.log(`render (${await evaluate('document.getElementById("cv").width')}x${await evaluate('document.getElementById("cv").height')} backing): median ${cost.med}ms  p95 ${cost.p95}ms  max ${cost.max}ms`);

// ── decode 24MP image ────────────────────────────────────────────────────
await evaluate(`(()=>{document.getElementById('btnClear').click(); window.__tf=[]; return 1;})()`);
const big = fs.readFileSync(path.join(IMGDIR, 'BIG.png')).toString('base64');
await evaluate(`(()=>{const b=atob(${JSON.stringify(big)});const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);window.__tf.push(new File([u],'BIG.png',{type:'image/png'}));return 1;})()`);
const t0 = await evaluate(`performance.now()`);
await evaluate(`(async()=>{await window.__tm.addFiles(window.__tf,null);return 1;})()`);
const dt = await evaluate(`performance.now()`) - t0;
const info = await evaluate(`(()=>{const i=[...window.__tm.images.values()][0]; return i.w+'x'+i.h;})()`);
console.log(`decode 6000x4000 PNG → stored ${info} in ${dt.toFixed(0)}ms`);

// ── export timing at 1920x1080 with the big source ───────────────────────
const p = path.join(ROOT, '.build', 'shots', 'big-export.png');
if (fs.existsSync(p)) fs.unlinkSync(p);
const t1 = Date.now();
await evaluate(`(async()=>{const s=window.__tm.state;s.format='png';window.__tm.setSize(1920,1080);await window.__tm.exportTo(${JSON.stringify(p)});return 1;})()`);
for (let i = 0; i < 40 && !fs.existsSync(p); i++) await sleep(100);
console.log(`export 1920x1080 PNG from 24MP source: ${fs.existsSync(p) ? (fs.statSync(p).size / 1024).toFixed(0) + 'KB in ' + (Date.now() - t1) + 'ms' : 'MISSING'}`);

// ── memory footprint ────────────────────────────────────────────────────
const mem = await evaluate(`(()=>{const m=performance.memory;return m?{used:(m.usedJSHeapSize/1048576).toFixed(1),limit:(m.jsHeapSizeLimit/1048576).toFixed(0)}:null;})()`);
console.log('JS heap:', mem ? `${mem.used} MB / limit ${mem.limit} MB` : 'n/a');

console.log('images:', await evaluate('window.__tm.images.size'));
ws.close();
