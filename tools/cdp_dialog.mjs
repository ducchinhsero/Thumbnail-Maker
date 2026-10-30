// Clicks "Xuất & lưu ảnh" for real → native Save As dialog appears → we cancel it → app must stay alive.
import fs from 'node:fs';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const PORT = 9333;
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
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, timeout: 60000 });
  if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'err');
  return r.result.result.value;
}

// make sure at least one image is present
const n = await ev('window.__tm.images.size');
if (!n) {
  console.log('no images loaded — loading one');
  await ev(`(async()=>{const c=document.createElement('canvas');c.width=800;c.height=600;const g=c.getContext('2d');g.fillStyle='#3355ff';g.fillRect(0,0,800,600);const b=await new Promise(r=>c.toBlob(r,'image/png'));await window.__tm.addFiles([new File([b],'gen.png',{type:'image/png'})],null);return 1;})()`);
}
await sleep(300);

console.log('clicking export (dialog should open)…');
ev(`document.getElementById('btnExport2').click()`).catch(() => { });

await sleep(2500);
ws.close();

// report window/dialog state
const procs = await import('node:child_process');
const out = procs.execSync(`powershell -NoProfile -Command "Get-Process ThumbnailMaker | Select-Object -ExpandProperty Responding"`).toString().trim();
console.log('app responding:', out);
console.log('log tail:');
try {
  const log = fs.readFileSync(process.env.LOCALAPPDATA + '\\ThumbnailMaker\\app.log', 'utf8').split(/\r?\n/).slice(-6).join('\n');
  console.log(log);
} catch (e) { console.log('(no log)'); }
