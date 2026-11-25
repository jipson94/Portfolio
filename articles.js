/* Articles du blog — partagés par index.html, actualites.html et article.html */
/* exemple: true = article fictif (affiché avec la mention « Exemple ») : à remplacer ou supprimer avant la mise en ligne. */
/* ====== ARTICLES DU BLOG ======
   Pour ajouter un article : copie un bloc { ... }, change id (sans espace ni accent), titre, date, catégorie, image et texte. */
/* ARTICLES : voir data/articles.js (modifiable depuis l'espace /admin) */

const COVERS = {
  ia: `<svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="225" fill="#132c86"/><circle cx="300" cy="40" r="140" fill="#1d44c2"/><g stroke="#fff799" stroke-width="2" opacity=".55"><line x1="120" y1="70" x2="200" y2="112"/><line x1="200" y1="112" x2="290" y2="80"/><line x1="200" y1="112" x2="150" y2="170"/><line x1="200" y1="112" x2="270" y2="165"/><line x1="120" y1="70" x2="150" y2="170"/></g><circle cx="200" cy="112" r="22" fill="#fff799"/><circle cx="120" cy="70" r="10" fill="#fff"/><circle cx="290" cy="80" r="10" fill="#fff"/><circle cx="150" cy="170" r="10" fill="#fff"/><circle cx="270" cy="165" r="10" fill="#fff"/><path d="M200 100l3.5 8.5 8.5 3.5-8.5 3.5-3.5 8.5-3.5-8.5-8.5-3.5 8.5-3.5z" fill="#0f2167"/></svg>`,
  motion: `<svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="225" fill="#fff799"/><rect x="60" y="80" width="70" height="70" rx="12" fill="#0f2167" opacity=".25"/><rect x="110" y="72" width="70" height="70" rx="12" fill="#0f2167" opacity=".5" transform="rotate(10 145 107)"/><rect x="165" y="64" width="78" height="78" rx="14" fill="#0f2167" transform="rotate(20 204 103)"/><circle cx="300" cy="105" r="36" fill="#1d44c2"/><path d="M290 88v34l28-17z" fill="#fff799"/><path d="M50 185h300" stroke="#0f2167" stroke-width="4" stroke-linecap="round"/><circle cx="210" cy="185" r="8" fill="#1d44c2"/></svg>`,
  logo: `<svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="225" fill="#fff799"/><circle cx="130" cy="112" r="58" fill="#0f2167"/><path d="M104 112a26 26 0 0 1 52 0" stroke="#fff799" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="130" cy="128" r="9" fill="#fff799"/><rect x="225" y="78" width="120" height="18" rx="4" fill="#0f2167"/><rect x="225" y="106" width="84" height="10" rx="3" fill="#0f2167" opacity=".5"/><circle cx="236" cy="146" r="11" fill="#0f2167"/><circle cx="266" cy="146" r="11" fill="#1d44c2"/><circle cx="296" cy="146" r="11" fill="#ffd84a" stroke="#0f2167" stroke-width="2"/></svg>`,
  social: `<svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="225" fill="#1d44c2"/><circle cx="70" cy="200" r="120" fill="#0f2167"/><rect x="90" y="50" width="170" height="80" rx="16" fill="#fff"/><path d="M120 130l-4 26 30-26z" fill="#fff"/><rect x="110" y="72" width="110" height="10" rx="4" fill="#0f2167"/><rect x="110" y="92" width="80" height="8" rx="4" fill="#0f2167" opacity=".45"/><rect x="200" y="118" width="130" height="62" rx="16" fill="#fff799"/><path d="M300 180l6 22-28-22z" fill="#fff799"/><rect x="218" y="136" width="84" height="9" rx="4" fill="#0f2167"/><rect x="218" y="153" width="56" height="8" rx="4" fill="#0f2167" opacity=".45"/></svg>`,
  data: `<svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="225" fill="#0b1850"/><rect x="50" y="30" width="300" height="165" rx="12" fill="#132c86"/><rect x="80" y="130" width="26" height="40" rx="4" fill="#1d44c2"/><rect x="118" y="105" width="26" height="65" rx="4" fill="#1d44c2"/><rect x="156" y="118" width="26" height="52" rx="4" fill="#1d44c2"/><rect x="194" y="80" width="26" height="90" rx="4" fill="#fff799"/><polyline points="240,150 268,128 292,136 322,92" fill="none" stroke="#fff799" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="322" cy="92" r="6" fill="#fff799"/><rect x="80" y="52" width="90" height="10" rx="4" fill="#bcc6ea"/></svg>`
};
// Adresse de la page d'un article (pages générées par scripts/build-pages.mjs)
const lienArticle = id => 'article-' + id + '.html';
// Version de l'article dans la langue du visiteur : tr.en / tr.zh (titre, resume, contenu) si la traduction existe, sinon le français
const artL = a => { const L = window.I18N && I18N.lang, t = a && L && L !== 'fr' && a.tr && a.tr[L]; return t ? Object.assign({}, a, t) : a; };
const coverHTML = a => a.image ? `<img src="${a.image}" alt="" loading="lazy">` : COVERS[a.cover] || '';
const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString((window.I18N && I18N.locale) || 'fr-FR', {day:'numeric', month:'long', year:'numeric'});

// Carte d'aperçu d'un article (lien vers sa page dédiée)
const postCard = a0 => { const a = artL(a0); return `
  <a class="post" href="${lienArticle(a.id)}" data-cat="${a.categorie}">
    <div class="post-cover">${coverHTML(a)}${a.exemple ? '<span class="ex">Exemple</span>' : ''}</div>
    <div class="post-body">
      <div class="post-meta"><span class="cat">${a.categorie}</span><span>${fmtDate(a.date)}</span><span>· ${a.lecture}</span></div>
      <h3>${a.titre}</h3>
      <p class="excerpt">${a.resume}</p>
      <span class="more">Lire l'article →</span>
    </div>
  </a>`; };

// Les anciens liens « index.html#article-xxx » redirigent vers la page de l'article
if (location.hash.startsWith('#article-')) location.replace(lienArticle(location.hash.slice(9)));

