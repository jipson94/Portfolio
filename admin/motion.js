/* ============================================================
   Animations de l'espace d'administration
   Apparition en cascade des blocs, chiffres qui défilent, barres et anneaux qui se remplissent.
   Fonctionne tout seul : surveille la zone #view et anime ce qui y apparaît.
   Désactivé si l'appareil demande moins d'animations.
   ============================================================ */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('anim-on');
  const view = document.getElementById('view');
  if (!view) return;

  const BLOCS = '.kpi, .card, .item, .fgroup, .st-card, .hello, .toolbar, .note, .moi-info, .feed-list li, .legend li, .bar-row, .counts a';
  const ease = t => 1 - Math.pow(1 - t, 3);

  // Chiffre qui défile de 0 à sa valeur
  function compte(el) {
    const txt = el.textContent.trim();
    if (!/^[\d\s  ]+$/.test(txt)) return;
    const fin = parseInt(txt.replace(/\D/g, ''), 10);
    if (!fin) return;
    const t0 = performance.now(), dur = Math.min(1100, 450 + fin * 8);
    const pas = now => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(fin * ease(k)).toLocaleString('fr-FR');
      if (k < 1) requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
  }

  function anime(root) {
    // 1. Blocs : apparition en cascade (dans l'ordre d'affichage)
    let i = 0;
    root.querySelectorAll(BLOCS).forEach(el => {
      if (el.dataset.a) return; el.dataset.a = '1';
      el.style.setProperty('--i', Math.min(i++, 18));
      el.classList.add('a-in');
      const fin = e => { if (e.target !== el) return; el.classList.remove('a-in'); el.removeEventListener('animationend', fin); };
      el.addEventListener('animationend', fin);   // libère l'effet de survol une fois apparu
    });
    // 2. Chiffres
    root.querySelectorAll('.kpi b, .d-tot, .counts a b, .stat').forEach(el => { if (el.dataset.c) return; el.dataset.c = '1'; compte(el); });
    // 3. Colonnes du graphique : montent l'une après l'autre
    root.querySelectorAll('.chart').forEach(ch => {
      if (ch.dataset.a2) return; ch.dataset.a2 = '1';
      const cols = ch.querySelectorAll('.col i'), n = cols.length;
      cols.forEach((b, k) => { b.style.setProperty('--d', Math.round(k * Math.min(40, 700 / Math.max(n, 1))) + 'ms'); b.classList.add('a-grow'); });
    });
    // 4. Barres horizontales
    root.querySelectorAll('.bar-track i').forEach((b, k) => { if (b.dataset.a) return; b.dataset.a = '1'; b.style.setProperty('--d', (120 + k * 45) + 'ms'); b.classList.add('a-bar'); });
    // 5. Anneaux : chaque part se dessine à son tour
    root.querySelectorAll('.donut svg').forEach(svg => {
      if (svg.dataset.a) return; svg.dataset.a = '1';
      const arcs = [...svg.querySelectorAll('circle')];
      arcs.forEach(c => { c.dataset.final = c.getAttribute('stroke-dasharray'); const C = c.dataset.final.split(' ')[1]; c.setAttribute('stroke-dasharray', '0 ' + C); });
      svg.getBoundingClientRect();   // force le point de départ
      arcs.forEach((c, k) => setTimeout(() => { c.style.transition = 'stroke-dasharray .7s cubic-bezier(.2,.7,.2,1)'; c.setAttribute('stroke-dasharray', c.dataset.final); }, 150 + k * 140));
    });
  }

  // Tout ce qui apparaît dans la zone principale (changement de page ou données chargées) est animé
  new MutationObserver(muts => {
    if (muts.some(m => [...m.addedNodes].some(n => n.nodeType === 1))) requestAnimationFrame(() => anime(view));
  }).observe(view, { childList: true, subtree: true });

  // Changement de page : fondu léger du titre
  addEventListener('hashchange', () => {
    const t = document.getElementById('view-title'); if (!t) return;
    t.classList.remove('a-title'); void t.offsetWidth; t.classList.add('a-title');
  });
  // Messages d'état : glissent depuis le haut
  const st = document.getElementById('status');
  if (st) new MutationObserver(() => { if (!st.hidden) { st.classList.remove('a-status'); void st.offsetWidth; st.classList.add('a-status'); } }).observe(st, { attributes: true, attributeFilter: ['hidden'], childList: true });   // pas 'class' : sinon boucle infinie
})();
