/**
 * Injects unified compliance copy + model version into each calculator page.
 */
(function () {
  var mounts = document.querySelectorAll('[data-bb-trust-mount]');
  if (!mounts.length) return;

  var aside =
    '<aside class="bb-disclaimer bb-disclaimer--legal" role="note">' +
    '<strong>Important:</strong> Illustrative outputs only — not personalised financial advice or a product recommendation. For advice on your situation, contact Bloomsbury Associates.' +
    '</aside>' +
    '<footer class="bb-model-foot" role="contentinfo">' +
    '<img class="bb-foot-icon" src="assets/icon.jpg" alt="" width="40" height="40" decoding="async" />' +
    '<span class="bb-model-foot__text">' +
    '<span class="bb-model-foot__meta">Calculator model v1.1</span>' +
    '<span class="bb-model-foot__sep" aria-hidden="true">·</span>' +
    '<span class="bb-model-foot__meta">As at <time datetime="2026-04-20">20 April 2026</time></span>' +
    '</span>' +
    '</footer>';

  mounts.forEach(function (el) {
    el.innerHTML = aside;
  });
})();
