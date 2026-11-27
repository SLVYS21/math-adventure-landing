// Réglages de la page de vente — seul fichier à modifier au déploiement.
window.MA_CONFIG = {
  /** serveur de vente (shop/server), sans « / » final */
  serverUrl: 'https://math-adventure.bisous.me',
  /** l'appli en ligne : sans licence, elle s'ouvre en version d'essai */
  appUrl: 'https://math-adventure-app-sooty.vercel.app/',
  /** vidéos d'installation pour les parents */
  guideUrl: 'https://math-adventure-app-sooty.vercel.app/guide/',
  /** ID du pixel Meta (laisser vide pour désactiver) */
  pixelId: '1149409637780474',
  whatsapp: '2290161879788',
  price: 4900,
  /** prix barré affiché (mettre 0 pour ne pas en afficher). Pendant le lancement, c'est le prix d'après. */
  oldPrice: 7900,
  /**
   * Prix de lancement : compte à rebours vers une VRAIE date, la même pour tous les visiteurs.
   * Après endsAt, la page affiche priceAfter : changer le prix dans Chariow le même jour
   * (puis mettre price = priceAfter et launch = null ici).
   */
  launch: { endsAt: '2026-12-05T23:59:59+01:00', priceAfter: 7900 },
  /** pays du numéro proposé si le lien de la pub (?c=bf) et le fuseau horaire du téléphone ne disent rien */
  defaultCountry: 'BF',
  /** ID du projet Microsoft Clarity (clarity.microsoft.com → Paramètres → ID du projet ; vide = désactivé) */
  clarityId: 'zk9uufyf0p',
  /** réduction du code personnel montré aux visiteurs qui reviennent (code Chariow MATH1000 côté serveur ; 0 = désactivé) */
  promoOff: 1000,
};
