import { SECTIONS, RATING_SCALE, SETTINGS } from './schema.js?v=4';
import { saveResponse, DEMO } from './data.js?v=4';

const app = document.getElementById('app');
const progress = document.getElementById('progress');
const bar = document.getElementById('bar');
const stepLabel = document.getElementById('stepLabel');
const TOTAL = SECTIONS.length;
const THERMAL_COLORS = ['#2f6fb0', '#5c9bd1', '#9cc6e4', '#d9d4c3', '#f2b880', '#e2773a', '#c0392b'];

let answers = {};
let step = 0; // 0 intro · 1..TOTAL sections · 'done' · 'declined'

if (DEMO) document.getElementById('demoBanner').hidden = false;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const findQ = id => SECTIONS.flatMap(s => s.questions).find(q => q.id === id);

function toast(msg, err = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (err ? ' err' : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.className = 'toast' + (err ? ' err' : '')), 3200);
}

/* ---------------- rendering ---------------- */
function render() {
  if (typeof step === 'number' && step >= 1) {
    progress.hidden = false;
    bar.style.width = ((step - 1) / TOTAL * 100) + '%';
    stepLabel.textContent = `الجزء ${step} من ${TOTAL}`;
  } else {
    progress.hidden = true;
  }

  if (step === 0) app.innerHTML = introHTML();
  else if (step === 'declined') app.innerHTML = declinedHTML();
  else if (step === 'done') app.innerHTML = doneHTML();
  else app.innerHTML = sectionHTML(SECTIONS[step - 1]);

  window.scrollTo({ top: step === 0 ? 0 : document.querySelector('.hero').offsetHeight - 10, behavior: 'smooth' });
}

function introHTML() {
  return `
  <div class="card intro" style="margin-top:-30px;position:relative">
    <p>استبيان أكاديمي لمادة <b>MSAU 611</b> في جامعة عفت عن تجربة الزوار في واجهة أبحر الجديدة.</p>
    <p class="en" style="display:block">An academic survey for MSAU 611 at Effat University.</p>
    <div class="facts">
      <span class="fact">⏱ 3–4 دقائق</span>
      <span class="fact">مجهول الهوية</span>
      <span class="fact">اختياري</span>
      <span class="fact">18 سنة فأكثر</span>
    </div>
    <div class="consent">
      <div class="q-text">أوافق على المشاركة وعمري 18 سنة أو أكثر
        <span class="en">I agree to take part and I am 18 or older</span></div>
      <div class="consent-btns">
        <button class="btn btn-primary" data-act="consent-yes">نعم، أبدأ الاستبيان</button>
        <button class="btn btn-ghost" data-act="consent-no">لا</button>
      </div>
    </div>
  </div>`;
}

function declinedHTML() {
  return `
  <div class="card done" style="margin-top:-30px;position:relative">
    <h2>شكراً لوقتك</h2>
    <p class="en" style="display:block">Thank you for your time.</p>
    <p style="color:var(--muted)">انتهى الاستبيان. المشاركة متاحة فقط للبالغين الموافقين على المشاركة.</p>
    <div class="actions"><button class="btn btn-ghost" data-act="restart">رجوع للبداية</button></div>
  </div>`;
}

function doneHTML() {
  return `
  <div class="card done" style="margin-top:-30px;position:relative">
    <div class="ico"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
    <h2>شكراً لمشاركتك</h2>
    <p class="en" style="display:block">Thank you for taking part.</p>
    <p style="color:var(--muted);margin-top:10px">تم حفظ إجاباتك بنجاح.</p>
    <div class="actions">
      ${SETTINGS.showResultsAfterSubmit ? `<a class="btn btn-primary" href="results.html">عرض النتائج</a>` : ''}
      <button class="btn btn-ghost" data-act="restart">إجابة جديدة (مشارك آخر)</button>
    </div>
  </div>`;
}

function sectionHTML(sec) {
  const isLast = step === TOTAL;
  return `
  <div class="section-head">
    <h2>${esc(sec.ar)}</h2><span class="en">${esc(sec.en)}</span>
  </div>
  ${sec.questions.map(questionHTML).join('')}
  <div class="nav">
    ${step > 1 ? `<button class="btn btn-ghost" data-act="prev">السابق</button>` : ''}
    <button class="btn ${isLast ? 'btn-sun' : 'btn-primary'}" data-act="${isLast ? 'submit' : 'next'}" style="flex:1">
      ${isLast ? 'إرسال الإجابات' : 'التالي'}
    </button>
  </div>`;
}

function questionHTML(q) {
  let hint = '';
  if (q.type === 'multi') hint = q.max ? `(${q.max} كحد أقصى)` : '(أكثر من اختيار)';
  if (q.optional) hint = '(اختياري)';
  let body = '';
  let err = 'الرجاء الإجابة على هذا السؤال';

  if (q.type === 'single' || q.type === 'multi') {
    const multi = q.type === 'multi';
    const sel = answers[q.id];
    body = `<div class="opts" role="${multi ? 'group' : 'radiogroup'}">` + q.options.map(o => {
      const on = multi ? (sel || []).includes(o.v) : sel === o.v;
      return `<button type="button" class="opt ${multi ? 'multi' : ''} ${on ? 'on' : ''}" role="${multi ? 'checkbox' : 'radio'}" aria-checked="${on}" data-q="${q.id}" data-v="${esc(o.v)}">
        <span class="mark"></span><span class="txt"><span>${esc(o.ar)}</span><span class="en">${esc(o.en)}</span></span></button>`;
    }).join('') + '</div>';
  } else if (q.type === 'rating') {
    const a = answers[q.id] || {};
    err = 'الرجاء تقييم جميع البنود (يمكنك اختيار "لا أعرف")';
    body = `<div class="legend"><span>1 = سيئ جداً · Very poor</span><span>5 = ممتاز · Excellent</span></div>` +
      q.items.map(it => `
      <div class="r-item" id="ri-${it.v}">
        <div class="r-label">${esc(it.ar)}<span class="en">${esc(it.en)}</span></div>
        <div class="r-scale" role="radiogroup" aria-label="${esc(it.ar)}">
          ${RATING_SCALE.map(s => `<button type="button" class="rbtn ${a[it.v] === s.v ? 'on' : ''}" role="radio" aria-checked="${a[it.v] === s.v}" data-q="${q.id}" data-item="${it.v}" data-v="${s.v}">${s.v}</button>`).join('')}
          <button type="button" class="rbtn dk ${a[it.v] === 'dk' ? 'on' : ''}" role="radio" aria-checked="${a[it.v] === 'dk'}" data-q="${q.id}" data-item="${it.v}" data-v="dk">لا أعرف</button>
        </div>
      </div>`).join('');
  } else if (q.type === 'thermal') {
    body = `<div class="thermal" role="radiogroup">` + q.options.map((o, i) => {
      const on = answers[q.id] === o.v;
      return `<button type="button" class="tbtn ${on ? 'on' : ''}" role="radio" aria-checked="${on}" data-q="${q.id}" data-v="${o.v}">
        <span class="dot" style="background:${THERMAL_COLORS[i]}"></span>
        <span class="num">${o.v > 0 ? '+' + o.v : o.v === 0 ? '0' : '−' + Math.abs(o.v)}</span>
        <span class="lab">${esc(o.ar)}</span></button>`;
    }).join('') + '</div>';
  } else if (q.type === 'text') {
    const v = answers[q.id] || '';
    body = `<textarea data-text="${q.id}" maxlength="${q.max}" placeholder="اكتب ملاحظاتك هنا… / Write here…">${esc(v)}</textarea>
      <div class="counter"><span id="cnt-${q.id}">${v.length}</span> / ${q.max}</div>`;
  }

  return `
  <div class="card" id="card-${q.id}">
    <div class="q-title">
      <span class="q-num">${q.n}</span>
      <div class="q-text">${esc(q.ar)}${hint ? `<span class="q-hint">${hint}</span>` : ''}<span class="en">${esc(q.en)}</span></div>
    </div>
    ${body}
    <div class="err-msg">${err}</div>
  </div>`;
}

function rerenderQuestion(qid) {
  const card = document.getElementById('card-' + qid);
  if (!card) return;
  const wasMissing = card.classList.contains('missing');
  card.outerHTML = questionHTML(findQ(qid));
  if (wasMissing && !isAnswered(findQ(qid))) markMissing(findQ(qid));
}

/* ---------------- answering ---------------- */
function choose(btn) {
  const qid = btn.dataset.q;
  const q = findQ(qid);
  const v = btn.dataset.v;

  if (q.type === 'single') answers[qid] = v;
  else if (q.type === 'thermal') answers[qid] = Number(v);
  else if (q.type === 'rating') {
    answers[qid] = { ...(answers[qid] || {}), [btn.dataset.item]: v === 'dk' ? 'dk' : Number(v) };
  } else if (q.type === 'multi') {
    let arr = [...(answers[qid] || [])];
    const excl = q.exclusive || [];
    if (arr.includes(v)) arr = arr.filter(x => x !== v);
    else if (excl.includes(v)) arr = [v];
    else {
      arr = arr.filter(x => !excl.includes(x));
      if (q.max && arr.length >= q.max) {
        btn.classList.add('shake');
        setTimeout(() => btn.classList.remove('shake'), 400);
        toast(`يمكنك اختيار ${q.max} كحد أقصى`);
        return;
      }
      arr.push(v);
    }
    answers[qid] = arr;
  }
  rerenderQuestion(qid);
  const focusSel = q.type === 'rating'
    ? `[data-q="${qid}"][data-item="${btn.dataset.item}"][data-v="${v}"]`
    : `[data-q="${qid}"][data-v="${v}"]`;
  document.querySelector(focusSel)?.focus({ preventScroll: true });
}

function isAnswered(q) {
  const a = answers[q.id];
  if (q.optional) return true;
  if (q.type === 'multi') return Array.isArray(a) && a.length > 0;
  if (q.type === 'rating') return q.items.every(it => a && a[it.v] !== undefined);
  return a !== undefined && a !== '';
}

function markMissing(q) {
  const card = document.getElementById('card-' + q.id);
  card?.classList.add('missing');
  if (q.type === 'rating') {
    const a = answers[q.id] || {};
    q.items.forEach(it => document.getElementById('ri-' + it.v)?.classList.toggle('missing', a[it.v] === undefined));
  }
}

function validate(sec) {
  let first = null;
  for (const q of sec.questions) {
    document.getElementById('card-' + q.id)?.classList.remove('missing');
    if (!isAnswered(q)) {
      markMissing(q);
      if (!first) first = q;
    }
  }
  if (first) {
    let target = document.getElementById('card-' + first.id);
    if (first.type === 'rating') target = target.querySelector('.r-item.missing') || target;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('بعض الأسئلة تحتاج إجابة', true);
    return false;
  }
  return true;
}

async function submit(btn) {
  if (!validate(SECTIONS[step - 1])) return;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> جارٍ الإرسال…';
  const payload = { consent: true, lang: 'ar' };
  for (const q of SECTIONS.flatMap(s => s.questions)) {
    const a = answers[q.id];
    if (q.type === 'text') {
      const t = (a || '').trim().slice(0, q.max);
      if (t) payload[q.id] = t;
    } else if (a !== undefined) payload[q.id] = a;
  }
  try {
    await saveResponse(payload);
    step = 'done';
    render();
  } catch (e) {
    console.error(e);
    btn.disabled = false;
    btn.textContent = 'إرسال الإجابات';
    toast('تعذّر الإرسال، تأكد من الاتصال وحاول مرة أخرى', true);
  }
}

/* ---------------- events ---------------- */
app.addEventListener('click', e => {
  const opt = e.target.closest('[data-q]');
  if (opt) return choose(opt);
  const act = e.target.closest('[data-act]');
  if (!act) return;
  switch (act.dataset.act) {
    case 'consent-yes': answers = {}; step = 1; render(); break;
    case 'consent-no': step = 'declined'; render(); break;
    case 'next': if (validate(SECTIONS[step - 1])) { step++; render(); } break;
    case 'prev': step--; render(); break;
    case 'submit': submit(act); break;
    case 'restart': answers = {}; step = 0; render(); break;
  }
});

app.addEventListener('input', e => {
  const id = e.target.dataset?.text;
  if (!id) return;
  answers[id] = e.target.value;
  const c = document.getElementById('cnt-' + id);
  if (c) c.textContent = e.target.value.length;
});

window.addEventListener('beforeunload', e => {
  if (typeof step === 'number' && step >= 1) { e.preventDefault(); e.returnValue = ''; }
});

render();
