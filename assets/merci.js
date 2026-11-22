// Page de remerciement : attend la confirmation du paiement, affiche la clé, déclenche « Purchase » une seule fois.
(function () {
  var cfg = window.MA_CONFIG || {};
  var $ = function (s) { return document.querySelector(s); };
  var track = window.maTrack || function () {};

  function show(id) {
    ['s-wait', 's-done', 's-failed', 's-unknown'].forEach(function (s) { $('#' + s).hidden = s !== id; });
  }
  $('#app-link').href = cfg.appUrl;
  $('#app-link').textContent = cfg.appUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  $('#open-app-2').href = cfg.appUrl;
  $('#guide').href = cfg.guideUrl || cfg.appUrl;
  [].forEach.call(document.querySelectorAll('[data-whatsapp]'), function (wa) { wa.href = 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent('Bonjour, j’ai payé Math Adventure mais je n’ai pas reçu ma clé.'); });

  // id de la vente : dans l'adresse, sinon mémorisé par la page de vente avant le paiement (48 h)
  var q = new URLSearchParams(location.search);
  var saleId = q.get('sale') || q.get('sale_id') || '';
  if (!saleId) {
    try {
      var saved = JSON.parse(localStorage.getItem('ma-sale') || 'null');
      if (saved && Date.now() - saved.t < 48 * 3600e3) saleId = saved.id;
    } catch (e) {}
  }
  if (!saleId) return show('s-unknown');

  var started = Date.now();
  function next() {
    var age = Date.now() - started;
    if (age > 10 * 60e3) return show('s-unknown');
    setTimeout(poll, age < 2 * 60e3 ? 3000 : 10000);
  }

  function purchased(res) {
    var flag = 'ma-px-' + saleId;
    try { if (localStorage.getItem(flag)) return; localStorage.setItem(flag, '1'); } catch (e) {}
    // même event_id que l'API Conversions du serveur : Meta ne compte l'achat qu'une fois
    track('Purchase', { value: res.value ? res.value.value : 0, currency: res.value ? res.value.currency : 'EUR', content_ids: ['math-adventure'], content_type: 'product' }, { eventID: saleId });
  }

  function poll() {
    fetch(cfg.serverUrl + '/api/order/' + encodeURIComponent(saleId))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) return res.code === 'not_found' ? show('s-unknown') : next();
        if (res.status === 'completed') {
          purchased(res);
          if (!res.license_key) return next(); // payé, clé pas encore émise : on attend encore un peu
          var key = res.license_key;
          if (res.first_name) $('#done-title').textContent = 'Merci ' + res.first_name + ' ! Voici votre clé';
          $('#key').textContent = key;
          $('#open-app').href = cfg.appUrl.replace(/#.*$/, '') + '#licence=' + encodeURIComponent(key);
          try { localStorage.removeItem('ma-sale'); } catch (e) {}
          return show('s-done');
        }
        if (res.status === 'failed' || res.status === 'abandoned') return show('s-failed');
        next();
      })
      .catch(next);
  }

  $('#copy').addEventListener('click', function () {
    var key = $('#key').textContent;
    var done = function () { $('#copy').textContent = 'Copiée ✓'; setTimeout(function () { $('#copy').textContent = 'Copier'; }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(key).then(done, function () {});
    else {
      var r = document.createRange();
      r.selectNodeContents($('#key'));
      var s = getSelection();
      s.removeAllRanges();
      s.addRange(r);
      document.execCommand('copy');
      done();
    }
  });

  poll();
})();
