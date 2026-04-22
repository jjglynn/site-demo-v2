/**
 * Bloomsbury calculator tools — session email gate.
 * First time "Generate" is used in a session, user enters email; stored in sessionStorage.
 */
(function () {
  var KEY_PREFIX = 'bb_calc_email_';
  var lastFocus = null;
  var docEscHandler = null;

  function isValidEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
  }

  function getFocusable(panel) {
    return panel.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
  }

  function trapKeydown(e) {
    if (e.key !== 'Tab') return;
    var overlay = document.getElementById('bb-email-gate-overlay');
    if (!overlay || !overlay.classList.contains('bb-gate-open')) return;
    var panel = overlay.querySelector('.bb-gate-panel');
    if (!panel) return;
    var list = Array.prototype.slice.call(getFocusable(panel));
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function ensureModal() {
    if (document.getElementById('bb-email-gate-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'bb-email-gate-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'bb-email-gate-title');
    overlay.innerHTML =
      '<div class="bb-gate-panel">' +
      '<h2 id="bb-email-gate-title">Continue to results</h2>' +
      '<p class="bb-gate-copy">Email for our records if you follow up later. Nothing is sent from this page. No marketing without consent.</p>' +
      '<label class="bb-gate-label" for="bb-email-gate-input">Email</label>' +
      '<input type="email" id="bb-email-gate-input" class="bb-gate-input" autocomplete="email" placeholder="you@example.co.nz" />' +
      '<p class="bb-gate-error" id="bb-email-gate-error" hidden>Please enter a valid email address.</p>' +
      '<div class="bb-gate-actions">' +
      '<button type="button" class="bb-btn bb-btn--ghost" id="bb-email-gate-cancel">Cancel</button>' +
      '<button type="button" class="bb-btn bb-btn--primary" id="bb-email-gate-confirm">Continue</button>' +
      '</div></div>';

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) cancelGate();
    });

    document.addEventListener('keydown', trapKeydown);
  }

  var pendingResolve = null;

  function setMainInert(inert) {
    var main = document.querySelector('main');
    if (!main) return;
    if (inert) {
      if ('inert' in HTMLElement.prototype) main.setAttribute('inert', '');
      main.setAttribute('aria-hidden', 'true');
    } else {
      main.removeAttribute('inert');
      main.removeAttribute('aria-hidden');
    }
  }

  function cancelGate() {
    if (docEscHandler) {
      document.removeEventListener('keydown', docEscHandler, true);
      docEscHandler = null;
    }
    var overlay = document.getElementById('bb-email-gate-overlay');
    if (overlay) overlay.classList.remove('bb-gate-open');
    var input = document.getElementById('bb-email-gate-input');
    if (input) input.value = '';
    var err = document.getElementById('bb-email-gate-error');
    if (err) err.hidden = true;
    document.body.style.overflow = '';
    setMainInert(false);
    pendingResolve = null;
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
    lastFocus = null;
  }

  function openGate(onAllowed) {
    ensureModal();
    var overlay = document.getElementById('bb-email-gate-overlay');
    var input = document.getElementById('bb-email-gate-input');
    var err = document.getElementById('bb-email-gate-error');
    var confirmBtn = document.getElementById('bb-email-gate-confirm');
    var cancelBtn = document.getElementById('bb-email-gate-cancel');

    lastFocus = document.activeElement;
    pendingResolve = onAllowed;
    err.hidden = true;
    document.body.style.overflow = 'hidden';
    setMainInert(true);
    overlay.classList.add('bb-gate-open');
    docEscHandler = function (ev) {
      if (ev.key !== 'Escape') return;
      var o = document.getElementById('bb-email-gate-overlay');
      if (!o || !o.classList.contains('bb-gate-open')) return;
      ev.preventDefault();
      cancelGate();
    };
    document.addEventListener('keydown', docEscHandler, true);
    setTimeout(function () {
      input.focus();
    }, 50);

    function onConfirm() {
      var v = input.value.trim();
      if (!isValidEmail(v)) {
        err.hidden = false;
        input.focus();
        input.select();
        return;
      }
      err.hidden = true;
      if (docEscHandler) {
        document.removeEventListener('keydown', docEscHandler, true);
        docEscHandler = null;
      }
      sessionStorage.setItem(overlay.dataset.storageKey, v);
      overlay.classList.remove('bb-gate-open');
      input.value = '';
      document.body.style.overflow = '';
      setMainInert(false);
      var fn = pendingResolve;
      pendingResolve = null;
      var refocus = lastFocus;
      lastFocus = null;
      if (fn) fn();
      if (refocus && typeof refocus.focus === 'function') refocus.focus();
    }

    confirmBtn.onclick = onConfirm;
    cancelBtn.onclick = cancelGate;
    input.onkeydown = function (e) {
      if (e.key === 'Enter') onConfirm();
      if (e.key === 'Escape') {
        e.stopPropagation();
        cancelGate();
      }
    };
  }

  /**
   * @param {string} pageId - unique id for this calculator page
   * @param {function(): void} runFn - calculation / render to run once allowed
   */
  window.bbRunWithEmailGate = function (pageId, runFn) {
    var key = KEY_PREFIX + pageId;
    var stored = sessionStorage.getItem(key);
    if (stored && isValidEmail(stored)) {
      runFn();
      return;
    }
    ensureModal();
    var overlay = document.getElementById('bb-email-gate-overlay');
    overlay.dataset.storageKey = key;
    openGate(runFn);
  };
})();
