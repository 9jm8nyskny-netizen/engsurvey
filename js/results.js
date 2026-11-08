import { SECTIONS, ALL_Q, Q, RATING_ITEMS, THERMAL, optLabel } from './schema.js';
import { subscribeResponses, DEMO } from './data.js';

const dash = document.getElementById('dash');
const filtersEl = document.getElementById('filters');
const RCOL = ['var(--r1)', 'var(--r2)', 'var(--r3)', 'var(--r4)', 'var(--r5)'];
const TCOL = ['#2f6fb0', '#5c9bd1', '#9cc6e4', '#c9c2ad', '#f2b880', '#e2773a', '#c0392b'];
const FILTER_QS = ['q15', 'q16', 'q17', 'q1'];
const surveyUrl = new URL('index.html', location.href).href;

let all = [];
const filters = Object.fromEntries(FILTER_QS.map(k => [k, '']));

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
const fmt1 = n => (n == null || isNaN(n) ? '—' : (Math.round(n * 10) / 10).toFixed(1));
const signed = n => (n == null || isNaN(n) ? '—' : (n > 0 ? '+' : n < 0 ? '−' : '') + fmt1(Math.abs(n)));

function toast(msg, err = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (err ? ' err' : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.className = 'toast'), 2600);
}

if (DEMO) {
  document.getElementById('demoBanner').hidden = false;
  document.getElementById('modeBadge').textContent = 'وضع تجريبي';
}

/* ---------------- filters ---------------- */
function renderFilters() {
  filtersEl.innerHTML = FILTER_QS.map(k => `
    <label>${esc(Q[k].ar)}
      <select data-f="${k}">
        <option value="">الكل</option>
        ${Q[k].options.map(o => `<option value="${esc(o.v)}" ${filters[k] === o.v ? 'selected' : ''}>${esc(o.ar)}</option>`).join('')}
      </select>
    </label>`).join('') + `<button class="reset" id="resetF">مسح الفلاتر</button>`;
}
filtersEl.addEventListener('change', e => {
  const k = e.target.dataset.f;
  if (!k) return;
  filters[k] = e.target.value;
  render();
});
filtersEl.addEventListener('click', e => {
  if (e.target.id !== 'resetF') return;
  FILTER_QS.forEach(k => (filters[k] = ''));
  renderFilters();
  render();
});

const filtered = () => all.filter(r => FILTER_QS.every(k => !filters[k] || r[k] === filters[k]));

/* ---------------- stats helpers ---------------- */
function countSingle(rows, q) {
  const answered = rows.filter(r => r[q.id] !== undefined && r[q.id] !== null && r[q.id] !== '');
  return { n: answered.length, counts: q.options.map(o => answered.filter(r => String(r[q.id]) === String(o.v)).length) };
}
function countMulti(rows, q) {
  const answered = rows.filter(r => Array.isArray(r[q.id]) && r[q.id].length);
  return { n: answered.length, counts: q.options.map(o => answered.filter(r => r[q.id].includes(o.v)).length) };
}
function ratingStats(rows, itemId) {
  const dist = [0, 0, 0, 0, 0];
  let dk = 0, sum = 0, n = 0;
  for (const r of rows) {
    const v = r.q9?.[itemId];
    if (v === 'dk') dk++;
    else if (typeof v === 'number' && v >= 1 && v <= 5) { dist[v - 1]++; sum += v; n++; }
  }
  return { dist, dk, n, mean: n ? sum / n : null };
}
function meanOf(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null; }
function ratingColor(m) {
  if (m == null) return 'var(--muted)';
  if (m < 2.2) return '#c8553d';
  if (m < 3) return '#d98a4e';
  if (m < 3.6) return '#a8925a';
  if (m < 4.2) return '#4f9f92';
  return '#2f8a7e';
}

/* ---------------- panels ---------------- */
function barsPanel(rows, q, { span = false } = {}) {
  const multi = q.type === 'multi';
  const { n, counts } = multi ? countMulti(rows, q) : countSingle(rows, q);
  const max = Math.max(1, ...counts);
  const order = q.options.map((o, i) => ({ o, c: counts[i] }));
  if (multi || q.id === 'q10') order.sort((a, b) => b.c - a.c);
  const topC = Math.max(...counts);
  return `
  <div class="panel ${span ? 'span-all' : ''}">
    <h3><span class="qn">س${q.n}</span>${esc(q.ar)}</h3>
    <div class="meta">${n} مجيب${multi ? ' · النسبة من المجيبين (أكثر من اختيار)' : ''}</div>
    ${n ? order.map(({ o, c }) => `
      <div class="row ${c === topC && c > 0 ? 'top' : ''}">
        <span class="lbl">${esc(o.ar)}</span>
        <span class="bar"><i style="width:${(c / max) * 100}%"></i></span>
        <span class="num"><b>${pct(c, n)}%</b> · ${c}</span>
      </div>`).join('') : '<div class="empty">لا توجد إجابات بعد</div>'}
  </div>`;
}

function ratingsPanel(rows) {
  const stats = RATING_ITEMS.map(it => ({ it, ...ratingStats(rows, it.v) }));
  const ranked = stats.filter(s => s.mean != null).sort((a, b) => a.mean - b.mean);
  const weakest = new Set(ranked.slice(0, 3).map(s => s.it.v));
  return `
  <div class="panel span-all">
    <h3><span class="qn">س9</span>التقييم من 1 إلى 5</h3>
    <div class="meta">متوسط كل بند (بدون "لا أعرف") وتوزيع الدرجات · أضعف 3 بنود معلّمة</div>
    <div class="rlegend">${['1 سيئ جداً', '2', '3', '4', '5 ممتاز'].map((l, i) => `<span><i style="background:${RCOL[i]}"></i>${l}</span>`).join('')}</div>
    ${stats.map(s => {
      const tot = s.n || 1;
      return `
      <div class="rrow">
        <div>${esc(s.it.ar)}${weakest.has(s.it.v) ? '<span class="weak-tag">يحتاج تحسين</span>' : ''}
          <div class="sub">${s.n} تقييم${s.dk ? ` · ${s.dk} لا أعرف` : ''}</div></div>
        <div class="stackwrap"><div class="stack" title="${s.dist.map((c, i) => `${i + 1}: ${c}`).join(' · ')}">
          ${s.dist.map((c, i) => `<span style="width:${(c / tot) * 100}%;background:${RCOL[i]}"></span>`).join('')}
        </div></div>
        <div class="mean" style="background:${ratingColor(s.mean)}">${fmt1(s.mean)}</div>
      </div>`;
    }).join('')}
  </div>`;
}

function thermalPanel(rows) {
  const vals = rows.map(r => r.q11).filter(v => typeof v === 'number');
  const counts = THERMAL.map(t => vals.filter(v => v === t.v).length);
  const max = Math.max(1, ...counts);
  const m = meanOf(vals);
  return `
  <div class="panel">
    <h3><span class="qn">س11</span>الإحساس الحراري الآن</h3>
    <div class="meta">${vals.length} مجيب · المتوسط <b style="color:var(--ink)">${signed(m)}</b> على مقياس −3 إلى +3</div>
    <div class="cols">${counts.map((c, i) => `
      <div class="col"><span class="c">${c}</span><i style="height:${(c / max) * 100}%;background:${TCOL[i]}"></i></div>`).join('')}
    </div>
    <div class="col-lbls">${THERMAL.map(t => `<span>${t.v > 0 ? '+' + t.v : t.v === 0 ? '0' : '−' + Math.abs(t.v)}<br>${esc(t.ar)}</span>`).join('')}</div>
  </div>`;
}

function thermalByLocation(rows) {
  const items = Q.q12.options.map(o => {
    const vals = rows.filter(r => r.q12 === o.v && typeof r.q11 === 'number').map(r => r.q11);
    return { o, n: vals.length, m: meanOf(vals) };
  });
  return `
  <div class="panel">
    <h3>الإحساس الحراري حسب المكان</h3>
    <div class="meta">س11 × س12 · متوسط الإحساس الحراري لكل موقع</div>
    ${items.map(({ o, n, m }) => {
      let bar = '';
      if (m != null) {
        const w = (Math.abs(m) / 3) * 50;
        const color = m > 0 ? '#e2773a' : '#5c9bd1';
        bar = m >= 0 ? `<i style="left:50%;width:${w}%;background:${color}"></i>` : `<i style="right:50%;width:${w}%;background:${color}"></i>`;
      }
      return `
      <div class="div-row">
        <span>${esc(o.ar)}<div class="sub" style="font-size:11.5px;color:var(--muted)">${n} مجيب</div></span>
        <div class="div-track">${bar}</div>
        <b style="text-align:center;font-variant-numeric:tabular-nums">${signed(m)}</b>
      </div>`;
    }).join('')}
    <div class="div-row" style="padding-top:0"><span></span><div class="div-axis"><span>−3 بارد</span><span>0</span><span>+3 حار</span></div><span></span></div>
  </div>`;
}

function dailyPanel(rows) {
  const days = 14;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (days - 1 - i));
    return { d, c: 0 };
  });
  for (const r of rows) {
    const d = new Date(r.createdAt); d.setHours(0, 0, 0, 0);
    const idx = Math.round((d - buckets[0].d) / 864e5);
    if (idx >= 0 && idx < days) buckets[idx].c++;
  }
  const max = Math.max(1, ...buckets.map(b => b.c));
  return `
  <div class="panel span-all">
    <h3>الردود اليومية</h3>
    <div class="meta">آخر 14 يوماً</div>
    <div class="days">${buckets.map(b => `
      <div class="d"><b>${b.c || ''}</b><i style="height:${(b.c / max) * 80}%"></i><span>${b.d.getDate()}/${b.d.getMonth() + 1}</span></div>`).join('')}
    </div>
  </div>`;
}

function commentsPanel(rows) {
  const list = rows.filter(r => r.q18 && String(r.q18).trim());
  return `
  <div class="panel span-all">
    <h3><span class="qn">س18</span>الملاحظات والاقتراحات</h3>
    <div class="meta">${list.length} ملاحظة</div>
    <div class="comments">
      ${list.length ? list.map(r => `
        <div class="cmt">${esc(r.q18)}
          <div class="m">${new Date(r.createdAt).toLocaleString('ar-SA-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' })}
          ${r.q15 ? ' · ' + esc(optLabel('q15', r.q15)) : ''}${r.q16 ? ' · ' + esc(optLabel('q16', r.q16)) : ''}${r.q12 ? ' · ' + esc(optLabel('q12', r.q12)) : ''}</div>
        </div>`).join('') : '<div class="empty">لا توجد ملاحظات</div>'}
    </div>
  </div>`;
}

/* ---------------- main render ---------------- */
function render() {
  const rows = filtered();
  const active = FILTER_QS.filter(k => filters[k]).length;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayCount = rows.filter(r => r.createdAt >= today.getTime()).length;
  const tVals = rows.map(r => r.q11).filter(v => typeof v === 'number');
  const tMean = meanOf(tVals);
  const tLabel = tMean == null ? '' : THERMAL.reduce((a, b) => (Math.abs(b.v - tMean) < Math.abs(a.v - tMean) ? b : a)).ar;
  const q13 = countSingle(rows, Q.q13);
  const allRatings = rows.flatMap(r => Object.values(r.q9 || {}).filter(v => typeof v === 'number'));
  const rMean = meanOf(allRatings);

  if (!all.length) {
    dash.innerHTML = `<div class="state"><h3 style="color:var(--ink)">لا توجد ردود بعد</h3>
      شارك رابط الاستبيان وستظهر الردود هنا مباشرة.</div>`;
    return;
  }

  dash.innerHTML = `
    ${active ? `<div class="fnote">الفلاتر مفعّلة: يتم عرض ${rows.length} من ${all.length} رد</div>` : ''}
    <div class="kpis">
      <div class="kpi"><div class="k">إجمالي الردود</div><div class="v">${rows.length}</div><div class="s">${todayCount} اليوم</div></div>
      <div class="kpi"><div class="k">متوسط التقييم العام</div><div class="v" style="color:${ratingColor(rMean)}">${fmt1(rMean)}<small style="font-size:16px;color:var(--muted)"> / 5</small></div><div class="s">لكل البنود الـ14</div></div>
      <div class="kpi"><div class="k">الإحساس الحراري</div><div class="v">${signed(tMean)}</div><div class="s">${tLabel || '—'}</div></div>
      <div class="kpi"><div class="k">سيبقون أطول مع ظل أكثر</div><div class="v" style="color:var(--sea)">${pct(q13.counts[0], q13.n)}%</div><div class="s">نعم · و${pct(q13.counts[1], q13.n)}% ربما</div></div>
    </div>

    <div class="grid">${dailyPanel(rows)}</div>

    <h2 class="sec-title">أ. الزيارة <span class="en">Your visit</span></h2>
    <div class="grid">${SECTIONS[0].questions.map(q => barsPanel(rows, q)).join('')}</div>

    <h2 class="sec-title">ب. التقييم <span class="en">Your rating</span></h2>
    <div class="grid">${ratingsPanel(rows)}${barsPanel(rows, Q.q10, { span: true })}</div>

    <h2 class="sec-title">ج. أثناء الزيارة <span class="en">Right now</span></h2>
    <div class="grid">${thermalPanel(rows)}${thermalByLocation(rows)}${['q12', 'q13', 'q14'].map(id => barsPanel(rows, Q[id])).join('')}</div>

    <h2 class="sec-title">د. عن المشاركين <span class="en">About you</span></h2>
    <div class="grid">${['q15', 'q16', 'q17'].map(id => barsPanel(rows, Q[id])).join('')}${commentsPanel(rows)}</div>
  `;
}

/* ---------------- CSV export (Excel / SPSS friendly) ---------------- */
function exportCSV() {
  const rows = filtered();
  const headers = ['id', 'date'];
  const getters = [r => r.id, r => new Date(r.createdAt).toISOString()];
  for (const q of ALL_Q) {
    if (q.type === 'single') { headers.push(q.id); getters.push(r => (r[q.id] != null ? optLabel(q.id, r[q.id]) : '')); }
    else if (q.type === 'multi') q.options.forEach(o => { headers.push(`${q.id}_${o.v}`); getters.push(r => (Array.isArray(r[q.id]) ? (r[q.id].includes(o.v) ? 1 : 0) : '')); });
    else if (q.type === 'rating') q.items.forEach(it => { headers.push(`q9_${it.v}`); getters.push(r => { const v = r.q9?.[it.v]; return typeof v === 'number' ? v : ''; }); });
    else if (q.type === 'thermal') { headers.push(q.id); getters.push(r => (typeof r[q.id] === 'number' ? r[q.id] : '')); }
    else if (q.type === 'text') { headers.push(q.id); getters.push(r => r[q.id] || ''); }
  }
  const cell = v => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [headers.join(','), ...rows.map(r => getters.map(g => cell(g(r))).join(','))].join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `obhur-survey-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`تم تصدير ${rows.length} رد`);
}

/* ---------------- link + QR ---------------- */
document.getElementById('copyLink').onclick = async () => {
  try { await navigator.clipboard.writeText(surveyUrl); toast('تم نسخ رابط الاستبيان'); }
  catch { prompt('انسخ الرابط:', surveyUrl); }
};
document.getElementById('csvBtn').onclick = exportCSV;

const modal = document.getElementById('qrModal');
document.getElementById('qrBtn').onclick = () => {
  const box = document.getElementById('qrBox');
  box.innerHTML = '';
  document.getElementById('qrUrl').textContent = surveyUrl;
  if (window.QRCode) new window.QRCode(box, { text: surveyUrl, width: 480, height: 480, correctLevel: window.QRCode.CorrectLevel.M });
  else box.textContent = 'تعذّر تحميل مولّد QR';
  modal.classList.add('open');
};
document.getElementById('qrClose').onclick = () => modal.classList.remove('open');
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('open'); });
document.getElementById('qrDl').onclick = () => {
  const c = document.querySelector('#qrBox canvas');
  if (!c) return;
  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = 'obhur-survey-qr.png';
  a.click();
};

/* ---------------- start ---------------- */
renderFilters();
subscribeResponses(rows => { all = rows; render(); }, err => {
  console.error(err);
  dash.innerHTML = `<div class="state"><h3 style="color:var(--danger)">تعذّر قراءة الردود</h3>
    تأكد من إعدادات Firebase وقواعد Firestore (firestore.rules).<br><small dir="ltr">${esc(err?.code || err?.message || '')}</small></div>`;
}).catch(err => {
  console.error(err);
  dash.innerHTML = `<div class="state"><h3 style="color:var(--danger)">تعذّر الاتصال بـ Firebase</h3><small dir="ltr">${esc(err?.message || '')}</small></div>`;
});
