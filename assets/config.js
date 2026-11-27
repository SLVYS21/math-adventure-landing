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
  defaultCountry: 'BJ',
};
