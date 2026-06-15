<!--
═══════════════════════════════════════════════════════════════
 PROMPT VAULT · File: Scripts.html — Bootstrap loader (executes inert blocks)
 Version: 1.0.0 · Last Update: 2026-05-30 · ครูวิรัตน์ หาดคำ
═══════════════════════════════════════════════════════════════
-->

(function () {
  function setText(t) { var el = document.getElementById('bl-text'); if (el) el.textContent = t; }
  function injectAll() {
    var blocks = document.querySelectorAll('script[type^="text/x-pv"]');
    if (!blocks.length) { setText('ไม่พบสคริปต์หลัก'); return false; }
    setText('กำลังโหลดสคริปต์หลัก (' + blocks.length + ' ส่วน)...');
    for (var i = 0; i < blocks.length; i++) {
      var src = blocks[i].textContent || '';
      if (!src) continue;
      try {
        var s = document.createElement('script');
        s.text = src;
        document.body.appendChild(s);
      } catch (e) {
        setText('โหลดสคริปต์ล้มเหลว: ' + (e && e.message ? e.message : e));
        if (window.console) console.error('[PV] inject error', e);
        return false;
      }
    }
    return true;
  }
  function start() {
    if (!injectAll()) return;
    if (typeof window.PV_boot === 'function') {
      window.__pvBootCalled = true;
      try { window.PV_boot(); } catch (e) { setText('Boot error: ' + e.message); if (window.console) console.error('[PV] boot threw', e); }
    } else {
      setText('ไม่พบฟังก์ชัน PV_boot — สคริปต์หลักอาจโหลดไม่สมบูรณ์');
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, false);
  else start();
  // Fallback guard
  setTimeout(function () {
    if (!window.__pvBootCalled && typeof window.PV_boot === 'function') {
      window.__pvBootCalled = true;
      try { window.PV_boot(); } catch (e) {}
    }
  }, 800);
})();

