// Page de vente : prix, liens vers l'essai, vidéos, barre collante, formulaire de paiement Chariow.
(function () {
  var cfg = window.MA_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var track = window.maTrack || function () {};
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Le franc CFA est arrimé à l'euro : Meta reçoit la valeur en euros (même calcul que le serveur).
  // Prix de lancement : une vraie date de fin, la même pour tout le monde. Passée, la page affiche le nouveau prix.
  var launch = cfg.launch && cfg.launch.endsAt ? cfg.launch : null;
  var launchEnd = launch ? new Date(launch.endsAt).getTime() : 0;
  var inLaunch = !!launch && Date.now() < launchEnd;
  var price = launch && !inLaunch ? launch.priceAfter : cfg.price;
  var oldPrice = inLaunch ? (cfg.oldPrice || launch.priceAfter) : (launch ? 0 : cfg.oldPrice);

  var EUR = Math.round((price / 655.957) * 100) / 100;
  var sep = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  var fcfa = function (n) { return sep(n) + ' F CFA'; };

  $$('[data-price]').forEach(function (el) { el.textContent = fcfa(price); });
  $$('[data-price-short]').forEach(function (el) { el.textContent = sep(price) + ' F'; });
  $$('[data-old-price]').forEach(function (el) { if (oldPrice) el.textContent = fcfa(oldPrice); else el.remove(); });

  if (inLaunch) {
    var dateTxt;
    try { dateTxt = new Date(launchEnd).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Lagos' }); }
    catch (e) { dateTxt = new Date(launchEnd).toLocaleDateString('fr-FR'); }
    $$('[data-launch-date]').forEach(function (el) { el.textContent = dateTxt; });
    $$('[data-launch-after]').forEach(function (el) { el.textContent = sep(launch.priceAfter) + ' F'; });
    $$('[data-launch], [data-launch-bar]').forEach(function (el) { el.hidden = false; });
    var bar = $('[data-launch-bar]');
    var boxes = $('[data-countdown-boxes]');
    if (boxes) boxes.setAttribute('aria-label', 'L’offre Black Friday se termine le ' + dateTxt);
    var cd = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
    var note = $('[data-sticky-note]');
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    var tick = function () {
      var left = launchEnd - Date.now();
      if (left <= 0) { location.reload(); return; } // l'échéance tombe pendant la visite : la page passe au nouveau prix
      var t = Math.floor(left / 1000);
      var d = Math.floor(t / 86400), h = Math.floor(t / 3600) % 24, m = Math.floor(t / 60) % 60, s = t % 60;
      var txt = (d ? d + ' j ' : '') + pad(h) + ' h ' + pad(m) + ' min ' + pad(s) + ' s';
      $$('[data-countdown]').forEach(function (el) { el.textContent = txt; });
      if (cd.d) { cd.d.textContent = pad(d); cd.h.textContent = pad(h); cd.m.textContent = pad(m); cd.s.textContent = pad(s); }
      if (note) note.textContent = d ? 'Black Friday · encore ' + d + ' j' : 'Black Friday · fin aujourd’hui';
      if (bar) bar.classList.toggle('is-last', left < 86400000); // dernières 24 h : la barre passe au rouge
      setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    tick();
  }

  // ---------------------------------------------------------------- liens
  var appLink = cfg.appUrl + (cfg.appUrl.indexOf('?') >= 0 ? '&' : '?') + 'utm_source=landing';
  // data-app="fruit-factory" : ouvre l'appli directement sur l'écran de ce jeu (sans accueil ni prénom)
  $$('[data-app]').forEach(function (a) {
    var jeu = a.getAttribute('data-app');
    a.href = appLink + (jeu ? '&jeu=' + encodeURIComponent(jeu) : '');
    a.addEventListener('click', function () { track('EssaiDemo', { jeu: a.getAttribute('data-track') }); });
  });
  $$('[data-whatsapp]').forEach(function (a) {
    a.href = 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent('Bonjour, j’ai une question sur Math Adventure.');
    a.addEventListener('click', function () { track('Contact'); });
  });
  track('ViewContent', { content_ids: ['math-adventure'], content_type: 'product', value: EUR, currency: 'EUR' });

  // ---------------------------------------------------------------- vidéos : jouent seulement quand elles sont visibles
  var videos = $$('video');
  if (reduced) videos.forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); v.controls = true; });
  else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (v.preload === 'none') v.preload = 'auto';
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else v.pause();
      });
    }, { rootMargin: '120px 0px', threshold: 0.2 });
    videos.forEach(function (v) { io.observe(v); });
  }

  // ---------------------------------------------------------------- barre d'achat collante (mobile)
  var sticky = $('#sticky');
  var hero = $('.hero');
  var offer = $('#offre');
  if (sticky && 'IntersectionObserver' in window) {
    var heroVisible = true, offerVisible = false;
    var update = function () {
      var show = !heroVisible && !offerVisible;
      sticky.classList.toggle('is-on', show);
      sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
      $('a', sticky).tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; update(); }).observe(hero);
    new IntersectionObserver(function (e) { offerVisible = e[0].isIntersecting; update(); }, { threshold: 0.05 }).observe(offer);
  }

  // ---------------------------------------------------------------- formulaire de paiement
  var COUNTRIES = [
    ['BJ', 'Bénin', '229'], ['CI', 'Côte d’Ivoire', '225'], ['SN', 'Sénégal', '221'], ['TG', 'Togo', '228'],
    ['BF', 'Burkina Faso', '226'], ['ML', 'Mali', '223'], ['NE', 'Niger', '227'], ['CM', 'Cameroun', '237'],
    ['GA', 'Gabon', '241'], ['CG', 'Congo', '242'], ['CD', 'RD Congo', '243'], ['GN', 'Guinée', '224'],
    ['TD', 'Tchad', '235'], ['MG', 'Madagascar', '261'], ['FR', 'France', '33'], ['BE', 'Belgique', '32'], ['CA', 'Canada', '1'],
  ];
  var form = $('#checkout');
  if (!form) return;
  var sel = $('#f-country');
  COUNTRIES.forEach(function (c) {
    var o = document.createElement('option');
    o.value = c[0];
    o.textContent = c[1] + ' +' + c[2];
    if (c[0] === cfg.defaultCountry) o.selected = true;
    sel.appendChild(o);
  });

  var started = false;
  form.addEventListener('focusin', function () {
    if (started) return;
    started = true;
    track('InitiateCheckout', { value: EUR, currency: 'EUR', num_items: 1, content_ids: ['math-adventure'] });
  });

  var fields = ['first_name', 'last_name', 'phone', 'country_code', 'email', 'discount_code'];
  function setErrors(errs) {
    var first = null;
    fields.forEach(function (k) {
      var p = $('#e-' + k);
      var input = form.elements[k];
      var msg = errs && errs[k];
      if (p) { p.hidden = !msg; p.textContent = msg || ''; }
      if (input) {
        if (msg) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', 'e-' + k); if (!first) first = input; }
        else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
      }
    });
    if (first) first.focus();
    if (errs && errs.discount_code) $('.promo').open = true;
  }
  function formError(msg) {
    var p = $('#form-err');
    p.hidden = !msg;
    p.textContent = msg || '';
  }
  function validate(d) {
    var e = {};
    if (!d.first_name) e.first_name = 'Écrivez votre prénom.';
    if (!d.last_name) e.last_name = 'Écrivez votre nom.';
    if (d.phone.replace(/\D/g, '').length < 6) e.phone = 'Ce numéro est trop court.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) e.email = 'Cette adresse e-mail ne semble pas complète (exemple : nom@gmail.com).';
    return e;
  }

  var btn = $('#pay');
  var btnLabel = btn.innerHTML;
  function busy(on) {
    btn.disabled = on;
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
    btn.innerHTML = on ? 'Ouverture du paiement…' : btnLabel;
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    formError('');
    var d = {};
    fields.forEach(function (k) { d[k] = (form.elements[k].value || '').trim(); });
    var errs = validate(d);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    busy(true);
    var body = Object.assign({}, d, {
      src: 'landing',
      fbp: window.maCookie ? window.maCookie('_fbp') : '',
      fbc: window.maCookie ? window.maCookie('_fbc') : '',
      url: location.href.split('#')[0],
    });
    if (!body.discount_code) delete body.discount_code;

    fetch(cfg.serverUrl + '/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (res) {
        if (!res.ok) {
          busy(false);
          if (res.errors) setErrors(res.errors);
          else formError(res.message || 'Le paiement ne s’ouvre pas. Réessayez dans une minute, ou écrivez-nous sur WhatsApp.');
          return;
        }
        try { localStorage.setItem('ma-sale', JSON.stringify({ id: res.sale_id, t: Date.now() })); } catch (e) {}
        track('AddPaymentInfo', { value: EUR, currency: 'EUR' });
        if (res.step === 'payment' && res.checkout_url) location.href = res.checkout_url;
        else location.href = 'merci.html?sale=' + encodeURIComponent(res.sale_id || '');
      })
      .catch(function () {
        busy(false);
        formError('Pas de connexion. Vérifiez internet et réessayez.');
      });
  });

  // Retour arrière depuis la page de paiement : le bouton redevient actif
  window.addEventListener('pageshow', function (e) { if (e.persisted) busy(false); });
})();
