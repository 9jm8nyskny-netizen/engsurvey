import { SECTIONS, ALL_Q, Q, RATING_ITEMS, THERMAL, optLabel } from './schema.js?v=10';
import { subscribeResponses, DEMO, onAdminChange, adminSignIn, adminSignOut, deleteResponses } from './data.js?v=10';

const dash = document.getElementById('dash');
const filtersEl = document.getElementById('filters');
const RCOL = ['var(--r1)', 'var(--r2)', 'var(--r3)', 'var(--r4)', 'var(--r5)'];
const TCOL = ['#2f6fb0', '#5c9bd1', '#9cc6e4', '#c9c2ad', '#f2b880', '#e2773a', '#c0392b'];
const FILTER_QS = ['q15', 'q16', 'q17', 'q1'];
const surveyUrl = new URL('./', location.href).href;

let all = [];
let admin = null;           // { email, admin }
const selected = new Set();
let showAll = false;
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

    <h2 class="sec-title">سجل الردود <span class="en">All responses</span></h2>
    <div class="grid">${recordsPanel(rows)}</div>
  `;
}


/* ---------------- records table + admin delete ---------------- */
function avgRating(r) {
  const v = Object.values(r.q9 || {}).filter(x => typeof x === 'number');
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
function recordsPanel(rows) {
  const can = !!admin?.admin || DEMO;
  const deletable = id => !DEMO || String(id).startsWith('local-');
  const LIMIT = 30;
  const list = showAll ? rows : rows.slice(0, LIMIT);
  for (const id of [...selected]) if (!rows.some(r => r.id === id)) selected.delete(id);
  const head = can
    ? `<div class="rec-bar">
         <span>${selected.size ? `تم تحديد <b>${selected.size}</b>` : 'حدّد الردود اللي تبي تحذفها'}</span>
         <button class="btn-del" data-act="del-selected" ${selected.size ? '' : 'disabled'}>حذف المحدد</button>
       </div>`
    : `<div class="rec-bar muted">للحذف: اضغط <b>دخول المسؤول</b> أعلى الصفحة وادخل بحسابك.</div>`;
  return `
  <div class="panel span-all">
    <h3>كل الردود</h3>
    <div class="meta">${rows.length} رد · الأحدث أولاً</div>
    ${head}
    <div class="rec-wrap"><table class="rec">
      <thead><tr>
        ${can ? `<th class="ck"><input type="checkbox" data-act="sel-all" aria-label="تحديد الكل" ${list.length && list.filter(r => deletable(r.id)).every(r => selected.has(r.id)) ? 'checked' : ''}></th>` : ''}
        <th>التاريخ</th><th>العمر</th><th>الجنس</th><th>المكان الآن</th><th>الإحساس الحراري</th><th>متوسط التقييم</th><th>ملاحظة</th>
        ${can ? '<th></th>' : ''}
      </tr></thead>
      <tbody>
      ${list.map(r => {
        const ar = avgRating(r);
        const ok = deletable(r.id);
        return `<tr class="${selected.has(r.id) ? 'sel' : ''}">
          ${can ? `<td class="ck">${ok ? `<input type="checkbox" data-sel="${esc(r.id)}" ${selected.has(r.id) ? 'checked' : ''} aria-label="تحديد">` : ''}</td>` : ''}
          <td class="nowrap">${new Date(r.createdAt).toLocaleString('ar-SA-u-nu-latn', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</td>
          <td>${esc(optLabel('q15', r.q15))}</td>
          <td>${esc(optLabel('q16', r.q16))}</td>
          <td>${esc(optLabel('q12', r.q12))}</td>
          <td class="num">${typeof r.q11 === 'number' ? (r.q11 > 0 ? '+' + r.q11 : r.q11 < 0 ? '−' + Math.abs(r.q11) : '0') : '—'}</td>
          <td class="num"><span class="pill" style="background:${ratingColor(ar)}">${fmt1(ar)}</span></td>
          <td class="note">${r.q18 ? esc(r.q18) : '<span class="muted">—</span>'}</td>
          ${can ? `<td>${ok ? `<button class="btn-x" data-del="${esc(r.id)}" title="حذف هذا الرد" aria-label="حذف">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg></button>` : ''}</td>` : ''}
        </tr>`;
      }).join('') || `<tr><td colspan="9" class="empty">لا توجد ردود</td></tr>`}
      </tbody>
    </table></div>
    ${!showAll && rows.length > LIMIT ? `<button class="more" data-act="show-all">عرض كل الردود (${rows.length})</button>` : ''}
  </div>`;
}

async function doDelete(ids) {
  if (!ids.length) return;
  const msg = ids.length === 1 ? 'حذف هذا الرد نهائياً؟\nلا يمكن التراجع بعد الحذف.' : `حذف ${ids.length} ردود نهائياً؟\nلا يمكن التراجع بعد الحذف.`;
  if (!confirm(msg)) return;
  try {
    await deleteResponses(ids);
    ids.forEach(id => selected.delete(id));
    toast(ids.length === 1 ? 'تم حذف الرد' : `تم حذف ${ids.length} ردود`);
  } catch (e) {
    console.error(e);
    toast(e?.code === 'permission-denied' ? 'ما عندك صلاحية الحذف: تأكد من قواعد Firestore وحساب الدخول' : 'تعذّر الحذف، حاول مرة ثانية', true);
  }
}

dash.addEventListener('click', e => {
  const del = e.target.closest('[data-del]');
  if (del) return doDelete([del.dataset.del]);
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'del-selected') doDelete([...selected]);
  if (act === 'show-all') { showAll = true; render(); }
});
dash.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.sel) { t.checked ? selected.add(t.dataset.sel) : selected.delete(t.dataset.sel); render(); }
  else if (t.dataset.act === 'sel-all') {
    const vis = (showAll ? filtered() : filtered().slice(0, 30)).filter(r => !DEMO || String(r.id).startsWith('local-'));
    vis.forEach(r => (t.checked ? selected.add(r.id) : selected.delete(r.id)));
    render();
  }
});

const adminBtn = document.getElementById('adminBtn');
function paintAdmin() {
  if (DEMO) { adminBtn.hidden = true; return; }
  if (admin?.admin) { adminBtn.textContent = 'خروج المسؤول'; adminBtn.title = admin.email; adminBtn.classList.add('on'); }
  else { adminBtn.textContent = 'دخول المسؤول'; adminBtn.title = ''; adminBtn.classList.remove('on'); }
}
adminBtn.onclick = async () => {
  try {
    if (admin) { await adminSignOut(); toast('تم تسجيل الخروج'); return; }
    await adminSignIn();
  } catch (e) {
    console.error(e);
    const m = {
      'auth/unauthorized-domain': 'أضف نطاق الموقع في Firebase ← Authentication ← Settings ← Authorized domains',
      'auth/operation-not-allowed': 'فعّل دخول Google في Firebase ← Authentication ← Sign-in method',
      'auth/configuration-not-found': 'فعّل Authentication ودخول Google في Firebase أولاً',
      'auth/popup-closed-by-user': 'تم إغلاق نافذة الدخول',
      'auth/cancelled-popup-request': 'تم إغلاق نافذة الدخول',
    }[e?.code] || `تعذّر تسجيل الدخول (${e?.code || 'خطأ غير معروف'})`;
    toast(m, true);
  }
};
onAdminChange(u => {
  admin = u;
  if (u && !u.admin && !u.demo) toast('هذا الحساب ما عنده صلاحية الحذف', true);
  paintAdmin();
  if (all.length) render();
}).catch(e => { console.error(e); adminBtn.hidden = true; });

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
let posterCanvas = null;

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function wrapLines(ctx, text, maxW) {
  const words = text.split(' '); const lines = []; let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}
function qrCanvas(text, size) {
  const holder = document.createElement('div');
  new window.QRCode(holder, { text, width: size, height: size, colorDark: '#0a3f45', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.Q });
  return holder.querySelector('canvas');
}

// بطاقة QR احترافية: صورة الواجهة + تفاصيل الاستبيان + الرمز
async function buildPoster() {
  const F = '"IBM Plex Sans Arabic", system-ui, sans-serif';
  try { await Promise.all(['400', '600', '700'].map(w => document.fonts.load(`${w} 40px "IBM Plex Sans Arabic"`))); } catch {}
  const photo = await loadImage(new URL('img/obhur.jpg?v=10', location.href).href).catch(() => null);
  const W = 2000, H = 1250;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // background photo (cover) + light veil
  ctx.fillStyle = '#cfe6ef'; ctx.fillRect(0, 0, W, H);
  if (photo) {
    const s = Math.max(W / photo.width, H / photo.height);
    const pw = photo.width * s, ph = photo.height * s;
    ctx.drawImage(photo, (W - pw) / 2, (H - ph) * 0.45, pw, ph);
  }
  let g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(246,240,230,0.10)'); g.addColorStop(1, 'rgba(246,240,230,0.55)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // ---- details panel (right) ----
  const px = 960, py = 110, pw = W - px - 90, ph = H - 220;
  ctx.save(); ctx.shadowColor = 'rgba(10,63,69,0.18)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
  rr(ctx, px, py, pw, ph, 44); ctx.fillStyle = 'rgba(255,255,255,0.90)'; ctx.fill(); ctx.restore();

  const R = px + pw - 70, maxW = pw - 140;
  ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  let y = py + 110;

  // badge
  ctx.font = `600 34px ${F}`;
  const badge = 'MSAU 611 · جامعة عفت';
  const bw = ctx.measureText(badge).width + 56;
  rr(ctx, R - bw, y - 46, bw, 66, 33); ctx.fillStyle = '#e3f1f1'; ctx.fill();
  ctx.fillStyle = '#0c5a62'; ctx.fillText(badge, R - 28, y);
  y += 120;

  // title
  ctx.font = `700 86px ${F}`; ctx.fillStyle = '#0a3f45';
  for (const ln of wrapLines(ctx, 'استبيان زوار واجهة أبحر الجديدة', maxW)) { ctx.fillText(ln, R, y); y += 108; }
  y -= 30;
  ctx.direction = 'ltr'; ctx.font = `500 38px ${F}`; ctx.fillStyle = '#4a6264';
  ctx.fillText('New Obhur Waterfront Visitor Survey', R, y);
  ctx.direction = 'rtl';
  y += 56;

  // accent line
  ctx.fillStyle = '#e2773a'; rr(ctx, R - 120, y, 120, 8, 4); ctx.fill();
  y += 86;

  // description
  ctx.font = `400 42px ${F}`; ctx.fillStyle = '#172a2c';
  const desc = 'شاركنا رأيك في الظل والمقاعد والممرات والخدمات، لنفهم تجربة الزوار ونقترح تحسينات للواجهة.';
  for (const ln of wrapLines(ctx, desc, maxW)) { ctx.fillText(ln, R, y); y += 68; }
  y += 40;

  // info chips
  ctx.font = `600 36px ${F}`;
  const chips = ['3–4 دقائق', 'مجهول الهوية', 'اختياري', '18 سنة فأكثر'];
  let cx = R;
  for (const ch of chips) {
    const w = ctx.measureText(ch).width + 56;
    if (R - (cx - w) > maxW) { cx = R; y += 92; }
    rr(ctx, cx - w, y - 50, w, 74, 37); ctx.fillStyle = '#e3f1f1'; ctx.fill();
    ctx.fillStyle = '#0c5a62'; ctx.fillText(ch, cx - 28, y);
    cx -= w + 18;
  }

  // location footer
  ctx.font = `500 34px ${F}`; ctx.fillStyle = '#5d6f71';
  ctx.fillText('واجهة أبحر البحرية · جدة', R, py + ph - 64);

  // ---- QR card (left) ----
  const qx = 90, qy = py, qw = 790, qh = ph;
  ctx.save(); ctx.shadowColor = 'rgba(10,63,69,0.22)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
  rr(ctx, qx, qy, qw, qh, 44); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.restore();
  // header strip
  ctx.save(); rr(ctx, qx, qy, qw, qh, 44); ctx.clip();
  g = ctx.createLinearGradient(qx, 0, qx + qw, 0); g.addColorStop(0, '#0a4a51'); g.addColorStop(1, '#13808a');
  ctx.fillStyle = g; ctx.fillRect(qx, qy, qw, 140); ctx.restore();
  ctx.textAlign = 'center'; ctx.direction = 'rtl';
  ctx.font = `700 50px ${F}`; ctx.fillStyle = '#ffffff';
  ctx.fillText('امسح الرمز للمشاركة', qx + qw / 2, qy + 90);

  const qs = 580, qrx = qx + (qw - qs) / 2, qry = qy + 200;
  const q = qrCanvas(surveyUrl, qs);
  rr(ctx, qrx - 26, qry - 26, qs + 52, qs + 52, 28); ctx.strokeStyle = '#d7e9e9'; ctx.lineWidth = 4; ctx.stroke();
  ctx.imageSmoothingEnabled = false; ctx.drawImage(q, qrx, qry, qs, qs); ctx.imageSmoothingEnabled = true;

  ctx.direction = 'ltr'; ctx.font = `500 34px ${F}`; ctx.fillStyle = '#4a6264';
  ctx.fillText('Scan to take part', qx + qw / 2, qry + qs + 104);
  ctx.font = `400 26px ${F}`; ctx.fillStyle = '#7b8c8e';
  ctx.fillText(surveyUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''), qx + qw / 2, qry + qs + 158);
  return c;
}

document.getElementById('qrBtn').onclick = async () => {
  const box = document.getElementById('qrBox');
  modal.classList.add('open');
  if (!window.QRCode) { box.innerHTML = '<p>تعذّر تحميل مولّد QR، تأكد من الاتصال</p>'; return; }
  box.innerHTML = '<p class="qr-loading">جارٍ تجهيز البطاقة…</p>';
  try {
    posterCanvas = await buildPoster();
    const img = new Image(); img.alt = 'بطاقة QR لاستبيان واجهة أبحر'; img.src = posterCanvas.toDataURL('image/png');
    box.innerHTML = ''; box.appendChild(img);
  } catch (e) { console.error(e); box.innerHTML = '<p>تعذّر تجهيز البطاقة</p>'; }
};
document.getElementById('qrClose').onclick = () => modal.classList.remove('open');
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('open'); });
document.getElementById('qrDl').onclick = () => {
  if (!posterCanvas) return;
  const a = document.createElement('a');
  a.href = posterCanvas.toDataURL('image/png');
  a.download = 'obhur-survey-qr-card.png';
  a.click();
};
document.getElementById('qrCopy').onclick = async () => {
  try { await navigator.clipboard.writeText(surveyUrl); toast('تم نسخ رابط الاستبيان'); }
  catch { prompt('انسخ الرابط:', surveyUrl); }
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
