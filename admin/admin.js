/* ============================================================
   Espace d'administration — Jipson Mathas
   Le site est hébergé sur GitHub Pages : l'admin enregistre dans le dépôt GitHub en passant par le
   « portier » Cloudflare (stats/worker.js), qui garde la clé GitHub en secret. Connexion par mot de passe,
   session de 30 jours gardée dans ce navigateur.
   Les modifications restent en brouillon jusqu'au bouton « Publier », qui envoie tout en une fois.
   Les demandes des formulaires arrivent par e-mail dans contact@ (Web3Forms), pas dans l'admin.
   ============================================================ */
(function () {
  const REPO = 'jipson94/Portfolio', BRANCH = 'main', GH = 'https://api.github.com/repos/' + REPO;
  const TOKEN_KEY = 'jm-admin-session';
  const API = (() => { try { return localStorage.getItem('jm-admin-api') || ''; } catch { return ''; } })() || 'https://jm-stats.jipsonmathas.workers.dev';   // portier Cloudflare
  try { localStorage.removeItem('jm-admin-gh'); } catch {}   // ancienne clé GitHub : plus utilisée
  const FILES = { projets: 'data/projets.js', articles: 'data/articles.js', formations: 'data/formations.js', pubs: 'data/pubs.js', site: 'data/site.js', temoignages: 'data/temoignages.js' };
  const DRAFT_KEY = 'jm-admin-draft';
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {};          // fichiers de données : { header, data, sha, dirty }
  let images = [];           // images envoyées mais pas encore publiées : { path, blob, preview }
  let token = (() => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } })();
  let CATS = [], MODELES = {};
  const ls = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

  /* ---------- GitHub (appelé directement depuis le navigateur) ---------- */
  // Fichiers que l'admin a le droit de modifier
  const WRITABLE = p => typeof p === 'string' && !p.includes('..') && !p.startsWith('/') &&
    (/^data\/[a-z0-9-]+\.js$/.test(p) || p === 'traductions.js' || /^images\/[a-z0-9/_-]+\.(jpe?g|png|webp|svg)$/i.test(p));
  async function gh(method, url, body) {
    let r;
    try {
      r = await fetch(API + '/gh' + url, {
        method, cache: 'no-store',
        headers: { authorization: 'Bearer ' + token, ...(body ? { 'content-type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined
      });
    } catch { throw new Error('Connexion impossible. Vérifiez votre accès à Internet.'); }
    const data = r.status === 204 ? {} : await r.json().catch(() => ({}));
    if (r.status === 401) { logout('Votre session a expiré. Reconnectez-vous avec votre mot de passe.'); throw new Error('Session expirée.'); }
    if (r.status === 502) throw new Error('La clé GitHub enregistrée chez Cloudflare a expiré ou a été supprimée : demandez à Claude de la remplacer.');
    if (r.status === 503) throw new Error(data.message || 'Le portier Cloudflare n’est pas encore configuré.');
    if (!r.ok) { const e = new Error(r.status === 403 || r.status === 404 ? 'Accès refusé par GitHub (' + (data.message || r.status) + ').' : 'GitHub ' + r.status + ' : ' + (data.message || '')); e.status = r.status; throw e; }
    return data;
  }
  const b64ToText = b => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, '')), c => c.charCodeAt(0)));
  async function readFiles(paths) {
    const out = {};
    for (const p of paths) {
      if (!WRITABLE(p)) throw new Error('Fichier non autorisé : ' + p);
      try {
        const d = await gh('GET', '/contents/' + encodeURI(p) + '?ref=' + BRANCH);
        let text = d.content ? b64ToText(d.content) : '';
        if (!d.content && d.sha) text = b64ToText((await gh('GET', '/git/blobs/' + d.sha)).content);   // fichiers > 1 Mo
        out[p] = { text, sha: d.sha };
      } catch (e) { if (e.status === 404) out[p] = null; else throw e; }
    }
    return out;
  }
  async function uploadBlob(base64) {
    if (base64.length * 0.75 > 4.5e6) throw new Error('Image trop lourde (4,5 Mo maximum).');
    return (await gh('POST', '/git/blobs', { content: base64, encoding: 'base64' })).sha;
  }
  // Publie plusieurs fichiers en un seul envoi (une seule mise à jour du site)
  async function publishFiles({ files = [], expected = {}, message }) {
    for (const f of files) if (!WRITABLE(f.path)) throw new Error('Fichier non autorisé : ' + f.path);
    // Le fichier a-t-il changé depuis son ouverture dans l'admin ? (évite d'écraser une autre modification)
    const current = await readFiles(Object.keys(expected));
    for (const [p, sha] of Object.entries(expected)) if ((current[p] ? current[p].sha : null) !== sha) return { conflict: p };
    const ref = await gh('GET', '/git/ref/heads/' + BRANCH);
    const base = await gh('GET', '/git/commits/' + ref.object.sha);
    const tree = files.map(f => f.blob ? { path: f.path, mode: '100644', type: 'blob', sha: f.blob } : { path: f.path, mode: '100644', type: 'blob', content: f.text });
    const newTree = await gh('POST', '/git/trees', { base_tree: base.tree.sha, tree });
    const commit = await gh('POST', '/git/commits', { message: (message || 'Mise à jour depuis l\'espace admin').slice(0, 200), tree: newTree.sha, parents: [ref.object.sha] });
    await gh('PATCH', '/git/refs/heads/' + BRANCH, { sha: commit.sha });
    return { ok: true, commit: commit.sha };
  }
  // Dernières mises à jour du site (GitHub Pages) : liste publique, sans clé
  async function deploys() {
    const r = await fetch(GH + '/actions/runs?per_page=5', { cache: 'no-store', headers: { accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error('État de la mise en ligne indisponible (' + r.status + ')');
    const runs = ((await r.json()).workflow_runs || []).filter(w => /pages/i.test(w.name));
    return runs.map(w => ({ state: w.status !== 'completed' ? 'building' : w.conclusion === 'success' ? 'ready' : 'error', created_at: w.created_at, published_at: w.updated_at, title: (w.head_commit && w.head_commit.message || '').split('\n')[0], sha: w.head_sha }));
  }
  // Même interface qu'avant : api('read' | 'upload' | 'publish' | 'deploys' | 'login', …)
  async function api(action, payload = {}) {
    if (action === 'read') return { files: await readFiles(payload.paths || []) };
    if (action === 'upload') return { blob: await uploadBlob(payload.base64 || '') };
    if (action === 'publish') return publishFiles(payload);
    if (action === 'deploys') return { list: await deploys() };
    if (action === 'login') {
      const d = await portier('/login', { password: payload.password });
      return { session: d.session };
    }
    throw new Error('Action inconnue');
  }
  async function portier(path, body, auth) {
    let r; try { r = await fetch(API + path, { method: body ? 'POST' : 'GET', cache: 'no-store', headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(auth ? { authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined }); }
    catch { throw new Error('Connexion impossible. Vérifiez votre accès à Internet.'); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(d.erreur || 'Erreur ' + r.status); e.status = r.status; e.data = d; throw e; }
    return d;
  }
  // Champs mot de passe : bouton « œil » pour voir ce qu'on tape
  const OEIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const OEIL_BARRE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7c2 0 3.7.7 5.1 1.6M22 12s-3.6 7-10 7c-2 0-3.7-.7-5.1-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"/></svg>';
  function oeil(root) {
    (root || document).querySelectorAll('input[type=password]:not([data-oeil])').forEach(inp => {
      inp.dataset.oeil = '1';
      const box = document.createElement('span'); box.className = 'pw-wrap';
      inp.parentNode.insertBefore(box, inp); box.appendChild(inp);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pw-eye'; b.innerHTML = OEIL;
      b.setAttribute('aria-label', 'Afficher le mot de passe'); b.title = 'Afficher le mot de passe';
      b.addEventListener('click', () => {
        const voir = inp.type === 'password'; inp.type = voir ? 'text' : 'password';
        b.innerHTML = voir ? OEIL_BARRE : OEIL; b.title = voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'; b.setAttribute('aria-label', b.title); inp.focus();
      });
      box.appendChild(b);
    });
  }
  oeil(); new MutationObserver(() => oeil()).observe(document.body, { childList: true, subtree: true });
  // Message affiché juste sous le bouton d'un formulaire
  function msgForm(form, texte, kind) {
    let p = form.querySelector('.form-msg');
    if (!p) { p = document.createElement('p'); p.className = 'form-msg'; p.setAttribute('role', 'status'); form.querySelector('.actions').after(p); }
    p.textContent = texte; p.className = 'form-msg ' + (kind || ''); p.hidden = !texte;
    p.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
      const src = await (await fetch('../projets.js', { cache: 'no-store' })).text();
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
    const what = dirty.map(([k]) => ({ projets: 'projets', articles: 'articles', formations: 'formations', pubs: 'annonces', site: 'réglages', temoignages: 'témoignages' }[k]));
    const ok = await ask('Publier sur le site ?', `Mise en ligne de : <b>${esc(what.join(', ') || 'images')}</b>${images.length ? ` et ${images.length} image(s)` : ''}.<br><br>Le site sera à jour dans une à deux minutes.`, 'Publier', 'Annuler');
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
      status('Publié ✓ — le site se met à jour (une à deux minutes).', 'ok');
      watchDeploy(r.commit);
    } catch (e) { status('Échec de la publication : ' + e.message, 'err'); refreshPending(); }
  }
  async function watchDeploy(sha) {
    for (let i = 0; i < 24; i++) {
      await new Promise(r => setTimeout(r, 10000));
      try {
        const { list } = await api('deploys'); const d = list.find(x => x.sha === sha); if (!d) continue;
        if (d.state === 'ready') { status('En ligne ✓ — la nouvelle version du site est publiée. Si vous ne la voyez pas, rechargez la page du site.', 'ok', 15000); return; }
        if (d.state === 'error') { status('La mise en ligne a échoué sur GitHub. Vos modifications sont bien enregistrées : demandez à Claude de regarder.', 'err'); return; }
        status('Mise en ligne en cours…');
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
  const previewOf = p => (images.find(i => i.path === p) || {}).preview || (p ? '../' + p : '');
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
    else if (fd.type === 'rich') input = `<div class="rich-bar" data-for="${id}"><button type="button" data-c="h3">Intertitre</button><button type="button" data-c="p">Paragraphe</button><button type="button" data-c="bold"><b>G</b></button><button type="button" data-c="italic"><i>I</i></button><button type="button" data-c="ul">• Liste</button><button type="button" data-c="link">Lien</button><button type="button" data-c="img">🖼 Image</button><button type="button" data-c="clean">Effacer le style</button></div><div class="rich" id="${id}" contenteditable="true">${richPourEdition(v)}</div>`;
    else if (fd.type === 'select') input = `<select id="${id}">${fd.opts.map(([val, lab]) => `<option value="${esc(val)}" ${String(v ?? '') === String(val) ? 'selected' : ''}>${esc(lab)}</option>`).join('')}</select>`;
    else if (fd.type === 'list' || fd.type === 'tags') input = `<div class="list-ed" id="${id}">${(v || []).map(x => liHTML(x)).join('')}<button type="button" class="btn light small" data-add="${id}">+ Ajouter une ligne</button></div>`;
    else if (fd.type === 'image') input = `<div class="img-one" id="${id}" data-path="${esc(v || '')}"><img src="${esc(previewOf(v))}" alt=""><label class="btn light small upl">Choisir une image<input type="file" accept="image/*" data-img="${id}"></label></div>`;
    else input = `<input type="${fd.type || 'text'}" id="${id}" value="${esc(v)}" placeholder="${esc(fd.ph || '')}" ${fd.type === 'number' ? 'step="any" min="0"' : ''}>`;
    return `<div class="f${full}"><label for="${id}">${esc(fd.label)}</label>${input}${help}</div>`;
  }
  // Texte enrichi → affichage dans l'éditeur : images visibles depuis /admin, figures traitées comme un bloc
  const richPourEdition = v => String(v || '')
    .replace(/<img([^>]*?)\ssrc="(images\/[^"]+)"/g, (m, a, p) => `<img${a} src="${esc(previewOf(p))}" data-path="${p}"`)
    .replace(/<figure>/g, '<figure contenteditable="false">');
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
    if (c === 'img') return insererImage(el);
    el.focus();
    if (c === 'h3' || c === 'p') document.execCommand('formatBlock', false, c);
    else if (c === 'bold' || c === 'italic') document.execCommand(c);
    else if (c === 'ul') document.execCommand('insertUnorderedList');
    else if (c === 'clean') document.execCommand('removeFormat');
    else if (c === 'link') { const u = prompt('Adresse du lien (https://…)'); if (u) document.execCommand('createLink', false, u); }
  }
  function insererImage(el) {
    const sel = getSelection(), zone = sel.rangeCount && el.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.addEventListener('change', async () => {
      const file = inp.files[0]; if (!file) return;
      try {
        status('Envoi de l\'image…');
        const p = `images/articles/${titleNow('article')}-${stamp()}.jpg`, apercu = await addImage(file, p, 1600);
        const legende = (prompt('Légende sous l\'image (facultatif) :', '') || '').trim();
        el.focus();
        if (zone) { sel.removeAllRanges(); sel.addRange(zone); } else { const fin = document.createRange(); fin.selectNodeContents(el); fin.collapse(false); sel.removeAllRanges(); sel.addRange(fin); }
        document.execCommand('insertHTML', false, `<figure contenteditable="false"><img src="${apercu}" data-path="${p}" alt="${esc(legende)}">${legende ? `<figcaption>${esc(legende)}</figcaption>` : ''}</figure><p><br></p>`);
        status('Image ajoutée ✓ — pour la retirer, cliquez juste après puis touche Effacer. Elle sera en ligne à la publication.', 'ok', 7000);
      } catch (err) { status(err.message, 'err'); }
    });
    inp.click();
  }
  // Ne garde que les balises utiles (titres, paragraphes, gras, italique, listes, liens, images)
  function cleanHTML(html) {
    const tpl = document.createElement('template'); tpl.innerHTML = html;
    const ALLOW = { P: 1, H3: 1, STRONG: 1, B: 1, EM: 1, I: 1, UL: 1, OL: 1, LI: 1, A: 1, BR: 1, FIGURE: 1, IMG: 1, FIGCAPTION: 1 };
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 1 && /^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|TEMPLATE)$/.test(n.tagName)) { n.remove(); return; }
        if (n.nodeType === 1) {
          walk(n);
          if (n.tagName === 'DIV') { const p = document.createElement('p'); p.append(...n.childNodes); n.replaceWith(p); return; }
          if (n.tagName === 'H2' || n.tagName === 'H4') { const h = document.createElement('h3'); h.append(...n.childNodes); n.replaceWith(h); return; }
          if (!ALLOW[n.tagName]) { n.replaceWith(...n.childNodes); return; }
          const href = n.tagName === 'A' ? n.getAttribute('href') : null;
          if (n.tagName === 'IMG') {
            const src = (n.getAttribute('data-path') || n.getAttribute('src') || '').replace(/^(\.\.\/)+/, ''), alt = n.getAttribute('alt') || '';
            [...n.attributes].forEach(a => n.removeAttribute(a.name));
            if (!/^(images\/[a-z0-9/_.-]+\.(jpe?g|png|webp)|https:\/\/[^"\s]+)$/i.test(src)) { n.remove(); return; }
            n.setAttribute('src', src); n.setAttribute('alt', alt); n.setAttribute('loading', 'lazy'); return;
          }
          [...n.attributes].forEach(a => n.removeAttribute(a.name));
          if (href && /^(https?:|mailto:|tel:|[a-z0-9-]+\.html|#)/i.test(href)) { n.setAttribute('href', href); if (/^https?:/.test(href)) { n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener'); } }
        } else if (n.nodeType === 8) n.remove();
      });
    };
    walk(tpl.content);
    tpl.content.querySelectorAll('figure').forEach(f => { if (!f.querySelector('img')) f.remove(); });
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
      const h = new Date().getHours(), salut = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
      $('#view').innerHTML = `<div class="hello"><div><h2>${salut} Jipson 👋</h2><p class="muted">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · chiffres des visiteurs, <b>hors vos propres visites</b></p></div>
        <div class="row"><a class="btn small" href="#article/nouveau">+ Article</a><a class="btn small light" href="#projet/nouveau">+ Projet</a><a class="btn small light" href="../" target="_blank" rel="noopener">Voir le site ↗</a></div></div>
        <h3 class="conv-t">Demandes et téléchargements <span class="muted">· 30 derniers jours</span></h3><div id="d-conv"><div class="kpis conv"><div class="kpi"><small>…</small><b>…</b><span>&nbsp;</span></div><div class="kpi"><small>…</small><b>…</b><span>&nbsp;</span></div><div class="kpi"><small>…</small><b>…</b><span>&nbsp;</span></div><div class="kpi"><small>…</small><b>…</b><span>&nbsp;</span></div><div class="kpi"><small>…</small><b>…</b><span>&nbsp;</span></div></div></div>
        <div class="kpis" id="d-kpis">${['Aujourd\'hui', '7 derniers jours', 'En ce moment', 'Demandes (30 j)'].map(t => `<div class="kpi"><small>${t}</small><b>…</b><span>&nbsp;</span></div>`).join('')}</div>
        <div class="dash">
          <section class="card st-card d-wide"><div class="row between"><h3>Visiteurs · 14 derniers jours</h3><a href="#stats/30" class="small-link">Toutes les statistiques →</a></div><div id="d-chart"><p class="muted">Chargement…</p></div></section>
          <section class="card st-card"><h3>D'où viennent-ils ?</h3><p class="muted st-sub">30 derniers jours</p><div id="d-src"><p class="muted">…</p></div></section>
          <section class="card st-card"><h3>Contenus les plus vus</h3><p class="muted st-sub">30 derniers jours · visiteurs</p><div id="d-top"><p class="muted">…</p></div></section>
          <section class="card st-card"><h3>Dernières activités</h3><p class="muted st-sub">en temps réel</p><div id="d-feed"><p class="muted">…</p></div></section>
          <section class="card st-card"><h3>Appareils</h3><p class="muted st-sub">30 derniers jours</p><div id="d-dev"><p class="muted">…</p></div></section>
          <section class="card st-card"><h3>Contenu du site</h3>
            <div class="counts"><a href="#projets"><b>${P.length}</b>projets</a><a href="#articles"><b>${A.length}</b>articles</a><a href="#formations"><b>${F.length}</b>formations</a></div>
            ${A.filter(a => a.exemple).length ? `<p class="note" style="margin-top:12px">${A.filter(a => a.exemple).length} article(s) d'exemple à remplacer</p>` : ''}
            <p class="muted" style="margin-top:12px">Dernier article : <b>${esc((A.slice().sort((x, y) => (y.date || '').localeCompare(x.date || ''))[0] || {}).titre || '—')}</b></p></section>
          <section class="card st-card"><h3>Mise en ligne</h3><p id="d-deploy" class="muted">…</p>
            <h3 style="margin-top:16px">Demandes reçues</h3><p class="muted">Inscriptions, devis et messages arrivent par e-mail dans <b>contact@jipsonmathas.com</b>.</p>
            <div class="links" style="margin-top:10px"><a href="https://mail.hostinger.com" target="_blank" rel="noopener">Ouvrir la boîte mail ↗</a><a href="https://github.com/jipson94/Portfolio" target="_blank" rel="noopener">GitHub ↗</a></div></section>
        </div>`;
      statsFetch(30, 'autres').then(d => {
        const by = Object.fromEntries(d.parJour.map(x => [x.day, x])), key = i => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
        const days = []; for (let i = 13; i >= 0; i--) { const k = key(i); days.push({ day: k, v: (by[k] || {}).visiteurs || 0, p: (by[k] || {}).vues || 0 }); }
        const sum = (n, f) => { let t = 0; for (let i = 0; i < n; i++) t += ((by[key(i)] || {})[f] || 0); return t; };
        const today = by[key(0)] || {}, envois = d.actions.filter(a => /^evt:envoi:/.test(a.path)).reduce((t, a) => t + a.n, 0);
        const k = [[today.visiteurs || 0, nf(today.vues || 0) + ' page(s) vue(s)'], [sum(7, 'visiteurs'), nf(sum(7, 'vues')) + ' pages vues'], [d.enLigne, 'ces 30 dernières minutes'], [envois, 'inscriptions, devis, messages']];
        $('#d-conv').innerHTML = convHTML(d.actions);
        $('#d-kpis').innerHTML = k.map(([v, sub], i) => `<div class="kpi ${i === 2 ? 'live' : ''}"><small>${['Aujourd\'hui', '7 derniers jours', 'En ce moment', 'Demandes (30 j)'][i]}</small><b>${nf(v)}</b><span>${i < 2 ? 'visiteurs · ' : ''}${sub}</span></div>`).join('');
        const max = Math.max(...days.map(x => x.v), 1), fd = k2 => new Date(k2 + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
        $('#d-chart').innerHTML = `<div class="chart mini" title="">${days.map(x => `<div class="col" title="${esc(fd(x.day))} : ${nf(x.v)} visiteur(s), ${nf(x.p)} page(s)"><i style="height:${x.v ? Math.max(4, Math.round(100 * x.v / max)) : 0}%"></i></div>`).join('')}</div><div class="chart-axis"><span>${esc(fd(days[0].day))}</span><span>max. ${nf(max)} / jour</span><span>aujourd'hui</span></div>`;
        $('#d-src').innerHTML = donut(d.sources, x => x.k, 'arrivées');
        $('#d-dev').innerHTML = donut(d.appareils, x => x.k || 'Inconnu');
        const top = d.pages.filter(p => !/^\/(index|merci)\.html$/.test(p.path)).slice(0, 6).map(p => ({ ...p, n: p.visiteurs }));
        $('#d-top').innerHTML = barList(top, x => pageLabel(x.path));
        $('#d-feed').innerHTML = d.recents.length ? `<ul class="feed-list">${d.recents.slice(0, 7).map(x => `<li class="${x.moi ? 'is-moi' : ''}"><span class="when">${esc(agoTxt(x.ts))}</span><span class="what">${esc(activite(x))}</span><span class="who">${x.moi ? '<span class="tag b">Vous</span>' : esc([x.city, x.device].filter(Boolean).join(' · '))}</span></li>`).join('')}</ul>` : '<p class="muted">Aucune visite pour l\'instant.</p>';
      }).catch(e => { ['#d-chart', '#d-src', '#d-top', '#d-feed', '#d-dev'].forEach(id => { $(id).innerHTML = `<p class="muted">${esc(e.message)}</p>`; }); });
      try {
        const { list } = await api('deploys'); const d = list[0];
        if (!d) { $('#d-deploy').textContent = 'Aucune information pour le moment.'; return; }
        const lab = { ready: '<span class="tag g">En ligne</span>', building: '<span class="tag y">En cours</span>', enqueued: '<span class="tag y">En attente</span>', error: '<span class="tag r">Échec</span>' }[d.state] || esc(d.state);
        $('#d-deploy').innerHTML = `${lab} ${new Date(d.published_at || d.created_at).toLocaleString('fr-FR')}<br>${esc(d.title)}`;
      } catch (e) { $('#d-deploy').textContent = e.message; }
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
        note: 'Versions anglaise et chinoise : si vous modifiez le titre, le résumé ou le texte, la traduction de cet article est retirée et le français s\'affiche à la place, jusqu\'à ce qu\'elle soit refaite.',
        onSave: out => {
          if (!out.titre) return 'Le titre est obligatoire.';
          if (!out.contenu) return 'Le texte de l\'article est vide.';
          const words = out.contenu.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
          out.lecture = Math.max(1, Math.round(words / 200)) + ' min';
          if (!out.exemple) delete out.exemple;
          if (!isNew && a.tr && ['titre', 'resume', 'contenu'].some(k => (a[k] || '') !== (out[k] || ''))) delete a.tr;   // traduction devenue fausse
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

    temoignages() {
      const L = store.temoignages.data.TEMOIGNAGES;
      const P = store.projets.data.PROJETS, F = store.formations.data.FORMATIONS;
      const lien = t => t.type === 'formation' ? (F.find(f => f.id === t.lien) || {}).titre : (P.find(p => p.id === t.lien) || {}).titre;
      const mode = ls.get('jm-vue', 'liste');
      const item = t => `<a class="item" href="#temoignage/${esc(t.id)}">${t.photo ? `<img src="${esc(previewOf(t.photo))}" alt="" loading="lazy">` : `<span class="ph tm-ph">${esc(String(t.nom || '?').trim().split(/\s+/).slice(0, 2).map(m => m[0]).join('').toUpperCase())}</span>`}
        <div class="grow"><div class="t">${esc(t.nom + (t.structure ? ' — ' + t.structure : ''))}</div><div class="muted">${esc((lien(t) || t.intitule || 'Sans lien') + ' · « ' + String(t.texte || '').slice(0, 80) + (String(t.texte || '').length > 80 ? '… »' : ' »'))}</div></div></a>`;
      const tri = list => list.slice().sort((x, y) => String(y.date || '').localeCompare(String(x.date || '')));
      const bloc = (type, titre, aide) => {
        const list = tri(L.filter(t => (type === 'formation') === (t.type === 'formation')));
        return `<section class="tm-bloc"><div class="tm-bloc-head"><h2>${titre} <span class="tag ${type === 'formation' ? 'b' : 'y'}">${list.length}</span></h2>
          <a class="btn small" href="#temoignage/nouveau-${type}">+ Ajouter</a></div><p class="muted tm-bloc-aide">${aide}</p>
          <div class="items ${mode === 'grille' ? 'as-grid' : ''}">${list.map(item).join('') || '<p class="muted">Aucun pour l\'instant.</p>'}</div></section>`;
      };
      $('#view-title').textContent = 'Témoignages';
      $('#view').innerHTML = `<div class="toolbar"><span class="muted">Uniquement de vrais témoignages, avec l'accord de la personne.</span>
        <div class="seg" id="vue-mode" role="group" aria-label="Affichage"><a href="#" data-m="liste" class="${mode === 'liste' ? 'on' : ''}">☰ Liste</a><a href="#" data-m="grille" class="${mode === 'grille' ? 'on' : ''}">▦ Grille</a></div></div>
        ${bloc('formation', 'Formations', 'Affichés sur la page Formations et sur l\'accueil.')}
        ${bloc('projet', 'Projets', 'Affichés sur la page Projets, sur la page du projet concerné et sur l\'accueil.')}`;
      $('#vue-mode').addEventListener('click', e => { const m = e.target.closest('[data-m]'); if (!m) return; e.preventDefault(); ls.set('jm-vue', m.dataset.m); document.querySelectorAll('#view .items').forEach(x => x.classList.toggle('as-grid', m.dataset.m === 'grille')); $('#vue-mode').querySelectorAll('a').forEach(x => x.classList.toggle('on', x === m)); });
    },
    temoignage(id) {
      const L = store.temoignages.data.TEMOIGNAGES, isNew = String(id).startsWith('nouveau');
      const t = isNew ? { type: id === 'nouveau-formation' ? 'formation' : 'projet', date: new Date().toISOString().slice(0, 10) } : L.find(x => x.id === id);
      if (!t) return notFound('#temoignages');
      const P = store.projets.data.PROJETS, F = store.formations.data.FORMATIONS;
      const opts = [['', '— Aucun en particulier —']].concat(P.map(p => ['projet:' + p.id, 'Projet · ' + p.titre]), F.map(f => ['formation:' + f.id, 'Formation · ' + f.titre]));
      editor({
        title: isNew ? 'Nouveau témoignage' : 'Modifier le témoignage', backHash: '#temoignages', item: { ...t, cible: t.lien ? t.type + ':' + t.lien : '' },
        groups: [
          { title: 'La personne', fields: [{ k: 'nom', label: 'Nom et prénom' }, { k: 'fonction', label: 'Fonction', ph: 'Directrice de la communication' }, { k: 'structure', label: 'Entreprise / structure', ph: 'Nom de l\'organisation' },
            { k: 'photo', label: 'Photo de la personne', type: 'image', help: 'Cliquez sur « Choisir une image ». Elle s’affiche dans un rond : une photo de visage, de face, est idéale. Sans photo, ses initiales s’affichent dans un rond jaune.' }] },
          { title: 'Le témoignage', fields: [{ k: 'texte', label: 'Ce que la personne dit', type: 'textarea', help: 'Ses propres mots (2 à 4 phrases), avec son accord pour la publication.' },
            { k: 'type', label: 'Il concerne', type: 'select', opts: [['projet', 'Un projet (page Projets)'], ['formation', 'Une formation (page Formations)']] },
            { k: 'cible', label: 'Projet ou formation concerné', type: 'select', opts, help: 'Pour un projet : le témoignage apparaît aussi sur la page de ce projet.' },
            { k: 'intitule', label: 'Ou, s’il n’est pas dans la liste : son nom', ph: 'Communication digitale', help: 'Affiché en bas de la carte, sans lien.' },
            { k: 'date', label: 'Date', type: 'date' }] }
        ],
        imageFor: async file => { const p = `images/temoignages/${titleNow('temoignage')}-${stamp()}.jpg`; return { path: p, preview: await addImage(file, p, 600) }; },
        note: 'Publiez uniquement des témoignages réels, avec l\'accord de la personne. Ils restent en français dans les versions anglaise et chinoise.',
        onSave: out => {
          if (!out.nom) return 'Le nom est obligatoire.';
          if (!out.texte) return 'Le texte du témoignage est vide.';
          const [ct, cl] = (out.cible || '').split(':'); delete out.cible;
          if (cl) { out.type = ct; out.lien = cl; delete out.intitule; } else delete out.lien;
          prune(out);
          if (isNew) L.push({ id: uniqueId(out.nom, L), ...out });
          else { Object.keys(t).forEach(k => { if (k !== 'id') delete t[k]; }); Object.assign(t, out); }
          markDirty('temoignages');
        },
        onDelete: isNew ? null : () => { L.splice(L.indexOf(t), 1); markDirty('temoignages'); }
      });
    },

    reglages() {
      const S = store.site.data.SITE;
      editor({
        title: 'Réglages', backHash: '#tableau', item: { ...S, ...Object.fromEntries(Object.entries(S.reseaux || {}).map(([k, v]) => ['r_' + k, v])) },
        groups: [
          { title: 'Coordonnées', fields: [{ k: 'whatsapp', label: 'Numéro WhatsApp (chiffres, avec 242)', ph: '242068050665' }, { k: 'email', label: 'E-mail affiché' }, { k: 'ville', label: 'Ville' }, { k: 'telephone', label: 'Téléphone affiché (facultatif)' },
            { k: 'whatsappMessage', label: 'Message pré-rempli WhatsApp', full: true }] },
          { title: 'Statistiques', fields: [{ k: 'stats', label: 'Adresse du compteur de visites', full: true, type: 'url', ph: 'https://jm-stats.….workers.dev', help: 'Compteur Cloudflare (dossier stats/ du site). Laissée vide, aucune visite n’est comptée.' }] },
          { title: 'Formulaires du site', fields: [{ k: 'web3forms', label: 'Clé Web3Forms (Access Key)', full: true, help: 'Les demandes du site arrivent par e-mail dans contact@ grâce à cette clé (web3forms.com). Laissée vide, les demandes partent par WhatsApp.' }] },
          { title: 'Réseaux sociaux (laisser vide pour masquer)', fields: Object.keys(S.reseaux || {}).map(k => ({ k: 'r_' + k, label: k, type: 'url', ph: 'https://…' })) }
        ],
        note: 'Après un changement de numéro ou d\'e-mail, demandez à Claude de régénérer les fiches PDF des programmes.',
        onSave: out => {
          if (out.whatsapp && !/^\d{8,15}$/.test(out.whatsapp)) return 'Le numéro WhatsApp doit contenir uniquement des chiffres (ex. 242068050665).';
          Object.keys(out).forEach(k => { if (k.startsWith('r_')) { S.reseaux[k.slice(2)] = out[k]; delete out[k]; } });
          Object.assign(S, out); markDirty('site');
        }
      });
    }
  };

  /* ---------- Statistiques (compteur Cloudflare, voir stats/) ---------- */
  const nf = n => Number(n || 0).toLocaleString('fr-FR');
  const paysNom = (() => { let d; try { d = new Intl.DisplayNames(['fr'], { type: 'region' }); } catch {} return c => { if (!c) return 'Inconnu'; try { return d ? d.of(c) : c; } catch { return c; } }; })();
  function pageLabel(path) {
    const m = String(path).match(/^\/([a-z0-9._-]*)(?:\?id=(.+))?$/i); if (!m) return path;
    const page = m[1] || 'index.html', id = m[2];
    const find = (L, k) => (L.find(x => x.id === id) || {})[k] || id;
    if (page === 'projet.html' && id) return 'Projet · ' + find(store.projets.data.PROJETS, 'titre');
    if (page === 'article.html' && id) return 'Article · ' + find(store.articles.data.ARTICLES, 'titre');
    return ({ 'index.html': 'Accueil', 'projets.html': 'Page Projets', 'actualites.html': 'Page Actualités', 'formations.html': 'Page Formations', 'merci.html': 'Page « Merci » (formulaire envoyé)', 'projet.html': 'Projet', 'article.html': 'Article' })[page] || page;
  }
  const barList = (rows, label, val = 'n', unit = '') => {
    if (!rows.length) return '<p class="muted">Pas encore de données.</p>';
    const max = Math.max(...rows.map(r => r[val] || 0), 1);
    return `<div class="bars">${rows.map(r => `<div class="bar-row"><div class="bar-top"><span class="bar-lab">${esc(label(r))}</span><b>${nf(r[val])}${unit}</b></div><div class="bar-track"><i style="width:${Math.max(2, Math.round(100 * (r[val] || 0) / max))}%"></i></div></div>`).join('')}</div>`;
  };
  const quiVoir = () => (ls.get('jm-stats-qui', 'autres') === 'moi' ? 'moi' : 'autres');   // « Autres visiteurs » ou « Mes visites »
  const agoTxt = ts => { const m = Math.round((Date.now() - ts) / 60e3); return m < 1 ? 'à l\'instant' : m < 60 ? 'il y a ' + m + ' min' : m < 1440 ? 'il y a ' + Math.round(m / 60) + ' h' : new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' ' + new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); };
  const evtLabelTxt = p => { if (p === 'evt:pressbook') return 'Press-book téléchargé'; const m = p.match(/^evt:(formation|envoi):([a-z0-9-]+)(?::([a-z0-9-]+))?$/i); if (!m) return p;
    const F = store.formations.data.FORMATIONS, ft = id => (F.find(f => f.id === id) || {}).titre || id;
    if (m[1] === 'envoi') return ({ inscription: 'Inscription envoyée', devis: 'Devis demandé', contact: 'Message de contact envoyé' }[m[2]] || 'Formulaire envoyé') + (m[3] ? ' · ' + ft(m[3]) : '');
    return ({ vue: 'Formation regardée', programme: 'Programme PDF téléchargé', 'clic-inscription': 'Clic « S\'inscrire »', 'clic-devis': 'Clic « Demander un devis »' }[m[3]] || m[3]) + ' · ' + ft(m[2]); };
  const activite = r => r.path.startsWith('evt:') ? evtLabelTxt(r.path) : pageLabel(r.path);
  // Anneau (« camembert ») : 4 parts au plus + « Autres », couleurs dans un ordre fixe, légende avec valeurs
  const COULEURS = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'], AUTRES = 'var(--s0)';   // couleurs définies dans admin.css (claires / sombres)
  function donut(rows, label, centre = 'visiteurs') {
    const tot = rows.reduce((a, x) => a + (x.n || 0), 0);
    if (!tot) return '<p class="muted">Pas encore de données.</p>';
    let parts = rows.slice(0, 4).map((x, i) => ({ l: label(x), n: x.n, c: COULEURS[i] }));
    const reste = rows.slice(4).reduce((a, x) => a + x.n, 0); if (reste) parts.push({ l: 'Autres', n: reste, c: AUTRES });
    const R = 52, C = 2 * Math.PI * R; let off = 0;
    const arcs = parts.map(p => { const len = C * p.n / tot, gap = parts.length > 1 ? Math.min(2, len / 2) : 0;
      const a = `<circle r="${R}" cx="70" cy="70" fill="none" style="stroke:${p.c}" stroke-width="22" stroke-dasharray="${Math.max(0, len - gap)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"><title>${esc(p.l)} : ${nf(p.n)} (${Math.round(100 * p.n / tot)} %)</title></circle>`; off += len; return a; }).join('');
    return `<div class="donut"><svg viewBox="0 0 140 140" role="img" aria-label="Répartition">${arcs}<text x="70" y="68" text-anchor="middle" class="d-tot">${nf(tot)}</text><text x="70" y="86" text-anchor="middle" class="d-lab">${centre}</text></svg>
      <ul class="legend">${parts.map(p => `<li><i style="background:${p.c}"></i><span>${esc(p.l)}</span><b>${Math.round(100 * p.n / tot)} %</b><em>${nf(p.n)}</em></li>`).join('')}</ul></div>`;
  }
  async function statsFetch(jours, qui = quiVoir()) {
    const r = await fetch(API + '/stats?jours=' + jours + '&qui=' + qui, { cache: 'no-store', headers: { authorization: 'Bearer ' + token } });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401) { logout('Votre session a expiré. Reconnectez-vous avec votre mot de passe.'); throw new Error('Session expirée.'); }
    if (!r.ok) throw new Error(d.erreur || ('Compteur indisponible (' + r.status + ')'));
    const norm = p => String(p).replace(/^\/(projet|article)-([a-z0-9_-]+)\.html$/i, '/$1.html?id=$2');
    const fus = new Map();
    (d.pages || []).forEach(x => { const k = norm(x.path), o = fus.get(k); if (o) { o.n += x.n; o.visiteurs += x.visiteurs; } else fus.set(k, { ...x, path: k }); });
    d.pages = [...fus.values()].sort((a, b) => b.visiteurs - a.visiteurs);
    (d.recents || []).forEach(x => { x.path = norm(x.path); });
    return d;
  }
  // Demandes et téléchargements sur la période : devis, inscriptions, programmes, press-book, messages
  function conversions(A) {
    const s = re => A.filter(a => re.test(a.path)).reduce((t, a) => t + a.n, 0);
    return [
      ['📝', 'Devis demandés', s(/^evt:envoi:devis(:|$)/), 'formulaires de devis envoyés'],
      ['✅', 'Inscriptions', s(/^evt:envoi:inscription(:|$)/), 'formulaires d\'inscription envoyés'],
      ['📄', 'Programmes téléchargés', s(/^evt:formation:[a-z0-9-]+:programme$/), 'PDF des formations'],
      ['📘', 'Press-book téléchargé', s(/^evt:pressbook$/), 'PDF du press-book'],
      ['✉️', 'Messages de contact', s(/^evt:envoi:contact(:|$)/), 'formulaire de l\'accueil']
    ];
  }
  const convHTML = A => `<div class="kpis conv">${conversions(A).map(([ic, t, v, sub]) => `<div class="kpi"><small>${ic} ${t}</small><b>${nf(v)}</b><span>${sub}</span></div>`).join('')}</div>`;
  VIEWS.stats = async function (arg) {
    $('#view-title').textContent = 'Statistiques';
    const jours = [1, 7, 30, 90, 365].includes(+arg) ? +arg : 30;
    const periodes = [[1, 'Aujourd\'hui'], [7, '7 jours'], [30, '30 jours'], [90, '3 mois'], [365, '12 mois']];
    $('#view').innerHTML = `<div class="toolbar"><div class="seg">${periodes.map(([j, l]) => `<a href="#stats/${j}" class="${j === jours ? 'on' : ''}">${l}</a>`).join('')}</div>
      <div class="seg qui" id="qui" role="group" aria-label="Visiteurs affichés"><a href="#" data-q="autres" class="${quiVoir() === 'autres' ? 'on' : ''}">👥 Autres visiteurs</a><a href="#" data-q="moi" class="${quiVoir() === 'moi' ? 'on' : ''}">🙋 Mes visites</a></div></div><div id="st"><p class="muted">Chargement des statistiques…</p></div>`;
    $('#qui').addEventListener('click', e => { const a = e.target.closest('[data-q]'); if (!a) return; e.preventDefault(); if (a.dataset.q === quiVoir()) return; ls.set('jm-stats-qui', a.dataset.q); VIEWS.stats(String(jours)); });
    let d;
    try { d = await statsFetch(jours); }
    catch (e) {
      $('#st').innerHTML = `<p class="note">${esc(e.message)}</p>`;
      return;
    }
    // Jours sans visite : affichés à zéro
    const byDay = Object.fromEntries(d.parJour.map(x => [x.day, x]));
    const days = []; for (let i = jours - 1; i >= 0; i--) { const k = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); days.push({ day: k, visiteurs: (byDay[k] || {}).visiteurs || 0, vues: (byDay[k] || {}).vues || 0 }); }
    const visiteurs = days.reduce((s, x) => s + x.visiteurs, 0), vues = days.reduce((s, x) => s + x.vues, 0);
    const A = d.actions, sumA = re => A.filter(a => re.test(a.path)).reduce((s, a) => s + a.n, 0);
    const envois = sumA(/^evt:envoi:/);
    const maxV = Math.max(...days.map(x => x.visiteurs), 1);
    const fmtDay = k => new Date(k + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    const pagesOf = re => d.pages.filter(p => re.test(p.path)).map(p => ({ ...p, n: p.visiteurs }));
    const F = store.formations.data.FORMATIONS;
    const fRows = F.map(f => { const c = k => (A.find(a => a.path === 'evt:formation:' + f.id + ':' + k) || {}).n || 0, e = k => (A.find(a => a.path === 'evt:envoi:' + k + ':' + f.id) || {}).n || 0;
      return { t: f.titre, vue: c('vue'), pdf: c('programme'), ci: c('clic-inscription'), cd: c('clic-devis'), ins: e('inscription'), dev: e('devis') }; }).sort((a, b) => b.vue - a.vue || b.ins + b.dev - a.ins - a.dev);
    const ago = agoTxt;
    const evtLabel = evtLabelTxt;
    $('#st').innerHTML = `
      <p class="moi-info">${d.qui === 'moi' ? '<span class="tag b">Vous</span> Vous voyez <b>uniquement vos propres visites</b> (depuis vos appareils reconnus).' : `Vous voyez <b>les autres visiteurs</b> uniquement. Vos propres visites sont à part (${nf(d.mesVues)} page(s) vue(s) par vous sur la période).`}</p>
      <div class="kpis">
        <div class="kpi"><small>Visiteurs</small><b>${nf(visiteurs)}</b><span>personnes différentes par jour, additionnées</span></div>
        <div class="kpi"><small>Pages vues</small><b>${nf(vues)}</b><span>${visiteurs ? (vues / visiteurs).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' pages par visiteur' : '—'}</span></div>
        <div class="kpi"><small>Demandes envoyées</small><b>${nf(envois)}</b><span>inscriptions, devis et messages</span></div>
        <div class="kpi live"><small>En ce moment</small><b>${nf(d.enLigne)}</b><span>visiteur(s) ces 30 dernières minutes</span></div>
      </div>
      <h3 class="conv-t">Demandes et téléchargements</h3>${convHTML(A)}
      ${jours > 1 ? `<section class="card st-card"><h3>Visiteurs par jour</h3>
        <div class="chart" id="chart" role="img" aria-label="Visiteurs par jour sur la période">${days.map(x => `<div class="col" data-t="${esc(fmtDay(x.day))} : ${nf(x.visiteurs)} visiteur(s), ${nf(x.vues)} page(s) vue(s)"><i style="height:${x.visiteurs ? Math.max(3, Math.round(100 * x.visiteurs / maxV)) : 0}%"></i></div>`).join('')}</div>
        <div class="chart-axis"><span>${esc(fmtDay(days[0].day))}</span><span>max. ${nf(maxV)} / jour</span><span>${esc(fmtDay(days[days.length - 1].day))}</span></div>
        <div class="tip" id="tip" hidden></div>
        <details class="st-table"><summary>Voir le détail jour par jour</summary><table><thead><tr><th>Jour</th><th>Visiteurs</th><th>Pages vues</th></tr></thead><tbody>${days.slice().reverse().map(x => `<tr><td>${esc(fmtDay(x.day))}</td><td>${nf(x.visiteurs)}</td><td>${nf(x.vues)}</td></tr>`).join('')}</tbody></table></details></section>` : ''}
      <div class="st-grid">
        <section class="card st-card"><h3>Articles les plus lus</h3><p class="muted st-sub">lecteurs</p>${barList(pagesOf(/^\/article\.html\?id=/).slice(0, 10), r => pageLabel(r.path).replace(/^Article · /, ''))}</section>
        <section class="card st-card"><h3>Projets les plus vus</h3><p class="muted st-sub">visiteurs</p>${barList(pagesOf(/^\/projet\.html\?id=/).slice(0, 10), r => pageLabel(r.path).replace(/^Projet · /, ''))}</section>
      </div>
      <section class="card st-card"><h3>Formations</h3><p class="muted st-sub">« Regardée » = carte restée au moins 2 secondes à l'écran</p>
        <div class="tbl-wrap"><table class="st-tbl"><thead><tr><th>Formation</th><th>Regardée</th><th>Programme PDF</th><th>Clic « S'inscrire »</th><th>Clic « Devis »</th><th>Inscriptions envoyées</th><th>Devis demandés</th></tr></thead>
        <tbody>${fRows.map(r => `<tr><td>${esc(r.t)}</td><td>${nf(r.vue)}</td><td>${nf(r.pdf)}</td><td>${nf(r.ci)}</td><td>${nf(r.cd)}</td><td><b>${nf(r.ins)}</b></td><td><b>${nf(r.dev)}</b></td></tr>`).join('')}</tbody></table></div></section>
      <div class="st-grid">
        <section class="card st-card"><h3>D'où viennent les visiteurs</h3><p class="muted st-sub">arrivées sur le site</p>${donut(d.sources, r => r.k, 'arrivées')}</section>
        <section class="card st-card"><h3>Pages du site</h3><p class="muted st-sub">visiteurs</p>${barList(pagesOf(/^\/(?!article\.html\?|projet\.html\?)/).slice(0, 10), r => pageLabel(r.path))}</section>
        <section class="card st-card"><h3>Pays</h3><p class="muted st-sub">visiteurs</p>${donut(d.pays, r => paysNom(r.k))}</section>
        <section class="card st-card"><h3>Villes</h3><p class="muted st-sub">visiteurs (ville estimée, approximative)</p>${barList(d.villes, r => r.k.replace(/\(([A-Z]{2})\)$/, (m, c) => '(' + paysNom(c) + ')'))}</section>
        <section class="card st-card"><h3>Appareils</h3><p class="muted st-sub">visiteurs</p>${donut(d.appareils, r => r.k || 'Inconnu')}</section>
      </div>
      <section class="card st-card"><h3>Dernières activités</h3><p class="muted st-sub">en temps réel, toutes périodes</p>
        <div class="tbl-wrap"><table class="st-tbl feed"><tbody>${d.recents.map(r => `<tr class="${r.moi ? 'is-moi' : ''}"><td class="muted">${esc(ago(r.ts))}${r.moi ? ' <span class="tag b">Vous</span>' : ''}</td><td>${esc(r.path.startsWith('evt:') ? evtLabel(r.path) : pageLabel(r.path))}</td><td>${esc([r.city, paysNom(r.country)].filter(Boolean).join(', '))}</td><td>${esc(r.device || '')}</td><td class="muted">${esc(r.ref || '')}</td></tr>`).join('') || '<tr><td class="muted">Aucune visite enregistrée pour l\'instant.</td></tr>'}</tbody></table></div></section>
      <p class="note">Les visiteurs restent anonymes : le site n'utilise pas de cookie et n'enregistre ni nom ni adresse IP. On ne peut donc pas savoir <i>qui</i> regarde, seulement combien, d'où et sur quoi. Les robots (Google, aperçus de liens…) ne sont pas comptés.</p>`;
    const chart = $('#chart'), tip = $('#tip');
    if (chart) {
      chart.addEventListener('mousemove', e => { const c = e.target.closest('.col'); if (!c) { tip.hidden = true; return; } tip.textContent = c.dataset.t; tip.hidden = false; const box = chart.parentNode.getBoundingClientRect(); tip.style.left = Math.min(box.width - tip.offsetWidth - 8, Math.max(8, e.clientX - box.left - tip.offsetWidth / 2)) + 'px'; tip.style.top = (chart.offsetTop - 34) + 'px'; chart.querySelectorAll('.col.hov').forEach(x => x.classList.remove('hov')); c.classList.add('hov'); });
      chart.addEventListener('mouseleave', () => { tip.hidden = true; chart.querySelectorAll('.col.hov').forEach(x => x.classList.remove('hov')); });
    }
  };

  VIEWS.compte = function () {
    $('#view-title').textContent = 'Mot de passe';
    $('#view').innerHTML = `<form class="form" id="acc">
      <section class="fgroup"><h2>Changer le mot de passe</h2>
        <div class="f"><label for="a-new">Nouveau mot de passe (8 caractères minimum)</label><input type="password" id="a-new" autocomplete="new-password" minlength="8"></div>
        <div class="f"><label for="a-new2">Répétez le nouveau mot de passe</label><input type="password" id="a-new2" autocomplete="new-password" minlength="8"></div>
        <span class="help full">Vos autres appareils seront déconnectés.</span></section>
      <section class="fgroup"><h2>Remplacer la clé GitHub</h2>
        <div class="f full"><label for="a-gh">Nouvelle clé GitHub (seulement si l'ancienne a expiré)</label><input type="password" id="a-gh" autocomplete="off" spellcheck="false" placeholder="github_pat_…"></div>
        <span class="help full">Créez-la sur <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com</a> : dépôt « Portfolio », permission « Contents : Read and write ».</span></section>
      <section class="fgroup"><h2>Confirmer</h2>
        <div class="f"><label for="a-cur">Mot de passe actuel</label><input type="password" id="a-cur" autocomplete="current-password" required></div></section>
      <div class="actions"><span></span><button class="btn" type="submit">Enregistrer</button></div></form>`;
    $('#acc').addEventListener('submit', async e => {
      e.preventDefault();
      const nouveau = $('#a-new').value, github = $('#a-gh').value.trim();
      if (nouveau !== $('#a-new2').value) { status('Les deux nouveaux mots de passe ne sont pas identiques.', 'err'); return; }
      if (!nouveau && !github) { status('Remplissez un nouveau mot de passe ou une nouvelle clé GitHub.', 'err'); return; }
      const b = e.target.querySelector('button[type=submit]'); b.disabled = true; status('Enregistrement…');
      try {
        const d = await portier('/compte', { actuel: $('#a-cur').value, nouveau: nouveau || undefined, github: github || undefined }, true);
        if (d.session) { token = d.session; try { localStorage.setItem(TOKEN_KEY, token); } catch {} }
        e.target.reset(); status(''); msgForm(e.target, '✓ Enregistré' + (nouveau ? ' — utilisez désormais votre nouveau mot de passe.' : '.'), 'ok');
      } catch (err) { status(''); msgForm(e.target, '✕ ' + err.message, 'err'); }
      b.disabled = false;
    });
  };

  function listView(title, list, fmt, newHash, newLabel, searchable = true) {
    $('#view-title').textContent = title;
    const mode = ls.get('jm-vue', 'liste');
    $('#view').innerHTML = `<div class="toolbar">${searchable ? '<input class="search" id="q" type="search" placeholder="Rechercher…">' : '<span></span>'}
      <div class="row"><div class="seg" id="vue-mode" role="group" aria-label="Affichage"><a href="#" data-m="liste" class="${mode === 'liste' ? 'on' : ''}" title="En liste">☰ Liste</a><a href="#" data-m="grille" class="${mode === 'grille' ? 'on' : ''}" title="En grille">▦ Grille</a></div><a class="btn" href="${newHash}">${esc(newLabel)}</a></div></div><div class="items ${mode === 'grille' ? 'as-grid' : ''}" id="lst"></div>`;
    $('#vue-mode').addEventListener('click', e => { const a = e.target.closest('[data-m]'); if (!a) return; e.preventDefault(); ls.set('jm-vue', a.dataset.m); $('#lst').classList.toggle('as-grid', a.dataset.m === 'grille'); $('#vue-mode').querySelectorAll('a').forEach(x => x.classList.toggle('on', x === a)); });
    const draw = q => {
      $('#lst').innerHTML = list.map(fmt).filter(x => !q || x.t.toLowerCase().includes(q)).map(x => `<a class="item" href="${x.href}">${x.img ? `<img src="${esc(x.img)}" alt="" loading="lazy">` : '<span class="ph"></span>'}<div class="grow"><div class="t">${esc(x.t)}</div><div class="muted">${esc(x.sub)}</div></div>${x.tags || ''}</a>`).join('') || '<p class="muted">Rien pour l\'instant.</p>';
    };
    draw('');
    const q = $('#q'); if (q) q.addEventListener('input', () => draw(q.value.trim().toLowerCase()));
  }
  function notFound(back) { $('#view').innerHTML = `<p class="note">Élément introuvable. <a href="${back}">Retour</a></p>`; }

  /* ---------- Navigation ---------- */
  function route() {
    if (!store.site) return;
    $('#app').classList.remove('menu');
    const [v, arg] = (location.hash.slice(1) || 'tableau').split('/');
    // Flèche de retour : vers la liste pour une fiche, vers le tableau de bord sinon
    const PARENT = { article: 'articles', projet: 'projets', formation: 'formations', annonce: 'annonces', temoignage: 'temoignages' };
    const retour = arg && PARENT[v] ? PARENT[v] : v === 'tableau' ? '' : 'tableau';
    $('#back-btn').hidden = !retour; $('#back-btn').dataset.to = retour;
    document.querySelectorAll('#side-nav a').forEach(a => a.classList.toggle('on', a.dataset.v === v || a.dataset.v + 's' === v || a.dataset.v === v + 's'));
    const fn = VIEWS[v] || VIEWS.tableau;
    try { fn(arg && decodeURIComponent(arg)); } catch (e) { status(e.message, 'err'); }
    scrollTo(0, 0);
  }
  async function start() {
    $('#login').hidden = true; $('#app').hidden = false;
    try { localStorage.setItem('jm-moi', '1'); } catch {}   // lu par site.js : vos visites sont reconnues sur cet appareil
    status('Chargement des données…');
    try { await loadAll(); status(''); } catch (e) { status('Impossible de charger les données : ' + e.message, 'err'); return; }
    route();
  }
  function logout(msg) {
    token = ''; try { localStorage.removeItem(TOKEN_KEY); } catch {}
    $('#app').hidden = true; $('#login').hidden = false; $('#login-err').textContent = msg || '';
    portier('/etat').then(d => { $('#setup-form').hidden = !!d.configure; $('#login-form').hidden = !d.configure; }).catch(() => {});
  }
  $('#setup-form').addEventListener('submit', async e => {
    e.preventDefault(); $('#setup-err').textContent = '';
    if ($('#su-pw').value !== $('#su-pw2').value) { $('#setup-err').textContent = 'Les deux mots de passe ne sont pas identiques.'; return; }
    const b = e.target.querySelector('button'); b.disabled = true; b.textContent = 'Vérification…';
    try {
      const d = await portier('/installer', { code: $('#su-code').value, password: $('#su-pw').value, github: $('#su-gh').value });
      token = d.session; try { localStorage.setItem(TOKEN_KEY, token); } catch {}
      e.target.reset(); $('#setup-form').hidden = true; $('#login-form').hidden = false; start();
    } catch (err) { $('#setup-err').textContent = err.message; }
    b.disabled = false; b.textContent = 'Créer et se connecter';
  });

  addEventListener('hashchange', route);
  $('#publish').addEventListener('click', publish);
  $('#logout').addEventListener('click', () => logout());
  // Thème clair / sombre (choix mémorisé)
  const themeBtn = $('#theme');
  const setTheme = t => { document.documentElement.dataset.theme = t; try { localStorage.setItem('jm-theme', t); } catch {} themeBtn.textContent = t === 'dark' ? '☀️' : '🌙'; themeBtn.title = t === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'; themeBtn.setAttribute('aria-label', themeBtn.title); };
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  themeBtn.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  // Menu mobile : s'ouvre avec ☰, se referme avec ✕, en touchant à côté, en choisissant une page ou avec Échap
  const fermerMenu = () => $('#app').classList.remove('menu');
  $('#menu-btn').addEventListener('click', () => $('#app').classList.toggle('menu'));
  $('#side-close').addEventListener('click', fermerMenu);
  $('#side-veil').addEventListener('click', fermerMenu);
  $('#side-nav').addEventListener('click', e => { if (e.target.closest('a')) fermerMenu(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') fermerMenu(); });
  $('#back-btn').addEventListener('click', () => { location.hash = '#' + ($('#back-btn').dataset.to || 'tableau'); });
  addEventListener('beforeunload', e => { if (Object.values(store).some(f => f.dirty) || images.length) { e.preventDefault(); e.returnValue = ''; } });
  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault(); $('#login-err').textContent = '';
    const b = e.target.querySelector('button'); b.disabled = true;
    try { token = (await api('login', { password: $('#pw').value })).session; try { localStorage.setItem(TOKEN_KEY, token); } catch {} $('#pw').value = ''; start(); }
    catch (err) { token = ''; $('#login-err').textContent = err.message; }
    b.disabled = false;
  });
  if (token) start(); else logout();
})();
