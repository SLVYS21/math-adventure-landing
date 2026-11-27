// Code personnel pour le visiteur qui revient (après la démo, ou plus tard) sans avoir payé.
// Montré UNE fois, dans un panneau en bas qu'on ferme d'un geste. Le serveur fixe la date limite :
// revenir ou vider le navigateur ne relance pas le compte à rebours, et le code ne marche que pour lui.
(function () {
  var cfg = window.MA_CONFIG || {};
  var visit = window.maVisit;
  if (!visit || !cfg.serverUrl || !cfg.promoOff) return;
  var KEY = 'ma-promo';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var sep = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var price = window.maPrice || cfg.price;
  var promoPrice = price - cfg.promoOff;

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  var promo = load();
  var left = function () { return promo ? promo.exp - Date.now() : 0; };
  var clock = function (ms) {
    var t = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(t / 60), s = t % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  };

  // ---------------------------------------------------------------- code appliqué dans le formulaire
  var field = $('#f-code');
  var strip = null;
  var timer = 0;
  var payPrice = $('#pay [data-price]');
  var stickyPrice = $('#sticky [data-price]');

  function showPrice(on) {
    var txt = sep(on ? promoPrice : price) + ' F CFA';
    if (payPrice) payPrice.textContent = txt;
    if (stickyPrice) stickyPrice.textContent = txt;
  }
  function applied() { return !!promo && left() > 0 && field && field.value.trim().toUpperCase() === promo.code; }

  function render() {
    var on = applied();
    showPrice(on);
    if (strip) strip.hidden = !on;
    if (on) $('[data-promo-left]', strip).textContent = clock(left());
  }

  function apply() {
    if (!promo || left() <= 0 || !field) return;
    field.value = promo.code;
    var det = field.closest('details');
    if (det) det.open = true;
    if (!strip) {
      strip = document.createElement('p');
      strip.className = 'promo-on';
      strip.setAttribute('role', 'status');
      strip.innerHTML = 'Votre code <strong>' + promo.code + '</strong> : <strong>' + sep(promoPrice) + ' F</strong> au lieu de ' + sep(price) + ' F · encore <strong class="promo-on__t" data-promo-left></strong>';
      var priceEl = $('#offre .price');
      if (priceEl) priceEl.insertAdjacentElement('afterend', strip);
    }
    field.addEventListener('input', render);
    clearInterval(timer);
    timer = setInterval(function () {
      if (left() <= 0) {
        clearInterval(timer);
        if (field.value.trim().toUpperCase() === promo.code) field.value = '';
        if (strip) strip.remove();
        strip = null;
        showPrice(false);
        return;
      }
      render();
    }, 1000);
    render();
  }

  // ---------------------------------------------------------------- panneau du bas
  function offer(p) {
    var wrap = document.createElement('div');
    wrap.className = 'sheet';
    wrap.innerHTML =
      '<div class="sheet__scrim" data-close></div>' +
      '<section class="sheet__card" role="dialog" aria-modal="true" aria-labelledby="sheet-t" aria-describedby="sheet-d">' +
        '<img class="sheet__tim" src="assets/tim.svg" alt="" width="64" height="64">' +
        '<h2 id="sheet-t">Content de vous revoir !</h2>' +
        '<p id="sheet-d">Pour vous seul, la version complète passe à <strong>' + sep(promoPrice) + ' F</strong> au lieu de ' + sep(price) + ' F.</p>' +
        '<p class="sheet__code"><span>Votre code</span> <strong>' + p.code + '</strong></p>' +
        '<p class="sheet__time">Valable encore <strong data-sheet-left>' + clock(left()) + '</strong></p>' +
        '<button type="button" class="btn btn--buy btn--lg btn--block" data-use>Profiter de ' + sep(promoPrice) + ' F</button>' +
        '<button type="button" class="sheet__no" data-close>Non merci</button>' +
      '</section>';
    document.body.appendChild(wrap);
    var t = $('[data-sheet-left]', wrap);
    var tick = setInterval(function () { t.textContent = clock(left()); if (left() <= 0) close(false); }, 1000);
    var last = document.activeElement;

    function close(use) {
      clearInterval(tick);
      document.removeEventListener('keydown', onKey);
      wrap.classList.remove('is-in');
      setTimeout(function () { wrap.remove(); }, reduced ? 0 : 220);
      visit.step(use ? 'promo_use' : 'promo_close');
      if (use) {
        apply();
        var o = $('#offre');
        if (o) o.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        setTimeout(function () { var f = $('#f-first'); if (f) f.focus({ preventScroll: true }); }, reduced ? 0 : 450);
      } else if (last && last.focus) last.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Tab') { // focus gardé dans le panneau
        var btns = wrap.querySelectorAll('button');
        var first = btns[0], end = btns[btns.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus(); }
        else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first.focus(); }
      }
    }
    wrap.addEventListener('click', function (e) {
      if (e.target.closest('[data-use]')) close(true);
      else if (e.target.closest('[data-close]')) close(false);
    });
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(function () { requestAnimationFrame(function () { wrap.classList.add('is-in'); $('[data-use]', wrap).focus({ preventScroll: true }); }); });
  }

  function maybeOffer() {
    if (promo || window.maVisitBought || !visit.back) return;
    promo = { pending: true };
    fetch(cfg.serverUrl + '/api/promo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ v: visit.id }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ok || d.expired) { promo = { code: d && d.code, exp: 0 }; save(promo); return; }
        promo = { code: d.code, exp: Date.now() + d.left_ms };
        save(promo);
        visit.step('promo', { code: d.code });
        setTimeout(function () { offer(promo); }, 1200); // le temps de reconnaître la page avant le panneau
      })
      .catch(function () { promo = null; });
  }

  window.maPromo = { maybeOffer: maybeOffer };
  if (promo && promo.code && left() > 0) apply(); // déjà reçu : le code reste dans le formulaire jusqu'à l'échéance
  else maybeOffer();
})();
