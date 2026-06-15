<!--
═══════════════════════════════════════════════════════════════
 PROMPT VAULT · File: ScriptsCore.html — SPA core (inert) · boot · router · auth · shell
 Version: 1.0.0 · Last Update: 2026-05-30 · ครูวิรัตน์ หาดคำ
═══════════════════════════════════════════════════════════════
-->

(function () {
  'use strict';

  /* ═══ STATE ═══ */
  var Store = { token: null, user: null, caps: [], boot: null };
  window.Routes = window.Routes || {};
  var Routes = window.Routes;

  /* ═══ DOM HELPERS ═══ */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fnum(n) { return Number(n || 0).toLocaleString('en-US'); }
  function avatarOf(u) {
    if (u && u.avatar_url) return '<img class="' + (arguments[1] || 'nav-ava') + '" src="' + esc(u.avatar_url) + '" referrerpolicy="no-referrer">';
    var ini = u && u.full_name ? u.full_name.trim().charAt(0) : '?';
    return '<div class="' + (arguments[1] || 'nav-ava') + '">' + esc(ini) + '</div>';
  }

  /* ═══ TH DATE ═══ */
  var TH = {
    M: ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'],
    MS: ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'],
    D: ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'],
    p2: function (n) { return (n < 10 ? '0' : '') + n; },
    parse: function (v) { if (!v) return null; if (v instanceof Date) return v; var d = new Date(v); return isNaN(d.getTime()) ? null : d; },
    date: function (v) { var d = this.parse(v); if (!d) return '-'; return d.getDate() + ' ' + this.MS[d.getMonth()] + ' ' + (d.getFullYear() + 543); },
    dateLong: function (v) { var d = this.parse(v); if (!d) return '-'; return 'วัน' + this.D[d.getDay()] + 'ที่ ' + d.getDate() + ' ' + this.M[d.getMonth()] + ' ' + (d.getFullYear() + 543); },
    time: function (v) { var d = this.parse(v); if (!d) return '-'; return this.p2(d.getHours()) + ':' + this.p2(d.getMinutes()) + ' น.'; },
    dateTime: function (v) { var d = this.parse(v); if (!d) return '-'; return this.date(v) + ' ' + this.time(v); },
    smart: function (v) {
      var d = this.parse(v); if (!d) return '-';
      var diff = Date.now() - d.getTime();
      if (diff < 0) return this.dateTime(v);
      var s = Math.floor(diff / 1000);
      if (s < 60) return 'เมื่อสักครู่';
      var m = Math.floor(s / 60); if (m < 60) return m + ' นาทีที่แล้ว';
      var h = Math.floor(m / 60); if (h < 24) return h + ' ชั่วโมงที่แล้ว';
      var dd = Math.floor(h / 24); if (dd < 7) return dd + ' วันที่แล้ว';
      return this.date(v);
    }
  };

  /* ═══ API (timeout + guard) ═══ */
  function call(action, payload) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var to = setTimeout(function () { if (!settled) { settled = true; reject(new Error('การเชื่อมต่อหมดเวลา (30s) — ' + action)); } }, 30000);
      try {
        if (!window.google || !google.script || !google.script.run) { clearTimeout(to); return reject(new Error('ไม่พบ google.script.run — โปรดเปิดผ่าน URL ของ Web App ที่ Deploy แล้ว')); }
        google.script.run
          .withSuccessHandler(function (res) {
            if (settled) return; settled = true; clearTimeout(to);
            if (!res) return reject(new Error('ไม่ได้รับคำตอบจากเซิร์ฟเวอร์'));
            if (res.ok) resolve(res.data); else reject(new Error(res.error || 'เกิดข้อผิดพลาด'));
          })
          .withFailureHandler(function (e) { if (settled) return; settled = true; clearTimeout(to); reject(new Error(e && e.message ? e.message : String(e))); })
          .api({ action: action, token: Store.token, payload: payload || {} });
      } catch (e) { clearTimeout(to); if (!settled) { settled = true; reject(e); } }
    });
  }

  /* ═══ RBAC ═══ */
  function hasCap(cap) {
    if (!cap || cap === '*') return true;
    var caps = Store.caps || [];
    return String(cap).split('|').some(function (c) {
      c = c.trim(); if (!c) return false; if (c === '*') return true;
      if (caps.indexOf(c) >= 0) return true;
      if (/\.(view_own|edit_own|view_self|edit_self|create_own|suggest|favorite)$/.test(c)) return false;
      var dot = c.indexOf('.');
      if (dot > 0 && caps.indexOf(c.substring(0, dot) + '.manage') >= 0) return true;
      return false;
    });
  }
  function roleChip(role) {
    var labels = (Store.boot && Store.boot.roles) || { admin: 'ผู้ดูแล', teacher: 'ครู', student: 'นักเรียน', guest: 'ผู้เยี่ยมชม' };
    return '<span class="role-chip role-chip-' + esc(role) + '"><i class="bi bi-shield-check"></i> ' + esc(labels[role] || role) + '</span>';
  }

  /* ═══ TOAST / ALERT / SPINNER / MODAL ═══ */
  function toast(msg, type, dur) {
    if (!window.Swal) return;
    Swal.fire({ toast: true, position: 'top-end', icon: type || 'success', title: msg, showConfirmButton: false,
      timer: dur || (type === 'error' ? 4500 : 2800), timerProgressBar: true,
      showClass: { popup: 'animate__animated animate__fadeInRight animate__faster' },
      hideClass: { popup: 'animate__animated animate__fadeOutRight animate__faster' } });
  }
  function alertSuccess(t, m) { return Swal.fire({ icon: 'success', title: t, html: m || '', confirmButtonText: 'ตกลง', showClass: { popup: 'animate__animated animate__zoomIn animate__faster' } }); }
  function alertError(t, m) { return Swal.fire({ icon: 'error', title: t, html: m || '', confirmButtonText: 'ตกลง', showClass: { popup: 'animate__animated animate__shakeX' } }); }
  function confirmModal(o) {
    o = o || {};
    return Swal.fire({ icon: o.danger ? 'warning' : 'question', title: o.title || 'ยืนยัน', html: o.message || '',
      showCancelButton: true, confirmButtonText: o.okText || 'ยืนยัน', cancelButtonText: o.cancelText || 'ยกเลิก', reverseButtons: true,
      showClass: { popup: 'animate__animated animate__zoomIn animate__faster' } }).then(function (r) { return r.isConfirmed; });
  }

  var Spinner = (function () {
    var timer = null, host = null;
    function ensure() {
      host = $('#spinner-host');
      if (!host.innerHTML) {
        host.innerHTML = '<div class="qspin"><div class="qspin-core"><div class="qspin-ring"></div><div class="qspin-ring"></div><div class="qspin-ring"></div><div class="qspin-dot"><i class="bi bi-cpu"></i></div></div><div class="qspin-text" id="qspin-text">กำลังประมวลผล</div><div class="qspin-sub" id="qspin-sub"></div><div class="qspin-bar"><span></span></div></div>';
      }
    }
    return {
      show: function (msg, opts) {
        ensure(); $('#qspin-text').textContent = msg || 'กำลังประมวลผล';
        host.classList.add('on');
        opts = opts || {};
        var stages = opts.stages || [];
        var sub = $('#qspin-sub'); var i = 0;
        if (timer) clearInterval(timer);
        if (stages.length) { sub.textContent = stages[0]; timer = setInterval(function () { i = (i + 1) % stages.length; sub.textContent = stages[i]; }, opts.stageInterval || 900); }
        else sub.textContent = '';
      },
      hide: function () { if (timer) { clearInterval(timer); timer = null; } if (host) host.classList.remove('on'); }
    };
  })();

  var Modal = {
    open: function (opts) {
      var host = $('#modal-host');
      var html = '<div class="modal-card' + (opts.large ? ' lg' : '') + '">'
        + (opts.title ? '<div class="md-header"><div class="md-title">' + esc(opts.title) + '</div><button class="md-close" data-modal-close><i class="bi bi-x-lg"></i></button></div>' : '')
        + '<div class="md-body">' + (opts.html || '') + '</div>'
        + (opts.footer ? '<div class="md-footer">' + opts.footer + '</div>' : '')
        + '</div>';
      host.innerHTML = html;
      host.classList.add('is-open');
      if (opts.onOpen) try { opts.onOpen(host); } catch (e) {}
    },
    close: function () { var h = $('#modal-host'); h.classList.remove('is-open'); h.innerHTML = ''; }
  };

  /* ═══ SESSION ═══ */
  function saveSession(token, user, caps) {
    Store.token = token; Store.user = user; Store.caps = caps || [];
    try { localStorage.setItem('pv.token', token); } catch (e) {}
  }
  function clearSession() {
    Store.token = null; Store.user = null; Store.caps = [];
    try { localStorage.removeItem('pv.token'); } catch (e) {}
  }

  /* ═══ BOOT ═══ */
  function setBootText(t) { var el = $('#bl-text'); if (el) el.textContent = t; }
  function hideBootLoader() { var bl = $('#boot-loader'); if (bl) bl.hidden = true; }
  function showFatalError(msg, detail) {
    var bl = $('#boot-loader'); if (bl) try { bl.remove(); } catch (e) {}
    var root = $('#app-root');
    if (!root) { alert(msg); return; }
    root.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">'
      + '<div style="max-width:460px;background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:30px;text-align:center">'
      + '<div style="width:62px;height:62px;margin:0 auto 14px;border-radius:50%;background:linear-gradient(135deg,#f43f5e,#e11d48);display:flex;align-items:center;justify-content:center;font-size:30px;color:#fff"><i class="bi bi-exclamation-triangle-fill"></i></div>'
      + '<h2 style="font-size:18px;margin:0 0 8px;color:#f0fdf4">เกิดข้อผิดพลาด</h2>'
      + '<p style="font-size:14px;color:var(--ink-muted);margin:0 0 14px">' + esc(msg) + '</p>'
      + (detail ? '<details style="text-align:left;background:#020617;border-radius:8px;padding:10px;margin-bottom:14px"><summary style="cursor:pointer;color:#34d399;font-size:12px">รายละเอียด</summary><pre style="white-space:pre-wrap;font-size:10px;color:#94a3b8;margin-top:8px">' + esc(detail) + '</pre></details>' : '')
      + '<button class="btn btn-primary" onclick="location.reload()"><i class="bi bi-arrow-clockwise"></i> ลองใหม่</button>'
      + '</div></div>';
  }

  function boot() {
    try { Store.token = localStorage.getItem('pv.token') || null; } catch (e) {}
    setBootText('กำลังโหลดข้อมูลเริ่มต้น...');
    call('app.bootstrap', {}).then(function (data) {
      try {
        if (!data || typeof data !== 'object') throw new Error('ข้อมูล bootstrap ไม่ถูกต้อง');
        Store.boot = data; Store.user = data.me || null; Store.caps = data.caps || [];
        hideBootLoader();
        if (Store.user) {
          if (!location.hash || location.hash === '#') {
            try { history.replaceState(null, '', location.pathname + location.search + '#/dashboard'); } catch (e) { location.hash = '#/dashboard'; }
          }
          renderShell(); dispatch();
        } else { clearSession(); renderLogin(); }
      } catch (re) { if (window.console) console.error(re); showFatalError('การแสดงผลล้มเหลว: ' + re.message, re.stack); }
    }).catch(function (e) { if (window.console) console.error(e); showFatalError((e && e.message) || 'ไม่สามารถเชื่อมต่อระบบ', e && e.stack); });
  }

  /* ═══ LOGIN ═══ */
  var loginMode = 'login';
  function renderLogin() {
    var b = Store.boot || {}; var app = b.app || {}; var allowReg = (b.settings && b.settings.allow_register) === 'yes';
    var particles = ''; for (var i = 0; i < 16; i++) { particles += '<i class="bi bi-terminal" style="left:' + Math.floor(Math.random() * 100) + '%;animation-duration:' + (14 + Math.floor(Math.random() * 12)) + 's;animation-delay:-' + Math.floor(Math.random() * 16) + 's"></i>'; }
    var ps = b.public_stats || {};
    var isReg = loginMode === 'register';
    var html = '<div class="login-stage"><div class="login-grid-bg"></div><div class="lparticles">' + particles + '</div>'
      + '<div class="login-shell">'
      + '<div class="lbrand">'
      +   '<div class="lbrand-logo"><i class="bi bi-' + esc(app.logo_icon || 'terminal-fill') + '"></i></div>'
      +   '<div class="lbrand-name">PROMPT<span>VAULT</span></div>'
      +   '<div class="lbrand-tag">' + esc(app.org || 'คลังคำสั่ง AI') + '</div>'
      +   '<div class="lbrand-big">คลัง<span class="shine">คำสั่ง AI</span><br>สำหรับครูและนักเรียน</div>'
      +   '<div class="lfeat">'
      +     feat('lightning-charge-fill', 'ค้นเจอใน 3 วินาที', 'ค้นหา + กรอง + คัดลอกพร้อมใช้ทันที')
      +     feat('people-fill', 'แบ่งปันทั้งโรงเรียน', 'ครูสร้าง นักเรียนเสนอ ทุกคนได้ใช้')
      +     feat('shield-lock-fill', 'ข้อมูลปลอดภัย', 'เข้ารหัสระดับธนาคาร เก็บบนระบบของคุณเอง')
      +     feat('phone-fill', 'ใช้ได้ทุกอุปกรณ์', 'มือถือ แท็บเล็ต คอม ลื่นไหลเหมือนแอป')
      +   '</div>'
      +   '<div class="lstats"><div><div class="lstat-v">' + fnum(ps.total_prompts || 0) + '</div><div class="lstat-l">Prompts</div></div>'
      +     '<div><div class="lstat-v">' + fnum(ps.total_copies || 0) + '</div><div class="lstat-l">ครั้งที่คัดลอก</div></div>'
      +     '<div><div class="lstat-v">' + fnum(ps.total_categories || 0) + '</div><div class="lstat-l">หมวดหมู่</div></div></div>'
      + '</div>'
      + '<div class="lform">'
      +   '<div class="lbrand-mini"><div class="lbrand-logo" style="width:42px;height:42px;font-size:21px"><i class="bi bi-terminal-fill"></i></div><div class="lbrand-name" style="font-size:19px">PROMPT<span>VAULT</span></div></div>'
      +   '<div class="lform-title">' + (isReg ? 'เริ่มต้นใช้งาน' : 'ยินดีต้อนรับกลับ') + '</div>'
      +   '<div class="lform-sub">' + (isReg ? 'สร้างบัญชีเพื่อเข้าใช้คลังคำสั่ง AI' : 'เข้าสู่ระบบเพื่อจัดการคลังคำสั่ง AI') + '</div>'
      +   '<form class="lf" id="login-form" novalidate>'
      +     (isReg ? field('full_name', 'person-badge', 'ชื่อ-นามสกุล', 'text') : '')
      +     field('username', 'person', 'ชื่อผู้ใช้', 'text')
      +     '<div class="lf-iw"><i class="bi bi-lock lf-ic"></i><input class="lf-input" type="password" name="password" placeholder="รหัสผ่าน" autocomplete="' + (isReg ? 'new-password' : 'current-password') + '"><button type="button" class="lf-toggle" data-pwtoggle><i class="bi bi-eye"></i></button></div>'
      +     '<div class="lf-caps" id="caps-warn"><i class="bi bi-capslock"></i> Caps Lock เปิดอยู่</div>'
      +     (isReg ? '<div class="lf-iw"><i class="bi bi-mortarboard lf-ic"></i><select class="lf-input" name="role" style="padding-left:40px"><option value="student">นักเรียน</option><option value="teacher">ครู</option></select></div>' : '')
      +     (!isReg ? '<div class="lf-row"><label class="lf-check"><input type="checkbox" id="remember"> จดจำฉัน</label><button type="button" class="lf-link" data-forgot>ลืมรหัสผ่าน?</button></div>' : '')
      +     submitBtn(isReg ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ', isReg ? 'person-plus' : 'box-arrow-in-right')
      +   '</form>'
      +   ((allowReg) ? '<div class="lf-switch">' + (isReg ? 'มีบัญชีแล้ว? <button class="lf-link" data-switch="login">เข้าสู่ระบบ →</button>' : 'ยังไม่มีบัญชี? <button class="lf-link" data-switch="register">สมัครสมาชิก →</button>') + '</div>' : '')
      +   '<div id="demo-host"></div>'
      + '</div></div>'
      + loginFooter() + '</div>';
    $('#app-root').innerHTML = html;
    try { wireLogin(); } catch (e) { if (window.console) console.error(e); }
    if (!isReg) loadDemoUsers();
    function feat(ic, t, d) { return '<div class="lfeat-item"><div class="lfeat-ic"><i class="bi bi-' + ic + '"></i></div><div><div class="lfeat-t">' + t + '</div><div class="lfeat-d">' + d + '</div></div></div>'; }
    function field(name, ic, ph, type) { return '<div class="lf-iw"><i class="bi bi-' + ic + ' lf-ic"></i><input class="lf-input" type="' + type + '" name="' + name + '" placeholder="' + ph + '" spellcheck="false" autocomplete="' + (name === 'username' ? 'username' : 'off') + '"></div>'; }
  }
  function submitBtn(label, ic) {
    return '<button type="submit" class="lf-submit">'
      + '<span class="lf-submit-state lf-submit-state-default"><i class="bi bi-' + ic + '"></i> ' + label + '</span>'
      + '<span class="lf-submit-state lf-submit-state-loading"><span class="lf-droplets"><span></span><span></span><span></span></span><span class="lf-status">กำลังตรวจสอบ...</span></span>'
      + '<span class="lf-submit-state lf-submit-state-success"><i class="bi bi-check-circle-fill"></i> สำเร็จ!</span>'
      + '<span class="lf-submit-state lf-submit-state-error"><i class="bi bi-exclamation-triangle-fill"></i> ไม่สำเร็จ</span></button>';
  }
  function loginFooter() {
    var d = (Store.boot && Store.boot.dev) || {}; var app = (Store.boot && Store.boot.app) || {};
    var y = new Date().getFullYear();
    return '<div class="app-footer" style="background:rgba(255,255,255,.03);position:relative;z-index:1;margin:14px auto 0;max-width:1060px;width:100%">'
      + '<div style="display:flex;align-items:center;gap:8px"><span class="af-year">' + y + '</span> © ' + esc(app.name || 'Prompt Vault') + ' <span style="font-size:10px;color:var(--ink-dim)">v' + esc(app.version || '1.0.0') + '</span></div>'
      + '<div class="af-dev"><a class="af-dev-link" href="' + esc(d.URL || '#') + '" target="_blank" rel="noopener noreferrer"><img class="af-dev-logo" src="' + esc(d.LOGO || '') + '" referrerpolicy="no-referrer"></a>'
      + '<div><div style="font-size:10px;color:var(--ink-dim)">ผู้พัฒนาโดย</div><a class="af-dev-name" href="' + esc(d.URL || '#') + '" target="_blank" rel="noopener noreferrer">' + esc(d.NAME || '') + '</a></div></div></div>';
  }
  function loadDemoUsers() {
    call('auth.demo_users', {}).then(function (r) {
      if (!r.items || !r.items.length) return;
      var host = $('#demo-host'); if (!host) return;
      var icons = { admin: 'shield-fill-check', teacher: 'mortarboard-fill', student: 'person-fill' };
      var html = '<div class="lf-demo"><div class="lf-demo-head"><i class="bi bi-stars"></i> ทดลองด้วยบัญชีตัวอย่าง<span class="lf-demo-pill">DEMO</span></div><div class="lf-demo-grid">';
      r.items.forEach(function (u) {
        html += '<button type="button" class="lf-demo-card" data-role="' + esc(u.role) + '" data-user="' + esc(u.username) + '" aria-label="เข้าสู่ระบบด้วย ' + esc(u.full_name) + '">'
          + '<div class="lf-demo-ic"><i class="bi bi-' + (icons[u.role] || 'person') + '"></i></div>'
          + '<div class="lf-demo-r">' + esc((Store.boot.roles || {})[u.role] || u.role) + '</div><div class="lf-demo-u">' + esc(u.username) + '</div></button>';
      });
      html += '</div><div class="lf-demo-note"><i class="bi bi-hand-index"></i> คลิกการ์ดเพื่อเข้าระบบทันที (รหัส: ' + esc(r.password) + ')</div></div>';
      host.innerHTML = html;
      $$('.lf-demo-card', host).forEach(function (card) {
        card.addEventListener('click', function () {
          var f = $('#login-form'); if (!f) return;
          var un = f.querySelector('input[name="username"]');
          var pw = f.querySelector('input[name="password"]');
          if (un) { un.value = card.getAttribute('data-user'); un.dispatchEvent(new Event('input', { bubbles: true })); }
          if (pw) { pw.value = r.password; pw.dispatchEvent(new Event('input', { bubbles: true })); }
          doLoginSubmit(f);
        });
      });
    }).catch(function () {});
  }
  function wireLogin() {
    var f = $('#login-form'); if (!f) return;
    var first = f.querySelector('input[name="full_name"]') || f.querySelector('input[name="username"]');
    if (first) try { first.focus(); } catch (e) {}
    var pw = f.querySelector('input[name="password"]');
    if (pw) pw.addEventListener('keyup', function (e) { var w = $('#caps-warn'); if (w) w.classList.toggle('on', e.getModifierState && e.getModifierState('CapsLock')); });
    f.addEventListener('submit', function (e) { e.preventDefault(); doLoginSubmit(f); });
    // remembered username
    try { var last = localStorage.getItem('pv.lastUser'); if (last && loginMode === 'login') { var un = f.querySelector('input[name="username"]'); if (un) { un.value = last; if (pw) pw.focus(); } } } catch (e) {}
  }
  function doLoginSubmit(f) {
    var btn = f.querySelector('.lf-submit');
    var fd = {}; $$('input,select', f).forEach(function (el) { if (el.name) fd[el.name] = el.value; });
    fd.ua = navigator.userAgent;
    if (!fd.username || !fd.password) { f.classList.add('shake'); setTimeout(function () { f.classList.remove('shake'); }, 500); toast('กรุณากรอกข้อมูลให้ครบ', 'warning'); return; }
    btn.setAttribute('data-state', 'loading');
    var stages = ['กำลังตรวจสอบข้อมูล...', 'ยืนยันตัวตน...', 'เตรียมระบบ...', 'เกือบเสร็จแล้ว...'], idx = 0;
    var statusEl = btn.querySelector('.lf-status'); if (statusEl) statusEl.textContent = stages[0];
    var st = setInterval(function () { idx = (idx + 1) % stages.length; if (statusEl) statusEl.textContent = stages[idx]; }, 700);
    var action = loginMode === 'register' ? 'auth.register' : 'auth.login';
    call(action, fd).then(function (res) {
      clearInterval(st); btn.setAttribute('data-state', 'success');
      try { if ($('#remember') && $('#remember').checked) localStorage.setItem('pv.lastUser', fd.username); } catch (e) {}
      saveSession(res.token, res.user, res.caps);
      setTimeout(function () {
        call('app.bootstrap', {}).then(function (data) {
          Store.boot = data; Store.user = data.me; Store.caps = data.caps || [];
          try { history.replaceState(null, '', location.pathname + location.search + '#/dashboard'); } catch (e) { location.hash = '#/dashboard'; }
          renderShell(); dispatch();
        });
      }, 700);
    }).catch(function (e) {
      clearInterval(st); btn.setAttribute('data-state', 'error');
      f.classList.add('shake'); setTimeout(function () { f.classList.remove('shake'); }, 500);
      toast(e.message, 'error');
      setTimeout(function () { btn.removeAttribute('data-state'); }, 1600);
    });
  }
  function doLogout() {
    confirmModal({ title: 'ออกจากระบบ', message: 'ต้องการออกจากระบบใช่หรือไม่?', okText: 'ออกจากระบบ', danger: true }).then(function (ok) {
      if (!ok) return;
      var t = Store.token;
      clearSession(); Modal.close(); Spinner.hide();
      var pop = $('.nav-profile-popover'); if (pop) pop.remove();
      closeSidebar();
      if (window.__pvClock) { clearInterval(window.__pvClock); window.__pvClock = null; }
      try { call('auth.logout', {}).catch(function () {}); } catch (e) {}
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
      loginMode = 'login'; renderLogin();
      toast('ออกจากระบบเรียบร้อย', 'success', 2000);
    });
  }

  /* ═══ SHELL ═══ */
  var MENU = [
    { cat: 'ภาพรวม', items: [{ h: '#/dashboard', i: 'grid-1x2-fill', l: 'แดชบอร์ด', cap: '*' }] },
    { cat: 'คลังคำสั่ง', items: [
      { h: '#/library', i: 'collection-fill', l: 'คลัง Prompt', cap: '*' },
      { h: '#/favorites', i: 'star-fill', l: 'รายการโปรด', cap: 'prompt.favorite|prompt.view_all', roles: ['admin','teacher','student'] },
      { h: '#/mine', i: 'person-workspace', l: 'ของฉัน', cap: 'prompt.create|prompt.suggest', roles: ['admin','teacher','student'] },
      { h: '#/prompt/new', i: 'plus-circle-fill', l: 'สร้าง Prompt', cap: 'prompt.create|prompt.suggest', roles: ['admin','teacher','student'] }
    ]},
    { cat: 'ข้อมูลหลัก', items: [
      { h: '#/categories', i: 'tags-fill', l: 'หมวดหมู่', cap: 'category.manage' },
      { h: '#/users', i: 'people-fill', l: 'ผู้ใช้งาน', cap: 'user.manage' }
    ]},
    { cat: 'รายงาน', items: [
      { h: '#/reports', i: 'bar-chart-fill', l: 'รายงานสรุป', cap: 'report.view_all|report.view_own', roles: ['admin','teacher'] },
      { h: '#/audit', i: 'clock-history', l: 'ประวัติการใช้งาน', cap: 'audit.view_all' }
    ]},
    { cat: 'ระบบ', items: [{ h: '#/settings', i: 'gear-fill', l: 'ตั้งค่าระบบ', cap: 'setting.manage' }] },
    { cat: 'ส่วนตัว', items: [{ h: '#/profile', i: 'person-circle', l: 'โปรไฟล์', cap: '*' }] }
  ];
  function canSeeMenu(it) {
    var role = Store.user ? Store.user.role : 'guest';
    if (it.roles && it.roles.indexOf(role) < 0) return false;
    return hasCap(it.cap);
  }
  var PAGE_META = {
    '#/dashboard': ['grid-1x2-fill', 'แดชบอร์ด', 'ภาพรวมคลังคำสั่ง AI'],
    '#/library': ['collection-fill', 'คลัง Prompt', 'ค้นหาและคัดลอกคำสั่ง AI'],
    '#/favorites': ['star-fill', 'รายการโปรด', 'Prompt ที่คุณบันทึกไว้'],
    '#/mine': ['person-workspace', 'ของฉัน', 'Prompt ที่คุณสร้าง'],
    '#/prompt/new': ['plus-circle-fill', 'สร้าง Prompt', 'เพิ่มคำสั่ง AI ใหม่'],
    '#/prompt/edit': ['pencil-fill', 'แก้ไข Prompt', 'ปรับปรุงคำสั่ง AI'],
    '#/categories': ['tags-fill', 'หมวดหมู่', 'จัดการหมวดหมู่ Prompt'],
    '#/users': ['people-fill', 'ผู้ใช้งาน', 'จัดการบัญชีผู้ใช้'],
    '#/reports': ['bar-chart-fill', 'รายงานสรุป', 'สถิติและการวิเคราะห์'],
    '#/audit': ['clock-history', 'ประวัติการใช้งาน', 'บันทึกกิจกรรมในระบบ'],
    '#/settings': ['gear-fill', 'ตั้งค่าระบบ', 'กำหนดค่าระบบ'],
    '#/profile': ['person-circle', 'โปรไฟล์', 'จัดการข้อมูลส่วนตัว']
  };

  function renderShell() {
    var u = Store.user; var app = (Store.boot && Store.boot.app) || {};
    var sb = '';
    MENU.forEach(function (g) {
      var vis = g.items.filter(canSeeMenu);
      if (!vis.length) return;
      sb += '<div class="sb-cat">' + esc(g.cat) + '</div>';
      vis.forEach(function (it) { sb += '<a class="sb-link" href="' + it.h + '"><i class="bi bi-' + it.i + '"></i> ' + esc(it.l) + '<span class="sb-badge" data-badge="' + it.h + '" hidden></span></a>'; });
    });
    sb += '<div class="sb-cat">ออกจากระบบ</div><a class="sb-link is-logout" data-action="logout"><i class="bi bi-box-arrow-right"></i> ออกจากระบบ</a>';

    var html = '<div class="shell">'
      + '<aside class="sidebar" id="sidebar">'
      +   '<div class="sb-head"><div class="sb-logo-row"><div class="sb-logo"><i class="bi bi-' + esc(app.logo_icon || 'terminal-fill') + '"></i></div>'
      +     '<div><div class="sb-name">PROMPT<span>VAULT</span></div><div class="sb-org">' + esc(app.org || '') + '</div></div></div>'
      +     '<div class="sb-clock"><div class="sb-clock-time" id="sb-clock-time">--:--:--</div><div class="sb-clock-date" id="sb-clock-date"></div></div>'
      +     '<div class="sb-user">' + avatarOf(u, 'sb-ava') + '<div style="min-width:0"><div class="sb-uname">' + esc(u.full_name) + '</div>' + roleChip(u.role) + '</div></div>'
      +   '</div><nav class="sb-nav">' + sb + '</nav></aside>'
      + '<div class="sidebar-backdrop" id="sidebar-backdrop"></div>'
      + '<div class="main-area">'
      +   '<header class="navbar"><button class="nav-burger" id="nav-burger"><i class="bi bi-list"></i></button>'
      +     '<div class="nav-page-ic" id="nav-page-ic"><i class="bi bi-grid-1x2-fill"></i></div>'
      +     '<div><div class="nav-page-title" id="nav-page-title">แดชบอร์ด</div><div class="nav-page-sub" id="nav-page-sub"></div></div>'
      +     '<div class="nav-spacer"></div>'
      +     '<div class="nav-pill"><span class="nav-dot"></span> ออนไลน์</div>'
      +     '<span class="nav-clock" id="nav-clock"></span>'
      +     '<button class="nav-profile" id="nav-profile">' + avatarOf(u, 'nav-ava') + '<span class="nav-profile-name">' + esc(u.full_name.split(' ')[0]) + '</span><i class="bi bi-chevron-down" style="font-size:11px;color:var(--ink-dim)"></i></button>'
      +   '</header>'
      +   '<div class="page-wrap" id="page"></div>'
      +   appFooter()
      + '</div></div>'
      + '<button class="fab" id="fab" hidden></button>'
      + bottomNav();
    $('#app-root').innerHTML = html;
    wireShell(); startClock();
  }
  function appFooter() {
    var d = (Store.boot && Store.boot.dev) || {}; var app = (Store.boot && Store.boot.app) || {}; var y = new Date().getFullYear();
    return '<div class="app-footer"><div style="display:flex;align-items:center;gap:8px"><span class="af-year">' + y + '</span> © ' + esc(app.name || 'Prompt Vault') + ' <span style="font-size:10px;color:var(--ink-dim)">v' + esc(app.version || '') + '</span></div>'
      + '<div class="af-dev"><a class="af-dev-link" href="' + esc(d.URL || '#') + '" target="_blank" rel="noopener noreferrer"><img class="af-dev-logo" src="' + esc(d.LOGO || '') + '" referrerpolicy="no-referrer"></a>'
      + '<div><div style="font-size:10px;color:var(--ink-dim)">ผู้พัฒนาโดย</div><a class="af-dev-name" href="' + esc(d.URL || '#') + '" target="_blank" rel="noopener noreferrer">' + esc(d.NAME || '') + '</a></div></div></div>';
  }
  function bottomNav() {
    var role = Store.user ? Store.user.role : 'guest';
    var items = [{ h: '#/dashboard', i: 'grid-1x2-fill', l: 'หน้าแรก' }, { h: '#/library', i: 'collection-fill', l: 'คลัง' }];
    if (hasCap('prompt.create|prompt.suggest') && role !== 'guest') items.push({ h: '#/prompt/new', i: 'plus-circle-fill', l: 'สร้าง' });
    if (role !== 'guest') items.push({ h: '#/favorites', i: 'star-fill', l: 'โปรด' });
    items.push({ h: '#/profile', i: 'person-circle', l: 'โปรไฟล์' });
    var html = '<nav class="bottom-nav" id="bottom-nav">';
    items.slice(0, 5).forEach(function (it) { html += '<a class="bn-item" href="' + it.h + '" data-bn="' + it.h + '"><i class="bi bi-' + it.i + '"></i><span>' + esc(it.l) + '</span></a>'; });
    return html + '</nav>';
  }
  function wireShell() {
    if (window.__pvShellWired) return; window.__pvShellWired = true;
    document.addEventListener('click', function (e) {
      // 1) data-action
      var actEl = e.target.closest && e.target.closest('[data-action]');
      if (actEl) {
        var act = actEl.getAttribute('data-action');
        if (act === 'logout') { e.preventDefault(); var pop = $('.nav-profile-popover'); if (pop) pop.remove(); doLogout(); return; }
      }
      // 2) modal close
      var mc = e.target.closest && e.target.closest('[data-modal-close]');
      if (mc) { e.preventDefault(); Modal.close(); return; }
      if (e.target === $('#modal-host')) { Modal.close(); return; }
      // 3) burger / backdrop
      if (e.target.closest && e.target.closest('#nav-burger')) { e.preventDefault(); toggleSidebar(); return; }
      if (e.target.closest && e.target.closest('#sidebar-backdrop')) { closeSidebar(); return; }
      // 4) profile
      if (e.target.closest && e.target.closest('#nav-profile')) { e.preventDefault(); toggleProfile(); return; }
      // 5) anchor hash
      var a = e.target.closest && e.target.closest('a[href]');
      if (a) {
        var href = a.getAttribute('href');
        if (href && href.charAt(0) === '#') {
          if (href === '#') return;
          if (a.target && a.target !== '_top' && a.target !== '_self') return;
          e.preventDefault();
          var pop2 = $('.nav-profile-popover'); if (pop2) pop2.remove();
          if (window.innerWidth <= 1024) closeSidebar();
          if (href === location.hash) dispatch(); else location.hash = href;
          return;
        }
      }
      // 6) data-hash on non-anchor
      var hh = e.target.closest && e.target.closest('[data-hash]');
      if (hh && hh.tagName !== 'A') { e.preventDefault(); var nh = hh.getAttribute('data-hash'); if (nh) { if (window.innerWidth <= 1024) closeSidebar(); if (nh === location.hash) dispatch(); else location.hash = nh; } return; }
      // close profile popover on outside
      if (!(e.target.closest && e.target.closest('.nav-profile-popover'))) { var p = $('.nav-profile-popover'); if (p) p.remove(); }
    }, true);
    window.addEventListener('hashchange', dispatch);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { Modal.close(); closeSidebar(); var p = $('.nav-profile-popover'); if (p) p.remove(); } });
  }
  function toggleSidebar() { var s = $('#sidebar'), b = $('#sidebar-backdrop'); if (s) s.classList.toggle('open'); if (b) b.classList.toggle('show'); }
  function closeSidebar() { var s = $('#sidebar'), b = $('#sidebar-backdrop'); if (s) s.classList.remove('open'); if (b) b.classList.remove('show'); }
  function toggleProfile() {
    var ex = $('.nav-profile-popover'); if (ex) { ex.remove(); return; }
    var u = Store.user;
    var pop = document.createElement('div'); pop.className = 'nav-profile-popover';
    pop.innerHTML = '<div class="npp-head">' + avatarOf(u, 'nav-ava') + '<div style="min-width:0"><div style="font-size:13px;font-weight:600;color:#ecfdf5">' + esc(u.full_name) + '</div><div style="font-size:11px;color:var(--ink-dim)">' + esc(u.email || u.username) + '</div></div></div>'
      + '<a class="npp-item" href="#/profile"><i class="bi bi-person"></i> โปรไฟล์ของฉัน</a>'
      + '<div class="npp-item" data-action="changepw"><i class="bi bi-key"></i> เปลี่ยนรหัสผ่าน</div>'
      + '<div class="npp-div"></div><div class="npp-item danger" data-action="logout"><i class="bi bi-box-arrow-right"></i> ออกจากระบบ</div>';
    document.body.appendChild(pop);
    pop.querySelector('[data-action="changepw"]').addEventListener('click', function () { pop.remove(); window.openChangePassword(); });
  }
  function startClock() {
    if (window.__pvClock) clearInterval(window.__pvClock);
    function tick() {
      var n = new Date();
      var t = TH.p2(n.getHours()) + ':' + TH.p2(n.getMinutes()) + ':' + TH.p2(n.getSeconds());
      var ct = $('#sb-clock-time'); if (ct) ct.textContent = t;
      var cd = $('#sb-clock-date'); if (cd) cd.textContent = TH.dateLong(n);
      var nc = $('#nav-clock'); if (nc) nc.textContent = TH.D[n.getDay()].substring(0, 2) + '. ' + TH.date(n) + ' · ' + t.substring(0, 5) + ' น.';
    }
    tick(); window.__pvClock = setInterval(tick, 1000);
  }

  /* ═══ ROUTER ═══ */
  var ROUTE_GUARDS = {
    '#/categories': { cap: 'category.manage' }, '#/users': { cap: 'user.manage' },
    '#/settings': { cap: 'setting.manage' }, '#/audit': { cap: 'audit.view_all' },
    '#/reports': { cap: 'report.view_all|report.view_own', roles: ['admin', 'teacher'] }
  };
  function checkGuard(route) { var g = ROUTE_GUARDS[route]; if (!g) return true; if (g.roles && g.roles.indexOf(Store.user.role) < 0) return false; return hasCap(g.cap); }
  function updateNav(hash) {
    var base = hash.split('?')[0];
    var meta = PAGE_META[base] || PAGE_META[base.split('/').slice(0, 2).join('/')] || ['grid-1x2-fill', 'Prompt Vault', ''];
    var ic = $('#nav-page-ic'); if (ic) ic.innerHTML = '<i class="bi bi-' + meta[0] + '"></i>';
    var t = $('#nav-page-title'); if (t) t.textContent = meta[1];
    var s = $('#nav-page-sub'); if (s) s.textContent = meta[2];
    var best = null, bestLen = 0;
    $$('.sb-link[href]').forEach(function (a) {
      a.classList.remove('is-active');
      var href = a.getAttribute('href').split('?')[0];
      if (base === href || base.indexOf(href + '/') === 0) { if (href.length > bestLen) { best = a; bestLen = href.length; } }
    });
    if (best) best.classList.add('is-active');
    $$('.bn-item[data-bn]').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-bn').split('?')[0] === base); });
  }
  function dispatch() {
    if (!$('#page')) return;
    if (!Store.token || !Store.user) { renderLogin(); return; }
    var hash = location.hash || '#/dashboard';
    var base = hash.split('?')[0];
    if (!checkGuard(base)) { toast('คุณไม่มีสิทธิ์เข้าถึงหน้านี้', 'warning'); location.hash = '#/dashboard'; return; }
    var handler = Routes[hash] || Routes[base];
    if (!handler) {
      var parts = base.split('/');
      while (parts.length > 1 && !handler) { parts.pop(); var pp = parts.join('/'); if (pp && pp !== '#') handler = Routes[pp]; else break; }
    }
    if (!handler) handler = Routes['#/dashboard'];
    updateNav(hash);
    try { handler(hash); } catch (e) { if (window.console) console.error(e); var pg = $('#page'); if (pg) pg.innerHTML = '<div class="empty-state"><i class="bi bi-bug"></i><p>เกิดข้อผิดพลาด: ' + esc(e.message) + '</p></div>'; }
  }
  function setFab(icon, hash) {
    var fab = $('#fab'); if (!fab) return;
    fab.onclick = null; fab.removeAttribute('data-hash');
    if (!icon) { fab.hidden = true; return; }
    fab.hidden = false; fab.innerHTML = '<i class="bi bi-' + icon + '"></i>';
    if (hash) fab.setAttribute('data-hash', hash);
  }

  /* ═══ CHANGE PASSWORD ═══ */
  function openChangePassword() {
    Modal.open({ title: 'เปลี่ยนรหัสผ่าน', html:
      '<div class="field"><label>รหัสผ่านปัจจุบัน <span class="req">*</span></label><input class="input" type="password" id="cp-cur"></div>'
      + '<div class="field"><label>รหัสผ่านใหม่ <span class="req">*</span></label><input class="input" type="password" id="cp-new"></div>'
      + '<div class="field"><label>ยืนยันรหัสผ่านใหม่ <span class="req">*</span></label><input class="input" type="password" id="cp-conf"><div class="field-hint">อย่างน้อย 6 ตัวอักษร</div></div>',
      footer: '<button class="btn btn-ghost" data-modal-close>ยกเลิก</button><button class="btn btn-primary" id="cp-save"><i class="bi bi-check-lg"></i> บันทึก</button>',
      onOpen: function (host) {
        host.querySelector('#cp-save').addEventListener('click', function () {
          var cur = $('#cp-cur').value, nw = $('#cp-new').value, cf = $('#cp-conf').value;
          if (nw !== cf) { toast('รหัสผ่านใหม่ไม่ตรงกัน', 'warning'); return; }
          Spinner.show('กำลังเปลี่ยนรหัสผ่าน', { stages: ['ตรวจสอบรหัสเดิม', 'เข้ารหัสรหัสใหม่', 'บันทึก'] });
          call('auth.change_password', { current: cur, next: nw }).then(function () { Spinner.hide(); Modal.close(); alertSuccess('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อย'); })
            .catch(function (e) { Spinner.hide(); toast(e.message, 'error'); });
        });
      } });
  }

  /* ═══ PUBLIC SURFACE ═══ */
  window.PV = {
    Store: Store, call: call, esc: esc, fnum: fnum, hasCap: hasCap, roleChip: roleChip, avatarOf: avatarOf, TH: TH,
    toast: toast, alertSuccess: alertSuccess, alertError: alertError, confirmModal: confirmModal, Spinner: Spinner, Modal: Modal,
    dispatch: dispatch, setFab: setFab, $: $, $$: $$, canSeeMenu: canSeeMenu
  };
  window.PV_boot = boot;
  window.renderShell = renderShell;
  window.renderLogin = renderLogin;
  window.dispatch = dispatch;
  window.openChangePassword = openChangePassword;
  window.$pv = $; window.$$pv = $$;
})();

