/* ============================================================
   RÉGLAGES DU SITE — à compléter
   Remplis ces informations : le bouton WhatsApp et les liens
   des réseaux apparaissent automatiquement dès qu'ils sont remplis.
   ============================================================ */
const SITE = {
  nom: 'Jipson Mathas',
  email: 'contact@jipsonmathas.com',
  ville: 'Brazzaville, Congo',
  // Téléphone affiché (laisser vide pour masquer)
  telephone: '',
  // Numéro WhatsApp au format international, chiffres uniquement (ex. '242061234567')
  whatsapp: '242061800888',   // +242 06 180 08 88
  whatsappMessage: "Bonjour Jipson, je vous contacte depuis votre site.",
  // Liens complets (laisser vide pour masquer)
  reseaux: {
    LinkedIn: 'https://www.linkedin.com/in/jipsonmathas',
    Instagram: '',
    Facebook: 'https://www.facebook.com/jipsonmathas',
    YouTube: '',
    TikTok: ''
  }
};

/* ============================================================
   Éléments communs à toutes les pages (ne pas modifier)
   ============================================================ */
(function () {
  const here = location.pathname.split('/').pop() || 'index.html';
  const home = here === 'index.html' || here === '' ? '' : 'index.html';
  const waLink = SITE.whatsapp ? 'https://wa.me/' + SITE.whatsapp + '?text=' + encodeURIComponent(window.I18N ? I18N.t(SITE.whatsappMessage) : SITE.whatsappMessage) : '';   // message dans la langue active
  const socials = Object.entries(SITE.reseaux).filter(([, url]) => url);
  // Icônes des réseaux sociaux
  const ICONES = {
    LinkedIn: '<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4z"/>',
    Facebook: '<path d="M14 8.5V6.6c0-.9.6-1.1 1-1.1h2.6V1.6L14 1.5c-4 0-4.9 3-4.9 4.9v2.1H6.8v4h2.3V22.5H14v-10h3.3l.4-4z"/>',
    Instagram: '<path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM12 3.6c2.7 0 3 0 4.1.1 2.7.1 4 1.4 4.1 4.1.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 2.7-1.4 4-4.1 4.1-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-2.7-.1-4-1.4-4.1-4.1-.1-1.1-.1-1.4-.1-4.1s0-3 .1-4.1c.1-2.7 1.4-4 4.1-4.1 1.1-.1 1.4-.1 4.1-.1zM12 2c-2.7 0-3.1 0-4.2.1C4.2 2.2 2.2 4.2 2.1 7.8 2 8.9 2 9.3 2 12s0 3.1.1 4.2c.2 3.6 2.1 5.6 5.7 5.7 1.1.1 1.5.1 4.2.1s3.1 0 4.2-.1c3.6-.2 5.6-2.1 5.7-5.7.1-1.1.1-1.5.1-4.2s0-3.1-.1-4.2C21.8 4.2 19.8 2.2 16.2 2.1 15.1 2 14.7 2 12 2z"/>',
    YouTube: '<path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15V9l5.8 3z"/>',
    TikTok: '<path d="M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.4 6.4 0 1 0 5.4 6.3V8.6a8.1 8.1 0 0 0 4.7 1.5V6.7a4.7 4.7 0 0 1-4.7-4.7z"/>'
  };
  const socialIcons = cls => socials.map(([n, u]) => `<a class="${cls}" href="${u}" target="_blank" rel="noopener" aria-label="${n}" title="${n}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONES[n] || ''}</svg></a>`).join('');

  // Lien d'évitement (accessibilité clavier)
  const main = document.querySelector('main');
  if (main) {
    main.id = main.id || 'contenu';
    const skip = document.createElement('a');
    skip.className = 'skip'; skip.href = '#' + main.id; skip.textContent = 'Aller au contenu';
    document.body.prepend(skip);
  }

  // Bouton WhatsApp flottant
  if (waLink) {
    const wa = document.createElement('a');
    wa.className = 'wa-float'; wa.href = waLink; wa.target = '_blank'; wa.rel = 'noopener';
    wa.setAttribute('aria-label', 'Discuter sur WhatsApp');
    wa.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-1-1.1-1.3-1.7-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.6.6-.9 1.4-.9 2.2.1 1 .5 1.9 1.1 2.7 1.1 1.6 2.5 2.9 4.2 3.7.5.2 1 .4 1.5.5.6.2 1.2.2 1.7.1.6-.1 1.2-.5 1.5-1 .2-.4.2-.8.1-1.2l-.3-.3z"/></svg><span>WhatsApp</span>';
    document.body.append(wa);
    document.querySelectorAll('[data-whatsapp]').forEach(el => { el.href = waLink; el.hidden = false; });
    document.querySelectorAll('[data-wa-row]').forEach(el => { el.hidden = false; });
  }

  // Pied de page complet
  const footer = document.querySelector('footer');
  if (footer) {
    footer.innerHTML = `
      <div class="wrap foot">
        <div class="foot-brand">
          <a href="${home || '#top'}" aria-label="Accueil"><img src="images/logo-signature.png" alt="${SITE.nom}" width="209" height="64"></a>
          <p>Communication, design et technologies numériques.<br>${SITE.ville} — disponible à distance.</p>
        </div>
        <div class="foot-nav" role="navigation" aria-label="Pied de page">
          <b>Navigation</b>
          <a href="${home}#apropos">À propos</a>
          <a href="${home}#services">Services</a>
          <a href="projets.html">Projets</a>
          <a href="formations.html">Formations</a>
          <a href="actualites.html">Actualités</a>
        </div>
        <div class="foot-contact">
          <b>Contact</b>
          <a href="mailto:${SITE.email}">${SITE.email}</a>
          ${SITE.telephone ? `<a href="tel:${SITE.telephone.replace(/\s/g, '')}">${SITE.telephone}</a>` : ''}
          ${waLink ? `<a href="${waLink}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
          <a href="${home}#contact">Formulaire de contact</a>
          ${socials.length ? `<div class="foot-social">${socialIcons('soc')}</div>` : ''}
        </div>
      </div>
      <div class="wrap foot-bottom">
        <span>© ${new Date().getFullYear()} ${SITE.nom}. <span>Tous droits réservés.</span></span>
        <a href="#top">Retour en haut ↑</a>
      </div>`;
  }

  // Téléphone dans la section contact
  document.querySelectorAll('[data-tel]').forEach(el => { if (SITE.telephone) { el.href = 'tel:' + SITE.telephone.replace(/\s/g, ''); el.textContent = SITE.telephone; el.hidden = false; } });
  if (SITE.telephone) document.querySelectorAll('[data-tel-row]').forEach(el => { el.hidden = false; });

  // Réseaux sociaux dans la section contact
  if (socials.length) document.querySelectorAll('[data-socials]').forEach(slot => { slot.innerHTML = socialIcons('soc soc-lg'); });

  // Menu : souligne la section visible pendant le défilement (page d'accueil)
  const spyLinks = [...document.querySelectorAll('header nav a[href^="#"]')];
  if (spyLinks.length && 'IntersectionObserver' in window) {
    const map = new Map(spyLinks.map(a => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver(entries => entries.forEach(e => {
      const a = map.get(e.target.id); if (!a) return;
      if (e.isIntersecting) { spyLinks.forEach(l => { l.classList.remove('on'); l.removeAttribute('aria-current'); }); a.classList.add('on'); a.setAttribute('aria-current', 'location'); }
    }), {rootMargin: '-45% 0px -50% 0px'});
    map.forEach((a, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
    // « À propos » reste actif pendant « Ma démarche »
    const dem = document.getElementById('demarche'); if (dem && map.get('apropos')) { map.set('demarche', map.get('apropos')); spy.observe(dem); }
    const pl = document.querySelector('header nav a[href="projets.html"]'), ps = document.getElementById('projets');
    if (pl && ps) { spyLinks.push(pl); map.set('projets', pl); spy.observe(ps); }
    const top = document.querySelector('.hero');
    if (top) new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) spyLinks.forEach(l => { l.classList.remove('on'); l.removeAttribute('aria-current'); }); }), {rootMargin: '-45% 0px -50% 0px'}).observe(top);
  }

  // En-têtes des pages : les ondes du fond sont centrées sur l'astérisque qui tourne
  document.querySelectorAll('.page-hero').forEach(hero => {
    const ast = hero.querySelector('.ast-deco'); if (!ast) return;
    const place = () => {
      const h = hero.getBoundingClientRect(), a = ast.getBoundingClientRect();
      hero.style.setProperty('--wx', Math.round(a.left + a.width / 2 - h.left) + 'px');
      hero.style.setProperty('--wy', Math.round(a.top + a.height / 2 - h.top) + 'px');
    };
    place(); addEventListener('load', place);
    if ('ResizeObserver' in window) new ResizeObserver(place).observe(hero); else addEventListener('resize', place);
  });

  // Accueil : bouton rond « retour en haut », qui apparaît en arrivant en bas de la page
  if (document.querySelector('.hero')) {
    const up = document.createElement('a');
    up.className = 'to-top'; up.href = '#top'; up.setAttribute('aria-label', 'Retour en haut'); up.textContent = '↑';
    document.body.append(up);
    up.addEventListener('click', e => { e.preventDefault(); scrollTo({top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); });
    const check = () => up.classList.toggle('show', scrollY + innerHeight > document.documentElement.scrollHeight - 900);
    addEventListener('scroll', check, {passive: true}); addEventListener('resize', check); check();
  }

  // En-têtes : anneaux et « planètes » qui tournent autour du centre (photo sur l'accueil, astérisque ailleurs)
  (function () {
    const R = [110, 175, 250, 335, 430, 535, 650, 775, 910, 1055];
    const PLANETS = { 1: [-38, 4.5], 3: [205, 3], 5: [-150, 4.5], 6: [28, 3], 8: [192, 4.5], 4: [118, 3] };
    let svg = '<svg viewBox="0 0 2400 2400" aria-hidden="true">';
    R.forEach((r, i) => {
      const op = (0.36 - i * 0.022).toFixed(3);
      const dash = i % 3 === 1 ? ' stroke-dasharray="1.5 9" stroke-linecap="round" stroke-width="2"' : i % 3 === 2 ? ' stroke-dasharray="60 14 6 14"' : '';
      let g = '<g class="orb" style="--d:' + (40 + i * 22) + 's;--dir:' + (i % 4 === 3 ? -1 : 1) + '"><circle cx="1200" cy="1200" r="' + r + '" fill="none" stroke="rgb(140,175,255)" stroke-opacity="' + op + '" stroke-width="1.4"' + dash + '/>';
      if (PLANETS[i]) { const a = PLANETS[i][0] * Math.PI / 180; g += '<circle cx="' + (1200 + r * Math.cos(a)).toFixed(1) + '" cy="' + (1200 + r * Math.sin(a)).toFixed(1) + '" r="' + PLANETS[i][1] + '" fill="#fff799" fill-opacity=".75"/>'; }
      svg += g + '</g>';
    });
    svg += '</svg>';
    document.querySelectorAll('.hero, .page-hero').forEach(h => {
      if (h.querySelector('.orbits')) return;
      const o = document.createElement('div'); o.className = 'orbits'; o.innerHTML = svg;
      h.prepend(o);
    });
  })();

  // Petits écrans / connexion économique : vidéo non lancée automatiquement
  const saveData = navigator.connection && navigator.connection.saveData;
  if (saveData || matchMedia('(max-width: 720px)').matches) {
    document.querySelectorAll('video[autoplay]').forEach(v => {
      v.removeAttribute('autoplay'); v.preload = 'none'; v.pause();
      const tog = v.parentElement.querySelector('.reel-toggle'); if (tog) { tog.textContent = '▶'; tog.setAttribute('aria-label', 'Lire la vidéo'); }
    });
  }
})();

/* ============================================================
   Formulaires hors Netlify (ex. GitHub Pages) : l'envoi Netlify
   n'existe pas, le message part donc par WhatsApp, déjà rédigé.
   Sur Netlify, rien ne change : les formulaires s'envoient normalement.
   ============================================================ */
(function () {
  if (!/\.github\.io$/.test(location.hostname) || !SITE.whatsapp) return;
  document.addEventListener('submit', e => {
    const form = e.target;
    if (!form.matches('form[data-netlify]')) return;
    e.preventDefault();
    const T = s => window.I18N ? I18N.t(s) : s, lg = (window.I18N && I18N.lang) || 'fr';
    const sep = lg === 'fr' ? ' : ' : lg === 'zh' ? '：' : ': ';   // ponctuation propre à chaque langue
    const titre = T(form.getAttribute('name') === 'formation' ? 'Demande de formation' : 'Message depuis le site');
    const lignes = [titre];
    form.querySelectorAll('input[name], select[name], textarea[name]').forEach(el => {
      if (['form-name', 'bot-field'].includes(el.name) || !el.value.trim()) return;
      if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) return;
      if (el.closest('[hidden]') || el.offsetParent === null && el.type !== 'radio') return;
      const lab = el.type === 'radio' ? T('Demande') : ((form.querySelector('label[for="' + el.id + '"]') || {}).firstChild || {}).textContent;
      const val = el.tagName === 'SELECT' ? el.options[el.selectedIndex].text : el.type === 'radio' ? T(el.value) : el.value;   // valeurs affichées (traduites)
      lignes.push((lab ? lab.trim() + sep : '') + val.trim());
    });
    location.href = 'https://wa.me/' + SITE.whatsapp + '?text=' + encodeURIComponent(lignes.join('\n'));
  });
})();
