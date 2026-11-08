// طبقة البيانات: Firestore عند ربط Firebase، وإلا وضع تجريبي على الجهاز
import { firebaseConfig } from './firebase-config.js?v=4';
import { ALL_Q } from './schema.js?v=4';

export const DEMO = !firebaseConfig?.apiKey || /PASTE|YOUR_/i.test(firebaseConfig.apiKey);
export const COLLECTION = 'responses';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const LS_KEY = 'obhur_demo_responses';
let ctx = null;

async function fb() {
  if (ctx) return ctx;
  const [{ initializeApp }, fs] = await Promise.all([
    import(SDK + 'firebase-app.js'),
    import(SDK + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(firebaseConfig);
  ctx = { db: fs.getFirestore(app), fs };
  return ctx;
}

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
}

export async function saveResponse(data) {
  if (DEMO) {
    const list = readLocal();
    list.push({ ...data, id: 'local-' + Date.now(), createdAt: Date.now() });
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
    await new Promise(r => setTimeout(r, 400));
    return;
  }
  const { db, fs } = await fb();
  await fs.addDoc(fs.collection(db, COLLECTION), { ...data, createdAt: fs.serverTimestamp() });
}

export async function subscribeResponses(onData, onError) {
  if (DEMO) {
    const emit = () => {
      const local = readLocal();
      const all = [...local, ...sample()].sort((a, b) => b.createdAt - a.createdAt);
      onData(all);
    };
    emit();
    window.addEventListener('storage', e => { if (e.key === LS_KEY) emit(); });
    return () => {};
  }
  const { db, fs } = await fb();
  const q = fs.query(fs.collection(db, COLLECTION), fs.orderBy('createdAt', 'desc'));
  return fs.onSnapshot(q, snap => {
    onData(snap.docs.map(d => {
      const x = d.data();
      return { ...x, id: d.id, createdAt: x.createdAt?.toMillis ? x.createdAt.toMillis() : Date.now() };
    }));
  }, onError);
}

// بيانات تجريبية ثابتة لمعاينة لوحة التجميع قبل ربط Firebase
let _sample;
function sample() {
  if (_sample) return _sample;
  let s = 611;
  const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const weak = new Set(['r2', 'r3', 'r8', 'r11']);
  const notes = ['نحتاج مظلات أكثر قرب الممشى', 'الإضاءة ممتازة بالليل', 'نتمنى دورات مياه أكثر', 'مكان جميل للعائلات', 'زحمة المواقف نهاية الأسبوع', 'العصر حار جداً بدون ظل'];
  const out = [];
  const now = Date.now();
  for (let i = 0; i < 48; i++) {
    const r = { id: 'demo-' + i, demo: true, consent: true, createdAt: now - Math.floor(rnd() * 12) * 864e5 - Math.floor(rnd() * 864e5) };
    for (const q of ALL_Q) {
      if (q.type === 'single') r[q.id] = pick(q.options).v;
      else if (q.type === 'multi') {
        const opts = q.options.filter(x => !(q.exclusive || []).includes(x.v));
        const k = 1 + Math.floor(rnd() * 3);
        const set = new Set();
        while (set.size < k) set.add(pick(opts).v);
        r[q.id] = [...set];
      } else if (q.type === 'rating') {
        r[q.id] = {};
        for (const it of q.items) {
          r[q.id][it.v] = rnd() < 0.07 ? 'dk' : Math.max(1, Math.min(5, Math.round(2.3 + rnd() * 2.8 - (weak.has(it.v) ? 1.1 : 0))));
        }
      } else if (q.type === 'thermal') r[q.id] = Math.max(-3, Math.min(3, Math.round(rnd() * 3.5 - 0.6)));
      else if (q.type === 'text' && rnd() < 0.25) r[q.id] = pick(notes);
    }
    if (r.q12 === 'sun') r.q11 = Math.min(3, r.q11 + 1);
    if (r.q12 === 'cafe') r.q11 = Math.max(-3, r.q11 - 1);
    out.push(r);
  }
  return (_sample = out);
}
