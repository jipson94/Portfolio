/* ============================================================
   Espace d'administration — Jipson Mathas
   Les modifications sont gardées en brouillon (dans ce navigateur) jusqu'au bouton « Publier »,
   qui envoie tout en une seule fois (une seule mise en ligne Netlify).
   ============================================================ */
(function () {
  const API = '/api/admin';
  const FILES = { projets: 'data/projets.js', articles: 'data/articles.js', formations: 'data/formations.js', pubs: 'data/pubs.js', site: 'data/site.js' };
  const DRAFT_KEY = 'jm-admin-draft', SEEN_KEY = 'jm-admin-seen', REPLIED_KEY = 'jm-admin-replied';
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {};          // fichiers de données : { header, data, sha, dirty }
  let images = [];           // images envoyées mais pas encore publiées : { path, blob, preview }
  let token = sessionStorage.getItem('jm-admin-token') || '';
  let CATS = [], MODELES = {};
  const ls = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

  /* ---------- Appels au serveur ---------- */
  async function api(action, payload = {}) {
    const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify({ action, ...payload }) });
    const d = await r.json().catch(() => ({ error: 'Réponse illisible du serveur (' + r.status + ')' }));
    if (r.status === 401 && action !== 'login') { logout(d.error); throw new Error(d.error); }
    if (!r.ok || d.error) throw new Error(d.error || 'Erreur ' + r.status);
    return d;
  }
  function status(msg, kind = '', ms = 0) {
    const el = $('#status'); el.textContent = msg; el.className = 'status ' + kind; el.hidden = !msg;
    if (ms) setTimeout(() => { if (el.textContent === msg) el.hidden = true; }, ms);
  }

  /* ---------- Fichiers de données (format : const NOM = {JSON}; ) ---------- */
  function parseData(text) {
    const parts = text.split(/^const (\w+) = /m);
    const data = {};
    for (let i = 1; i < parts.length; i += 2) data[parts[i]] = JSON.parse(parts[i + 1].trim().replace(/;\s*$/, ''));
    return { header: parts[0], data };
  }
  const serialize = f => f.header + Object.entries(f.data).map(([k, v]) => `const ${k} = ${JSON.stringify(v, null, 2)};\n`).join('\n');

  async function loadAll() {
    const { files } = await api('read', { paths: Object.values(FILES) });
    for (const [key, p] of Object.entries(FILES)) {
      const f = files[p]; if (!f) throw new Error('Fichier introuvable : ' + p);
      store[key] = { ...parseData(f.text), sha: f.sha, dirty: false };
    }
    // Catégories et modèles de textes des projets (définis dans projets.js)
    try {
      const src = await (await fetch('/projets.js', { cache: 'no-store' })).text();
      const grab = name => { const m = src.match(new RegExp('const ' + name + ' = ([\\s\\S]*?\\n[\\]}]);')); return m ? new Function('return (' + m[1] + ')')() : null; };
      CATS = grab('CATEGORIES') || []; MODELES = grab('MODELES') || {};
    } catch { CATS = []; }
    // Brouillon non publié retrouvé ?
    const draft = ls.get(DRAFT_KEY, null);
    if (draft && draft.files && Object.keys(draft.files).length + (draft.images || []).length) {
      const stale = Object.entries(draft.files).some(([k, d]) => store[k] && d.sha !== store[k].sha);
      const ok = await ask('Modifications non publiées',
        `Vous avez des modifications enregistrées dans ce navigateur mais pas encore publiées (${Object.keys(draft.files).length} fichier(s), ${(draft.images || []).length} image(s)).` +
        (stale ? '<br><br><b>Attention :</b> le site a été modifié entre-temps ailleurs. Reprendre le brouillon remplacera ces changements récents pour les fichiers concernés.' : ''),
        'Reprendre le brouillon', 'Abandonner');
      if (ok) {
        for (const [k, d] of Object.entries(draft.files)) if (store[k]) { store[k].data = d.data; store[k].dirty = true; if (!stale) store[k].sha = d.sha; }
        images = draft.images || [];
      } else ls.set(DRAFT_KEY, null);
    }
    refreshPending();
  }
  function saveDraft() {
    const files = {};
    for (const [k, f] of Object.entries(store)) if (f.dirty) files[k] = { data: f.data, sha: f.sha };
    ls.set(DRAFT_KEY, { files, images: images.map(({ path, blob }) => ({ path, blob })) });
    refreshPending();
  }
  function markDirty(key) { store[key].dirty = true; saveDraft(); }
  function refreshPending() {
    const n = Object.values(store).filter(f => f.dirty).length + images.length;
    $('#pending').hidden = !n; $('#pending').textContent = n ? n + ' modification(s) à publier' : '';
    $('#publish').disabled = !n;
  }

  /* ---------- Publication (un seul envoi) ---------- */
  async function publish() {
    const dirty = Object.entries(store).filter(([, f]) => f.dirty);
    if (!dirty.length && !images.length) return;
    const what = dirty.map(([k]) => ({ projets: 'projets', articles: 'articles', formations: 'formations', pubs: 'annonces', site: 'réglages' }[k]));
    const ok = await ask('Publier sur le site ?', `Mise en ligne de : <b>${esc(what.join(', ') || 'images')}</b>${images.length ? ` et ${images.length} image(s)` : ''}.<br><br>Le site sera à jour dans environ une minute. Chaque publication consomme des crédits Netlify (une vingtaine de publications par mois) : regroupez vos modifications.`, 'Publier', 'Annuler');
    if (!ok) return;
    $('#publish').disabled = true; status('Publication en cours…');
    try {
      const files = dirty.map(([k, f]) => ({ path: FILES[k], text: serialize(f) }))
        .concat(images.map(i => ({ path: i.path, blob: i.blob })));
      const expected = Object.fromEntries(dirty.map(([k, f]) => [FILES[k], f.sha]));
      const r = await api('publish', { files, expected, message: 'Admin : mise à jour (' + (what.join(', ') || 'images') + ')' });
      if (r.conflict) {
        status('Le fichier « ' + r.conflict + ' » a été modifié ailleurs depuis l\'ouverture de l\'admin. Rechargez la page : vos modifications restent en brouillon et vous pourrez choisir de les reprendre.', 'err');
        refreshPending(); return;
      }
      // Nouveaux identifiants des fichiers publiés
      const { files: fresh } = await api('read', { paths: dirty.map(([k]) => FILES[k]) });
      for (const [k] of dirty) { store[k].sha = fresh[FILES[k]].sha; store[k].dirty = false; }
      images.forEach(i => { i.published = true; }); images = [];
      ls.set(DRAFT_KEY, null); refreshPending();
      status('Publié ✓ — le site se met à jour (environ une minute).', 'ok');
      watchDeploy();
    } catch (e) { status('Échec de la publication : ' + e.message, 'err'); refreshPending(); }
  }
  async function watchDeploy() {
    for (let i = 0; i < 18; i++) {
      await new Promise(r => setTimeout(r, 10000));
      try {
        const { list } = await api('deploys'); const d = list[0]; if (!d) return;
        if (d.state === 'ready') { status('En ligne ✓ — la nouvelle version du site est publiée.', 'ok', 15000); return; }
        if (d.state === 'error') { status('La mise en ligne a échoué sur Netlify : ' + (d.error || 'voir le tableau de bord Netlify'), 'err'); return; }
        status('Mise en ligne en cours sur Netlify… (' + d.state + ')');
      } catch { return; }
    }
  }

  /* ---------- Images : réduites dans le navigateur puis envoyées ---------- */
  function resize(file, max, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible : ' + file.name)); };
      img.src = url;
    });
  }
  async function addImage(file, path, max = 1600) {
    const dataUrl = await resize(file, max);
    const { blob } = await api('upload', { base64: dataUrl.split(',')[1] });
    images = images.filter(i => i.path !== path).concat({ path, blob, preview: dataUrl });
    saveDraft(); return dataUrl;
  }
  const previewOf = p => (images.find(i => i.path === p) || {}).preview || (p ? '/' + p : '');
  const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'element';
  const uniqueId = (base, list) => { let id = slug(base), n = 2; while (list.some(x => x.id === id)) id = slug(base) + '-' + n++; return id; };
  const stamp = () => Date.now().toString(36);
  const titleNow = fallback => slug((document.getElementById('f-titre') || {}).value || fallback);   // nom d'image d'après le titre saisi
  // Lien WhatsApp : au Congo le 0 fait partie du numéro (+242 06 …)
  const waNumber = t => { const d = String(t || '').replace(/\D/g, ''); return d.startsWith('242') ? d : d.startsWith('0') ? '242' + d : d; };

  /* ---------- Fenêtre de dialogue ---------- */
  function ask(title, html, okLabel = 'OK', cancelLabel = 'Annuler', danger = false) {
    const dlg = $('#dlg'), f = $('#dlg-form');
    f.innerHTML = `<h2>${esc(title)}</h2><div>${html}</div><div class="row" style="justify-content:flex-end">${cancelLabel ? `<button class="btn light" value="no">${esc(cancelLabel)}</button>` : ''}<button class="btn ${danger ? 'danger' : ''}" value="yes">${esc(okLabel)}</button></div>`;
    dlg.showModal();
    return new Promise(res => dlg.addEventListener('close', () => res(dlg.returnValue === 'yes'), { once: true }));
  }

  /* ---------- Constructeur de formulaires ---------- */
  // types : text, textarea, rich, number, date, select, list, tags, check, image
  function fieldHTML(fd, v) {
    const id = 'f-' + fd.k, full = fd.full || ['textarea', 'rich', 'list', 'image', 'tags'].includes(fd.type) ? ' full' : '';
    const help = fd.help ? `<span class="help">${fd.help}</span>` : '';
    if (fd.type === 'check') return `<div class="f${full}"><label class="check"><input type="checkbox" id="${id}" ${v ? 'checked' : ''}> ${esc(fd.label)}</label>${help}</div>`;
    let input;
    if (fd.type === 'textarea') input = `<textarea id="${id}" placeholder="${esc(fd.ph || '')}">${esc(v)}</textarea>`;
    else if (fd.type === 'rich') input = `<div class="rich-bar" data-for="${id}"><button type="button" data-c="h3">Intertitre</button><button type="button" data-c="p">Paragraphe</button><button type="button" data-c="bold"><b>G</b></button><button type="button" data-c="italic"><i>I</i></button><button type="button" data-c="ul">• Liste</button><button type="button" data-c="link">Lien</button><button type="button" data-c="clean">Effacer le style</button></div><div class="rich" id="${id}" contenteditable="true">${v || ''}</div>`;
    else if (fd.type === 'select') input = `<select id="${id}">${fd.opts.map(([val, lab]) => `<option value="${esc(val)}" ${String(v ?? '') === String(val) ? 'selected' : ''}>${esc(lab)}</option>`).join('')}</select>`;
    else if (fd.type === 'list' || fd.type === 'tags') input = `<div class="list-ed" id="${id}">${(v || []).map(x => liHTML(x)).join('')}<button type="button" class="btn light small" data-add="${id}">+ Ajouter une ligne</button></div>`;
    else if (fd.type === 'image') input = `<div class="img-one" id="${id}" data-path="${esc(v || '')}"><img src="${esc(previewOf(v))}" alt=""><label class="btn light small upl">Choisir une image<input type="file" accept="image/*" data-img="${id}"></label></div>`;
    else input = `<input type="${fd.type || 'text'}" id="${id}" value="${esc(v)}" placeholder="${esc(fd.ph || '')}" ${fd.type === 'number' ? 'step="any" min="0"' : ''}>`;
    return `<div class="f${full}"><label for="${id}">${esc(fd.label)}</label>${input}${help}</div>`;
  }
  const liHTML = x => `<div class="li"><input type="text" value="${esc(x)}"><button type="button" class="icon-btn" data-up title="Monter">↑</button><button type="button" class="icon-btn" data-del title="Retirer">✕</button></div>`;
  function readField(fd) {
    const el = document.getElementById('f-' + fd.k); if (!el) return undefined;
    if (fd.type === 'check') return el.checked;
    if (fd.type === 'rich') return cleanHTML(el.innerHTML);
    if (fd.type === 'list' || fd.type === 'tags') return [...el.querySelectorAll('.li input')].map(i => i.value.trim()).filter(Boolean);
    if (fd.type === 'image') return el.dataset.path || '';
    if (fd.type === 'number') return el.value === '' ? '' : Number(el.value);
    return el.value.trim();
  }
  function wireForm(root, onImage) {
    root.addEventListener('click', e => {
      const add = e.target.closest('[data-add]'); if (add) { add.insertAdjacentHTML('beforebegin', liHTML('')); add.previousElementSibling.querySelector('input').focus(); return; }
      const del = e.target.closest('[data-del]'); if (del) { del.closest('.li').remove(); return; }
      const up = e.target.closest('[data-up]'); if (up) { const li = up.closest('.li'); if (li.previousElementSibling) li.parentNode.insertBefore(li, li.previousElementSibling); return; }
      const rb = e.target.closest('.rich-bar button'); if (rb) { richCmd(rb.dataset.c, document.getElementById(rb.parentNode.dataset.for)); }
    });
    root.addEventListener('change', async e => {
      const inp = e.target.closest('[data-img]'); if (!inp || !inp.files[0]) return;
      const box = document.getElementById(inp.dataset.img);
      try { status('Envoi de l\'image…'); const r = await onImage(inp.files[0], box); box.dataset.path = r.path; box.querySelector('img').src = r.preview; status('Image prête ✓ (elle sera en ligne à la publication).', 'ok', 4000); }
      catch (err) { status(err.message, 'err'); }
      inp.value = '';
    });
    root.querySelectorAll('.rich').forEach(r => r.addEventListener('paste', e => {   // coller en texte simple
      e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertHTML', false, t.split(/\n{2,}/).map(p => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join(''));
    }));
  }
  function richCmd(c, el) {
    el.focus();
    if (c === 'h3' || c === 'p') document.execCommand('formatBlock', false, c);
    else if (c === 'bold' || c === 'italic') document.execCommand(c);
    else if (c === 'ul') document.execCommand('insertUnorderedList');
    else if (c === 'clean') document.execCommand('removeFormat');
    else if (c === 'link') { const u = prompt('Adresse du lien (https://…)'); if (u) document.execCommand('createLink', false, u); }
  }
  // Ne garde que les balises utiles (titres, paragraphes, gras, italique, listes, liens)
  function cleanHTML(html) {
    const tpl = document.createElement('template'); tpl.innerHTML = html;
    const ALLOW = { P: 1, H3: 1, STRONG: 1, B: 1, EM: 1, I: 1, UL: 1, OL: 1, LI: 1, A: 1, BR: 1 };
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 1 && /^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|TEMPLATE)$/.test(n.tagName)) { n.remove(); return; }
        if (n.nodeType === 1) {
          walk(n);
          if (n.tagName === 'DIV') { const p = document.createElement('p'); p.append(...n.childNodes); n.replaceWith(p); return; }
          if (n.tagName === 'H2' || n.tagName === 'H4') { const h = document.createElement('h3'); h.append(...n.childNodes); n.replaceWith(h); return; }
          if (!ALLOW[n.tagName]) { n.replaceWith(...n.childNodes); return; }
          const href = n.tagName === 'A' ? n.getAttribute('href') : null;
          [...n.attributes].forEach(a => n.removeAttribute(a.name));
          if (href && /^(https?:|mailto:|tel:|[a-z0-9-]+\.html|#)/i.test(href)) { n.setAttribute('href', href); if (/^https?:/.test(href)) { n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener'); } }
        } else if (n.nodeType === 8) n.remove();
      });
    };
    walk(tpl.content);
    return tpl.innerHTML.replace(/<b>/g, '<strong>').replace(/<\/b>/g, '</strong>').replace(/<i>/g, '<em>').replace(/<\/i>/g, '</em>').replace(/<p><br><\/p>/g, '').trim();
  }

  function editor({ title, groups, item, onSave, onDelete, backHash, note, imageFor, extra }) {
    $('#view-title').textContent = title;
    $('#view').innerHTML = `<form class="form" id="ed">${groups.map(g => `<section class="fgroup">${g.title ? `<h2>${esc(g.title)}</h2>` : ''}${g.fields.map(fd => fieldHTML(fd, item[fd.k])).join('')}</section>`).join('')}
      ${extra ? extra.html : ''}
      ${note ? `<p class="note">${note}</p>` : ''}
      <div class="actions"><div class="row"><a class="btn light" href="${backHash}">← Retour</a>${onDelete ? '<button type="button" class="btn danger" id="ed-del">Supprimer</button>' : ''}</div>
      <button class="btn" type="submit">Enregistrer</button></div></form>`;
    const form = $('#ed');
    wireForm(form, imageFor);
    if (extra && extra.wire) extra.wire(form);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const out = {};
      groups.forEach(g => g.fields.forEach(fd => { out[fd.k] = readField(fd); }));
      if (extra && extra.read) Object.assign(out, extra.read(form));
      const err = onSave(out);
      if (err) { status(err, 'err'); return; }
      status('Enregistré ✓ — pensez à cliquer sur « Publier » pour mettre en ligne.', 'ok', 6000);
      location.hash = backHash;
    });
    if (onDelete) $('#ed-del').addEventListener('click', async () => {
      if (await ask('Supprimer ?', 'Cet élément sera retiré du site à la prochaine publication.', 'Supprimer', 'Annuler', true)) { onDelete(); status('Supprimé — publiez pour appliquer.', 'ok', 5000); location.hash = backHash; }
    });
  }
  // Retire les champs vides (pour les projets à textes types, un champ vide = texte du modèle)
  const prune = o => { Object.keys(o).forEach(k => { const v = o[k]; if (v === '' || v == null || (Array.isArray(v) && !v.length) || v === false) delete o[k]; }); return o; };

  /* ---------- Vues ---------- */
  const VIEWS = {
    async tableau() {
      $('#view-title').textContent = 'Tableau de bord';
      const P = store.projets.data.PROJETS, A = store.articles.data.ARTICLES, F = store.formations.data.FORMATIONS;
      $('#view').innerHTML = `<div class="grid">
        <div class="card"><h3>Demandes reçues</h3><div class="stat" id="d-total">…</div><p class="muted" id="d-month"></p><p style="margin-top:10px"><a href="#demandes">Voir les demandes →</a></p></div>
        <div class="card"><h3>Contenu du site</h3><p><b>${P.length}</b> projets · <b>${A.length}</b> articles · <b>${F.length}</b> formations</p><p class="muted" style="margin-top:6px">${A.filter(a => a.exemple).length} article(s) d'exemple à remplacer</p></div>
        <div class="card"><h3>Dernière mise en ligne</h3><p id="d-deploy" class="muted">…</p></div>
        <div class="card"><h3>Raccourcis</h3><div class="links"><a href="#article/nouveau">+ Écrire un article</a><a href="#projet/nouveau">+ Ajouter un projet</a><a href="https://mail.hostinger.com" target="_blank" rel="noopener">Boîte mail contact@ ↗</a><a href="https://app.netlify.com/projects/jipsonmathas" target="_blank" rel="noopener">Netlify ↗</a></div></div>
      </div>`;
      try {
        const { list } = await api('submissions');
        const now = new Date(), month = list.filter(s => { const d = new Date(s.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
        $('#d-total').textContent = list.length; $('#d-month').textContent = month.length + ' ce mois-ci';
      } catch (e) { $('#d-total').textContent = '—'; $('#d-month').textContent = e.message; }
      try {
        const { list } = await api('deploys'); const d = list[0];
        const lab = { ready: '<span class="tag g">En ligne</span>', building: '<span class="tag y">En cours</span>', enqueued: '<span class="tag y">En attente</span>', error: '<span class="tag r">Échec</span>' }[d.state] || esc(d.state);
        $('#d-deploy').innerHTML = `${lab} ${new Date(d.published_at || d.created_at).toLocaleString('fr-FR')}<br>${esc(d.title)}`;
      } catch (e) { $('#d-deploy').textContent = e.message; }
    },

    async demandes() {
      $('#view-title').textContent = 'Demandes reçues';
      $('#view').innerHTML = '<p class="muted">Chargement…</p>';
      let list;
      try { list = (await api('submissions')).list; } catch (e) { $('#view').innerHTML = `<p class="note">${esc(e.message)}</p>`; return; }
      list.sort((a, b) => b.created_at.localeCompare(a.created_at));
      const seen = ls.get(SEEN_KEY, 0), replied = ls.get(REPLIED_KEY, {});
      ls.set(SEEN_KEY, Date.now()); $('#nav-new').hidden = true;
      const forms = ['Toutes', ...new Set(list.map(s => s.form_name))];
      const LABEL = { name: 'Nom', email: 'E-mail', telephone: 'Téléphone', demande: 'Type', formation: 'Formation', format: 'Format', structure: 'Structure', participants: 'Participants', message: 'Message' };
      const FORM = { formation: 'Formation', contact: 'Contact' };
      let filter = 'Toutes';
      const render = () => {
        const shown = list.filter(s => filter === 'Toutes' || s.form_name === filter);
        $('#subs').innerHTML = shown.length ? shown.map(s => {
          const d = s.data, isNew = new Date(s.created_at).getTime() > seen;
          const rows = Object.entries(d).filter(([k, v]) => v && !['ip', 'user_agent', 'referrer', 'form-name', 'bot-field'].includes(k));
          return `<article class="sub ${isNew ? 'new' : ''}" data-id="${esc(s.id)}">
            <div class="sub-head"><div><b>${esc(d.name || d.email || 'Sans nom')}</b> <span class="tag b">${esc(FORM[s.form_name] || s.form_name)}</span> ${d.demande ? `<span class="tag y">${esc(d.demande)}</span>` : ''} ${isNew ? '<span class="tag y">Nouveau</span>' : ''} ${replied[s.id] ? '<span class="tag g">Répondu</span>' : ''}</div>
            <span class="muted">${new Date(s.created_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</span></div>
            <dl>${rows.map(([k, v]) => `<dt>${esc(LABEL[k] || k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
            <div class="row">${d.email ? '<button class="btn small" data-reply>Répondre par e-mail</button>' : ''}${d.telephone ? `<a class="btn light small" target="_blank" rel="noopener" href="https://wa.me/${esc(waNumber(d.telephone))}">WhatsApp</a>` : ''}<button class="btn danger small" data-remove>Supprimer</button></div>
          </article>`;
        }).join('') : '<p class="muted">Aucune demande pour le moment.</p>';
      };
      $('#view').innerHTML = `<div class="toolbar"><div class="chips" id="chips">${forms.map(f => `<button class="chip ${f === filter ? 'on' : ''}" data-f="${esc(f)}">${esc(FORM[f] || f)}</button>`).join('')}</div><span class="muted">${list.length} demande(s)</span></div><div class="items" id="subs"></div>`;
      render();
      $('#chips').addEventListener('click', e => { const c = e.target.closest('[data-f]'); if (!c) return; filter = c.dataset.f; $('#chips').querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === c)); render(); });
      $('#subs').addEventListener('click', async e => {
        const card = e.target.closest('.sub'); if (!card) return;
        const s = list.find(x => x.id === card.dataset.id), d = s.data;
        if (e.target.closest('[data-remove]')) {
          if (!await ask('Supprimer cette demande ?', 'Elle sera effacée définitivement de Netlify.', 'Supprimer', 'Annuler', true)) return;
          try { await api('deleteSubmission', { id: s.id }); list = list.filter(x => x !== s); render(); status('Demande supprimée.', 'ok', 4000); } catch (err) { status(err.message, 'err'); }
        }
        if (e.target.closest('[data-reply]')) replyTo(s, () => { replied[s.id] = Date.now(); ls.set(REPLIED_KEY, replied); render(); });
      });
    },

    articles() { listView('Articles', store.articles.data.ARTICLES.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')), a => ({ img: previewOf(a.image), t: a.titre, sub: `${a.categorie || ''} · ${a.date ? new Date(a.date + 'T12:00').toLocaleDateString('fr-FR') : ''}`, tags: a.exemple ? '<span class="tag y">Exemple</span>' : '', href: '#article/' + a.id }), '#article/nouveau', '+ Écrire un article'); },
    article(id) {
      const L = store.articles.data.ARTICLES, isNew = id === 'nouveau';
      const a = isNew ? { date: new Date().toISOString().slice(0, 10), categorie: 'Projets' } : L.find(x => x.id === id);
      if (!a) return notFound('#articles');
      const cats = [...new Set(L.map(x => x.categorie).concat(['Projets', 'Intelligence artificielle', 'Motion design', 'Design graphique', 'Communication', 'Analyse de données']))];
      editor({
        title: isNew ? 'Nouvel article' : 'Modifier l\'article', backHash: '#articles', item: a,
        groups: [
          { fields: [{ k: 'titre', label: 'Titre', full: true }, { k: 'categorie', label: 'Catégorie', type: 'select', opts: cats.map(c => [c, c]) }, { k: 'date', label: 'Date de publication', type: 'date' },
            { k: 'image', label: 'Image de couverture', type: 'image', help: 'Format paysage conseillé. Elle est réduite automatiquement.' },
            { k: 'resume', label: 'Résumé (affiché sur les cartes)', type: 'textarea' },
            { k: 'contenu', label: 'Texte de l\'article', type: 'rich', help: 'Utilisez « Intertitre » pour les sous-titres. Le temps de lecture est calculé tout seul.' },
            { k: 'exemple', label: 'Article d\'exemple (affiche la mention « Exemple »)', type: 'check' }] }
        ],
        imageFor: async (file) => { const p = `images/articles/${titleNow('article')}-${stamp()}.jpg`; return { path: p, preview: await addImage(file, p) }; },
        note: 'Les textes modifiés s\'affichent en français dans les versions anglaise et chinoise tant qu\'ils ne sont pas traduits.',
        onSave: out => {
          if (!out.titre) return 'Le titre est obligatoire.';
          if (!out.contenu) return 'Le texte de l\'article est vide.';
          const words = out.contenu.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
          out.lecture = Math.max(1, Math.round(words / 200)) + ' min';
          if (!out.exemple) delete out.exemple;
          if (isNew) L.push({ id: uniqueId(out.titre, L), ...out }); else Object.keys(out).forEach(k => { a[k] = out[k]; }), out.exemple || delete a.exemple;
          markDirty('articles');
        },
        onDelete: isNew ? null : () => { L.splice(L.indexOf(a), 1); markDirty('articles'); }
      });
    },

    projets() { listView('Projets', store.projets.data.PROJETS, p => ({ img: previewOf((p.images || [])[0] || p.poster), t: p.titre, sub: `${(CATS.find(c => c.id === p.cat) || {}).label || p.cat || ''} · ${p.annee || ''}`, tags: p.modele ? '<span class="tag">Textes types</span>' : '', href: '#projet/' + p.id }), '#projet/nouveau', '+ Ajouter un projet', true); },
    projet(id) {
      const L = store.projets.data.PROJETS, isNew = id === 'nouveau';
      const p = isNew ? { cat: (CATS[0] || {}).id, annee: String(new Date().getFullYear()), modele: 'identite', images: [] } : L.find(x => x.id === id);
      if (!p) return notFound('#projets');
      let imgs = (p.images || []).slice();
      const modeles = [['', 'Aucun (j\'écris tous les textes)']].concat(Object.keys(MODELES).map(k => [k, 'Textes types : ' + ({ identite: 'identité visuelle', affiches: 'affiches', cm: 'réseaux sociaux', edition: 'édition' }[k] || k)]));
      const drawImgs = root => {
        root.querySelector('#imgs').innerHTML = imgs.map((src, i) => `<div class="im"><img src="${esc(previewOf(src))}" alt=""><span class="n">${i === 0 ? 'Principale' : i + 1}</span><div class="ctl">${i ? `<button type="button" data-mv="${i}" title="Avancer">←</button>` : ''}<button type="button" data-rm="${i}" title="Retirer">✕</button></div></div>`).join('') || '<p class="muted">Aucune image pour l\'instant.</p>';
      };
      editor({
        title: isNew ? 'Nouveau projet' : 'Modifier le projet', backHash: '#projets', item: p,
        groups: [
          { title: 'L\'essentiel', fields: [{ k: 'titre', label: 'Nom du projet / du client' }, { k: 'annee', label: 'Année', ph: '2025' },
            { k: 'cat', label: 'Catégorie sur la page Projets', type: 'select', opts: CATS.map(c => [c.id, c.label]) },
            { k: 'modele', label: 'Textes de la fiche', type: 'select', opts: modeles, help: 'Avec des « textes types », laissez vides les champs ci-dessous : un texte standard s\'affichera.' }] },
          { title: 'La fiche du projet (facultatif avec textes types)', fields: [{ k: 'sousTitre', label: 'Sous-titre' }, { k: 'categorie', label: 'Domaine affiché', ph: 'Identité visuelle · Design graphique' },
            { k: 'client', label: 'Client' }, { k: 'role', label: 'Mon rôle' }, { k: 'lieu', label: 'Lieu' }, { k: 'video', label: 'Vidéo (chemin ou lien .mp4, facultatif)' },
            { k: 'resume', label: 'Résumé (carte du projet)', type: 'textarea' }, { k: 'contexte', label: 'Contexte / la demande', type: 'textarea' },
            { k: 'solution', label: 'Ce que j\'ai fait', type: 'rich' }, { k: 'objectifs', label: 'Objectifs', type: 'list' },
            { k: 'livrables', label: 'Livrables', type: 'list' }, { k: 'outils', label: 'Mots-clés / outils', type: 'tags' }] }
        ],
        extra: {
          html: `<section class="fgroup"><h2>Images (la première est l'image principale)</h2><div class="f full"><div class="imgs" id="imgs"></div>
            <label class="btn light upl" style="margin-top:10px;align-self:flex-start">+ Ajouter des images<input type="file" accept="image/*" multiple id="add-imgs"></label>
            <span class="help">Vous pouvez en choisir plusieurs d'un coup. Elles sont réduites automatiquement.</span></div></section>`,
          wire: root => {
            drawImgs(root);
            root.querySelector('#imgs').addEventListener('click', e => {
              const mv = e.target.closest('[data-mv]'), rm = e.target.closest('[data-rm]');
              if (mv) { const i = +mv.dataset.mv; [imgs[i - 1], imgs[i]] = [imgs[i], imgs[i - 1]]; drawImgs(root); }
              if (rm) { imgs.splice(+rm.dataset.rm, 1); drawImgs(root); }
            });
            root.querySelector('#add-imgs').addEventListener('change', async e => {
              const files = [...e.target.files]; e.target.value = '';
              const base = slug(root.querySelector('#f-titre').value || p.titre || 'projet');
              for (let i = 0; i < files.length; i++) {
                status(`Envoi de l'image ${i + 1} / ${files.length}…`);
                try {
                  const name = `${base}-${stamp()}${i}.jpg`, big = 'images/projets/g/' + name;
                  await addImage(files[i], big, 1600);
                  await addImage(files[i], 'images/projets/g/t/' + name, 480);   // miniature
                  imgs.push(big); drawImgs(root);
                } catch (err) { status(err.message, 'err'); return; }
              }
              status('Images prêtes ✓ (en ligne à la publication).', 'ok', 4000);
            });
          },
          read: () => ({ images: imgs })
        },
        note: 'Les textes modifiés s\'affichent en français dans les versions anglaise et chinoise tant qu\'ils ne sont pas traduits.',
        onSave: out => {
          if (!out.titre) return 'Le nom du projet est obligatoire.';
          if (!out.images.length) return 'Ajoutez au moins une image.';
          if (!out.modele) { if (!out.resume || !out.contexte) return 'Sans textes types, le résumé et le contexte sont obligatoires.'; }
          const keep = { variante: p.variante, poster: p.poster };
          prune(out);
          if (isNew) L.unshift({ id: uniqueId(out.titre, L), ...out });
          else { Object.keys(p).forEach(k => { if (k !== 'id') delete p[k]; }); Object.assign(p, out); Object.entries(keep).forEach(([k, v]) => { if (v != null) p[k] = v; }); }
          markDirty('projets');
        },
        onDelete: isNew ? null : () => { L.splice(L.indexOf(p), 1); markDirty('projets'); }
      });
    },

    formations() { listView('Formations', store.formations.data.FORMATIONS, f => ({ img: previewOf(f.image), t: f.titre, sub: `${f.theme || ''} · ${f.duree || ''} · ${f.prix ? Number(f.prix).toLocaleString('fr-FR') + ' FCFA' : ''}`, href: '#formation/' + f.id }), '#formation/nouveau', '+ Ajouter une formation'); },
    formation(id) {
      const D = store.formations.data, L = D.FORMATIONS, isNew = id === 'nouveau';
      const f = isNew ? { theme: 'Communication', icone: 'building', duree: '1 mois', objectifs: [] } : L.find(x => x.id === id);
      if (!f) return notFound('#formations');
      const prog = (D.PROGRAMMES[f.id] && JSON.parse(JSON.stringify(D.PROGRAMMES[f.id]))) || { modules: [], projet: '' };
      const themes = [...new Set(L.map(x => x.theme))];
      const modHTML = m => `<div class="mod"><input type="text" placeholder="Période (ex. Semaines 1–2)" value="${esc(m.periode || '')}" data-m="periode"><div><input type="text" placeholder="Titre du module" value="${esc(m.titre || '')}" data-m="titre" style="margin-bottom:8px"><textarea placeholder="Points abordés (un par ligne)" data-m="points">${esc((m.points || []).join('\n'))}</textarea></div><button type="button" class="icon-btn" data-delmod title="Retirer">✕</button></div>`;
      editor({
        title: isNew ? 'Nouvelle formation' : 'Modifier la formation', backHash: '#formations', item: { ...f, projetFinal: prog.projet },
        groups: [
          { title: 'Présentation', fields: [{ k: 'titre', label: 'Titre', full: true }, { k: 'theme', label: 'Thème', type: 'select', opts: themes.map(t => [t, t]) }, { k: 'duree', label: 'Durée', ph: '1 mois' },
            { k: 'public', label: 'Public visé', full: true }, { k: 'image', label: 'Image', type: 'image' }, { k: 'resume', label: 'Résumé', type: 'textarea' }, { k: 'objectifs', label: 'Objectifs', type: 'list' }] },
          { title: 'Prix (FCFA)', fields: [{ k: 'prix', label: 'Par personne (session ouverte)', type: 'number' }, { k: 'prixEntreprise', label: 'Entreprise, à partir de', type: 'number' }] }
        ],
        extra: {
          html: `<section class="fgroup"><h2>Programme (fiche PDF et page)</h2><div class="f full"><div id="mods" class="list-ed">${prog.modules.map(modHTML).join('')}</div><button type="button" class="btn light small" id="addmod" style="align-self:flex-start;margin-top:8px">+ Ajouter un module</button></div>
            <div class="f full"><label for="f-projetFinal">Projet final</label><input type="text" id="f-projetFinal" value="${esc(prog.projet || '')}"></div></section>`,
          wire: root => {
            root.querySelector('#addmod').addEventListener('click', () => root.querySelector('#mods').insertAdjacentHTML('beforeend', modHTML({})));
            root.querySelector('#mods').addEventListener('click', e => { if (e.target.closest('[data-delmod]')) e.target.closest('.mod').remove(); });
          },
          read: root => ({ _prog: { modules: [...root.querySelectorAll('#mods .mod')].map(m => ({ periode: m.querySelector('[data-m=periode]').value.trim(), titre: m.querySelector('[data-m=titre]').value.trim(), points: m.querySelector('[data-m=points]').value.split('\n').map(s => s.trim()).filter(Boolean) })).filter(m => m.titre), projet: root.querySelector('#f-projetFinal').value.trim() } })
        },
        imageFor: async file => { const p = `images/formations/${titleNow('formation')}-${stamp()}.jpg`; return { path: p, preview: await addImage(file, p) }; },
        note: 'Après une modification de formation, la fiche PDF du programme n\'est pas régénérée automatiquement : demandez-le à Claude. Les textes modifiés restent en français dans les autres langues tant qu\'ils ne sont pas traduits.',
        onSave: out => {
          if (!out.titre) return 'Le titre est obligatoire.';
          const pr = out._prog; delete out._prog; delete out.projetFinal;
          if (out.prix === '') delete out.prix; if (out.prixEntreprise === '') delete out.prixEntreprise;
          let target = f;
          if (isNew) { target = { id: uniqueId(out.titre, L), icone: f.icone, ...out }; L.push(target); } else Object.assign(f, out);
          D.PROGRAMMES[target.id] = pr.projet ? pr : { modules: pr.modules };
          markDirty('formations');
        },
        onDelete: isNew ? null : () => { L.splice(L.indexOf(f), 1); delete D.PROGRAMMES[f.id]; markDirty('formations'); }
      });
    },

    annonces() { listView('Annonces', store.pubs.data.PUBS, a => ({ img: previewOf(a.image), t: a.titre, sub: (a.type === 'sponsor' ? 'Partenaire' : 'Mon offre') + ' · ' + (a.couleur || ''), href: '#annonce/' + a.id }), '#annonce/nouveau', '+ Ajouter une annonce'); },
    annonce(id) {
      const L = store.pubs.data.PUBS, isNew = id === 'nouveau';
      const a = isNew ? { type: 'annonce', couleur: 'jaune', lien: 'index.html#contact' } : L.find(x => x.id === id);
      if (!a) return notFound('#annonces');
      editor({
        title: isNew ? 'Nouvelle annonce' : 'Modifier l\'annonce', backHash: '#annonces', item: a,
        groups: [{ fields: [{ k: 'titre', label: 'Titre', full: true }, { k: 'texte', label: 'Texte', type: 'textarea' }, { k: 'cta', label: 'Texte du bouton', ph: 'En savoir plus →' }, { k: 'lien', label: 'Lien du bouton', ph: 'formations.html' },
          { k: 'type', label: 'Type', type: 'select', opts: [['annonce', 'Mon offre (« Annonce »)'], ['sponsor', 'Partenaire (« Sponsorisé »)']] }, { k: 'couleur', label: 'Couleur', type: 'select', opts: [['jaune', 'Jaune'], ['bleu', 'Bleu']] }, { k: 'image', label: 'Image', type: 'image' }] }],
        imageFor: async file => { const p = `images/annonces/${titleNow('annonce')}-${stamp()}.jpg`; return { path: p, preview: await addImage(file, p, 1000) }; },
        onSave: out => { if (!out.titre) return 'Le titre est obligatoire.'; if (isNew) L.push({ id: uniqueId(out.titre, L), ...out }); else Object.assign(a, out); markDirty('pubs'); },
        onDelete: isNew ? null : () => { L.splice(L.indexOf(a), 1); markDirty('pubs'); }
      });
    },

    reglages() {
      const S = store.site.data.SITE;
      editor({
        title: 'Réglages', backHash: '#tableau', item: { ...S, ...Object.fromEntries(Object.entries(S.reseaux || {}).map(([k, v]) => ['r_' + k, v])) },
        groups: [
          { title: 'Coordonnées', fields: [{ k: 'whatsapp', label: 'Numéro WhatsApp (chiffres, avec 242)', ph: '242061800888' }, { k: 'email', label: 'E-mail affiché' }, { k: 'ville', label: 'Ville' }, { k: 'telephone', label: 'Téléphone affiché (facultatif)' },
            { k: 'whatsappMessage', label: 'Message pré-rempli WhatsApp', full: true }] },
          { title: 'Réseaux sociaux (laisser vide pour masquer)', fields: Object.keys(S.reseaux || {}).map(k => ({ k: 'r_' + k, label: k, type: 'url', ph: 'https://…' })) }
        ],
        note: 'Après un changement de numéro ou d\'e-mail, demandez à Claude de régénérer les fiches PDF des programmes.',
        onSave: out => {
          if (out.whatsapp && !/^\d{8,15}$/.test(out.whatsapp)) return 'Le numéro WhatsApp doit contenir uniquement des chiffres (ex. 242061800888).';
          Object.keys(out).forEach(k => { if (k.startsWith('r_')) { S.reseaux[k.slice(2)] = out[k]; delete out[k]; } });
          Object.assign(S, out); markDirty('site');
        }
      });
    }
  };

  function listView(title, list, fmt, newHash, newLabel, searchable = true) {
    $('#view-title').textContent = title;
    $('#view').innerHTML = `<div class="toolbar">${searchable ? '<input class="search" id="q" type="search" placeholder="Rechercher…">' : '<span></span>'}<a class="btn" href="${newHash}">${esc(newLabel)}</a></div><div class="items" id="lst"></div>`;
    const draw = q => {
      $('#lst').innerHTML = list.map(fmt).filter(x => !q || x.t.toLowerCase().includes(q)).map(x => `<a class="item" href="${x.href}">${x.img ? `<img src="${esc(x.img)}" alt="" loading="lazy">` : '<span class="ph"></span>'}<div class="grow"><div class="t">${esc(x.t)}</div><div class="muted">${esc(x.sub)}</div></div>${x.tags || ''}</a>`).join('') || '<p class="muted">Rien pour l\'instant.</p>';
    };
    draw('');
    const q = $('#q'); if (q) q.addEventListener('input', () => draw(q.value.trim().toLowerCase()));
  }
  function notFound(back) { $('#view').innerHTML = `<p class="note">Élément introuvable. <a href="${back}">Retour</a></p>`; }

  async function replyTo(s, done) {
    const d = s.data, first = (d.name || '').split(' ')[0];
    const subj = s.form_name === 'formation' ? `Votre ${d.demande === 'Demande de devis' ? 'demande de devis' : 'inscription'} — ${d.formation || 'formation'}` : 'Votre message — Jipson Mathas';
    const dlg = $('#dlg'), f = $('#dlg-form');
    f.innerHTML = `<h2>Répondre à ${esc(d.name || d.email)}</h2>
      <div class="f"><label>À</label><input type="text" id="r-to" value="${esc(d.email)}"></div>
      <div class="f"><label>Objet</label><input type="text" id="r-subj" value="${esc(subj)}"></div>
      <div class="f"><label>Message</label><textarea id="r-text">Bonjour ${esc(first)},\n\nMerci pour votre message.\n\n\n\nCordialement,\nJipson Mathas\nWhatsApp : +${esc((store.site.data.SITE.whatsapp || '').replace(/^(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5'))}\njipsonmathas.com</textarea></div>
      <p class="muted">Envoyé depuis contact@jipsonmathas.com. Une copie arrive aussi dans votre boîte.</p>
      <div class="row" style="justify-content:flex-end"><button class="btn light" value="no">Annuler</button><button class="btn" value="send" id="r-send">Envoyer</button></div>`;
    dlg.showModal();
    const ta = $('#r-text'); ta.focus(); ta.setSelectionRange(ta.value.indexOf('\n\n\n') + 2, ta.value.indexOf('\n\n\n') + 2);
    $('#r-send').addEventListener('click', async e => {
      e.preventDefault(); const b = e.target; b.disabled = true; b.textContent = 'Envoi…';
      try { await api('reply', { to: $('#r-to').value, subject: $('#r-subj').value, text: ta.value }); dlg.close(); status('Réponse envoyée ✓', 'ok', 5000); done(); }
      catch (err) { b.disabled = false; b.textContent = 'Envoyer'; alert(err.message); }
    });
  }

  /* ---------- Navigation ---------- */
  function route() {
    if (!store.site) return;
    $('#app').classList.remove('menu');
    const [v, arg] = (location.hash.slice(1) || 'tableau').split('/');
    document.querySelectorAll('#side-nav a').forEach(a => a.classList.toggle('on', a.dataset.v === v || a.dataset.v + 's' === v || a.dataset.v === v + 's'));
    const fn = VIEWS[v] || VIEWS.tableau;
    try { fn(arg && decodeURIComponent(arg)); } catch (e) { status(e.message, 'err'); }
    scrollTo(0, 0);
  }
  async function start() {
    $('#login').hidden = true; $('#app').hidden = false;
    status('Chargement des données…');
    try { await loadAll(); status(''); } catch (e) { status('Impossible de charger les données : ' + e.message, 'err'); return; }
    route();
    // Pastille « nouvelles demandes »
    api('submissions').then(({ list }) => { const seen = ls.get(SEEN_KEY, 0), n = list.filter(s => new Date(s.created_at).getTime() > seen).length; if (n) { $('#nav-new').textContent = n; $('#nav-new').hidden = false; } }).catch(() => {});
  }
  function logout(msg) {
    token = ''; sessionStorage.removeItem('jm-admin-token');
    $('#app').hidden = true; $('#login').hidden = false; $('#login-err').textContent = msg || '';
  }

  addEventListener('hashchange', route);
  $('#publish').addEventListener('click', publish);
  $('#logout').addEventListener('click', () => logout());
  $('#menu-btn').addEventListener('click', () => $('#app').classList.toggle('menu'));
  addEventListener('beforeunload', e => { if (Object.values(store).some(f => f.dirty) || images.length) { e.preventDefault(); e.returnValue = ''; } });
  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault(); $('#login-err').textContent = '';
    const b = e.target.querySelector('button'); b.disabled = true;
    try { const r = await api('login', { password: $('#pw').value }); token = r.token; sessionStorage.setItem('jm-admin-token', token); $('#pw').value = ''; start(); }
    catch (err) { $('#login-err').textContent = err.message; }
    b.disabled = false;
  });
  if (token) start(); else logout();
})();
