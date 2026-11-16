/* Articles du blog — partagés par index.html, actualites.html et article.html */
/* exemple: true = article fictif (affiché avec la mention « Exemple ») : à remplacer ou supprimer avant la mise en ligne. */
/* ====== ARTICLES DU BLOG ======
   Pour ajouter un article : copie un bloc { ... }, change id (sans espace ni accent), titre, date, catégorie, image et texte. */
const ARTICLES = [
  {
    id: 'anic-2026-coulisses',
    titre: "ANIC 2026 : dans les coulisses du film des Assises",
    categorie: 'Projets',
    date: '2026-11-12',
    lecture: '4 min',
    image: 'images/anic-usine.jpg',
    resume: "Comment j'ai conçu le film de présentation des Assises Nationales de l'Industrie du Congo, du terrain à l'habillage animé.",
    contenu: `
      <p>Du 7 au 9 décembre 2026, Brazzaville accueille les <strong>Assises Nationales de l'Industrie du Congo</strong>. Pour présenter l'événement et mobiliser les acteurs publics et privés, il fallait un film clair, rythmé et à la hauteur de l'enjeu : l'industrialisation du pays.</p>
      <h3>Partir du terrain</h3>
      <p>Le film s'appuie d'abord sur des images réelles : vues aériennes de zones industrielles, usines, chaînes de production. Ces plans donnent du concret au message et montrent ce que l'industrie congolaise produit déjà.</p>
      <h3>Un habillage animé… codé</h3>
      <p>Pour les titres, les cartons thématiques et les appels aux partenaires, j'ai utilisé <strong>Remotion</strong>, un outil qui permet de créer de la vidéo avec du code (React). L'avantage : chaque animation est précise, cohérente avec la charte, et une modification de texte se répercute partout en quelques secondes.</p>
      <h3>Ce que je retiens</h3>
      <ul>
        <li>Un message institutionnel gagne à être <strong>structuré en séquences courtes</strong> : contexte, objectifs, thématiques, appel à l'action.</li>
        <li>Le motion design sert la compréhension, pas seulement l'esthétique.</li>
        <li>Livrer en <strong>1080p et en 4K</strong> permet d'adapter la diffusion : réseaux sociaux, écrans géants, présentations.</li>
      </ul>`
  },
  {
    id: 'ia-communication-institutionnelle',
    titre: "L'IA au service de la communication institutionnelle : 5 usages concrets",
    categorie: 'Intelligence artificielle',
    date: '2026-11-06',
    lecture: '5 min',
    image: 'images/photos/article-ia.jpg',
    resume: "L'intelligence artificielle ne remplace pas le communicant, mais elle peut lui faire gagner un temps précieux. Voici comment je l'utilise.",
    contenu: `
      <p>L'intelligence artificielle est partout dans les discussions. Mais concrètement, que peut-elle apporter à une organisation qui doit communiquer clairement avec ses publics ? Voici cinq usages que je trouve réellement utiles.</p>
      <h3>1. Préparer un premier jet</h3>
      <p>Communiqué, discours, publication : l'IA aide à poser une structure de départ. Le travail de fond — le ton, la précision, la validation — reste humain.</p>
      <h3>2. Adapter un message à plusieurs publics</h3>
      <p>Un même contenu peut être reformulé pour le grand public, les partenaires ou la presse, en gardant le fond identique.</p>
      <h3>3. Analyser des retours</h3>
      <p>Commentaires, questionnaires, revues de presse : l'IA aide à repérer les thèmes qui reviennent et à les synthétiser.</p>
      <h3>4. Accélérer la création visuelle</h3>
      <p>Pistes graphiques, déclinaisons de formats, sous-titres de vidéos : autant de tâches répétitives qui peuvent être accélérées.</p>
      <h3>5. Rendre l'information accessible</h3>
      <p>Résumer un long document, traduire, produire une version simplifiée : l'IA aide à toucher plus de monde.</p>
      <p><strong>Ma règle :</strong> l'IA propose, le professionnel vérifie et décide. Les données sensibles ne doivent jamais être confiées à un outil sans s'assurer de la façon dont elles sont traitées.</p>`
  },
  {
    id: 'motion-design-messages-clairs',
    titre: "Pourquoi le motion design rend vos messages plus clairs",
    categorie: 'Motion design',
    date: '2026-10-28',
    lecture: '3 min',
    image: 'images/photos/article-motion.jpg',
    resume: "Une idée complexe expliquée en 30 secondes animées : c'est souvent plus efficace qu'une page de texte.",
    contenu: `
      <p>Le motion design, c'est l'art de mettre en mouvement des éléments graphiques — textes, formes, icônes, chiffres — pour raconter une idée. Et c'est l'un des moyens les plus efficaces pour se faire comprendre.</p>
      <h3>Guider le regard</h3>
      <p>Le mouvement indique où regarder et dans quel ordre. L'information arrive étape par étape, au lieu d'être livrée d'un bloc.</p>
      <h3>Simplifier le complexe</h3>
      <p>Un processus, des chiffres, une organisation : ce qui prend une page à expliquer peut tenir en quelques secondes animées.</p>
      <h3>Retenir l'attention</h3>
      <p>Sur les réseaux sociaux, quelques secondes suffisent pour capter — ou perdre — un public. Une animation soignée fait la différence.</p>
      <p>Vous avez un message à faire passer ? <strong>Parlons-en</strong> : écrivez-moi à contact@jipsonmathas.com.</p>`
  },
  /* ====== ARTICLES EXEMPLES (fictifs) — à remplacer par de vrais articles ====== */
  {
    "id": "exemple-logo-reussi",
    "exemple": true,
    "titre": "5 questions à se poser avant de créer son logo",
    "categorie": "Design graphique",
    "date": "2026-10-20",
    "lecture": "4 min",
    "image": "images/photos/article-logo.jpg",
    "resume": "Un bon logo ne commence pas par un dessin, mais par quelques questions simples sur votre activité et votre public.",
    "contenu": "<p>Avant d'ouvrir un logiciel, un logo se prépare. Voici cinq questions qui évitent bien des allers-retours.</p><h3>1. À qui vous adressez-vous ?</h3><p>Un logo pour une banque ne parle pas comme celui d'un restaurant. Décrivez votre client type en une phrase.</p><h3>2. Qu'est-ce qui vous distingue ?</h3><p>Prix, qualité, proximité, innovation : choisissez l'idée principale que le logo doit transmettre.</p><h3>3. Où sera-t-il utilisé ?</h3><p>Enseigne, emballage, photo de profil : un logo doit rester lisible sur un panneau comme sur un écran de téléphone.</p><h3>4. Quelles couleurs et quel ton ?</h3><p>Deux ou trois couleurs suffisent. Elles doivent fonctionner aussi en noir et blanc.</p><h3>5. Tiendra-t-il dans le temps ?</h3><p>Méfiez-vous des modes : la simplicité vieillit mieux que les effets.</p>"
  },
  {
    "id": "exemple-reseaux-sociaux-institution",
    "exemple": true,
    "titre": "Réseaux sociaux : comment une institution peut gagner la confiance de son public",
    "categorie": "Communication",
    "date": "2026-10-12",
    "lecture": "5 min",
    "image": "images/photos/article-social.jpg",
    "resume": "Publier ne suffit pas. Régularité, clarté et écoute : trois habitudes qui changent la relation avec les citoyens.",
    "contenu": "<p>Beaucoup d'institutions ouvrent une page, publient quelques communiqués, puis s'essoufflent. Trois habitudes simples font la différence.</p><h3>Publier régulièrement</h3><p>Mieux vaut deux publications par semaine, toute l'année, que dix en une semaine puis le silence. Un calendrier éditorial aide à tenir le rythme.</p><h3>Parler simplement</h3><p>Un texte court, une image lisible, une seule idée par publication. Le jargon administratif éloigne le public.</p><h3>Répondre</h3><p>Les commentaires et les messages sont une chance : y répondre montre que l'institution écoute, et permet de corriger rapidement une fausse information.</p><p><strong>À retenir :</strong> la confiance se construit dans la durée, publication après publication.</p>"
  },
  {
    "id": "exemple-donnees-decision",
    "exemple": true,
    "titre": "Transformer vos chiffres en décisions : par où commencer",
    "categorie": "Analyse de données",
    "date": "2026-10-03",
    "lecture": "4 min",
    "image": "images/photos/article-data.jpg",
    "resume": "Vous avez des tableaux partout mais peu de réponses ? Trois étapes pour faire parler vos données sans être statisticien.",
    "contenu": "<p>Les données ne manquent presque jamais. Ce qui manque, c'est une façon simple de les lire.</p><h3>1. Partir d'une question</h3><p>« Quelle activité touche le plus de bénéficiaires ? » est une meilleure base de travail que « analysons tout ».</p><h3>2. Mettre de l'ordre</h3><p>Mêmes noms de colonnes, mêmes formats de dates, une ligne par élément : ce rangement représente souvent la moitié du travail.</p><h3>3. Montrer, pas seulement calculer</h3><p>Un graphique bien choisi vaut mieux qu'un grand tableau. Trois ou quatre indicateurs suffisent pour suivre une activité.</p><p>Ensuite seulement vient le tableau de bord, qui automatise ce suivi.</p>"
  }
];

const COVERS = {
  ia: `<svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="225" fill="#132c86"/><circle cx="300" cy="40" r="140" fill="#1d44c2"/><g stroke="#fff799" stroke-width="2" opacity=".55"><line x1="120" y1="70" x2="200" y2="112"/><line x1="200" y1="112" x2="290" y2="80"/><line x1="200" y1="112" x2="150" y2="170"/><line x1="200" y1="112" x2="270" y2="165"/><line x1="120" y1="70" x2="150" y2="170"/></g><circle cx="200" cy="112" r="22" fill="#fff799"/><circle cx="120" cy="70" r="10" fill="#fff"/><circle cx="290" cy="80" r="10" fill="#fff"/><circle cx="150" cy="170" r="10" fill="#fff"/><circle cx="270" cy="165" r="10" fill="#fff"/><path d="M200 100l3.5 8.5 8.5 3.5-8.5 3.5-3.5 8.5-3.5-8.5-8.5-3.5 8.5-3.5z" fill="#0f2167"/></svg>`,
  motion: `<svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="225" fill="#fff799"/><rect x="60" y="80" width="70" height="70" rx="12" fill="#0f2167" opacity=".25"/><rect x="110" y="72" width="70" height="70" rx="12" fill="#0f2167" opacity=".5" transform="rotate(10 145 107)"/><rect x="165" y="64" width="78" height="78" rx="14" fill="#0f2167" transform="rotate(20 204 103)"/><circle cx="300" cy="105" r="36" fill="#1d44c2"/><path d="M290 88v34l28-17z" fill="#fff799"/><path d="M50 185h300" stroke="#0f2167" stroke-width="4" stroke-linecap="round"/><circle cx="210" cy="185" r="8" fill="#1d44c2"/></svg>`,
  logo: `<svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="225" fill="#fff799"/><circle cx="130" cy="112" r="58" fill="#0f2167"/><path d="M104 112a26 26 0 0 1 52 0" stroke="#fff799" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="130" cy="128" r="9" fill="#fff799"/><rect x="225" y="78" width="120" height="18" rx="4" fill="#0f2167"/><rect x="225" y="106" width="84" height="10" rx="3" fill="#0f2167" opacity=".5"/><circle cx="236" cy="146" r="11" fill="#0f2167"/><circle cx="266" cy="146" r="11" fill="#1d44c2"/><circle cx="296" cy="146" r="11" fill="#ffd84a" stroke="#0f2167" stroke-width="2"/></svg>`,
  social: `<svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="225" fill="#1d44c2"/><circle cx="70" cy="200" r="120" fill="#0f2167"/><rect x="90" y="50" width="170" height="80" rx="16" fill="#fff"/><path d="M120 130l-4 26 30-26z" fill="#fff"/><rect x="110" y="72" width="110" height="10" rx="4" fill="#0f2167"/><rect x="110" y="92" width="80" height="8" rx="4" fill="#0f2167" opacity=".45"/><rect x="200" y="118" width="130" height="62" rx="16" fill="#fff799"/><path d="M300 180l6 22-28-22z" fill="#fff799"/><rect x="218" y="136" width="84" height="9" rx="4" fill="#0f2167"/><rect x="218" y="153" width="56" height="8" rx="4" fill="#0f2167" opacity=".45"/></svg>`,
  data: `<svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="225" fill="#0b1850"/><rect x="50" y="30" width="300" height="165" rx="12" fill="#132c86"/><rect x="80" y="130" width="26" height="40" rx="4" fill="#1d44c2"/><rect x="118" y="105" width="26" height="65" rx="4" fill="#1d44c2"/><rect x="156" y="118" width="26" height="52" rx="4" fill="#1d44c2"/><rect x="194" y="80" width="26" height="90" rx="4" fill="#fff799"/><polyline points="240,150 268,128 292,136 322,92" fill="none" stroke="#fff799" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="322" cy="92" r="6" fill="#fff799"/><rect x="80" y="52" width="90" height="10" rx="4" fill="#bcc6ea"/></svg>`
};
const coverHTML = a => a.image ? `<img src="${a.image}" alt="" loading="lazy">` : COVERS[a.cover] || '';
const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString((window.I18N && I18N.locale) || 'fr-FR', {day:'numeric', month:'long', year:'numeric'});

// Carte d'aperçu d'un article (lien vers sa page dédiée)
const postCard = a => `
  <a class="post" href="article.html?id=${encodeURIComponent(a.id)}" data-cat="${a.categorie}">
    <div class="post-cover">${coverHTML(a)}${a.exemple ? '<span class="ex">Exemple</span>' : ''}</div>
    <div class="post-body">
      <div class="post-meta"><span class="cat">${a.categorie}</span><span>${fmtDate(a.date)}</span><span>· ${a.lecture}</span></div>
      <h3>${a.titre}</h3>
      <p class="excerpt">${a.resume}</p>
      <span class="more">Lire l'article →</span>
    </div>
  </a>`;

// Les anciens liens « index.html#article-xxx » redirigent vers la page de l'article
if (location.hash.startsWith('#article-')) location.replace('article.html?id=' + encodeURIComponent(location.hash.slice(9)));

