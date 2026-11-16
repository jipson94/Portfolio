/* ============================================================
   COUCHE D'ANIMATION DU SITE — à charger en dernier sur chaque page.
   Tout est désactivé si le visiteur a réduit les animations dans son système.
   1. Intro : la signature se dessine, puis le rideau se lève (1 fois par visite)
   2. Barre de progression de lecture
   3. Titres qui apparaissent mot par mot
   4. Cartes qui arrivent en cascade
   5. Images dévoilées par un balayage
   6. Effets liés au défilement (astérisque, photo, bandeau)
   7. Ordinateur : cartes inclinables en 3D, halo lumineux qui suit la souris
   ============================================================ */
(function () {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { root.classList.remove('intro'); return; }
  root.classList.add('motion');
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $$ = (s, c) => [...(c || document).querySelectorAll(s)];

  /* 1. Intro */
  if (root.classList.contains('intro')) {
    try { sessionStorage.jmIntro = '1'; } catch (e) {}
    const ov = document.createElement('div');
    ov.className = 'intro-ov'; ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML = '<img src="images/logo-signature.png" alt=""><i></i>';
    document.body.append(ov);
    root.classList.add('intro-run'); root.classList.remove('intro');
    setTimeout(() => { ov.classList.add('out'); root.classList.remove('intro-run'); }, 1250);
    setTimeout(() => ov.remove(), 2200);
  }

  /* 2. Barre de progression */
  const bar = document.createElement('div'); bar.className = 'scroll-bar'; bar.setAttribute('aria-hidden', 'true');
  document.body.append(bar);

  /* 3. Titres mot par mot */
  $$('main h2, main .page-hero h1, .hero-side h1').forEach(h => {
    if (h.closest('#quiz, .contact-form, .hero-name')) return;
    let n = 0;
    const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (!node.nodeValue.trim()) return;
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/([ \n\t]+)/).forEach(part => {
        if (!part) return;
        if (/^[ \n\t]+$/.test(part)) { frag.append(' '); return; }
        const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--w', n++); s.textContent = part;
        frag.append(s);
      });
      node.replaceWith(frag);
    });
    h.classList.add('w-split');
  });

  /* 4. Cascade + 5. Balayage des images */
  $$('.cards, .works, .posts, .formats, .catalog, .p-facts, .p-list, .about-stats, .thumbs, .p-gallery').forEach(g => {
    g.classList.remove('reveal'); g.classList.add('stagger');
    [...g.children].forEach((c, i) => c.style.setProperty('--i', i));
  });
  $$('.project-img, .p-media, .article-cover').forEach(el => el.classList.add('clipr'));

  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; io.unobserve(el);
    if (el.classList.contains('w-split')) { el.classList.add('w-in'); return; }
    el.classList.add('in');
    if (el.classList.contains('stagger')) setTimeout(() => el.classList.remove('stagger'), el.children.length * 80 + 1000);
    if (el.classList.contains('clipr')) setTimeout(() => el.classList.remove('clipr'), 1400);
  }), { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });
  $$('.w-split, .stagger, .clipr').forEach(el => io.observe(el));

  /* 6. Effets liés au défilement */
  const ast = document.querySelector('.ast-wrap'), me = document.querySelector('.me');
  const anims = $$('.track').flatMap(t => t.getAnimations ? t.getAnimations() : []);
  let lastY = scrollY, ticking = false, speed = 1, target = 1, looping = false;
  function frame() {
    ticking = false;
    const y = scrollY, max = root.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (ast && y < 1400) { ast.style.rotate = (y * 0.12) + 'deg'; if (me) me.style.translate = '0 ' + (y * 0.06) + 'px'; }
    const dv = Math.abs(y - lastY); lastY = y;
    if (anims.length && dv > 2) { target = 1 + Math.min(5, dv * 0.12); if (!looping) { looping = true; requestAnimationFrame(marquee); } }
  }
  function marquee() {   // le bandeau accélère quand on fait défiler, puis revient à sa vitesse
    speed += (target - speed) * 0.1; target += (1 - target) * 0.06;
    anims.forEach(a => { a.playbackRate = speed; });
    if (Math.abs(speed - 1) > 0.02 || Math.abs(target - 1) > 0.02) requestAnimationFrame(marquee);
    else { anims.forEach(a => { a.playbackRate = 1; }); looping = false; }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  frame();

  /* Petites formes flottantes dans les en-têtes */
  $$('.hero, .page-hero').forEach(h => {
    for (let i = 1; i <= 4; i++) { const f = document.createElement('span'); f.className = 'floaty f' + i; f.setAttribute('aria-hidden', 'true'); h.prepend(f); }
  });

  /* 7. Ordinateur uniquement */
  if (fine) {
    $$('.card, .work, .post, .format').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateX(' + (-y * 7) + 'deg) rotateY(' + (x * 9) + 'deg) translateY(-6px)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    $$('.hero, .page-hero').forEach(h => h.addEventListener('pointermove', e => {
      const r = h.getBoundingClientRect();
      h.style.setProperty('--sx', (e.clientX - r.left) + 'px'); h.style.setProperty('--sy', (e.clientY - r.top) + 'px');
    }));
  }
})();
