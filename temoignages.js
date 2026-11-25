/* ============================================================
   Témoignages — affichés dans les sections <section data-temoignages="…">
   data-temoignages : "projet", "formation" ou "tous" (accueil : les deux mélangés)
   data-lien="auto" : seulement ceux du projet affiché (page d'un projet)
   data-max : nombre maximum affiché
   La section reste cachée tant qu'il n'y a aucun témoignage à montrer.
   Données : data/temoignages.js (modifiable depuis /admin)
   ============================================================ */
(function () {
  if (typeof TEMOIGNAGES === 'undefined') return;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const initiales = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(m => m[0]).join('').toUpperCase();
  const projet = id => typeof PROJETS !== 'undefined' && PROJETS.find(p => p.id === id);
  const formation = id => typeof FORMATIONS !== 'undefined' && FORMATIONS.find(f => f.id === id);
  const lienDe = t => {
    if (t.type === 'projet' && t.lien) { const p = projet(t.lien); return p ? `<a class="tm-lien" href="projet-${esc(p.id)}.html">Projet : ${esc(p.titre)} →</a>` : ''; }
    if (t.type === 'formation' && t.lien) { const f = formation(t.lien); return f ? `<a class="tm-lien" href="formations.html#${esc(f.id)}">Formation : ${esc(f.titre)} →</a>` : ''; }
    return '';
  };
  const carte = t => `
    <figure class="tm-card">
      <svg class="tm-quote" viewBox="0 0 48 36" aria-hidden="true"><path d="M0 36V20Q0 6 14 0l4 6q-8 4-8 12h8v18zm26 0V20q0-14 14-20l4 6q-8 4-8 12h8v18z"/></svg>
      <blockquote>${esc(t.texte)}</blockquote>
      <figcaption>
        ${t.photo ? `<img class="tm-avatar" src="${esc(t.photo)}" alt="" loading="lazy">` : `<span class="tm-avatar tm-ini" aria-hidden="true">${esc(initiales(t.nom))}</span>`}
        <span class="tm-who"><b>${esc(t.nom)}</b><small>${esc([t.fonction, t.structure].filter(Boolean).join(' · '))}</small></span>
      </figcaption>
      ${lienDe(t)}
    </figure>`;
  // Accueil : les plus récents, en alternant projets et formations
  const melange = list => {
    const p = list.filter(t => t.type !== 'formation'), f = list.filter(t => t.type === 'formation'), out = [];
    while (p.length || f.length) { if (p.length) out.push(p.shift()); if (f.length) out.push(f.shift()); }
    return out;
  };
  const tri = list => list.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  document.querySelectorAll('[data-temoignages]').forEach(sec => {
    const type = sec.dataset.temoignages, max = +sec.dataset.max || 9;
    let list = tri(TEMOIGNAGES.filter(t => t && t.texte && t.nom && (type === 'tous' || (type === 'formation' ? t.type === 'formation' : t.type !== 'formation'))));
    if (sec.dataset.lien === 'auto') {
      const id = new URLSearchParams(location.search).get('id') || window.PAGE_ID;
      list = list.filter(t => t.lien === id);
    }
    if (type === 'tous') list = melange(list);
    list = list.slice(0, max);
    if (!list.length) return;
    const titre = sec.dataset.titre || 'Ce qu\'ils en disent';
    sec.innerHTML = `<div class="wrap">
      <div class="process-head"><div><div class="kicker">Témoignages</div><h2>${esc(titre)}</h2></div>${sec.dataset.intro ? `<p>${esc(sec.dataset.intro)}</p>` : ''}</div>
      <div class="tm-grid${list.length === 1 ? ' tm-solo' : ''}">${list.map(carte).join('')}</div></div>`;
    sec.hidden = false;
  });
})();
