/* Catalogue des formations — utilisé par index.html (aperçu) et formations.html (page complète).
   Pour ajouter une formation : copie un bloc { ... } et modifie-le.
   « duree » (de 2 semaines à 3 mois) et « public » sont des propositions : ajuste-les à ton offre réelle.
   « prix » (par personne, session ouverte) et « prixEntreprise » (groupe dans votre structure, à partir de) sont en FCFA :
   estimations basées sur les tarifs moyens à Brazzaville, à ajuster. */
/* FORMATIONS : voir data/formations.js (modifiable depuis l'espace /admin) */

const FORMATION_ICONS = {
  building: '<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/>',
  mega: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',
  spark: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  palette: '<path d="M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3 3h-2a2 2 0 0 0-1.5 3.3A1.6 1.6 0 0 1 12 21z"/><circle cx="7.5" cy="11" r="1"/><circle cx="11" cy="7" r="1"/><circle cx="16" cy="8.5" r="1"/>',
  play: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4-2.5z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>'
};
const formationIcon = f => `<svg viewBox="0 0 24 24">${FORMATION_ICONS[f.icone] || ''}</svg>`;
const formationMail = f => 'mailto:contact@jipsonmathas.com?subject=' + encodeURIComponent('Formation : ' + f.titre) + '&body=' + encodeURIComponent("Bonjour,\n\nJe souhaite recevoir le programme et les modalités de la formation « " + f.titre + " ».\n\nOrganisation / structure :\nNombre de participants :\nFormat souhaité (présentiel / en ligne) :\nPériode envisagée :\n\nMerci.");

// Carte courte (aperçu sur l'accueil)
const formationCard = f => `
  <a class="card" href="formations.html#${f.id}">
    <span class="card-ico">${formationIcon(f)}</span>
    <span class="f-theme">${f.theme} · ${f.duree}</span>
    <h3>${f.titre}</h3>
    <p>${f.resume}</p>
  </a>`;

/* Illustrations des formations (dessins vectoriels aux couleurs du site).
   Pour utiliser une vraie photo à la place : ajoute  image: 'images/ma-photo.jpg'  dans la formation. */
const FORMATION_ARTS = {
  'communication-institutionnelle': `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="300" fill="#1d44c2"/><circle cx="330" cy="40" r="130" fill="#2f5ae0"/><rect x="60" y="150" width="150" height="110" fill="#0f2167"/><path d="M50 150l85-60 85 60z" fill="#0f2167"/><rect x="78" y="170" width="18" height="70" fill="#fff799"/><rect x="108" y="170" width="18" height="70" fill="#fff799"/><rect x="138" y="170" width="18" height="70" fill="#fff799"/><rect x="168" y="170" width="18" height="70" fill="#fff799"/><rect x="40" y="258" width="190" height="12" rx="3" fill="#0b1850"/><rect x="235" y="70" width="130" height="64" rx="14" fill="#fff"/><path d="M262 134l-10 22 30-22z" fill="#fff"/><rect x="252" y="88" width="90" height="9" rx="4" fill="#0f2167"/><rect x="252" y="106" width="64" height="9" rx="4" fill="#1d44c2"/><rect x="250" y="160" width="110" height="52" rx="12" fill="#fff799"/><path d="M340 212l14 18-30-18z" fill="#fff799"/><rect x="264" y="176" width="70" height="8" rx="4" fill="#0f2167"/><rect x="264" y="192" width="46" height="8" rx="4" fill="#0f2167" opacity=".5"/></svg>`,
  'relations-publiques': `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="300" fill="#fff799"/><circle cx="60" cy="260" r="120" fill="#ffe35a" opacity=".6"/><rect x="150" y="220" width="100" height="16" rx="4" fill="#0f2167"/><rect x="194" y="150" width="12" height="74" fill="#0f2167"/><rect x="172" y="70" width="56" height="96" rx="28" fill="#1d44c2"/><path d="M164 120v8a36 36 0 0 0 72 0v-8" stroke="#0f2167" stroke-width="8" fill="none" stroke-linecap="round"/><g stroke="#0f2167" stroke-width="6" stroke-linecap="round"><path d="M260 90a60 60 0 0 1 0 70" fill="none"/><path d="M285 70a90 90 0 0 1 0 110" fill="none" opacity=".5"/><path d="M140 90a60 60 0 0 0 0 70" fill="none"/><path d="M115 70a90 90 0 0 0 0 110" fill="none" opacity=".5"/></g><rect x="290" y="210" width="70" height="44" rx="6" fill="#0f2167"/><rect x="300" y="222" width="40" height="6" rx="3" fill="#fff799"/><rect x="300" y="234" width="28" height="6" rx="3" fill="#fff799" opacity=".6"/><rect x="40" y="40" width="70" height="44" rx="6" fill="#1d44c2"/><rect x="50" y="52" width="40" height="6" rx="3" fill="#fff"/><rect x="50" y="64" width="28" height="6" rx="3" fill="#fff" opacity=".6"/></svg>`,
  'ia-productivite': `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="300" fill="#0f2167"/><circle cx="200" cy="150" r="120" fill="#132c86"/><g stroke="#fff799" stroke-width="2" opacity=".5"><line x1="200" y1="150" x2="90" y2="70"/><line x1="200" y1="150" x2="320" y2="60"/><line x1="200" y1="150" x2="330" y2="230"/><line x1="200" y1="150" x2="80" y2="230"/><line x1="90" y1="70" x2="80" y2="230"/><line x1="320" y1="60" x2="330" y2="230"/></g><rect x="150" y="100" width="100" height="100" rx="18" fill="#1d44c2" stroke="#fff799" stroke-width="3"/><g stroke="#fff799" stroke-width="4" stroke-linecap="round"><line x1="170" y1="92" x2="170" y2="80"/><line x1="200" y1="92" x2="200" y2="80"/><line x1="230" y1="92" x2="230" y2="80"/><line x1="170" y1="208" x2="170" y2="220"/><line x1="200" y1="208" x2="200" y2="220"/><line x1="230" y1="208" x2="230" y2="220"/></g><path d="M200 122l7 17 17 7-17 7-7 17-7-17-17-7 17-7z" fill="#fff799"/><circle cx="90" cy="70" r="12" fill="#fff"/><circle cx="320" cy="60" r="12" fill="#fff"/><circle cx="330" cy="230" r="12" fill="#fff799"/><circle cx="80" cy="230" r="12" fill="#fff"/></svg>`,
  'design-graphique': `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="300" fill="#2f5ae0"/><rect x="50" y="40" width="210" height="220" rx="10" fill="#fff"/><circle cx="120" cy="120" r="44" fill="#fff799"/><rect x="140" y="110" width="90" height="90" rx="8" fill="#1d44c2"/><path d="M80 230l40-60 40 60z" fill="#0f2167"/><rect x="180" y="220" width="60" height="10" rx="5" fill="#0f2167" opacity=".4"/><g transform="rotate(35 320 150)"><rect x="306" y="60" width="28" height="150" rx="6" fill="#fff799"/><path d="M306 210h28l-14 34z" fill="#0f2167"/><rect x="306" y="60" width="28" height="20" rx="6" fill="#0f2167"/></g><circle cx="300" cy="60" r="12" fill="#fff799"/><circle cx="330" cy="60" r="12" fill="#0f2167"/><circle cx="360" cy="60" r="12" fill="#fff"/></svg>`,
  'motion-design': `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="300" fill="#fff799"/><rect x="40" y="36" width="320" height="150" rx="14" fill="#0f2167"/><rect x="80" y="80" width="54" height="54" rx="10" fill="#fff799" opacity=".3"/><rect x="120" y="70" width="54" height="54" rx="10" fill="#fff799" opacity=".6" transform="rotate(12 147 97)"/><rect x="168" y="62" width="58" height="58" rx="12" fill="#fff799" transform="rotate(24 197 91)"/><circle cx="300" cy="110" r="30" fill="#1d44c2"/><path d="M291 96v28l24-14z" fill="#fff799"/><rect x="40" y="206" width="320" height="58" rx="10" fill="#0f2167" opacity=".12"/><rect x="56" y="222" width="288" height="6" rx="3" fill="#0f2167" opacity=".35"/><rect x="56" y="242" width="288" height="6" rx="3" fill="#0f2167" opacity=".35"/><g fill="#1d44c2"><path d="M90 219l6 6-6 6-6-6z"/><path d="M170 219l6 6-6 6-6-6z"/><path d="M250 239l6 6-6 6-6-6z"/><path d="M310 219l6 6-6 6-6-6z"/></g><rect x="198" y="200" width="4" height="70" rx="2" fill="#e5484d"/></svg>`,
  'analyse-donnees': `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="300" fill="#132c86"/><rect x="40" y="40" width="200" height="220" rx="14" fill="#1d44c2"/><rect x="62" y="200" width="26" height="40" rx="4" fill="#2f5ae0"/><rect x="98" y="160" width="26" height="80" rx="4" fill="#2f5ae0"/><rect x="134" y="120" width="26" height="120" rx="4" fill="#fff799"/><rect x="170" y="150" width="26" height="90" rx="4" fill="#2f5ae0"/><polyline points="62,120 98,100 134,74 170,92 206,60" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="206" cy="60" r="6" fill="#fff"/><circle cx="310" cy="110" r="60" fill="#0f2167"/><path d="M310 110V50a60 60 0 0 1 52 90z" fill="#fff799"/><path d="M310 110l52 30a60 60 0 0 1-82 22z" fill="#2f5ae0"/><rect x="262" y="196" width="100" height="14" rx="7" fill="#fff799"/><rect x="262" y="220" width="72" height="14" rx="7" fill="#fff" opacity=".6"/></svg>`,
  'site-web': `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="300" fill="#1d44c2"/><circle cx="60" cy="40" r="110" fill="#2f5ae0"/><rect x="40" y="50" width="250" height="180" rx="12" fill="#fff"/><rect x="40" y="50" width="250" height="24" rx="12" fill="#e3e8f8"/><circle cx="58" cy="62" r="4" fill="#ff6b6b"/><circle cx="72" cy="62" r="4" fill="#ffc94d"/><circle cx="86" cy="62" r="4" fill="#4cd07d"/><rect x="60" y="92" width="130" height="14" rx="4" fill="#0f2167"/><rect x="60" y="114" width="100" height="8" rx="4" fill="#0f2167" opacity=".4"/><rect x="60" y="130" width="84" height="8" rx="4" fill="#0f2167" opacity=".4"/><rect x="60" y="150" width="56" height="18" rx="9" fill="#1d44c2"/><rect x="200" y="90" width="72" height="72" rx="10" fill="#fff799"/><rect x="60" y="184" width="64" height="30" rx="6" fill="#e3e8f8"/><rect x="134" y="184" width="64" height="30" rx="6" fill="#e3e8f8"/><rect x="208" y="184" width="64" height="30" rx="6" fill="#e3e8f8"/><rect x="290" y="110" width="76" height="140" rx="14" fill="#0f2167"/><rect x="298" y="124" width="60" height="112" rx="6" fill="#fff"/><rect x="306" y="134" width="44" height="10" rx="3" fill="#0f2167"/><rect x="306" y="152" width="44" height="34" rx="5" fill="#fff799"/><rect x="306" y="194" width="30" height="8" rx="3" fill="#0f2167" opacity=".4"/></svg>`
};
const formationArt = f => f.image ? `<img src="${f.image}" alt="" loading="lazy"><span class="f-illu">Image d'illustration</span>` : (FORMATION_ARTS[f.id] || '');
// Prix affichés sur l'image de la formation
const fcfa = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f') + '\u00a0FCFA';
const fcfaB = n => `<b>${fcfa(n).replace(/ FCFA$/, '')}<i>FCFA</i></b>`;   // chiffres en gros, « FCFA » en petit
const formationPrix = f => f.prix ? `<span class="f-price"><span class="fp-row"><small>Par personne</small>${fcfaB(f.prix)}</span>${f.prixEntreprise ? `<span class="fp-row fp-pro"><small>Entreprise, dès</small>${fcfaB(f.prixEntreprise)}</span>` : ''}</span>` : '';

// Carte avec illustration (aperçu sur l'accueil)
const formationCardArt = f => `
  <a class="card f-card" href="formations.html#${f.id}">
    <span class="f-card-art">${formationArt(f)}${formationPrix(f)}</span>
    <span class="f-theme">${f.theme} · ${f.duree}</span>
    <h3>${f.titre}</h3>
    <p>${f.resume}</p>
  </a>`;

/* Programmes détaillés (par semaine ou par période) — affichés dans le catalogue de formations.html.
   Rythme indicatif : à adapter (ex. 2 séances par semaine, en présentiel ou à distance). */
/* PROGRAMMES : voir data/formations.js (modifiable depuis l'espace /admin) */

// Programme HTML d'une formation (frise de modules)
const programmeHTML = f => {
  const p = PROGRAMMES[f.id]; if (!p) return '';
  return `
    <div class="f-prog">
      <h4>Programme <span>· ${p.modules.length} modules · ${f.duree}</span></h4>
      <ol class="prog">${p.modules.map((m, i) => `
        <li>
          <span class="prog-num">${String(i + 1).padStart(2, '0')}</span>
          <div>
            <small>${m.periode}</small>
            <b>${m.titre}</b>
            <ul>${m.points.map(x => `<li>${x}</li>`).join('')}</ul>
          </div>
        </li>`).join('')}
      </ol>
      ${p.projet ? `<div class="prog-final"><small>Projet final</small><b>${p.projet}</b></div>` : ''}
      <p class="prog-note">Rythme indicatif adaptable à votre disponibilité (par exemple 2 séances par semaine), en présentiel ou à distance.</p>
    </div>`;
};

/* Devis automatique (page Formations) — règles de calcul, à ajuster librement.
   - Session ouverte / À distance : prix par personne × nombre de participants.
   - Dans votre structure : forfait « prixEntreprise » jusqu'à « groupeInclus » participants,
     puis chaque participant en plus coûte « partSupp » × le prix par personne. */
const DEVIS = { groupeInclus: 10, partSupp: 0.5, validiteJours: 30 };
function calculDevis(f, format, nb) {
  nb = Math.max(1, parseInt(nb, 10) || 1);
  if (format === 'Dans votre structure') {
    const lignes = [{ label: 'Forfait groupe', detail: `jusqu'à ${DEVIS.groupeInclus} participants`, qte: 1, pu: f.prixEntreprise }];
    const supp = nb - DEVIS.groupeInclus;
    if (supp > 0) lignes.push({ label: 'Participant supplémentaire', detail: '', qte: supp, pu: Math.round(f.prix * DEVIS.partSupp) });
    return { nb, lignes, total: lignes.reduce((s, l) => s + l.qte * l.pu, 0) };
  }
  const lignes = [{ label: 'Participant', detail: format, qte: nb, pu: f.prix }];
  return { nb, lignes, total: nb * f.prix };
}
