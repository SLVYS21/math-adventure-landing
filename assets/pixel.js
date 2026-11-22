// Pixel Meta + identifiants de clic (fbp/fbc) transmis au serveur pour l'API Conversions.
(function () {
  var cfg = window.MA_CONFIG || {};

  // fbclid de l'annonce → cookie _fbc (format Meta : fb.1.<horodatage>.<fbclid>), gardé 90 jours
  try {
    var m = location.search.match(/[?&]fbclid=([^&#]+)/);
    if (m) document.cookie = '_fbc=fb.1.' + Date.now() + '.' + decodeURIComponent(m[1]) + ';max-age=7776000;path=/;SameSite=Lax';
  } catch (e) {}

  window.maCookie = function (name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  };

  /** Envoie un événement au pixel si configuré ; sans pixel, ne fait rien. */
  window.maTrack = function (event, data, opts) {
    if (!window.fbq) return;
    var standard = ['PageView', 'ViewContent', 'InitiateCheckout', 'AddPaymentInfo', 'Purchase', 'Lead', 'Contact'];
    if (standard.indexOf(event) >= 0) window.fbq('track', event, data || {}, opts || {});
    else window.fbq('trackCustom', event, data || {}, opts || {});
  };

  if (!cfg.pixelId) return;
  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', cfg.pixelId);
  window.fbq('track', 'PageView');
})();
