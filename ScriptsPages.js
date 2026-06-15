<!--
═══════════════════════════════════════════════════════════════
 PROMPT VAULT · File: ScriptsPages.html — Page handlers (inert)
 Version: 1.0.0 · Last Update: 2026-05-30 · ครูวิรัตน์ หาดคำ
═══════════════════════════════════════════════════════════════
-->

(function () {
  'use strict';
  var P = window.PV;
  var $ = P.$, $$ = P.$$, esc = P.esc, fnum = P.fnum, call = P.call, hasCap = P.hasCap, TH = P.TH;
  var toast = P.toast, Spinner = P.Spinner, Modal = P.Modal, confirmModal = P.confirmModal, alertSuccess = P.alertSuccess;
  var Store = P.Store, Routes = window.Routes;

  function catMap() { var m = {}; ((Store.boot && Store.boot.categories) || []).forEach(function (c) { m[c.key] = c; }); return m; }
  function levels() { return (Store.boot && Store.boot.levels) || ['ทุกระดับ']; }
  function statusLabel(s) { return ((Store.boot && Store.boot.statuses) || {})[s] || s; }

  function skeletonCards(n) { var h = '<div class="pgrid">'; for (var i = 0; i < (n || 8); i++) h += '<div class="sk sk-card"></div>'; return h + '</div>'; }
  function empty(icon, msg, cta) { return '<div class="empty-state"><i class="bi bi-' + icon + '"></i><p>' + esc(msg) + '</p>' + (cta || '') + '</div>'; }

  /* ════════ DASHBOARD ════════ */
  Routes['#/dashboard'] = function () {
    var pg = $('#page');
    pg.innerHTML = '<div class="sk" style="height:160px;border-radius:22px;margin-bottom:18px"></div><div class="sd-grid-stats">'
      + '<div class="sk" style="height:110px;border-radius:16px"></div><div class="sk" style="height:110px;border-radius:16px"></div><div class="sk" style="height:110px;border-radius:16px"></div><div class="sk" style="height:110px;border-radius:16px"></div></div>' + skeletonCards(6);
    P.setFab(hasCap('prompt.create|prompt.suggest') && Store.user.role !== 'guest' ? 'plus-lg' : '', '#/prompt/new');
    call('report.dashboard', {}).then(function (d) {
      if (!$('#page')) return;
      var u = Store.user; var hr = new Date().getHours();
      var greet = hr < 12 ? 'อรุณสวัสดิ์' : (hr < 17 ? 'สวัสดี' : 'สวัสดียามเย็น');
      var k = d.kpi;
      var html = '<div class="hero"><div class="hero-pill"><i class="bi bi-stars"></i> ' + TH.dateLong(new Date()) + '</div>'
        + '<div class="hero-title">' + greet + ', ' + esc(u.full_name.split(' ')[0]) + ' 👋</div>'
        + '<div class="hero-sub">ยินดีต้อนรับสู่คลังคำสั่ง AI ของ ' + esc((Store.boot.app || {}).org || 'โรงเรียน') + '</div>'
        + '<div class="hero-kpi">'
        + hkpi('terminal-fill', k.total_prompts, 'Prompts ทั้งหมด')
        + hkpi('eye-fill', k.total_views, 'ยอดเข้าชม')
        + hkpi('clipboard-check-fill', k.total_copies, 'ครั้งที่คัดลอก')
        + hkpi('star-fill', k.favorites, 'รายการโปรด')
        + '</div></div>';

      // action grid
      var acts = [
        { h: '#/library', i: 'collection-fill', l: 'คลัง Prompt', g: 'g-emerald' },
        { h: '#/prompt/new', i: 'plus-circle-fill', l: 'สร้าง Prompt', g: 'g-sky', cap: 'prompt.create|prompt.suggest' },
        { h: '#/favorites', i: 'star-fill', l: 'รายการโปรด', g: 'g-amber', cap: 'prompt.favorite|prompt.view_all' },
        { h: '#/mine', i: 'person-workspace', l: 'ของฉัน', g: 'g-violet', cap: 'prompt.create|prompt.suggest' },
        { h: '#/categories', i: 'tags-fill', l: 'หมวดหมู่', g: 'g-indigo', cap: 'category.manage' },
        { h: '#/users', i: 'people-fill', l: 'ผู้ใช้งาน', g: 'g-rose', cap: 'user.manage' },
        { h: '#/reports', i: 'bar-chart-fill', l: 'รายงาน', g: 'g-sky', cap: 'report.view_all|report.view_own', roles: ['admin', 'teacher'] },
        { h: '#/settings', i: 'gear-fill', l: 'ตั้งค่า', g: 'g-indigo', cap: 'setting.manage' }
      ].filter(function (a) { if (a.roles && a.roles.indexOf(Store.user.role) < 0) return false; return !a.cap || hasCap(a.cap); });
      html += '<div class="act-grid">';
      acts.forEach(function (a) {
        var badge = (a.h === '#/library' && d.kpi.pending > 0 && hasCap('prompt.moderate')) ? '<span class="act-badge">' + d.kpi.pending + '</span>' : '';
        html += '<div class="act-card" data-hash="' + a.h + '">' + badge + '<div class="act-ic ' + a.g + '"><i class="bi bi-' + a.i + '"></i></div><div class="act-l">' + esc(a.l) + '</div></div>';
      });
      html += '</div>';

      // pending review (admin)
      if (d.is_admin && d.kpi.pending > 0) {
        html += '<div class="panel" style="border-color:rgba(245,158,11,.3)"><div class="panel-head"><div class="panel-title"><i class="bi bi-hourglass-split" style="color:var(--amber)"></i> รออนุมัติ (' + d.kpi.pending + ')</div><a class="btn btn-sm btn-ghost" href="#/library?status=pending">ดูทั้งหมด</a></div>'
          + '<div style="font-size:13px;color:var(--ink-muted)">มี Prompt ที่นักเรียน/ครูเสนอเข้ามารอการตรวจสอบ คลิก "ดูทั้งหมด" เพื่ออนุมัติหรือตีกลับ</div></div>';
      }

      // charts row
      html += '<div class="sd-grid-2">';
      html += '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bi bi-graph-up-arrow"></i> Prompt ใหม่ 14 วัน</div></div>' + lineChart(d.trend) + '</div>';
      html += '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bi bi-pie-chart-fill"></i> ตามหมวดหมู่</div></div>' + horizBars(d.by_category, d.cat_map) + '</div>';
      html += '</div>';

      // top prompts
      html += '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bi bi-fire"></i> Prompt ยอดนิยม</div><a class="btn btn-sm btn-ghost sd-no-print" href="#/library?sort=popular">ดูทั้งหมด</a></div>';
      if (!d.top_prompts.length) html += empty('inbox', 'ยังไม่มี Prompt');
      else { html += '<div class="pgrid">'; d.top_prompts.forEach(function (p) { html += promptCard(p); }); html += '</div>'; }
      html += '</div>';

      pg.innerHTML = html;
      animateBars();
    }).catch(function (e) { if ($('#page')) $('#page').innerHTML = empty('wifi-off', e.message, '<button class="btn btn-primary" onclick="PV.dispatch()"><i class="bi bi-arrow-clockwise"></i> ลองใหม่</button>'); });

    function hkpi(ic, v, l) { return '<div class="hkpi"><div class="hkpi-ic"><i class="bi bi-' + ic + '"></i></div><div class="hkpi-v">' + fnum(v) + '</div><div class="hkpi-l">' + l + '</div></div>'; }
  };

  /* ════════ CHARTS ════════ */
  function lineChart(trend) {
    if (!trend || !trend.length) return empty('graph-up', 'ยังไม่มีข้อมูล');
    var w = 520, h = 180, pad = 28;
    var max = Math.max(1, Math.max.apply(null, trend.map(function (t) { return t.count; })));
    var step = (w - pad * 2) / Math.max(1, trend.length - 1);
    var pts = trend.map(function (t, i) { return [pad + i * step, h - pad - (t.count / max) * (h - pad * 2)]; });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (h - pad) + ' L' + pad + ' ' + (h - pad) + ' Z';
    var dots = pts.map(function (p) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" fill="#34d399"/>'; }).join('');
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet" width="100%" height="180">'
      + '<defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10b981" stop-opacity=".35"/><stop offset="1" stop-color="#10b981" stop-opacity="0"/></linearGradient></defs>'
      + '<path d="' + area + '" fill="url(#lg)"/><path d="' + line + '" fill="none" stroke="#34d399" stroke-width="2.5"/>' + dots + '</svg>';
  }
  function horizBars(byKey, cmap) {
    var keys = Object.keys(byKey || {}).filter(function (k) { return byKey[k] > 0; }).sort(function (a, b) { return byKey[b] - byKey[a]; }).slice(0, 8);
    if (!keys.length) return empty('pie-chart', 'ยังไม่มีข้อมูล');
    var max = Math.max.apply(null, keys.map(function (k) { return byKey[k]; }));
    var html = '';
    keys.forEach(function (k) {
      var c = (cmap && cmap[k]) || {};
      html += '<div class="bar-row"><div class="bar-label">' + esc(c.label || k || 'อื่นๆ') + '</div><div class="bar-track"><div class="bar-fill" data-w="' + Math.round(byKey[k] / max * 100) + '" style="width:0;' + (c.color ? 'background:linear-gradient(90deg,' + c.color + ',' + c.color + ');' : '') + '"></div></div><div class="bar-val">' + byKey[k] + '</div></div>';
    });
    return html;
  }
  function animateBars() { setTimeout(function () { $$('.bar-fill[data-w]').forEach(function (b) { b.style.width = b.getAttribute('data-w') + '%'; }); }, 50); }

  /* ════════ PROMPT CARD ════════ */
  function promptCard(p) {
    var cm = catMap()[p.category_key] || { color: '#10b981', icon: 'tag', label: p.category_key };
    var tags = (p.tags || '').split(',').filter(Boolean).slice(0, 3);
    var canFav = Store.user && Store.user.role !== 'guest';
    return '<div class="pcard" data-prompt="' + esc(p.id) + '" style="--cat-color:' + esc(cm.color) + '">'
      + (p.is_featured ? '<div class="pcard-feat"><i class="bi bi-star-fill"></i> เด่น</div>' : '')
      + (p.status !== 'published' ? '<div class="pcard-status"><span class="badge b-' + esc(p.status) + '">' + esc(statusLabel(p.status)) + '</span></div>' : '')
      + '<div class="pcard-top"><div class="pcard-cat" style="background:' + esc(cm.color) + '"><i class="bi bi-' + esc(cm.icon) + '"></i></div>'
      + '<div style="min-width:0"><div class="pcard-cat-l">' + esc(cm.label) + '</div><div class="pcard-lv">' + esc(p.level || '') + '</div></div>'
      + (canFav ? '<button class="pcard-fav ' + (p.is_favorite ? 'on' : '') + '" data-fav="' + esc(p.id) + '"><i class="bi bi-star' + (p.is_favorite ? '-fill' : '') + '"></i></button>' : '') + '</div>'
      + '<div class="pcard-title">' + esc(p.title) + '</div>'
      + '<div class="pcard-body">' + esc(p.body) + '</div>'
      + (tags.length ? '<div class="pcard-tags">' + tags.map(function (t) { return '<span class="ptag">#' + esc(t.trim()) + '</span>'; }).join('') + '</div>' : '')
      + '<div class="pcard-foot"><span class="m"><i class="bi bi-eye"></i> ' + fnum(p.views) + '</span><span class="m"><i class="bi bi-clipboard-check"></i> ' + fnum(p.copies) + '</span>'
      + '<span class="m"><i class="bi bi-star-fill" style="color:var(--amber)"></i> ' + (p.rating || '-') + '</span><span class="m" style="margin-left:auto"><i class="bi bi-person"></i> ' + esc((p.author_name || '').split(' ')[0]) + '</span></div></div>';
  }

  /* ════════ LIBRARY ════════ */
  var LIB = { q: '', category: '', level: '', status: '', sort: 'recent', page: 1, mine: false, favorite: false, _t: null };
  function parseQuery(hash) { var o = {}; var qi = hash.indexOf('?'); if (qi >= 0) hash.substring(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); o[p[0]] = decodeURIComponent(p[1] || ''); }); return o; }

  function libraryPage(mode) {
    return function (hash) {
      var qp = parseQuery(hash || location.hash);
      LIB = { q: '', category: qp.category || '', level: '', status: qp.status || '', sort: qp.sort || 'recent', page: 1, mine: mode === 'mine', favorite: mode === 'fav', _t: null };
      var pg = $('#page');
      var cats = (Store.boot.categories || []).filter(function (c) { return c.is_active; });
      var catChips = '<div class="chip' + (!LIB.category ? ' on' : '') + '" data-cat="">ทั้งหมด</div>';
      cats.forEach(function (c) { catChips += '<div class="chip' + (LIB.category === c.key ? ' on' : '') + '" data-cat="' + esc(c.key) + '"><i class="bi bi-' + esc(c.icon) + '" style="color:' + esc(c.color) + '"></i> ' + esc(c.label) + '</div>'; });
      var statusFilter = hasCap('prompt.moderate') ? '<select class="tb-select" id="lib-status"><option value="">ทุกสถานะ</option><option value="published">เผยแพร่</option><option value="pending">รออนุมัติ</option><option value="draft">ฉบับร่าง</option><option value="rejected">ตีกลับ</option><option value="archived">เก็บถาวร</option></select>' : '';
      pg.innerHTML = '<div class="toolbar"><div class="search-box"><i class="bi bi-search"></i><input id="lib-q" placeholder="ค้นหา Prompt, แท็ก, วิชา..." value="' + esc(LIB.q) + '"></div>'
        + '<select class="tb-select" id="lib-level"><option value="">ทุกระดับ</option>' + levels().map(function (l) { return '<option' + (LIB.level === l ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>'
        + statusFilter
        + '<select class="tb-select" id="lib-sort"><option value="recent"' + (LIB.sort === 'recent' ? ' selected' : '') + '>ล่าสุด</option><option value="popular"' + (LIB.sort === 'popular' ? ' selected' : '') + '>คัดลอกมากสุด</option><option value="views">เข้าชมมากสุด</option><option value="rating">คะแนนสูงสุด</option></select>'
        + (hasCap('prompt.create|prompt.suggest') && Store.user.role !== 'guest' ? '<a class="btn btn-primary" href="#/prompt/new"><i class="bi bi-plus-lg"></i> สร้าง</a>' : '') + '</div>'
        + (mode === 'lib' ? '<div class="chips" id="lib-cats" style="margin-bottom:16px">' + catChips + '</div>' : '')
        + '<div id="lib-result"></div>';
      P.setFab(hasCap('prompt.create|prompt.suggest') && Store.user.role !== 'guest' ? 'plus-lg' : '', '#/prompt/new');
      if (qp.status && $('#lib-status')) $('#lib-status').value = qp.status;
      wireLib(mode);
      loadLib();
    };
  }
  Routes['#/library'] = libraryPage('lib');
  Routes['#/favorites'] = libraryPage('fav');
  Routes['#/mine'] = libraryPage('mine');

  function wireLib(mode) {
    var q = $('#lib-q'); if (q) q.addEventListener('input', function () { clearTimeout(LIB._t); LIB._t = setTimeout(function () { LIB.q = q.value; LIB.page = 1; loadLib(); }, 300); });
    var lv = $('#lib-level'); if (lv) lv.addEventListener('change', function () { LIB.level = lv.value; LIB.page = 1; loadLib(); });
    var so = $('#lib-sort'); if (so) so.addEventListener('change', function () { LIB.sort = so.value; LIB.page = 1; loadLib(); });
    var stf = $('#lib-status'); if (stf) stf.addEventListener('change', function () { LIB.status = stf.value; LIB.page = 1; loadLib(); });
    var cats = $('#lib-cats'); if (cats) cats.addEventListener('click', function (e) { var c = e.target.closest('[data-cat]'); if (!c) return; LIB.category = c.getAttribute('data-cat'); LIB.page = 1; $$('#lib-cats .chip').forEach(function (x) { x.classList.remove('on'); }); c.classList.add('on'); loadLib(); });
  }
  function loadLib() {
    var box = $('#lib-result'); if (!box) return; box.innerHTML = skeletonCards(8);
    call('prompt.list', { q: LIB.q, category: LIB.category, level: LIB.level, status: LIB.status, sort: LIB.sort, page: LIB.page, mine: LIB.mine, favorite: LIB.favorite, per_page: 24 }).then(function (r) {
      if (!$('#lib-result')) return;
      if (!r.items.length) { box.innerHTML = empty('search', 'ไม่พบ Prompt ที่ตรงกับเงื่อนไข', hasCap('prompt.create|prompt.suggest') && Store.user.role !== 'guest' ? '<a class="btn btn-primary" href="#/prompt/new"><i class="bi bi-plus-lg"></i> สร้าง Prompt แรก</a>' : ''); return; }
      var html = '<div style="font-size:13px;color:var(--ink-dim);margin-bottom:12px">พบ ' + fnum(r.total) + ' รายการ</div><div class="pgrid">';
      r.items.forEach(function (p) { html += promptCard(p); });
      html += '</div>';
      if (r.pages > 1) {
        html += '<div style="display:flex;gap:8px;justify-content:center;margin-top:20px">';
        if (r.page > 1) html += '<button class="btn btn-ghost btn-sm" data-pg="' + (r.page - 1) + '"><i class="bi bi-chevron-left"></i> ก่อนหน้า</button>';
        html += '<span class="wiz-pill">หน้า ' + r.page + ' / ' + r.pages + '</span>';
        if (r.page < r.pages) html += '<button class="btn btn-ghost btn-sm" data-pg="' + (r.page + 1) + '">ถัดไป <i class="bi bi-chevron-right"></i></button>';
        html += '</div>';
      }
      box.innerHTML = html;
      $$('[data-pg]', box).forEach(function (b) { b.addEventListener('click', function () { LIB.page = Number(b.getAttribute('data-pg')); loadLib(); window.scrollTo({ top: 0, behavior: 'smooth' }); }); });
    }).catch(function (e) { if ($('#lib-result')) $('#lib-result').innerHTML = empty('wifi-off', e.message); });
  }

  // delegated: card click, fav
  document.addEventListener('click', function (e) {
    var fav = e.target.closest && e.target.closest('[data-fav]');
    if (fav) { e.preventDefault(); e.stopPropagation(); var id = fav.getAttribute('data-fav');
      call('prompt.favorite', { id: id }).then(function (r) { fav.classList.toggle('on', r.favorite); fav.innerHTML = '<i class="bi bi-star' + (r.favorite ? '-fill' : '') + '"></i>'; toast(r.favorite ? 'เพิ่มในรายการโปรด' : 'นำออกจากรายการโปรด', 'success', 1500); if (LIB.favorite) loadLib(); }).catch(function (er) { toast(er.message, 'error'); }); return; }
    var card = e.target.closest && e.target.closest('[data-prompt]');
    if (card) { openPromptDetail(card.getAttribute('data-prompt')); return; }
  });

  /* ════════ PROMPT DETAIL ════════ */
  function openPromptDetail(id) {
    Modal.open({ title: 'รายละเอียด Prompt', large: true, html: '<div style="text-align:center;padding:40px"><div class="sk" style="height:30px;width:60%;margin:0 auto 16px"></div><div class="sk" style="height:140px"></div></div>' });
    call('prompt.get', { id: id }).then(function (p) {
      if (!$('#modal-host').classList.contains('is-open')) return;
      var cm = catMap()[p.category_key] || { color: '#10b981', icon: 'tag', label: p.category_key };
      var canEdit = hasCap('prompt.moderate') || (Store.user && String(p.author_id) === String(Store.user.id) && hasCap('prompt.edit_own|prompt.create'));
      var canMod = hasCap('prompt.moderate');
      var html = '<div class="pd-cat"><div class="pd-cat-ic" style="background:' + esc(cm.color) + '"><i class="bi bi-' + esc(cm.icon) + '"></i></div><div><div style="font-size:12px;color:var(--ink-muted)">' + esc(cm.label) + ' · ' + esc(p.level || '') + (p.subject ? ' · ' + esc(p.subject) : '') + '</div>'
        + '<div style="font-size:19px;font-weight:800;color:#f0fdf4">' + esc(p.title) + '</div></div>'
        + (p.status !== 'published' ? '<span class="badge b-' + esc(p.status) + '" style="margin-left:auto">' + esc(statusLabel(p.status)) + '</span>' : '') + '</div>'
        + '<div class="pd-stats"><div class="pd-stat"><div class="pd-stat-v">' + fnum(p.views) + '</div><div class="pd-stat-l">เข้าชม</div></div>'
        + '<div class="pd-stat"><div class="pd-stat-v">' + fnum(p.copies) + '</div><div class="pd-stat-l">คัดลอก</div></div>'
        + '<div class="pd-stat"><div class="pd-stat-v">' + (p.rating || '-') + ' <i class="bi bi-star-fill" style="font-size:12px;color:var(--amber)"></i></div><div class="pd-stat-l">' + p.rating_count + ' คะแนน</div></div></div>'
        + '<div class="pd-section"><div class="pd-sec-t"><i class="bi bi-terminal"></i> คำสั่ง (Prompt)</div><div class="pd-prompt" id="pd-body"><button class="btn btn-primary btn-sm pd-copy-btn" id="pd-copy"><i class="bi bi-clipboard"></i> คัดลอก</button>' + esc(p.body) + '</div></div>'
        + (p.usage_note ? '<div class="pd-section"><div class="pd-sec-t"><i class="bi bi-info-circle"></i> วิธีใช้</div><div class="pd-note">' + esc(p.usage_note) + '</div></div>' : '')
        + (p.model_hint ? '<div class="pd-section"><div class="pd-sec-t"><i class="bi bi-robot"></i> โมเดลแนะนำ</div><div style="font-size:13px;color:var(--ink)">' + esc(p.model_hint) + '</div></div>' : '')
        + (p.example_output ? '<div class="pd-section"><div class="pd-sec-t"><i class="bi bi-chat-square-text"></i> ตัวอย่างผลลัพธ์</div><div class="pd-prompt" style="color:var(--ink-muted)">' + esc(p.example_output) + '</div></div>' : '')
        + (p.tags ? '<div class="pd-section"><div class="pcard-tags">' + p.tags.split(',').filter(Boolean).map(function (t) { return '<span class="ptag">#' + esc(t.trim()) + '</span>'; }).join('') + '</div></div>' : '')
        + (Store.user && Store.user.role !== 'guest' ? '<div class="pd-section"><div class="pd-sec-t"><i class="bi bi-star"></i> ให้คะแนน Prompt นี้</div><div class="pd-rate" id="pd-rate">' + [1,2,3,4,5].map(function (i) { return '<i class="bi bi-star' + (i <= (p.my_rating || 0) ? '-fill on' : '') + '" data-score="' + i + '"></i>'; }).join('') + '</div></div>' : '')
        + '<div style="font-size:11px;color:var(--ink-dim);margin-top:16px;display:flex;gap:6px;align-items:center"><i class="bi bi-person-circle"></i> โดย ' + esc(p.author_name) + ' · อัปเดต ' + TH.smart(p.updated_at) + '</div>';
      var footer = '';
      if (canMod && p.status === 'pending') footer += '<button class="btn btn-danger btn-sm" data-mod="rejected"><i class="bi bi-x-lg"></i> ตีกลับ</button><button class="btn btn-primary btn-sm" data-mod="published"><i class="bi bi-check-lg"></i> อนุมัติ</button>';
      if (canMod) footer += '<button class="btn btn-ghost btn-sm" id="pd-feat"><i class="bi bi-star' + (p.is_featured ? '-fill' : '') + '"></i> ' + (p.is_featured ? 'เลิกปักหมุด' : 'ปักหมุด') + '</button>';
      if (canEdit) footer += '<button class="btn btn-ghost btn-sm" id="pd-edit"><i class="bi bi-pencil"></i> แก้ไข</button><button class="btn btn-danger btn-sm" id="pd-del"><i class="bi bi-trash"></i> ลบ</button>';
      Modal.open({ title: 'รายละเอียด Prompt', large: true, html: html, footer: footer || '<button class="btn btn-ghost" data-modal-close>ปิด</button>', onOpen: function (host) { wireDetail(host, p); } });
    }).catch(function (e) { toast(e.message, 'error'); Modal.close(); });
  }
  function wireDetail(host, p) {
    var copyBtn = host.querySelector('#pd-copy');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(p.body).then(function () {
        copyBtn.innerHTML = '<i class="bi bi-check-lg"></i> คัดลอกแล้ว!';
        call('prompt.copy', { id: p.id }).catch(function () {});
        toast('คัดลอก Prompt เรียบร้อย — นำไปวางใน AI ได้เลย', 'success', 2000);
        setTimeout(function () { if (copyBtn) copyBtn.innerHTML = '<i class="bi bi-clipboard"></i> คัดลอก'; }, 2000);
      }).catch(function () { toast('คัดลอกไม่สำเร็จ', 'error'); });
    });
    var rate = host.querySelector('#pd-rate');
    if (rate) rate.addEventListener('click', function (e) { var s = e.target.closest('[data-score]'); if (!s) return; var score = Number(s.getAttribute('data-score'));
      call('prompt.rate', { id: p.id, score: score }).then(function (r) { $$('#pd-rate i').forEach(function (ic, i) { ic.className = 'bi bi-star' + (i < score ? '-fill on' : ''); }); toast('ให้คะแนน ' + score + ' ดาว', 'success', 1500); }).catch(function (er) { toast(er.message, 'error'); }); });
    var edit = host.querySelector('#pd-edit'); if (edit) edit.addEventListener('click', function () { Modal.close(); location.hash = '#/prompt/edit?id=' + p.id; });
    var del = host.querySelector('#pd-del'); if (del) del.addEventListener('click', function () {
      confirmModal({ title: 'ลบ Prompt', message: 'ลบ "' + esc(p.title) + '" ออกถาวร?', okText: 'ลบ', danger: true }).then(function (ok) { if (!ok) return;
        call('prompt.delete', { id: p.id }).then(function () { Modal.close(); toast('ลบเรียบร้อย', 'success'); P.dispatch(); }).catch(function (er) { toast(er.message, 'error'); }); }); });
    var feat = host.querySelector('#pd-feat'); if (feat) feat.addEventListener('click', function () { call('prompt.feature', { id: p.id }).then(function (r) { toast(r.is_featured ? 'ปักหมุดแล้ว' : 'เลิกปักหมุด', 'success'); Modal.close(); }).catch(function (er) { toast(er.message, 'error'); }); });
    $$('[data-mod]', host).forEach(function (b) { b.addEventListener('click', function () { var st = b.getAttribute('data-mod');
      call('prompt.moderate', { id: p.id, status: st }).then(function () { Modal.close(); toast(st === 'published' ? 'อนุมัติเรียบร้อย' : 'ตีกลับเรียบร้อย', 'success'); P.dispatch(); }).catch(function (er) { toast(er.message, 'error'); }); }); });
  }

  /* ════════ PROMPT WIZARD ════════ */
  var WIZ = null;
  function wizardPage(hash) {
    var qp = parseQuery(hash || location.hash);
    var isEdit = !!qp.id;
    P.setFab('', '');
    WIZ = { step: 1, maxStep: isEdit ? 4 : 1, isEdit: isEdit, id: qp.id || null, data: { level: 'ทุกระดับ' } };
    var pg = $('#page');
    if (isEdit) {
      pg.innerHTML = '<div class="panel"><div class="sk" style="height:300px"></div></div>';
      call('prompt.get', { id: qp.id }).then(function (p) {
        WIZ.data = { title: p.title, body: p.body, category_key: p.category_key, tags: p.tags, level: p.level, subject: p.subject, model_hint: p.model_hint, usage_note: p.usage_note, example_output: p.example_output };
        WIZ.maxStep = 4; renderWiz();
      }).catch(function (e) { pg.innerHTML = empty('exclamation-triangle', e.message); });
    } else renderWiz();
  }
  Routes['#/prompt/new'] = wizardPage;
  Routes['#/prompt/edit'] = wizardPage;

  var WSTEPS = [{ t: 'ข้อมูลพื้นฐาน', i: 'card-text' }, { t: 'เนื้อหา Prompt', i: 'terminal' }, { t: 'รายละเอียด', i: 'sliders' }, { t: 'ตรวจสอบ', i: 'check2-circle' }];
  function renderWiz() {
    var pg = $('#page'); var s = WIZ.step;
    var pct = (s - 1) / (WSTEPS.length - 1);
    var prog = '<div class="wiz-prog"><div class="wiz-prog-fill" style="width:calc((100% - 56px) * ' + pct + ')"></div>';
    WSTEPS.forEach(function (st, i) { var n = i + 1; var cls = n === s ? 'active' : (n < s ? 'done' : ''); prog += '<div class="wiz-step ' + cls + '"><div class="wiz-circ"><i class="bi bi-' + (n < s ? 'check-lg' : st.i) + '"></i></div><div class="wiz-step-l">' + st.t + '</div></div>'; });
    prog += '</div>';
    pg.innerHTML = '<div class="panel" style="max-width:760px;margin:0 auto">' + prog + '<div id="wiz-pane">' + stepHtml(s) + '</div>'
      + '<div class="wiz-nav"><button class="btn btn-ghost" id="wiz-back"' + (s === 1 ? ' style="visibility:hidden"' : '') + '><i class="bi bi-chevron-left"></i> ย้อนกลับ</button>'
      + '<span class="wiz-pill">ขั้นที่ ' + s + ' จาก ' + WSTEPS.length + '</span>'
      + (s < WSTEPS.length ? '<button class="btn btn-primary" id="wiz-next">ถัดไป <i class="bi bi-chevron-right"></i></button>' : '<button class="btn btn-primary" id="wiz-save"><i class="bi bi-check-lg"></i> บันทึก</button>') + '</div></div>';
    wireWiz();
  }
  function stepHtml(s) {
    var d = WIZ.data;
    if (s === 1) {
      var cats = (Store.boot.categories || []).filter(function (c) { return c.is_active; });
      return '<div class="wiz-pane">' + wsec('ข้อมูลพื้นฐาน', 'card-text')
        + fld('title', 'ชื่อ Prompt', true, 'text', d.title, 'เช่น สร้างแผนการสอนแบบ Active Learning')
        + '<div class="field" data-fwrap="category_key"><label>หมวดหมู่ <span class="req">*</span></label><select class="select" data-field="category_key"><option value="">— เลือกหมวดหมู่ —</option>'
        + cats.map(function (c) { return '<option value="' + esc(c.key) + '"' + (d.category_key === c.key ? ' selected' : '') + '>' + esc(c.label) + '</option>'; }).join('') + '</select></div></div>';
    }
    if (s === 2) {
      return '<div class="wiz-pane">' + wsec('เนื้อหา Prompt', 'terminal')
        + '<div class="field" data-fwrap="body"><label>คำสั่ง (Prompt) <span class="req">*</span></label><textarea class="textarea code" data-field="body" placeholder="พิมพ์คำสั่งที่จะให้ AI ทำ... ใช้ [วงเล็บเหลี่ยม] เป็นช่องเติมข้อมูล">' + esc(d.body || '') + '</textarea><div class="field-hint">เคล็ดลับ: ใช้ [หัวข้อ] [ระดับชั้น] เป็นช่องให้ผู้ใช้เติมข้อมูลเอง</div></div>'
        + fldArea('usage_note', 'วิธีใช้ / คำแนะนำ', d.usage_note, 'อธิบายว่าควรแทนที่อะไรบ้าง (ไม่บังคับ)') + '</div>';
    }
    if (s === 3) {
      return '<div class="wiz-pane">' + wsec('รายละเอียดเพิ่มเติม', 'sliders')
        + '<div class="rows-2"><div class="field" data-fwrap="level"><label>ระดับชั้น</label><select class="select" data-field="level">' + levels().map(function (l) { return '<option' + (d.level === l ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></div>'
        + fld('subject', 'วิชา/กลุ่มสาระ', false, 'text', d.subject, 'เช่น วิทยาศาสตร์') + '</div>'
        + fld('model_hint', 'โมเดล AI แนะนำ', false, 'text', d.model_hint, 'เช่น ChatGPT, Gemini, Claude')
        + fld('tags', 'แท็ก (คั่นด้วยจุลภาค)', false, 'text', d.tags, 'เช่น แผนการสอน, STEM, active learning')
        + fldArea('example_output', 'ตัวอย่างผลลัพธ์', d.example_output, 'วางตัวอย่างผลลัพธ์ที่ได้ (ไม่บังคับ)') + '</div>';
    }
    // review
    var cm = catMap()[d.category_key] || {};
    var canPublish = hasCap('prompt.create');
    return '<div class="wiz-pane">' + wsec('ตรวจสอบและบันทึก', 'check2-circle')
      + '<table class="wiz-review-table"><tr><td class="lbl">ชื่อ</td><td>' + esc(d.title || '-') + '</td></tr>'
      + '<tr><td class="lbl">หมวดหมู่</td><td>' + esc(cm.label || d.category_key || '-') + '</td></tr>'
      + '<tr><td class="lbl">ระดับชั้น</td><td>' + esc(d.level || '-') + '</td></tr>'
      + '<tr><td class="lbl">วิชา</td><td>' + esc(d.subject || '-') + '</td></tr>'
      + '<tr><td class="lbl">โมเดล</td><td>' + esc(d.model_hint || '-') + '</td></tr>'
      + '<tr><td class="lbl">แท็ก</td><td>' + esc(d.tags || '-') + '</td></tr></table>'
      + '<div class="wiz-review-block' + (d.body ? '' : ' empty') + '"><div class="t">คำสั่ง (Prompt)</div><div style="font-family:monospace;font-size:13px;white-space:pre-wrap;color:#a7f3d0">' + esc(d.body || '(ยังไม่ได้กรอก)') + '</div></div>'
      + '<div class="pd-note" style="margin-top:14px"><i class="bi bi-info-circle"></i> ' + (canPublish ? 'หลังบันทึก Prompt จะถูกเผยแพร่ทันที' : 'Prompt ที่คุณเสนอจะอยู่สถานะ "รออนุมัติ" จนกว่าผู้ดูแลจะตรวจสอบ') + '</div></div>';
    function wsec(t, i) { return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><div class="nav-page-ic"><i class="bi bi-' + i + '"></i></div><div style="font-size:16px;font-weight:700;color:#f0fdf4">' + t + '</div></div>'; }
  }
  function wsec() {}
  function fld(name, label, req, type, val, ph) { return '<div class="field" data-fwrap="' + name + '"><label>' + label + (req ? ' <span class="req">*</span>' : '') + '</label><input class="input" type="' + type + '" data-field="' + name + '" value="' + esc(val || '') + '" placeholder="' + esc(ph || '') + '"></div>'; }
  function fldArea(name, label, val, ph) { return '<div class="field" data-fwrap="' + name + '"><label>' + label + '</label><textarea class="textarea" data-field="' + name + '" placeholder="' + esc(ph || '') + '">' + esc(val || '') + '</textarea></div>'; }
  function captureWiz() { $$('#wiz-pane [data-field]').forEach(function (el) { WIZ.data[el.getAttribute('data-field')] = el.value; }); }
  function validateWiz(s) {
    var d = WIZ.data; var err = {};
    if (s === 1) { if (!d.title || d.title.trim().length < 3) err.title = 'กรุณากรอกชื่ออย่างน้อย 3 ตัว'; if (!d.category_key) err.category_key = 'กรุณาเลือกหมวดหมู่'; }
    if (s === 2) { if (!d.body || d.body.trim().length < 10) err.body = 'เนื้อหา Prompt ต้องมีอย่างน้อย 10 ตัว'; }
    return err;
  }
  function showWizErr(err) {
    $$('#wiz-pane .field').forEach(function (f) { f.classList.remove('has-error'); var e = f.querySelector('.field-error'); if (e) e.remove(); });
    var first = null;
    Object.keys(err).forEach(function (k) { var w = $('#wiz-pane [data-fwrap="' + k + '"]'); if (!w) return; w.classList.add('has-error'); var d = document.createElement('div'); d.className = 'field-error'; d.innerHTML = '<i class="bi bi-exclamation-circle-fill"></i> ' + esc(err[k]); w.appendChild(d); if (!first) first = w.querySelector('[data-field]'); });
    var pane = $('#wiz-pane'); if (pane) { pane.classList.remove('is-shake'); void pane.offsetWidth; pane.style.animation = 'shake .45s'; setTimeout(function () { pane.style.animation = ''; }, 460); }
    if (first) try { first.focus(); } catch (e) {}
    toast('กรุณาแก้ไข ' + Object.keys(err).length + ' รายการ', 'warning');
  }
  function wireWiz() {
    var back = $('#wiz-back'); if (back) back.addEventListener('click', function () { captureWiz(); WIZ.step--; renderWiz(); });
    var next = $('#wiz-next'); if (next) next.addEventListener('click', function () { captureWiz(); var err = validateWiz(WIZ.step); if (Object.keys(err).length) { showWizErr(err); return; } WIZ.step++; WIZ.maxStep = Math.max(WIZ.maxStep, WIZ.step); renderWiz(); });
    var save = $('#wiz-save'); if (save) save.addEventListener('click', function () { captureWiz();
      for (var s = 1; s <= 2; s++) { var err = validateWiz(s); if (Object.keys(err).length) { WIZ.step = s; renderWiz(); setTimeout(function () { showWizErr(validateWiz(WIZ.step)); }, 50); return; } }
      Spinner.show(WIZ.isEdit ? 'กำลังบันทึกการแก้ไข' : 'กำลังบันทึก Prompt', { stages: ['ตรวจสอบข้อมูล', 'บันทึกลงคลัง', 'อัปเดตดัชนี', 'เสร็จสิ้น'] });
      var payload = {}; Object.keys(WIZ.data).forEach(function (k) { payload[k] = WIZ.data[k]; });
      if (WIZ.isEdit) payload.id = WIZ.id;
      call(WIZ.isEdit ? 'prompt.update' : 'prompt.create', payload).then(function (p) {
        Spinner.hide();
        Swal.fire({ icon: 'success', title: WIZ.isEdit ? 'บันทึกการแก้ไขสำเร็จ!' : (hasCap('prompt.create') ? 'เผยแพร่ Prompt สำเร็จ!' : 'เสนอ Prompt สำเร็จ!'), html: '<div style="font-size:14px;color:var(--ink-muted)">' + esc(p.title) + '</div>', timer: 2000, showConfirmButton: false, timerProgressBar: true });
        setTimeout(function () { location.hash = WIZ.isEdit ? '#/library' : (hasCap('prompt.create') ? '#/mine' : '#/library'); }, 1100);
      }).catch(function (e) { Spinner.hide(); toast(e.message, 'error'); });
    });
    // enter key on inputs (not textarea)
    $$('#wiz-pane input').forEach(function (el) { el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); var n = $('#wiz-next'); if (n) n.click(); } }); });
  }

  /* ════════ CATEGORIES (admin) ════════ */
  Routes['#/categories'] = function () {
    var pg = $('#page'); P.setFab('plus-lg', '');
    pg.innerHTML = '<div class="toolbar"><div style="flex:1"></div><button class="btn btn-primary" id="cat-add"><i class="bi bi-plus-lg"></i> เพิ่มหมวดหมู่</button></div><div id="cat-list">' + skeletonCards(6) + '</div>';
    $('#cat-add').addEventListener('click', function () { openCatModal(null); });
    var fab = $('#fab'); if (fab) fab.onclick = function () { openCatModal(null); };
    loadCats();
  };
  function loadCats() {
    call('category.list', { withCount: true }).then(function (r) {
      if (!$('#cat-list')) return;
      var html = '<div class="act-grid" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr))">';
      r.items.forEach(function (c) {
        html += '<div class="pcard" style="cursor:default;--cat-color:' + esc(c.color) + '"><div class="pcard-top"><div class="pcard-cat" style="background:' + esc(c.color) + '"><i class="bi bi-' + esc(c.icon) + '"></i></div>'
          + '<div style="min-width:0;flex:1"><div style="font-size:15px;font-weight:700;color:#f0fdf4">' + esc(c.label) + '</div><div style="font-size:11px;color:var(--ink-dim);font-family:monospace">' + esc(c.key) + '</div></div>'
          + '<span class="badge ' + (c.is_active ? 'b-published' : 'b-archived') + '">' + (c.is_active ? 'เปิด' : 'ปิด') + '</span></div>'
          + '<div style="font-size:13px;color:var(--ink-muted);margin:8px 0">' + esc(c.description || '-') + '</div>'
          + '<div class="pcard-foot"><span class="m"><i class="bi bi-terminal"></i> ' + c.count + ' prompts</span>'
          + '<div style="margin-left:auto;display:flex;gap:6px"><button class="btn btn-ghost btn-sm" data-cat-edit="' + esc(c.id) + '"><i class="bi bi-pencil"></i></button>'
          + '<button class="btn btn-ghost btn-sm" data-cat-toggle="' + esc(c.id) + '"><i class="bi bi-' + (c.is_active ? 'pause' : 'play') + '"></i></button>'
          + '<button class="btn btn-danger btn-sm" data-cat-del="' + esc(c.id) + '"><i class="bi bi-trash"></i></button></div></div></div>';
      });
      html += '</div>';
      $('#cat-list').innerHTML = html;
      $$('[data-cat-edit]').forEach(function (b) { b.addEventListener('click', function () { var c = r.items.filter(function (x) { return String(x.id) === b.getAttribute('data-cat-edit'); })[0]; openCatModal(c); }); });
      $$('[data-cat-toggle]').forEach(function (b) { b.addEventListener('click', function () { call('category.toggle', { id: b.getAttribute('data-cat-toggle') }).then(function () { loadCats(); }).catch(function (e) { toast(e.message, 'error'); }); }); });
      $$('[data-cat-del]').forEach(function (b) { b.addEventListener('click', function () { confirmModal({ title: 'ลบหมวดหมู่', message: 'ลบหมวดนี้?', okText: 'ลบ', danger: true }).then(function (ok) { if (!ok) return; call('category.delete', { id: b.getAttribute('data-cat-del') }).then(function () { toast('ลบเรียบร้อย', 'success'); loadCats(); }).catch(function (e) { toast(e.message, 'error'); }); }); }); });
    }).catch(function (e) { if ($('#cat-list')) $('#cat-list').innerHTML = empty('wifi-off', e.message); });
  }
  var ICONS = ['tag', 'journal-text', 'pencil-square', 'chat-heart', 'stars', 'mortarboard-fill', 'briefcase-fill', 'translate', 'code-slash', 'lightbulb', 'book', 'easel', 'calculator', 'globe', 'palette', 'music-note', 'camera', 'graph-up', 'megaphone', 'puzzle', 'rocket', 'gem', 'shield', 'heart', 'trophy', 'flag', 'compass', 'bookmark', 'cpu', 'robot', 'magic', 'fire'];
  var COLORS = ['#10b981', '#34d399', '#22d3ee', '#0ea5e9', '#6366f1', '#a78bfa', '#8b5cf6', '#ec4899', '#f472b6', '#f43f5e', '#f59e0b', '#fbbf24', '#84cc16', '#14b8a6', '#06b6d4', '#3b82f6', '#d946ef', '#ef4444', '#f97316', '#eab308'];
  function openCatModal(c) {
    var ed = !!c; c = c || { icon: 'tag', color: '#10b981', is_active: true };
    Modal.open({ title: ed ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่', html:
      '<div class="field"><label>Key (ภาษาอังกฤษ) <span class="req">*</span></label><input class="input mono" id="cat-key" value="' + esc(c.key || '') + '" placeholder="lesson_plan" pattern="[-a-z0-9_]+"' + (ed ? '' : '') + '><div class="field-hint">a-z, 0-9, _ เท่านั้น (ใช้อ้างอิงภายใน)</div></div>'
      + '<div class="field"><label>ชื่อหมวดหมู่ <span class="req">*</span></label><input class="input" id="cat-label" value="' + esc(c.label || '') + '" placeholder="แผนการสอน"></div>'
      + '<div class="field"><label>คำอธิบาย</label><input class="input" id="cat-desc" value="' + esc(c.description || '') + '"></div>'
      + '<div class="rows-2"><div class="field"><label>ไอคอน</label><div class="icon-picker" id="cat-icons">' + ICONS.map(function (i) { return '<div class="ic-opt' + (c.icon === i ? ' on' : '') + '" data-ic="' + i + '"><i class="bi bi-' + i + '"></i></div>'; }).join('') + '</div></div>'
      + '<div class="field"><label>สี</label><div class="color-picker" id="cat-colors">' + COLORS.map(function (col) { return '<div class="co-opt' + (c.color === col ? ' on' : '') + '" data-co="' + col + '" style="background:' + col + '"></div>'; }).join('') + '</div></div></div>'
      + '<div class="field"><label class="lf-check"><input type="checkbox" id="cat-active"' + (c.is_active ? ' checked' : '') + '> เปิดใช้งาน</label></div>'
      + '<div style="margin-top:6px"><div style="font-size:12px;color:var(--ink-dim);margin-bottom:6px">ตัวอย่าง:</div><div class="pcard-top"><div class="pcard-cat" id="cat-prev-ic" style="background:' + esc(c.color) + '"><i class="bi bi-' + esc(c.icon) + '"></i></div><div id="cat-prev-l" style="font-weight:700;color:#f0fdf4">' + esc(c.label || 'ชื่อหมวดหมู่') + '</div></div></div>',
      footer: '<button class="btn btn-ghost" data-modal-close>ยกเลิก</button><button class="btn btn-primary" id="cat-save"><i class="bi bi-check-lg"></i> บันทึก</button>',
      onOpen: function (host) {
        var sel = { icon: c.icon, color: c.color };
        function prev() { host.querySelector('#cat-prev-ic').style.background = sel.color; host.querySelector('#cat-prev-ic').innerHTML = '<i class="bi bi-' + sel.icon + '"></i>'; host.querySelector('#cat-prev-l').textContent = host.querySelector('#cat-label').value || 'ชื่อหมวดหมู่'; }
        host.querySelector('#cat-icons').addEventListener('click', function (e) { var o = e.target.closest('[data-ic]'); if (!o) return; sel.icon = o.getAttribute('data-ic'); $$('#cat-icons .ic-opt').forEach(function (x) { x.classList.remove('on'); }); o.classList.add('on'); prev(); });
        host.querySelector('#cat-colors').addEventListener('click', function (e) { var o = e.target.closest('[data-co]'); if (!o) return; sel.color = o.getAttribute('data-co'); $$('#cat-colors .co-opt').forEach(function (x) { x.classList.remove('on'); }); o.classList.add('on'); prev(); });
        host.querySelector('#cat-label').addEventListener('input', prev);
        host.querySelector('#cat-save').addEventListener('click', function () {
          var payload = { id: ed ? c.id : null, key: host.querySelector('#cat-key').value, label: host.querySelector('#cat-label').value, description: host.querySelector('#cat-desc').value, icon: sel.icon, color: sel.color, is_active: host.querySelector('#cat-active').checked };
          Spinner.show('กำลังบันทึกหมวดหมู่', { stages: ['ตรวจสอบ', 'บันทึก', 'เสร็จ'] });
          call('category.upsert', payload).then(function () { Spinner.hide(); Modal.close(); toast('บันทึกเรียบร้อย', 'success'); loadCats(); }).catch(function (e) { Spinner.hide(); toast(e.message, 'error'); });
        });
      } });
  }

  /* ════════ USERS (admin) ════════ */
  var USR = { q: '', role: '', _t: null };
  Routes['#/users'] = function () {
    var pg = $('#page'); P.setFab('person-plus', '');
    pg.innerHTML = '<div class="toolbar"><div class="search-box"><i class="bi bi-search"></i><input id="usr-q" placeholder="ค้นหาชื่อ, username, อีเมล..."></div>'
      + '<select class="tb-select" id="usr-role"><option value="">ทุกบทบาท</option><option value="admin">ผู้ดูแล</option><option value="teacher">ครู</option><option value="student">นักเรียน</option><option value="guest">ผู้เยี่ยมชม</option></select>'
      + '<button class="btn btn-primary" id="usr-add"><i class="bi bi-plus-lg"></i> เพิ่มผู้ใช้</button></div><div id="usr-list">' + skeletonCards(4) + '</div>';
    $('#usr-add').addEventListener('click', function () { openUserModal(null); });
    var fab = $('#fab'); if (fab) fab.onclick = function () { openUserModal(null); };
    $('#usr-q').addEventListener('input', function () { clearTimeout(USR._t); USR._t = setTimeout(function () { USR.q = $('#usr-q').value; loadUsers(); }, 300); });
    $('#usr-role').addEventListener('change', function () { USR.role = $('#usr-role').value; loadUsers(); });
    loadUsers();
  };
  function loadUsers() {
    call('user.list', { q: USR.q, role: USR.role }).then(function (r) {
      if (!$('#usr-list')) return;
      if (!r.items.length) { $('#usr-list').innerHTML = empty('people', 'ไม่พบผู้ใช้'); return; }
      var html = '<div class="tbl-wrap"><table class="data-table"><thead><tr><th>ผู้ใช้</th><th>บทบาท</th><th>กลุ่มสาระ</th><th>Prompts</th><th>สถานะ</th><th></th></tr></thead><tbody>';
      r.items.forEach(function (u) {
        html += '<tr><td><div style="display:flex;align-items:center;gap:10px">' + P.avatarOf(u, 'nav-ava') + '<div><div style="font-weight:600;color:#ecfdf5">' + esc(u.full_name) + '</div><div style="font-size:11px;color:var(--ink-dim);font-family:monospace">' + esc(u.username) + '</div></div></div></td>'
          + '<td>' + P.roleChip(u.role) + '</td><td style="color:var(--ink-muted)">' + esc(u.subject_group || '-') + '</td><td><b style="color:var(--brand-3)">' + u.prompt_count + '</b></td>'
          + '<td><span class="badge ' + (u.is_active ? 'b-published' : 'b-rejected') + '">' + (u.is_active ? 'ใช้งาน' : 'ระงับ') + '</span></td>'
          + '<td><div style="display:flex;gap:5px;justify-content:flex-end"><button class="btn btn-ghost btn-sm" data-u-edit="' + esc(u.id) + '"><i class="bi bi-pencil"></i></button>'
          + '<button class="btn btn-ghost btn-sm" data-u-pw="' + esc(u.id) + '" title="รีเซ็ตรหัสผ่าน"><i class="bi bi-key"></i></button>'
          + '<button class="btn btn-ghost btn-sm" data-u-toggle="' + esc(u.id) + '"><i class="bi bi-' + (u.is_active ? 'pause' : 'play') + '"></i></button></div></td></tr>';
      });
      html += '</tbody></table></div>';
      $('#usr-list').innerHTML = html;
      $$('[data-u-edit]').forEach(function (b) { b.addEventListener('click', function () { openUserModal(r.items.filter(function (x) { return String(x.id) === b.getAttribute('data-u-edit'); })[0]); }); });
      $$('[data-u-toggle]').forEach(function (b) { b.addEventListener('click', function () { call('user.toggle', { id: b.getAttribute('data-u-toggle') }).then(function () { loadUsers(); }).catch(function (e) { toast(e.message, 'error'); }); }); });
      $$('[data-u-pw]').forEach(function (b) { b.addEventListener('click', function () { confirmModal({ title: 'รีเซ็ตรหัสผ่าน', message: 'รีเซ็ตเป็น 123456?', okText: 'รีเซ็ต' }).then(function (ok) { if (!ok) return; call('user.reset_password', { id: b.getAttribute('data-u-pw') }).then(function (rr) { alertSuccess('รีเซ็ตแล้ว', 'รหัสผ่านใหม่: <b>' + rr.password + '</b>'); }).catch(function (e) { toast(e.message, 'error'); }); }); }); });
    }).catch(function (e) { if ($('#usr-list')) $('#usr-list').innerHTML = empty('wifi-off', e.message); });
  }
  function openUserModal(u) {
    var ed = !!u; u = u || { role: 'student', is_active: true };
    Modal.open({ title: ed ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้', html:
      (ed ? '' : '<div class="field"><label>ชื่อผู้ใช้ <span class="req">*</span></label><input class="input mono" id="u-username" placeholder="a-z, 0-9, _ ."></div>')
      + '<div class="field"><label>ชื่อ-นามสกุล <span class="req">*</span></label><input class="input" id="u-name" value="' + esc(u.full_name || '') + '"></div>'
      + '<div class="rows-2"><div class="field"><label>บทบาท</label><select class="select" id="u-role"><option value="student"' + (u.role === 'student' ? ' selected' : '') + '>นักเรียน</option><option value="teacher"' + (u.role === 'teacher' ? ' selected' : '') + '>ครู</option><option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>ผู้ดูแล</option><option value="guest"' + (u.role === 'guest' ? ' selected' : '') + '>ผู้เยี่ยมชม</option></select></div>'
      + '<div class="field"><label>กลุ่มสาระ</label><input class="input" id="u-subject" value="' + esc(u.subject_group || '') + '"></div></div>'
      + '<div class="rows-2"><div class="field"><label>อีเมล</label><input class="input" id="u-email" value="' + esc(u.email || '') + '"></div>'
      + '<div class="field"><label>เบอร์โทร</label><input class="input" id="u-phone" value="' + esc(u.phone || '') + '"></div></div>'
      + '<div class="field"><label>รหัสผ่าน' + (ed ? ' (เว้นว่างถ้าไม่เปลี่ยน)' : '') + '</label><input class="input" type="text" id="u-pw" placeholder="' + (ed ? 'ไม่เปลี่ยน' : '123456') + '"></div>',
      footer: '<button class="btn btn-ghost" data-modal-close>ยกเลิก</button><button class="btn btn-primary" id="u-save"><i class="bi bi-check-lg"></i> บันทึก</button>',
      onOpen: function (host) {
        host.querySelector('#u-save').addEventListener('click', function () {
          var payload = { id: ed ? u.id : null, full_name: host.querySelector('#u-name').value, role: host.querySelector('#u-role').value, subject_group: host.querySelector('#u-subject').value, email: host.querySelector('#u-email').value, phone: host.querySelector('#u-phone').value, password: host.querySelector('#u-pw').value };
          if (!ed) payload.username = host.querySelector('#u-username').value;
          Spinner.show('กำลังบันทึกผู้ใช้', { stages: ['ตรวจสอบ', 'บันทึก', 'เสร็จ'] });
          call('user.upsert', payload).then(function () { Spinner.hide(); Modal.close(); toast('บันทึกเรียบร้อย', 'success'); loadUsers(); }).catch(function (e) { Spinner.hide(); toast(e.message, 'error'); });
        });
      } });
  }

  /* ════════ REPORTS ════════ */
  Routes['#/reports'] = function () {
    var pg = $('#page'); P.setFab('', '');
    pg.innerHTML = '<div class="sd-grid-stats">' + '<div class="sk" style="height:110px;border-radius:16px"></div>'.repeat(4) + '</div>' + '<div class="panel"><div class="sk" style="height:200px"></div></div>';
    call('report.overview', {}).then(function (d) {
      if (!$('#page')) return;
      var s = d.stats;
      var html = '<div class="hero" style="margin-bottom:18px"><div class="hero-pill"><i class="bi bi-bar-chart-fill"></i> รายงานสรุป</div><div class="hero-title">ภาพรวมคลังคำสั่ง AI</div><div class="hero-sub">สร้างเมื่อ ' + TH.dateTime(d.generated_at) + '</div></div>';
      html += '<div class="sd-grid-stats sd-stagger">'
        + stat('g-emerald', 'terminal-fill', s.total, 'Prompts เผยแพร่')
        + stat('g-sky', 'eye-fill', s.views, 'ยอดเข้าชมรวม')
        + stat('g-amber', 'clipboard-check-fill', s.copies, 'คัดลอกรวม')
        + stat('g-violet', 'star-fill', s.avg_rating, 'คะแนนเฉลี่ย')
        + stat('g-rose', 'people-fill', s.contributors, 'ผู้สร้าง') + '</div>';
      html += '<div class="sd-grid-2"><div class="panel"><div class="panel-head"><div class="panel-title"><i class="bi bi-pie-chart-fill"></i> ตามหมวดหมู่</div></div>' + horizBars(d.by_category, d.cat_map) + '</div>'
        + '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bi bi-mortarboard-fill"></i> ตามระดับชั้น</div></div>' + horizBars(d.by_level, {}) + '</div></div>';
      if (d.authors && d.authors.length) {
        html += '<div class="panel"><div class="panel-head"><div class="panel-title"><i class="bi bi-trophy-fill"></i> ผู้สร้างยอดเยี่ยม</div><button class="btn btn-sm btn-ghost sd-no-print" onclick="window.print()"><i class="bi bi-printer"></i> พิมพ์</button></div><div class="tbl-wrap"><table class="data-table"><thead><tr><th>อันดับ</th><th>ชื่อ</th><th>Prompts</th><th>เข้าชม</th><th>คัดลอก</th></tr></thead><tbody>';
        d.authors.slice(0, 15).forEach(function (a, i) { html += '<tr><td><div class="medal medal-' + (i < 3 ? (i + 1) : 'n') + '">' + (i + 1) + '</div></td><td style="font-weight:600;color:#ecfdf5">' + esc(a.name) + '</td><td><b style="color:var(--brand-3)">' + a.count + '</b></td><td>' + fnum(a.views) + '</td><td>' + fnum(a.copies) + '</td></tr>'; });
        html += '</tbody></table></div></div>';
      }
      pg.innerHTML = html; animateBars();
    }).catch(function (e) { if ($('#page')) $('#page').innerHTML = empty('wifi-off', e.message); });
    function stat(g, ic, v, l) { return '<div class="sd-stat"><div class="sd-stat-ic ' + g + '"><i class="bi bi-' + ic + '"></i></div><div class="sd-stat-v">' + fnum(v) + '</div><div class="sd-stat-l">' + l + '</div></div>'; }
  };

  /* ════════ SETTINGS ════════ */
  Routes['#/settings'] = function () {
    var pg = $('#page'); P.setFab('', '');
    pg.innerHTML = '<div class="panel"><div class="sk" style="height:300px"></div></div>';
    call('setting.get', {}).then(function (s) {
      if (!$('#page')) return;
      pg.innerHTML = '<div class="panel" style="max-width:680px"><div class="panel-head"><div class="panel-title"><i class="bi bi-building"></i> ข้อมูลองค์กร</div></div>'
        + '<div class="field"><label>ชื่อโรงเรียน/องค์กร</label><input class="input" id="set-org" value="' + esc(s.org_name || '') + '"></div>'
        + '<div class="field"><label>URL โลโก้</label><input class="input" id="set-logo" value="' + esc(s.org_logo || '') + '"></div></div>'
        + '<div class="panel" style="max-width:680px"><div class="panel-head"><div class="panel-title"><i class="bi bi-toggles"></i> การใช้งาน</div></div>'
        + toggle('set-demo', 'show_demo_users', 'แสดงการ์ดบัญชีทดลองในหน้าล็อกอิน', s.show_demo_users, 'ปิดก่อนใช้งานจริง (Production)')
        + toggle('set-reg', 'allow_register', 'อนุญาตให้สมัครสมาชิกเอง', s.allow_register, 'ครูและนักเรียนสมัครเองได้')
        + toggle('set-sug', 'student_suggest', 'อนุญาตให้นักเรียนเสนอ Prompt', s.student_suggest, 'Prompt ที่เสนอจะรออนุมัติ')
        + '</div><div style="max-width:680px"><button class="btn btn-primary" id="set-save"><i class="bi bi-check-lg"></i> บันทึกการตั้งค่า</button></div>';
      $('#set-save').addEventListener('click', function () {
        var payload = { org_name: $('#set-org').value, org_logo: $('#set-logo').value,
          show_demo_users: $('#set-demo').checked ? 'yes' : 'no', allow_register: $('#set-reg').checked ? 'yes' : 'no', student_suggest: $('#set-sug').checked ? 'yes' : 'no' };
        Spinner.show('กำลังบันทึกการตั้งค่า', { stages: ['ตรวจสอบ', 'บันทึก', 'อัปเดตระบบ'] });
        call('setting.update', payload).then(function () { Spinner.hide(); alertSuccess('บันทึกสำเร็จ', 'การตั้งค่าถูกบันทึกแล้ว'); }).catch(function (e) { Spinner.hide(); toast(e.message, 'error'); });
      });
    }).catch(function (e) { if ($('#page')) $('#page').innerHTML = empty('wifi-off', e.message); });
    function toggle(id, key, label, val, hint) { return '<div class="field"><label class="lf-check" style="color:var(--ink)"><input type="checkbox" id="' + id + '"' + (val === 'yes' ? ' checked' : '') + '> ' + label + '</label><div class="field-hint">' + hint + '</div></div>'; }
  };

  /* ════════ AUDIT ════════ */
  var AUD = { q: '', action: '', page: 1, _t: null };
  Routes['#/audit'] = function () {
    var pg = $('#page'); P.setFab('', '');
    pg.innerHTML = '<div class="toolbar"><div class="search-box"><i class="bi bi-search"></i><input id="aud-q" placeholder="ค้นหา ผู้ใช้, action..."></div><select class="tb-select" id="aud-action"><option value="">ทุก action</option></select></div><div id="aud-list">' + skeletonCards(3) + '</div>';
    $('#aud-q').addEventListener('input', function () { clearTimeout(AUD._t); AUD._t = setTimeout(function () { AUD.q = $('#aud-q').value; AUD.page = 1; loadAudit(); }, 300); });
    $('#aud-action').addEventListener('change', function () { AUD.action = $('#aud-action').value; AUD.page = 1; loadAudit(); });
    loadAudit();
  };
  function loadAudit() {
    call('audit.list', { q: AUD.q, action: AUD.action, page: AUD.page }).then(function (r) {
      if (!$('#aud-list')) return;
      var sel = $('#aud-action'); if (sel && sel.options.length <= 1) r.actions.forEach(function (a) { var o = document.createElement('option'); o.value = a; o.textContent = a; sel.appendChild(o); });
      if (!r.items.length) { $('#aud-list').innerHTML = empty('clock-history', 'ไม่พบประวัติ'); return; }
      var html = '<div class="tbl-wrap"><table class="data-table"><thead><tr><th>เวลา</th><th>ผู้ใช้</th><th>การกระทำ</th><th>เป้าหมาย</th></tr></thead><tbody>';
      r.items.forEach(function (a) { html += '<tr><td style="color:var(--ink-muted);white-space:nowrap">' + TH.smart(a.created_at) + '</td><td style="font-weight:600;color:#ecfdf5">' + esc(a.username) + '</td><td><span class="ptag">' + esc(a.action) + '</span></td><td style="color:var(--ink-dim);font-size:12px">' + esc(a.entity) + (a.entity_id ? ' · ' + esc(String(a.entity_id).substring(0, 8)) : '') + '</td></tr>'; });
      html += '</tbody></table></div>';
      if (r.pages > 1) { html += '<div style="display:flex;gap:8px;justify-content:center;margin-top:16px">' + (r.page > 1 ? '<button class="btn btn-ghost btn-sm" data-ap="' + (r.page - 1) + '">ก่อนหน้า</button>' : '') + '<span class="wiz-pill">หน้า ' + r.page + '/' + r.pages + '</span>' + (r.page < r.pages ? '<button class="btn btn-ghost btn-sm" data-ap="' + (r.page + 1) + '">ถัดไป</button>' : '') + '</div>'; }
      $('#aud-list').innerHTML = html;
      $$('[data-ap]').forEach(function (b) { b.addEventListener('click', function () { AUD.page = Number(b.getAttribute('data-ap')); loadAudit(); }); });
    }).catch(function (e) { if ($('#aud-list')) $('#aud-list').innerHTML = empty('wifi-off', e.message); });
  }

  /* ════════ PROFILE ════════ */
  Routes['#/profile'] = function () {
    var pg = $('#page'); P.setFab('', ''); var u = Store.user;
    var bigAva = u.avatar_url
      ? '<img class="pf-ava" src="' + esc(u.avatar_url) + '" referrerpolicy="no-referrer">'
      : '<div class="pf-ava">' + esc((u.full_name || '?').trim().charAt(0)) + '</div>';
    pg.innerHTML = '<div class="panel" style="max-width:680px"><div style="display:flex;align-items:center;gap:16px;margin-bottom:18px">'
      + '<div style="position:relative">' + bigAva + '<label for="pf-file" style="position:absolute;bottom:-4px;right:-4px;width:30px;height:30px;border-radius:50%;background:var(--brand-2);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#022c22"><i class="bi bi-camera-fill"></i></label><input type="file" id="pf-file" accept="image/*" capture="environment" hidden></div>'
      + '<div><div style="font-size:20px;font-weight:800;color:#f0fdf4">' + esc(u.full_name) + '</div><div style="margin:5px 0">' + P.roleChip(u.role) + '</div><div style="font-size:12px;color:var(--ink-dim)">' + esc(u.username) + '</div></div></div>'
      + '<div class="rows-2"><div class="field"><label>ชื่อ-นามสกุล</label><input class="input" id="pf-name" value="' + esc(u.full_name) + '"></div><div class="field"><label>กลุ่มสาระ</label><input class="input" id="pf-subject" value="' + esc(u.subject_group || '') + '"></div></div>'
      + '<div class="rows-2"><div class="field"><label>อีเมล</label><input class="input" id="pf-email" value="' + esc(u.email || '') + '"></div><div class="field"><label>เบอร์โทร</label><input class="input" id="pf-phone" value="' + esc(u.phone || '') + '"></div></div>'
      + '<div class="field"><label>เกี่ยวกับฉัน</label><textarea class="textarea" id="pf-bio">' + esc(u.bio || '') + '</textarea></div>'
      + '<div style="display:flex;gap:10px"><button class="btn btn-primary" id="pf-save"><i class="bi bi-check-lg"></i> บันทึก</button><button class="btn btn-ghost" onclick="window.openChangePassword()"><i class="bi bi-key"></i> เปลี่ยนรหัสผ่าน</button></div></div>';
    var avatarUrl = u.avatar_url || '';
    $('#pf-file').addEventListener('change', function (e) {
      var file = e.target.files[0]; if (!file) return;
      var rd = new FileReader();
      rd.onload = function () { Spinner.show('กำลังอัปโหลดรูป', { stages: ['อ่านไฟล์', 'อัปโหลด', 'บันทึก'] });
        call('file.upload', { data: rd.result, mime: file.type }).then(function (r) { Spinner.hide(); avatarUrl = r.url; toast('อัปโหลดรูปสำเร็จ — กดบันทึกเพื่อยืนยัน', 'success'); var av = $('.pf-ava'); if (av) av.outerHTML = '<img class="pf-ava" src="' + r.url + '" referrerpolicy="no-referrer">'; }).catch(function (er) { Spinner.hide(); toast(er.message, 'error'); }); };
      rd.readAsDataURL(file);
    });
    $('#pf-save').addEventListener('click', function () {
      Spinner.show('กำลังบันทึกโปรไฟล์', { stages: ['ตรวจสอบ', 'บันทึก', 'อัปเดต'] });
      call('profile.update', { full_name: $('#pf-name').value, subject_group: $('#pf-subject').value, email: $('#pf-email').value, phone: $('#pf-phone').value, bio: $('#pf-bio').value, avatar_url: avatarUrl }).then(function (nu) {
        Spinner.hide(); Store.user = nu; alertSuccess('บันทึกสำเร็จ', 'ข้อมูลโปรไฟล์อัปเดตแล้ว').then(function () { renderShellSafe(); P.dispatch(); });
      }).catch(function (e) { Spinner.hide(); toast(e.message, 'error'); });
    });
  };
  function renderShellSafe() { if (window.renderShell) window.renderShell(); }

})();

