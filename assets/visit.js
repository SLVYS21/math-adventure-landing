// Parcours du visiteur, vu par nous (pas seulement par Meta) :
// - un identifiant anonyme (v) gardé dans le navigateur, transmis à l'appli d'essai puis au paiement ;
// - les étapes envoyées au serveur (/api/event), lisibles sur la page privée /stats ;
// - Microsoft Clarity (enregistrements de visites), relié au même identifiant ;
// - le code personnel montré une seule fois à un visiteur qui revient (après la démo ou plus tard).
(function () {
  var cfg = window.MA_CONFIG || {};
  var KEY = 'ma-visit';
  var AWAY_MS = 30 * 60e3; // absent plus de 30 min = une vraie nouvelle visite
  var q = new URLSearchParams(location.search);
  var now = Date.now();

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || {}; } catch (e) { return {}; } }
  function store() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function newId() {
    var a = new Uint8Array(8);
    try { crypto.getRandomValues(a); } catch (e) { for (var i = 0; i < 8; i++) a[i] = Math.floor(Math.random() * 256); }
    return Array.prototype.map.call(a, function (b) { return (b % 36).toString(36); }).join('') + now.toString(36).slice(-4);
  }

  var st = load();
  var fromApp = q.get('utm_source') === 'app';
  var fromUrl = q.get('v');
  if (fromUrl && /^[a-z0-9]{8,24}$/.test(fromUrl)) st.id = fromUrl; // retour depuis l'appli : même personne
  if (!st.id) st.id = newId();
  var bought = false;
  try { bought = !!localStorage.getItem('ma-sale'); } catch (e) {}

  // Revient-il ? Depuis l'appli, après être parti sur la démo, ou après 30 min d'absence. Un rechargement ne compte pas.
  var back = !!st.last && (fromApp || (st.demoAt && st.demoAt > (st.viewAt || 0)) || now - st.last > AWAY_MS);
  st.viewAt = now;

  // ---------------------------------------------------------------- envoi des étapes
  var endpoint = cfg.serverUrl ? cfg.serverUrl + '/api/event' : '';
  function send(events) {
    if (!endpoint) return;
    var body = JSON.stringify({ v: st.id, events: events });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(endpoint, body)) return; // texte brut : pas de requête préalable CORS
    } catch (e) {}
    try { fetch(endpoint, { method: 'POST', body: body, keepalive: true, mode: 'cors' }).catch(function () {}); } catch (e) {}
  }
  function step(e, p) {
    st.last = Date.now();
    store();
    send([p ? { e: e, p: p } : { e: e }]);
    if (window.clarity) window.clarity('event', e);
  }

  // ---------------------------------------------------------------- Clarity
  if (cfg.clarityId) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', cfg.clarityId);
    window.clarity('identify', st.id);
    window.clarity('set', 'retour', back ? 'oui' : 'non');
    if (fromApp) window.clarity('set', 'depuis', 'appli');
  }

  var src = q.get('utm_source') || (q.get('fbclid') ? 'facebook' : document.referrer ? 'lien' : 'direct');
  step('view', {
    src: src,
    ad: q.get('utm_content') || q.get('utm_campaign') || '',
    back: back,
    mobile: /Mobi|Android/i.test(navigator.userAgent),
  });

  // ---------------------------------------------------------------- profondeur de lecture
  var marks = [25, 50, 75, 100], hit = {};
  var ticking = false;
  function depth() {
    ticking = false;
    var h = document.documentElement.scrollHeight - innerHeight;
    var pct = h > 0 ? (scrollY / h) * 100 : 100;
    marks.forEach(function (m) { if (!hit[m] && pct >= m - 2) { hit[m] = 1; step('depth', { pct: m }); } });
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(depth); } }, { passive: true });

  window.maVisit = {
    id: st.id,
    back: back,
    step: step,
    /** l'appli va s'ouvrir dans cet onglet : au retour, on saura qu'il revient de la démo */
    leftForDemo: function () { st.demoAt = Date.now(); store(); },
    /** référence courte, lisible dans un message WhatsApp */
    ref: st.id.slice(-5).toUpperCase(),
  };

  // Retour par le bouton « Précédent » (page gardée en mémoire par le navigateur) : c'est aussi un retour
  addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    if (st.demoAt && st.demoAt > (st.viewAt || 0)) {
      st.viewAt = Date.now();
      window.maVisit.back = true;
      step('view', { src: 'retour', back: true });
      if (window.maPromo) window.maPromo.maybeOffer();
    }
  });

  window.maVisitBought = bought;
})();
