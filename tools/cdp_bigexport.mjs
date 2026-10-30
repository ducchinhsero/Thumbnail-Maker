// Worst-case 4K export test: 20 MB noise PNG → 3840x2160 canvas → exe writes file.
import fs from 'node:fs';
import path from 'node:path';

const PORT = 9333;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let target = null;
for (let i = 0; i < 40 && !target; i++) {
  try {
    const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    target = l.find(x => x.type === 'page' && String(x.url).includes('app.local'));
  } catch { }
  if (!target) await sleep(400);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => { ws.onopen = r; });
let id = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise(res => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params })); });
async function ev(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, timeout: 300000 });
  if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval error');
  return r.result.result.value;
}
await send('Runtime.enable');

const b64 = fs.readFileSync('.build/testimg/NOISE.png').toString('base64');
console.log('staging noise png:', (b64.length / 1048576).toFixed(1), 'MB as base64');
await ev(`(()=>{document.getElementById('btnClear').click();window.__tf=[];return 1;})()`);
await ev(`(()=>{const b=atob(${JSON.stringify(b64)});const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);window.__tf.push(new File([u],'NOISE.png',{type:'image/png'}));return 1;})()`);

const t0 = Date.now();
await ev(`(async()=>{await window.__tm.addFiles(window.__tf,null);return 1;})()`);
console.log('decode + load:', Date.now() - t0, 'ms; stored size =', await ev(`(()=>{const i=[...window.__tm.images.values()][0];return i.w+'x'+i.h})()`));

const out = path.resolve('.build/shots/big-4k.png');
if (fs.existsSync(out)) fs.unlinkSync(out);
const t1 = Date.now();
await ev(`(async()=>{const s=window.__tm.state;s.format='png';window.__tm.setSize(3840,2160);s.radius=0;s.gap=0;await window.__tm.exportTo(${JSON.stringify(out)});return 1;})()`);
for (let i = 0; i < 90 && !fs.existsSync(out); i++) await sleep(200);
await sleep(500);
console.log('4K PNG export:', fs.existsSync(out) ? `${(fs.statSync(out).size / 1048576).toFixed(1)} MB in ${Date.now() - t1} ms OK` : 'MISSING (bridge failed?)');

// memory after the heavy run
const mem = await ev(`(()=>{const m=performance.memory;return m?{used:(m.usedJSHeapSize/1048576).toFixed(1)}:null})()`);
console.log('JS heap:', mem ? mem.used + ' MB' : 'n/a');
ws.close();
