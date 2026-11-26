/* ============================================================
   RÉGLAGES DU SITE — à compléter
   Remplis ces informations : le bouton WhatsApp et les liens
   des réseaux apparaissent automatiquement dès qu'ils sont remplis.
   ============================================================ */
/* SITE : voir data/site.js (modifiable depuis l'espace /admin) */

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

  // Bouton rond « retour en haut », sur toutes les pages, qui apparaît dès qu'on a fait défiler la page
  if (document.querySelector('main')) {
    const up = document.createElement('a');
    up.className = 'to-top'; up.href = '#top'; up.setAttribute('aria-label', 'Retour en haut'); up.textContent = '↑';
    document.body.append(up);
    up.addEventListener('click', e => { e.preventDefault(); scrollTo({top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); });
    const check = () => up.classList.toggle('show', scrollY > innerHeight * 0.8);
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

  // Vidéos « data-src » : rien n'est téléchargé tant qu'elles ne sont pas à l'écran.
  // Sur ordinateur : lecture automatique quand elles apparaissent. Sur téléphone, en mode économie de données
  // ou si l'appareil demande moins d'animations : seule l'image s'affiche, la vidéo se lance avec le bouton ▶.
  const saveData = navigator.connection && navigator.connection.saveData;
  const auto = !saveData && !matchMedia('(max-width: 720px)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('video[data-src]').forEach(v => {
    const tog = v.parentElement.querySelector('.reel-toggle');
    const etat = lecture => { if (tog) { tog.textContent = lecture ? '❚❚' : '▶'; tog.setAttribute('aria-label', lecture ? 'Mettre en pause la vidéo' : 'Lire la vidéo'); } };
    if (!auto || !('IntersectionObserver' in window)) { etat(false); return; }
    etat(true);
    const io = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; io.disconnect(); v.src = v.dataset.src; v.play().catch(() => etat(false)); }, { rootMargin: '200px' });
    io.observe(v);
  });
})();

/* ============================================================
   Formulaires (contact, inscription / devis) : envoi par e-mail vers contact@
   grâce au service Web3Forms (clé SITE.web3forms, réglable dans l'admin).
   Sans clé, ou si l'envoi échoue, le message part par WhatsApp, déjà rédigé.
   ============================================================ */
const CHAMPS = { name: 'Nom', email: 'E-mail', telephone: 'Téléphone', demande: 'Type de demande', formation: 'Formation', format: 'Format', structure: 'Structure', participants: 'Participants', message: 'Message' };
// Envoie le formulaire par e-mail ; renvoie true si c'est parti
window.envoyerFormulaire = async function (form) {
  const fd = new FormData(form);
  if (fd.get('bot-field')) return true;                    // robot : on fait comme si c'était envoyé
  const sujet = form.getAttribute('name') === 'formation'
    ? (fd.get('demande') || 'Demande') + ' — ' + (fd.get('formation') || 'formation')
    : 'Nouveau message depuis le site';
  if (!SITE.web3forms) return false;
  const corps = { access_key: SITE.web3forms, subject: sujet + ' (' + (fd.get('name') || '') + ')', from_name: 'Site jipsonmathas.com', replyto: fd.get('email') || '' };
  for (const [k, v] of fd.entries()) {
    if (['form-name', 'bot-field'].includes(k) || typeof v !== 'string' || !v.trim()) continue;
    corps[CHAMPS[k] || k] = v.trim();
  }
  try {
    const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(corps) });
    const d = await r.json().catch(() => ({}));
    return r.ok && d.success !== false;
  } catch { return false; }
};

(function () {
  document.addEventListener('submit', async e => {
    const form = e.target;
    if (!form.matches('form[data-form]')) return;
    e.preventDefault();
    const btn = form.querySelector('[type=submit]'), lab = btn && btn.textContent;
    if (btn) { btn.disabled = true; btn.textContent = window.I18N ? I18N.t('Envoi…') : 'Envoi…'; }
    const ok = await window.envoyerFormulaire(form);
    if (btn) { btn.disabled = false; btn.textContent = lab; }
    if (ok) { location.href = form.getAttribute('action') || 'merci.html'; return; }
    if (!SITE.whatsapp) return;
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

/* Téléphone : le bouton « Me contacter » de l'en-tête manque de place ; on le reprend en bas du menu */
(function () {
  const pill = document.querySelector('header .pill:not(.pill-dl)'), nav = document.querySelector('header nav');
  if (!pill || !nav || nav.querySelector('.nav-cta')) return;
  const a = document.createElement('a');
  a.className = 'nav-cta'; a.href = pill.getAttribute('href'); a.textContent = pill.textContent.trim();
  a.addEventListener('click', () => {   // referme le menu après le clic
    nav.classList.remove('open');
    const b = document.querySelector('.burger'); if (b) b.setAttribute('aria-expanded', 'false');
  });
  nav.appendChild(a);
})();

/* Statistiques de visite (compteur maison sur Cloudflare, voir stats/) : sans cookie, aucune donnée personnelle.
   Envoie la page vue et sa provenance, plus quelques actions (formation vue / inscription / devis / programme, formulaire envoyé). */
(function () {
  const U = (typeof SITE !== 'undefined' && SITE.stats || '').replace(/\/$/, '');
  if (!U || !/^https:/.test(U) || /^(localhost|127\.|\[::1\])/.test(location.hostname) || navigator.webdriver) return;
  const page = location.pathname.split('/').pop() || 'index.html';
  if (/^(pressbook|programme)\.html$/.test(page)) return;            // pages servant à fabriquer les PDF
  const q = new URLSearchParams(location.search), id = q.get('id');
  let moi = false; try { moi = localStorage.getItem('jm-moi') === '1'; } catch (e) {}   // appareil où l'admin a été ouvert : vos propres visites
  const send = o => { try { if (moi) o.m = 1; const b = JSON.stringify(o); if (!(navigator.sendBeacon && navigator.sendBeacon(U + '/hit', new Blob([b], { type: 'text/plain' })))) fetch(U + '/hit', { method: 'POST', body: b, keepalive: true, mode: 'no-cors' }); } catch (e) {} };
  const evt = name => send({ p: 'evt:' + name });
  send({ p: '/' + page + (id && /^[a-z0-9_-]{1,80}$/i.test(id) ? '?id=' + id : ''), r: document.referrer, s: q.get('utm_source') || '' });

  // Formations : carte réellement regardée (au moins 2 secondes à l'écran), boutons utilisés
  const fid = el => { const c = el && el.closest('[data-id]'); return c ? c.dataset.id : ''; };
  if (page === 'formations.html' && 'IntersectionObserver' in window) {
    const seen = new Set(), timers = new Map();
    const io = new IntersectionObserver(es => es.forEach(e => {
      const k = e.target.dataset.id; if (!k || seen.has(k)) return;
      if (e.isIntersecting) timers.set(k, setTimeout(() => { seen.add(k); io.unobserve(e.target); evt('formation:' + k + ':vue'); }, 2000));
      else clearTimeout(timers.get(k));
    }), { threshold: 0.5 });
    setTimeout(() => document.querySelectorAll('.f-card-full[data-id]').forEach(c => io.observe(c)), 500);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.f-card-full [data-open], .f-card-full a.dl-pdf'); if (!b) return;
    const k = fid(b); if (!k) return;
    evt('formation:' + k + ':' + (b.classList.contains('dl-pdf') ? 'programme' : b.dataset.open === 'Inscription' ? 'clic-inscription' : 'clic-devis'));
  }, true);
  // Press-book téléchargé (lien vers le PDF, où qu'il soit sur le site)
  document.addEventListener('click', e => { if (e.target.closest('a[href*="press-book"][href$=".pdf"]')) evt('pressbook'); }, true);
  // Formulaires envoyés (inscription, devis, contact)
  document.addEventListener('submit', e => {
    const f = e.target; if (!f.matches || !f.matches('form[data-form]')) return;
    const d = f.elements.demande ? f.elements.demande.value : '';
    const t = d === 'Inscription' ? 'inscription' : d === 'Demande de devis' ? 'devis' : 'contact';
    const sel = f.elements.formation, fo = sel && typeof FORMATIONS !== 'undefined' ? FORMATIONS.find(x => x.titre === sel.value) : null;
    evt('envoi:' + t + (fo ? ':' + fo.id : ''));
  }, true);
})();

/* ============================================================
   PARTAGE : bouton « Partager » sur les cartes d'articles et de formations ([data-share-url]).
   Sur téléphone : feuille de partage du téléphone. Sinon : petit menu WhatsApp, Facebook, LinkedIn, X, copier le lien.
   Chaque lien porte sa provenance (?utm_source=whatsapp…) pour les statistiques de l'admin, et la langue choisie.
   ============================================================ */
window.Partage = (function () {
  const BASE = 'https://jipsonmathas.com/';
  const T = s => window.I18N ? I18N.t(s) : s;
  const url = (chemin, source) => {
    const [p, h] = String(chemin).split('#'), u = new URL(p, BASE);
    const lg = window.I18N && I18N.lang; if (lg && lg !== 'fr') u.searchParams.set('lang', lg);
    if (source) u.searchParams.set('utm_source', source);
    return u.href + (h ? '#' + h : '');
  };
  const lien = (canal, chemin, titre) => {
    const u = encodeURIComponent(url(chemin, canal)), t = encodeURIComponent(titre || '');
    return ({
      whatsapp: 'https://wa.me/?text=' + t + '%20' + u,
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + u,
      linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + u,
      x: 'https://x.com/intent/post?text=' + t + '&url=' + u
    })[canal];
  };
  let menu = null;
  const fermer = () => { if (menu) { menu.remove(); menu = null; } };
  function ouvrir(btn) {
    const chemin = btn.dataset.shareUrl, titre = btn.dataset.shareTitle || document.title;
    // Téléphone : partage natif (WhatsApp, Messenger, SMS… selon les applications installées)
    if (navigator.share && matchMedia('(pointer:coarse)').matches) {
      navigator.share({ title: titre, url: url(chemin, 'partage') }).catch(() => {});
      return;
    }
    fermer();
    menu = document.createElement('div');
    menu.className = 'share-menu'; menu.setAttribute('role', 'menu');
    menu.innerHTML = [['whatsapp', 'WhatsApp'], ['facebook', 'Facebook'], ['linkedin', 'LinkedIn'], ['x', 'X']]
      .map(([c, n]) => `<a role="menuitem" href="${lien(c, chemin, titre)}" target="_blank" rel="noopener">${n}</a>`).join('')
      + `<button type="button" role="menuitem" data-copy>${T('Copier le lien')}</button>`;
    document.body.appendChild(menu);
    const r = btn.getBoundingClientRect(), w = menu.offsetWidth, h = menu.offsetHeight;
    let left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8);
    let top = r.bottom + 8; if (top + h > innerHeight - 8) top = r.top - h - 8;
    menu.style.left = (left + scrollX) + 'px'; menu.style.top = (top + scrollY) + 'px';
    menu.querySelector('[data-copy]').addEventListener('click', async e => {
      const b = e.currentTarget;
      try { await navigator.clipboard.writeText(url(chemin, '')); b.textContent = T('Lien copié ✓'); }
      catch { b.textContent = T('Copie impossible'); }
      setTimeout(fermer, 1200);
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setTimeout(fermer, 100)));
  }
  // Le bouton est dans une carte cliquable : on bloque le clic pour ne pas ouvrir l'article ou la formation
  document.addEventListener('click', e => {
    const btn = e.target.closest && e.target.closest('[data-share-url]');
    if (btn) { e.preventDefault(); e.stopPropagation(); ouvrir(btn); return; }
    if (menu && !menu.contains(e.target)) fermer();
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fermer();
    const btn = e.target.closest && e.target.closest('[data-share-url]');
    if (btn && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); ouvrir(btn); }
  }, true);
  addEventListener('scroll', fermer, { passive: true });
  return { url, lien };
})();
