/* ============================================================
   TRADUCTION DU SITE : français (langue d'origine), anglais, chinois
   - Les textes français restent dans les pages HTML et les fichiers .js.
   - Les traductions sont dans traductions.js : une ligne par texte,
     [ "texte français", "English text", "中文文本" ].
   - Un texte absent de traductions.js reste affiché en français.
   À charger dans le <head> de chaque page, puis appeler I18N.apply()
   en bas de page, juste avant typo.js.
   ============================================================ */
(function () {
  const LANGS = {
    fr: { label: 'FR', nom: 'Français', html: 'fr', locale: 'fr-FR', col: 0 },
    en: { label: 'EN', nom: 'English', html: 'en', locale: 'en-GB', col: 1 },
    zh: { label: '中文', nom: '中文', html: 'zh-Hans', locale: 'zh-CN', col: 2 }
  };

  // Langue choisie : ?lang=en dans l'adresse, sinon le dernier choix du visiteur, sinon le français
  let lang = 'fr';
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && LANGS[q]) localStorage.setItem('jmLang', q);
    lang = localStorage.getItem('jmLang') || 'fr';
  } catch (e) {}
  if (!LANGS[lang]) lang = 'fr';
  document.documentElement.lang = LANGS[lang].html;
  document.documentElement.dataset.lang = lang;

  // Clé de comparaison : espaces normalisés (y compris les espaces insécables de typo.js)
  const norm = s => s.replace(/&nbsp;/g, ' ').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  const hasLetter = /\p{L}/u;

  const dict = new Map();
  const I18N = window.I18N = {
    lang, langs: LANGS, locale: LANGS[lang].locale, norm,
    // Appelé par traductions.js
    load(rows) {
      const c = LANGS[lang].col;
      if (!c) return;
      rows.forEach(r => { if (r && r[c]) dict.set(norm(r[0]), r[c]); });
    },
    // Traduit une chaîne isolée (texte simple)
    t(s) {
      if (lang === 'fr' || s == null) return s;
      const v = dict.get(norm(esc(String(s))));
      return v === undefined ? s : unesc(v);
    },
    apply
  };

  if (lang !== 'fr') document.write('<script src="traductions.js"><\/script>');

  const SKIP = new Set(['SCRIPT', 'STYLE', 'svg', 'SVG', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'VIDEO']);
  const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];

  function trText(n) {
    const t = n.nodeValue; if (!t || !hasLetter.test(t)) return;
    const v = dict.get(norm(esc(t)));
    if (v === undefined) return;
    const m = t.match(/^(\s*)[\s\S]*?(\s*)$/);
    const nv = m[1] + unesc(v) + m[2];
    if (nv !== t) n.nodeValue = nv;
  }
  function trAttrs(el) {
    for (const a of ATTRS) {
      const t = el.getAttribute(a); if (!t || !hasLetter.test(t)) continue;
      const v = dict.get(norm(esc(t)));
      if (v !== undefined) el.setAttribute(a, unesc(v));
    }
  }
  function walk(el) {
    if (SKIP.has(el.tagName) || el.classList.contains('hero-name') || el.classList.contains('lang-switch')) return;
    trAttrs(el);
    const h = el.innerHTML;
    if (h.length < 8000 && hasLetter.test(h)) {
      const v = dict.get(norm(h));
      if (v !== undefined) {
        if (v !== h) el.innerHTML = v;
        el.querySelectorAll('*').forEach(trAttrs);
        return;
      }
    }
    for (const n of [...el.childNodes]) {
      if (n.nodeType === 1) walk(n);
      else if (n.nodeType === 3) trText(n);
    }
  }

  // Sélecteur de langue dans l'en-tête
  function switcher() {
    const bar = document.querySelector('header .bar'); if (!bar || bar.querySelector('.lang-switch')) return;
    const box = document.createElement('div');
    box.className = 'lang-switch'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Langue / Language / 语言');
    box.innerHTML = Object.entries(LANGS).map(([k, l]) =>
      `<button type="button" data-l="${k}" lang="${l.html}" aria-pressed="${k === lang}" title="${l.nom}">${l.label}</button>`).join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.dataset.l === lang) return;
      try { localStorage.setItem('jmLang', b.dataset.l); } catch (err) {}
      // Sans le repère #section de l'adresse : sinon la page rechargée descend jusqu'à cette section
      const u = new URL(location.href); u.searchParams.delete('lang'); u.hash = '';
      if (b.dataset.l !== 'fr') u.searchParams.set('lang', b.dataset.l);
      location.href = u.href;
    });
    const pill = bar.querySelector('.pill:not(.pill-dl)'), dl = bar.querySelector('.pill-dl');
    const end = document.createElement('div'); end.className = 'bar-end';
    if (pill) { bar.insertBefore(end, pill); end.append(box, pill); }
    else { const burger = bar.querySelector('.burger'); bar.insertBefore(end, burger); end.append(box); }
    if (dl) end.prepend(dl);   // bouton « Portfolio (PDF) » des pages Projets, à côté du choix de langue
  }

  // Outil de maintenance : liste les textes de la page (avant animations), pour compléter traductions.js
  function collect() {
    const out = new Set();
    const add = s => { if (s && hasLetter.test(s)) out.add(norm(s)); };
    (function rec(el, inUnit) {
      if (SKIP.has(el.tagName) || el.classList.contains('hero-name') || el.classList.contains('lang-switch')) return;
      ATTRS.forEach(a => { const v = el.getAttribute(a); if (v) add(esc(v)); });
      const unit = !inUnit && [...el.childNodes].some(n => n.nodeType === 3 && hasLetter.test(n.nodeValue));
      if (unit) add(el.innerHTML);
      for (const c of el.children) rec(c, inUnit || unit);
    })(document.body, false);
    add(esc(document.title));
    const md = document.querySelector('meta[name=description]'); if (md) add(esc(md.getAttribute('content')));
    return [...out];
  }
  I18N.collect = collect;

  // Liens internes : la langue choisie suit le visiteur de page en page (?lang=en), même sans mémoire du navigateur
  function keepLang(a) {
    const h = a.getAttribute('href');
    if (!h || /^(#|[a-z][a-z0-9+.-]*:|\/\/)/i.test(h) || a.hasAttribute('download')) return;   // ancres, liens externes, mailto, tel…
    const u = new URL(h, location.href);
    if (u.origin !== location.origin || !/(\.html|\/)$/.test(u.pathname)) return;               // seulement les pages du site
    if (u.searchParams.get('lang') === lang) return;
    u.searchParams.set('lang', lang);
    a.setAttribute('href', (u.pathname.split('/').pop() || './') + u.search + u.hash);
  }
  function linksKeepLang() {
    if (lang === 'fr') return;
    document.querySelectorAll('a[href]').forEach(keepLang);
    ['click', 'auxclick', 'contextmenu', 'focusin'].forEach(ev => document.addEventListener(ev, e => {
      const a = e.target.closest && e.target.closest('a[href]'); if (a) keepLang(a);
    }, true));
  }

  function apply() {
    try { if (sessionStorage.getItem('jmCollect')) window.__units = collect(); } catch (e) {}
    switcher();
    linksKeepLang();
    if (lang === 'fr' || !dict.size) return;
    walk(document.body);
    document.title = I18N.t(document.title);
    const md = document.querySelector('meta[name=description]');
    if (md) md.setAttribute('content', I18N.t(md.getAttribute('content')));
    // Contenus ajoutés plus tard (questionnaire, filtres…) : traduits au fil de l'eau
    const mo = new MutationObserver(list => {
      mo.disconnect();
      for (const m of list) {
        if (m.type === 'characterData') trText(m.target);
        else m.addedNodes.forEach(n => { if (n.nodeType === 1) walk(n); else if (n.nodeType === 3) trText(n); });
      }
      mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
})();
