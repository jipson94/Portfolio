/* Projets — utilisés par projets.html (cartes) et projet.html (page détaillée de chaque projet).
   Pour ajouter un projet : copie un bloc { ... } et modifie-le. Les images sont dans images/projets/.
   Champs facultatifs : annee, video, poster. Laisser annee vide pour ne pas l'afficher. */
/* PROJETS : voir data/projets.js (modifiable depuis l'espace /admin) */

const PROJET_ARTS = {
  campagne: `<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="250" fill="#1d44c2"/><circle cx="320" cy="60" r="120" fill="#2f5ae0"/><rect x="60" y="30" width="130" height="190" rx="6" fill="#fff799"/><rect x="74" y="48" width="102" height="70" rx="4" fill="#0f2167"/><circle cx="125" cy="83" r="20" fill="#fff799"/><rect x="74" y="132" width="90" height="10" rx="3" fill="#0f2167"/><rect x="74" y="150" width="70" height="7" rx="3" fill="#0f2167" opacity=".5"/><rect x="74" y="164" width="80" height="7" rx="3" fill="#0f2167" opacity=".5"/><rect x="74" y="192" width="50" height="14" rx="7" fill="#0f2167"/><rect x="215" y="70" width="110" height="160" rx="6" fill="#fff" opacity=".92"/><rect x="228" y="86" width="84" height="56" rx="4" fill="#1d44c2"/><rect x="228" y="154" width="70" height="8" rx="3" fill="#0f2167"/><rect x="228" y="170" width="54" height="6" rx="3" fill="#0f2167" opacity=".4"/></svg>`,
  identite: `<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="250" fill="#fff799"/><circle cx="120" cy="125" r="62" fill="#0f2167"/><path d="M95 125a25 25 0 0 1 50 0" stroke="#fff799" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="120" cy="140" r="9" fill="#fff799"/><rect x="210" y="92" width="130" height="18" rx="4" fill="#0f2167"/><rect x="210" y="120" width="90" height="10" rx="3" fill="#0f2167" opacity=".55"/><circle cx="222" cy="168" r="12" fill="#0f2167"/><circle cx="254" cy="168" r="12" fill="#1d44c2"/><circle cx="286" cy="168" r="12" fill="#2f5ae0"/><circle cx="318" cy="168" r="12" fill="#fff" stroke="#0f2167" stroke-width="2"/></svg>`,
  dashboard: `<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="250" fill="#0b1a55"/><rect x="40" y="30" width="320" height="190" rx="12" fill="#132c86"/><rect x="60" y="50" width="80" height="44" rx="6" fill="#1d44c2"/><rect x="70" y="60" width="40" height="8" rx="3" fill="#bcc6ea"/><rect x="70" y="74" width="26" height="12" rx="3" fill="#fff799"/><rect x="152" y="50" width="80" height="44" rx="6" fill="#1d44c2"/><rect x="162" y="60" width="40" height="8" rx="3" fill="#bcc6ea"/><rect x="162" y="74" width="34" height="12" rx="3" fill="#fff"/><rect x="244" y="50" width="96" height="44" rx="6" fill="#1d44c2"/><rect x="254" y="60" width="40" height="8" rx="3" fill="#bcc6ea"/><rect x="254" y="74" width="30" height="12" rx="3" fill="#fff799"/><rect x="66" y="170" width="18" height="34" rx="3" fill="#2f5ae0"/><rect x="94" y="150" width="18" height="54" rx="3" fill="#2f5ae0"/><rect x="122" y="160" width="18" height="44" rx="3" fill="#2f5ae0"/><rect x="150" y="128" width="18" height="76" rx="3" fill="#fff799"/><rect x="178" y="140" width="18" height="64" rx="3" fill="#2f5ae0"/><polyline points="220,190 250,170 278,178 306,140 336,120" fill="none" stroke="#fff799" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="336" cy="120" r="6" fill="#fff799"/></svg>`,
  site: `<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="250" fill="#2f5ae0"/><rect x="50" y="34" width="300" height="190" rx="10" fill="#fff"/><rect x="50" y="34" width="300" height="22" rx="10" fill="#e3e8f8"/><circle cx="66" cy="45" r="4" fill="#ff6b6b"/><circle cx="80" cy="45" r="4" fill="#ffc94d"/><circle cx="94" cy="45" r="4" fill="#4cd07d"/><rect x="70" y="72" width="150" height="16" rx="4" fill="#0f2167"/><rect x="70" y="96" width="120" height="8" rx="3" fill="#0f2167" opacity=".45"/><rect x="70" y="112" width="100" height="8" rx="3" fill="#0f2167" opacity=".45"/><rect x="70" y="132" width="64" height="18" rx="9" fill="#1d44c2"/><rect x="238" y="70" width="94" height="84" rx="8" fill="#fff799"/><circle cx="285" cy="104" r="16" fill="#0f2167"/><rect x="70" y="170" width="80" height="38" rx="6" fill="#e3e8f8"/><rect x="160" y="170" width="80" height="38" rx="6" fill="#e3e8f8"/><rect x="250" y="170" width="82" height="38" rx="6" fill="#e3e8f8"/></svg>`
};

const projetVisuel = p => p.art ? PROJET_ARTS[p.art] : `<img src="${p.images ? p.images[0] : p.poster}" alt="" loading="lazy">`;

// Carte d'un projet (accueil)
const projetCard = p => `
  <a href="projet.html?id=${encodeURIComponent(p.id)}" class="work" data-dom="${p.domaine || ''}">
    <div class="work-art">${projetVisuel(p)}${p.exemple ? '<span class="ex">Exemple</span>' : ''}</div>
    <div class="work-body">
      <div class="work-meta"><span>${p.categorie}</span>${p.annee ? `<span>${p.annee}</span>` : ''}</div>
      <h4>${p.titre}</h4>
      <p>${p.resume}</p>
      <span class="more">Voir le projet →</span>
    </div>
  </a>`;


/* ===== Catégories de la page Projets (ordre d'affichage) ===== */
const CATEGORIES = [
  { id: 'identite', label: 'Identité visuelle & charte graphique' },
  { id: 'cm', label: 'Community management & réseaux sociaux' },
  { id: 'affiches', label: 'Affiches & communication événementielle' },
  { id: 'edition', label: 'Édition, print & packaging' }
];

/* ===== Modèles de texte : complètent les projets qui ont « modele » (le nom du client remplace {nom}) ===== */
const MODELES = {
  identite: { sousTitre: 'Logo, charte graphique et déclinaisons', categorie: 'Identité visuelle · Design graphique',
    resume: 'Identité visuelle de {nom} : logo, charte graphique et mises en situation sur les supports de la marque.',
    role: 'Création du logo et de la charte graphique', outils: ['Logo', 'Charte graphique', 'Typographie', 'Couleurs'],
    contexte: "{nom} souhaitait une identité visuelle professionnelle, cohérente et facile à reconnaître sur tous ses supports.",
    objectifs: ["Créer un logo unique, lisible et facile à mémoriser", "Définir une charte graphique : couleurs, typographies et règles d'usage", "Garantir une image cohérente sur tous les supports, imprimés et numériques"],
    solution: "<p>Chaque identité commence par l'écoute : comprendre l'activité, les valeurs et le public de la marque. Plusieurs pistes sont ensuite explorées, puis la plus juste est affinée jusqu'au logo final.</p><p>La charte graphique fixe les couleurs, les typographies et les règles d'utilisation, pour que la marque reste reconnaissable sur chaque support.</p>",
    livrables: ['Logo et ses déclinaisons', 'Charte graphique', 'Mises en situation sur les supports'],
    variantes: [null,
      { contexte: "{nom} avait besoin d'une image claire et durable, capable de la distinguer de ses concurrents dès le premier regard.",
        solution: "<p>Le travail a commencé par un échange sur le métier, les clients visés et l'image que la marque voulait donner. Le logo a ensuite été dessiné pour rester lisible en petit comme en grand, en couleur comme en noir et blanc.</p><p>Les couleurs et les typographies retenues ont été réunies dans une charte simple, pour que chaque nouveau support reste fidèle à la marque.</p>" },
      { contexte: "{nom} voulait une identité qui inspire confiance et qui fonctionne aussi bien sur un document officiel que sur les réseaux sociaux.",
        solution: "<p>Après l'analyse de l'activité et du public, plusieurs pistes graphiques ont été proposées puis affinées avec le client jusqu'à la version finale.</p><p>L'identité a été testée sur des mises en situation concrètes — cartes, documents, publications — afin de vérifier qu'elle reste reconnaissable partout.</p>" }] },
  cm: { sousTitre: 'Création de contenus et animation des réseaux sociaux', categorie: 'Communication digitale · Réseaux sociaux',
    resume: 'Visuels et publications réalisés pour les réseaux sociaux de {nom}.',
    role: 'Création des visuels et animation des réseaux sociaux', outils: ['Stratégie de contenu', 'Création de visuels', 'Animation de communauté'],
    contexte: "{nom} avait besoin d'une présence régulière et soignée sur les réseaux sociaux, avec des visuels fidèles à son image.",
    objectifs: ["Définir une ligne éditoriale adaptée à chaque structure", "Publier régulièrement des contenus clairs et attractifs", "Transformer les pages en véritables lieux d'échange avec la communauté"],
    solution: "<p>Pour chaque publication, je crée le visuel et le message : annonces, offres, conseils, événements. L'ensemble suit une ligne graphique commune, pour que la marque reste reconnaissable d'une publication à l'autre.</p>",
    livrables: ['Visuels et textes des publications', 'Animation des pages'] },
  affiches: { sousTitre: 'Affiches et supports de communication', categorie: 'Communication événementielle · Affiches',
    resume: 'Affiches et visuels de communication réalisés pour {nom}.',
    role: 'Conception des affiches et des visuels', outils: ['Affiches', 'Communication événementielle', 'Réseaux sociaux'],
    contexte: "{nom} avait besoin d'affiches et de visuels percutants pour annoncer ses activités et ses événements, à l'impression comme sur les réseaux sociaux.",
    objectifs: ["Annoncer clairement chaque événement", "Attirer l'attention en un coup d'œil", "Décliner les visuels pour l'impression et les réseaux sociaux"],
    solution: "<p>Chaque affiche est construite autour d'un message principal, d'une image forte et d'informations pratiques faciles à lire : date, lieu, contact. Les visuels sont ensuite déclinés aux formats imprimés et numériques.</p>",
    livrables: ['Affiches', 'Déclinaisons pour les réseaux sociaux'],
    variantes: [null,
      { contexte: "{nom} souhaitait des visuels qui se remarquent dans la rue comme dans un fil d'actualité, et qui donnent envie de participer.",
        solution: "<p>Pour chaque visuel, l'information essentielle est placée en premier, puis mise en valeur par des couleurs et une image qui attirent l'œil. Les formats ont été adaptés à l'affichage, au partage sur WhatsApp et aux réseaux sociaux.</p>" },
      { contexte: "{nom} avait besoin d'une communication visuelle régulière et cohérente pour annoncer ses rendez-vous.",
        solution: "<p>Une ligne graphique commune relie les différents visuels, pour que le public reconnaisse immédiatement les annonces. Chaque affiche reste lisible en un coup d'œil : le titre, la date, le lieu et le contact.</p>" }] },
  edition: { sousTitre: 'Supports imprimés et édition', categorie: 'Édition · Print',
    resume: 'Supports imprimés et documents réalisés pour {nom}.',
    role: 'Conception graphique des supports imprimés', outils: ['Mise en page', 'Typographie', 'Print'],
    contexte: "{nom} avait besoin de supports imprimés clairs et soignés pour présenter son activité.",
    objectifs: ["Présenter l'information de façon claire et hiérarchisée", "Refléter l'image de la structure", "Livrer des fichiers prêts pour l'impression"],
    solution: "<p>La mise en page, les typographies et les visuels sont pensés pour une lecture facile, puis les fichiers sont préparés pour l'impression.</p>",
    livrables: ['Supports imprimés', 'Fichiers prêts pour l’impression'] },
  evenements: { sousTitre: "Faire-part, invitations et supports d'événement", categorie: 'Événementiel · Faire-part',
    resume: 'Faire-part, invitations et visuels réalisés pour {nom}.',
    role: "Conception des faire-part et des supports de l'événement", outils: ['Faire-part', 'Invitations', 'Décor graphique'],
    contexte: "Pour {nom}, il fallait des supports élégants et cohérents : invitations, cartes et visuels du jour J.",
    objectifs: ["Créer un univers graphique élégant et personnel", "Décliner cet univers sur tous les supports de l'événement"],
    solution: "<p>Un même univers — couleurs, typographies, ornements — est décliné sur les invitations, les cartes et les visuels de l'événement.</p>",
    livrables: ['Invitations et faire-part', 'Cartes et supports du jour J'] },
  photo: { sousTitre: "Reportage photo et couverture d'événement", categorie: 'Photo · Couverture médiatique',
    resume: "Couverture photo des activités de {nom} : les temps forts, les intervenants et l'ambiance.",
    role: "Prise de vue et sélection des images", outils: ['Reportage photo', 'Couverture d’événement', 'Retouche'],
    contexte: "{nom} souhaitait garder une trace professionnelle de ses activités et disposer d'images pour sa communication.",
    objectifs: ["Saisir les temps forts et l'émotion de l'événement", "Mettre en valeur les intervenants et les participants", "Livrer rapidement des images prêtes pour les réseaux sociaux et la presse"],
    solution: "<p>Présent du début à la fin, je photographie les moments clés, les prises de parole et les échanges, puis je sélectionne et retouche les meilleures images pour qu'elles soient prêtes à être publiées.</p>",
    livrables: ['Sélection de photos retouchées', 'Images adaptées aux réseaux sociaux'] }
};
(function () {
  const T = s => (window.I18N && I18N.t) ? I18N.t(s) : s;     // phrases avec {nom} : traduites avant d'insérer le nom
  PROJETS.forEach(p => {
    const m = p.modele && MODELES[p.modele]; if (!m) return;
    for (const k of ['sousTitre', 'categorie', 'role', 'outils', 'objectifs', 'solution', 'livrables']) if (p[k] == null) p[k] = m[k];
    if (p.resume == null) p.resume = T(m.resume).replace('{nom}', p.titre);
    if (p.contexte == null) p.contexte = T(m.contexte).replace('{nom}', p.titre);
    if (p.client == null) p.client = p.titre;
    const v = m.variantes && m.variantes[p.variante];
    if (v) { if (v.solution && p.solution === m.solution) p.solution = v.solution; if (v.contexte && p.contexte === T(m.contexte).replace('{nom}', p.titre)) p.contexte = T(v.contexte).replace('{nom}', p.titre); }
  });
})();
