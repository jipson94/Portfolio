/* ============================================================
   ANNONCES (page Actualités et articles)
   - type 'annonce'  : vos propres offres (formations, services)
   - type 'sponsor'  : annonce d'un partenaire (affiche « Sponsorisé »)
   Pour ajouter une annonce : copie un bloc { ... } et modifie-le.
   Champs : titre, texte, cta (texte du bouton), lien, couleur ('jaune' ou 'bleu'),
            image (facultatif : chemin d'une image, ex. 'images/pub-partenaire.jpg').
   Pour retirer toutes les annonces : vider la liste (const PUBS = [];).
   ============================================================ */
const PUBS = [
  {
    id: 'formation-motion', image: 'images/photos/formation-motion-design.jpg', type: 'annonce', couleur: 'jaune',
    titre: 'Formation : initiation au motion design',
    texte: 'Animez textes, logos et infographies pour vos réseaux. 3 mois, à Brazzaville ou à distance.',
    cta: 'Voir la formation →', lien: 'formations.html#motion-design'
  },
  {
    id: 'service-identite', image: 'images/photos/formation-design-graphique.jpg', type: 'annonce', couleur: 'bleu',
    titre: 'Une identité visuelle qui vous ressemble',
    texte: 'Logo, charte graphique et premiers supports : plus de 150 identités visuelles créées.',
    cta: 'Démarrer un projet →', lien: 'index.html#contact'
  },
  {
    id: 'formation-ia', image: 'images/photos/formation-ia-productivite.jpg', type: 'annonce', couleur: 'jaune',
    titre: "Formation : l'IA au service de la communication",
    texte: "Rédigez, créez et analysez plus vite avec les outils d'IA. 1 mois, en groupe ou dans votre structure.",
    cta: 'Voir la formation →', lien: 'formations.html#ia-productivite'
  },
  {
    id: 'service-site', image: 'images/photos/projet-site.jpg', type: 'annonce', couleur: 'bleu',
    titre: 'Votre site web professionnel',
    texte: 'Un site rapide, clair et adapté au téléphone, relié à votre nom de domaine.',
    cta: 'En parler →', lien: 'index.html#contact'
  }
];

/* ---- Affichage (ne pas modifier) ---- */
const PUB_TAG = { annonce: 'Annonce', sponsor: 'Sponsorisé' };
// Un tirage par page : les emplacements affichent des annonces différentes, dans un ordre qui varie à chaque visite
const pubsDuJour = (() => {
  const l = [...PUBS];
  for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
  let k = 0;
  return () => l.length ? l[k++ % l.length] : null;
})();
function pubHTML(p, place) {
  if (!p) return '';
  const ext = /^https?:/.test(p.lien) ? ' target="_blank" rel="noopener sponsored"' : '';
  return `<aside class="pub-slot pub-at-${place}" aria-label="${PUB_TAG[p.type] || 'Annonce'}">
    <a class="pub pub-${p.couleur || 'jaune'}" href="${p.lien}"${ext}>
      ${p.image ? `<img src="${p.image}" alt="" loading="lazy">` : ''}
      <span class="pub-tag">${PUB_TAG[p.type] || 'Annonce'}</span>
      <b class="pub-title">${p.titre}</b>
      <span class="pub-text">${p.texte}</span>
      <span class="pub-cta">${p.cta}</span>
    </a>
  </aside>`;
}
