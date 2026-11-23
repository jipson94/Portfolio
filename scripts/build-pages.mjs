/* ============================================================
   Génère une vraie page HTML par projet et par article + le plan du site (sitemap.xml)
   - projet-<id>.html  (à partir du modèle projet.html)
   - article-<id>.html (à partir du modèle article.html)
   Chaque page a son titre, sa description, son image de partage (WhatsApp, Facebook, LinkedIn)
   et ses informations pour Google, et contient déjà le texte (lisible sans JavaScript).
   Lancé automatiquement par GitHub (.github/workflows/pages.yml) après chaque publication.
   À la main : node scripts/build-pages.mjs
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = 'https://jipsonmathas.com/';
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Données du site (mêmes fichiers que le navigateur)
const ctx = { window: {}, location: { hash: '' } };
vm.createContext(ctx);
for (const f of ['data/projets.js', 'projets.js', 'data/articles.js']) vm.runInContext(read(f), ctx, { filename: f });
const { PROJETS, ARTICLES } = vm.runInContext('({ PROJETS, ARTICLES })', ctx);

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const texte = html => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const court = (s, n = 160) => { s = texte(s); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const abs = p => !p ? SITE_URL + 'images/partage.jpg' : /^https?:/.test(p) ? p : SITE_URL + p.replace(/^\.?\//, '');
export const lienProjet = id => 'projet-' + id + '.html';
export const lienArticle = id => 'article-' + id + '.html';
const jsonld = o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';

// Remplace l'en-tête (titre, description, partage) d'un modèle
function entete(tpl, { titre, description, url, image, imageParDefaut, robots, donnees, type = 'website' }) {
  let h = tpl;
  const set = (re, val) => { if (!re.test(h)) throw new Error('Balise introuvable : ' + re); h = h.replace(re, val); };
  set(/\n<meta name="robots" content="[^"]*">/, '');   // le modèle n'est pas indexé, la page générée oui
  set(/<title>[^<]*<\/title>/, `<title>${esc(titre)}</title>`);
  set(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(description)}">\n<link rel="canonical" href="${url}">` + (robots ? `\n<meta name="robots" content="${robots}">` : ''));
  set(/<meta property="og:type" content="[^"]*">/, `<meta property="og:type" content="${type}">`);
  set(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(titre)}">`);
  set(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(description)}">`);
  set(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  set(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${esc(image)}">\n<meta property="og:image:alt" content="${esc(titre)}">`);
  if (!imageParDefaut) h = h.replace(/\n<meta property="og:image:width" content="\d+">\n<meta property="og:image:height" content="\d+">/, '');
  set(/<meta name="twitter:card" content="[^"]*">/, `<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${esc(titre)}">\n<meta name="twitter:description" content="${esc(description)}">\n<meta name="twitter:image" content="${esc(image)}">\n` + donnees.map(jsonld).join('\n'));
  return h;
}
// Remplit un élément vide <x id="…"></x> (le script de la page le réécrit ensuite à l'identique)
function remplir(h, id, html) {
  const re = new RegExp(`(<([a-z0-9]+)[^>]*\\bid="${id}"[^>]*>)([\\s\\S]*?)(</\\2>)`);
  if (!re.test(h)) throw new Error('Élément introuvable : #' + id);
  return h.replace(re, (m, a, tag, inner, b) => a + html + b);
}
// La page générée sait quel élément afficher (sans « ?id= » dans l'adresse)
const avecId = (h, id) => h.replace(/(\n<script>\n)/, `\n<script>window.PAGE_ID = ${JSON.stringify(id)};</script>$1`);

const fil = items => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) });
const AUTEUR = { '@type': 'Person', name: 'Jipson Mathas', url: SITE_URL };

/* ---------- Projets ---------- */
const tplP = read('projet.html');
const anciens = fs.readdirSync(ROOT).filter(f => /^(projet|article)-[a-z0-9_-]+\.html$/i.test(f));
const faits = [];
PROJETS.forEach((p, i) => {
  const url = SITE_URL + lienProjet(p.id), image = abs((p.images || [])[0] || p.poster);
  const titre = `${p.titre} — Projet de Jipson Mathas`, description = court(p.resume || p.sousTitre || p.contexte);
  let h = entete(tplP, {
    titre, description, url, image, imageParDefaut: !((p.images || [])[0] || p.poster), type: 'article',
    donnees: [
      { '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.titre, headline: p.sousTitre || p.titre, description, image, url, dateCreated: p.annee, genre: p.categorie, creator: AUTEUR, author: AUTEUR, ...(p.client ? { sourceOrganization: { '@type': 'Organization', name: p.client } } : {}), keywords: (p.outils || []).join(', ') },
      fil([['Accueil', SITE_URL], ['Projets', SITE_URL + 'projets.html'], [p.titre, url]])
    ]
  });
  const img = (p.images || [])[0];
  h = remplir(h, 'crumb', esc(p.titre));
  h = remplir(h, 'p-title', esc(p.titre));
  h = remplir(h, 'p-sub', esc(p.sousTitre || p.resume));
  if (img && !p.video) h = remplir(h, 'p-media', `<img src="${esc(img)}" alt="Visuel du projet ${esc(p.titre)}">`);
  h = remplir(h, 'p-facts', [['Année', p.annee], ['Domaine', p.categorie], ['Client', p.client], ['Rôle', p.role]].filter(f => f[1]).map(([k, v]) => `<div class="f-fact"><small>${k}</small><b>${esc(v)}</b></div>`).join(''));
  h = remplir(h, 'p-context', esc(p.contexte));
  h = remplir(h, 'p-goals', (p.objectifs || []).map(o => `<li>${o}</li>`).join(''));
  h = remplir(h, 'p-solution', p.solution || '');
  h = remplir(h, 'p-tools', (p.outils || []).map(t => `<span>${t}</span>`).join(''));
  h = remplir(h, 'p-deliv', (p.livrables || []).map(l => `<li>${l}</li>`).join(''));
  const prev = PROJETS[(i - 1 + PROJETS.length) % PROJETS.length], next = PROJETS[(i + 1) % PROJETS.length];
  h = remplir(h, 'p-nav', `<a href="${lienProjet(prev.id)}"><small>← Projet précédent</small><b>${esc(prev.titre)}</b></a><a href="${lienProjet(next.id)}"><small>Projet suivant →</small><b>${esc(next.titre)}</b></a>`);
  h = avecId(h, p.id);
  fs.writeFileSync(path.join(ROOT, lienProjet(p.id)), h);
  faits.push(lienProjet(p.id));
});

/* ---------- Articles ---------- */
const tplA = read('article.html');
const fmt = d => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
ARTICLES.forEach(a => {
  const url = SITE_URL + lienArticle(a.id), image = abs(a.image);
  const titre = `${a.titre} — Jipson Mathas`, description = court(a.resume || a.contenu);
  let h = entete(tplA, {
    titre, description, url, image, imageParDefaut: !a.image, type: 'article', robots: a.exemple ? 'noindex, follow' : '',
    donnees: [
      { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: a.titre, description, image, url, mainEntityOfPage: url, datePublished: a.date, dateModified: a.date, articleSection: a.categorie, inLanguage: 'fr', author: AUTEUR, publisher: { '@type': 'Person', name: 'Jipson Mathas', logo: { '@type': 'ImageObject', url: SITE_URL + 'images/logo-signature.png' } } },
      fil([['Accueil', SITE_URL], ['Actualités', SITE_URL + 'actualites.html'], [a.titre, url]])
    ]
  });
  if (a.date) h = h.replace('</head>', `<meta property="article:published_time" content="${a.date}">\n</head>`);
  h = remplir(h, 'crumb-cat', esc(a.categorie));
  h = remplir(h, 'a-title', esc(a.titre));
  h = remplir(h, 'a-meta', `<a class="cat" href="actualites.html?cat=${encodeURIComponent(a.categorie)}">${esc(a.categorie)}</a><span>${fmt(a.date)}</span><span>· ${esc(a.lecture || '')} de lecture</span>`);
  if (a.image) h = remplir(h, 'a-cover', `<img src="${esc(a.image)}" alt="">`);
  h = remplir(h, 'a-body', a.contenu || '');
  h = avecId(h, a.id);
  fs.writeFileSync(path.join(ROOT, lienArticle(a.id)), h);
  faits.push(lienArticle(a.id));
});

// Pages d'éléments supprimés depuis la dernière fois : effacées
for (const f of anciens) if (!faits.includes(f)) fs.unlinkSync(path.join(ROOT, f));

/* ---------- Plan du site ---------- */
const urls = [['', 'weekly', '1.0'], ['projets.html', 'weekly', '0.9'], ['formations.html', 'monthly', '0.9'], ['actualites.html', 'weekly', '0.8']]
  .map(([u, f, p]) => ({ loc: SITE_URL + u, f, p }))
  .concat(ARTICLES.filter(a => !a.exemple).sort((x, y) => (y.date || '').localeCompare(x.date || '')).map(a => ({ loc: SITE_URL + lienArticle(a.id), last: a.date, f: 'monthly', p: '0.7' })))
  .concat(PROJETS.filter(p => !p.exemple).map(p => ({ loc: SITE_URL + lienProjet(p.id), f: 'yearly', p: '0.6' })));
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u => `  <url><loc>${u.loc}</loc>${u.last ? `<lastmod>${u.last}</lastmod>` : ''}<changefreq>${u.f}</changefreq><priority>${u.p}</priority></url>`).join('\n') + '\n</urlset>\n');

console.log(`${PROJETS.length} pages projet, ${ARTICLES.length} pages article, plan du site : ${urls.length} adresses` + (anciens.filter(f => !faits.includes(f)).length ? `, ${anciens.filter(f => !faits.includes(f)).length} ancienne(s) page(s) effacée(s)` : ''));

/* ---------- Informations pour Google : accueil (activité locale) et formations (cours) ----------
   Écrites entre les repères <!-- donnees-google --> … <!-- /donnees-google --> de index.html et formations.html */
vm.runInContext(read('data/formations.js') + ';' + read('data/site.js'), ctx, { filename: 'data/formations.js' });
const { FORMATIONS, SITE } = vm.runInContext('({ FORMATIONS, SITE })', ctx);
const reseaux = Object.values(SITE.reseaux || {}).filter(Boolean);
const tel = SITE.whatsapp ? '+' + SITE.whatsapp : undefined;
const ENTREPRISE = {
  '@context': 'https://schema.org', '@type': 'ProfessionalService', '@id': SITE_URL + '#activite',
  name: 'Jipson Mathas', url: SITE_URL, image: SITE_URL + 'images/partage.jpg', logo: SITE_URL + 'favicon.png',
  description: 'Communication, design graphique, identité visuelle, motion design, vidéo, sites web, données et intelligence artificielle, et formations, à Brazzaville et à distance.',
  telephone: tel, email: SITE.email, priceRange: 'FCFA',
  address: { '@type': 'PostalAddress', addressLocality: 'Brazzaville', addressCountry: 'CG' },
  areaServed: [{ '@type': 'City', name: 'Brazzaville' }, { '@type': 'City', name: 'Pointe-Noire' }, { '@type': 'Country', name: 'République du Congo' }],
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '17:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '09:00', closes: '12:00' }],
  founder: { '@id': SITE_URL + '#personne' }, sameAs: reseaux,
  knowsAbout: ['Identité visuelle', 'Design graphique', 'Motion design', 'Montage vidéo', 'Communication institutionnelle', 'Relations publiques', 'Création de sites web', 'Applications mobiles', 'Analyse de données', 'Intelligence artificielle'],
  hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Services', itemListElement: ['Identité visuelle et logo', 'Design graphique et supports imprimés', 'Motion design et vidéo', 'Couverture photo et vidéo d\'événements', 'Développement web et mobile', 'Gestion des réseaux sociaux', 'Analyse de données', 'Formations'].map(n => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: n } })) }
};
const PERSONNE = {
  '@context': 'https://schema.org', '@type': 'Person', '@id': SITE_URL + '#personne', name: 'Jipson Mathas', url: SITE_URL, image: SITE_URL + 'images/partage.jpg',
  jobTitle: 'Expert en communication, design et technologies numériques', email: 'mailto:' + SITE.email, telephone: tel, sameAs: reseaux,
  address: { '@type': 'PostalAddress', addressLocality: 'Brazzaville', addressCountry: 'CG' }, worksFor: { '@id': SITE_URL + '#activite' },
  knowsAbout: ENTREPRISE.knowsAbout
};
// « 2 semaines » -> P2W, « 1 mois » -> P1M
const dureeISO = d => { const m = String(d || '').match(/(\d+)\s*(jour|semaine|mois|an)/i); return m ? 'P' + m[1] + { jour: 'D', semaine: 'W', mois: 'M', an: 'Y' }[m[2].toLowerCase()] : undefined; };
const COURS = {
  '@context': 'https://schema.org', '@type': 'ItemList', name: 'Formations Jipson Mathas',
  itemListElement: FORMATIONS.map((f, i) => ({
    '@type': 'ListItem', position: i + 1, url: SITE_URL + 'formations.html#' + f.id,
    item: {
      '@type': 'Course', '@id': SITE_URL + 'formations.html#' + f.id, name: f.titre, description: court(f.resume, 300), url: SITE_URL + 'formations.html#' + f.id,
      image: abs(f.image), inLanguage: 'fr', educationalLevel: 'Débutant à intermédiaire', audience: { '@type': 'Audience', audienceType: f.public },
      teaches: f.objectifs, about: f.theme,
      provider: { '@type': 'Organization', name: 'Jipson Mathas', sameAs: SITE_URL },
      ...(f.prix ? { offers: [{ '@type': 'Offer', category: 'Paid', price: f.prix, priceCurrency: 'XAF', description: 'Par personne, session ouverte', url: SITE_URL + 'formations.html#' + f.id, availability: 'https://schema.org/InStock' }] } : {}),
      hasCourseInstance: [
        { '@type': 'CourseInstance', courseMode: 'Onsite', location: { '@type': 'Place', name: 'Brazzaville', address: { '@type': 'PostalAddress', addressLocality: 'Brazzaville', addressCountry: 'CG' } }, ...(dureeISO(f.duree) ? { courseWorkload: dureeISO(f.duree) } : {}) },
        { '@type': 'CourseInstance', courseMode: 'Online', ...(dureeISO(f.duree) ? { courseWorkload: dureeISO(f.duree) } : {}) }]
    }
  }))
};
function injecter(fichier, blocs) {
  let h = read(fichier);
  const bloc = '<!-- donnees-google (généré par scripts/build-pages.mjs, ne pas modifier) -->\n' + blocs.map(jsonld).join('\n') + '\n<!-- /donnees-google -->';
  if (h.includes('<!-- donnees-google')) h = h.replace(/<!-- donnees-google[\s\S]*?<!-- \/donnees-google -->/, bloc);
  else if (/<script type="application\/ld\+json">[\s\S]*?<\/script>/.test(h)) h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, bloc);
  else h = h.replace('</head>', bloc + '\n</head>');
  fs.writeFileSync(path.join(ROOT, fichier), h);
}
injecter('index.html', [PERSONNE, ENTREPRISE]);
injecter('formations.html', [COURS, fil([['Accueil', SITE_URL], ['Formations', SITE_URL + 'formations.html']])]);
console.log(`Informations Google : accueil (activité + personne), ${FORMATIONS.length} formations`);
