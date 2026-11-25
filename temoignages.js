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
    if (t.type === 'projet' && t.lien) { const p = projet(t.lien); return p ? `<a class="tm-sous" href="projet-${esc(p.id)}.html">Projet : ${esc(p.titre)} ›</a>` : ''; }
    if (t.type === 'formation' && t.lien) { const f = formation(t.lien); return f ? `<a class="tm-sous" href="formations.html#${esc(f.id)}">Formation : ${esc(f.titre.includes(" : ") ? f.titre.split(" : ")[0] : f.titre.length > 34 && f.theme ? f.theme : f.titre)} ›</a>` : ''; }
    // Formation ou projet hors catalogue : même présentation, sans lien
    if (t.intitule) return `<span class="tm-sous">${t.type === 'formation' ? 'Formation' : 'Projet'} : ${esc(t.intitule)}</span>`;
    return '';
  };
  const carte = t => `
    <figure class="tm-card">
      <svg class="tm-quote" viewBox="0 0 48 36" aria-hidden="true"><path d="M0 36V20Q0 6 14 0l4 6q-8 4-8 12h8v18zm26 0V20q0-14 14-20l4 6q-8 4-8 12h8v18z"/></svg>
      <blockquote>${esc(t.texte)}</blockquote>
      <figcaption>
        ${t.photo ? `<img class="tm-avatar" src="${esc(t.photo)}" alt="" loading="lazy">` : `<span class="tm-avatar tm-ini" aria-hidden="true">${esc(initiales(t.nom))}</span>`}
        <span class="tm-who"><b>${esc(t.nom)}</b>${t.fonction || t.structure ? `<small>${esc([t.fonction, t.structure].filter(Boolean).join(' · '))}</small>` : ''}${lienDe(t)}</span>
      </figcaption>
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
    const solo = list.length === 1;
    sec.innerHTML = `<div class="wrap">
      <div class="process-head"><div><div class="kicker">Témoignages</div><h2>${esc(titre)}</h2></div>${sec.dataset.intro ? `<p>${esc(sec.dataset.intro)}</p>` : ''}</div>
      <div class="tm-grid${solo ? ' tm-solo' : ' tm-carrousel'}" tabindex="${solo ? -1 : 0}" aria-label="Témoignages">${list.map(carte).join('')}</div>
      ${solo ? '' : `<div class="tm-nav"><button type="button" class="tm-btn tm-prev" aria-label="Témoignage précédent">‹</button><div class="tm-dots"></div><button type="button" class="tm-btn tm-next" aria-label="Témoignage suivant">›</button></div>`}</div>`;
    sec.hidden = false;
    if (!solo) carrousel(sec);
  });

  /* Carrousel : défile tout seul (pause au survol, au toucher, hors de l'écran ou si l'appareil demande moins d'animations),
     flèches, points et glissement du doigt. Sur ordinateur 3 cartes visibles, 2 sur tablette, 1 sur téléphone. */
  function carrousel(sec) {
    const piste = sec.querySelector('.tm-grid'), cartes = [...piste.children], dots = sec.querySelector('.tm-dots');
    const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pas = () => cartes[0].getBoundingClientRect().width + parseFloat(getComputedStyle(piste).columnGap || getComputedStyle(piste).gap || 0);
    const parVue = () => Math.max(1, Math.round(piste.clientWidth / pas()));
    const pages = () => Math.max(1, cartes.length - parVue() + 1);
    const actuelle = () => Math.round(piste.scrollLeft / pas());
    const aller = i => { const n = pages(); i = ((i % n) + n) % n; piste.scrollTo({ left: i * pas(), behavior: calme ? 'auto' : 'smooth' }); };
    const dessinerPoints = () => {
      const n = pages(); sec.querySelector('.tm-nav').hidden = n < 2;
      dots.innerHTML = Array.from({ length: n }, (_, i) => `<button type="button" aria-label="Aller au témoignage ${i + 1}"></button>`).join('');
      majPoints();
    };
    const majPoints = () => { const a = Math.min(actuelle(), pages() - 1); [...dots.children].forEach((d, i) => d.classList.toggle('on', i === a)); };
    dots.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { aller([...dots.children].indexOf(b)); relancer(); } });
    sec.querySelector('.tm-prev').addEventListener('click', () => { aller(actuelle() - 1); relancer(); });
    sec.querySelector('.tm-next').addEventListener('click', () => { aller(actuelle() + 1); relancer(); });
    let attente; piste.addEventListener('scroll', () => { clearTimeout(attente); attente = setTimeout(majPoints, 80); }, { passive: true });
    addEventListener('resize', () => { dessinerPoints(); });
    dessinerPoints();
    if (calme) return;
    // Défilement automatique
    let minuterie = null, survol = false, visible = false;
    const tourner = () => { if (!survol && visible && !document.hidden) aller(actuelle() + 1); };
    const relancer = () => { clearInterval(minuterie); minuterie = setInterval(tourner, 5000); };
    relancer();
    piste.addEventListener('mouseenter', () => { survol = true; });
    piste.addEventListener('mouseleave', () => { survol = false; });
    piste.addEventListener('focusin', () => { survol = true; });
    piste.addEventListener('focusout', () => { survol = false; });
    piste.addEventListener('touchstart', () => { survol = true; }, { passive: true });
    piste.addEventListener('touchend', () => { survol = false; relancer(); }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: .3 }).observe(piste);
    else visible = true;
  }
})();
