/* ============================================================
   API de l'espace d'administration (/admin) — fonction Netlify.
   Réglages à créer dans Netlify (Project configuration > Environment variables) :
     ADMIN_PASSWORD  mot de passe de l'espace /admin
     GITHUB_TOKEN    jeton GitHub (accès « Contents : read and write » au dépôt du site)
     NETLIFY_TOKEN   jeton Netlify (« Personal access token ») pour lire les demandes et l'état des publications
     SMTP_PASS       mot de passe de la boîte contact@jipsonmathas.com (pour répondre aux demandes)
   Facultatifs : GITHUB_REPO (défaut jipson94/Portfolio), GITHUB_BRANCH (défaut main),
     SMTP_HOST (défaut smtp.hostinger.com), SMTP_USER (défaut contact@jipsonmathas.com), SITE_ID.
   Test sur l'ordinateur : ADMIN_LOCAL_DIR = dossier du site → lecture/écriture des fichiers locaux, sans GitHub.
   ============================================================ */
import crypto from 'node:crypto';
import tls from 'node:tls';
import fs from 'node:fs/promises';
import path from 'node:path';

export const config = { path: '/api/admin' };

const env = k => (globalThis.Netlify?.env?.get?.(k)) ?? process.env[k] ?? '';
const REPO = () => env('GITHUB_REPO') || 'jipson94/Portfolio';
const BRANCH = () => env('GITHUB_BRANCH') || 'main';
const LOCAL = () => env('ADMIN_LOCAL_DIR');

// Fichiers que l'admin a le droit de modifier
const WRITABLE = p => typeof p === 'string' && !p.includes('..') && !p.startsWith('/') &&
  (/^data\/[a-z0-9-]+\.js$/.test(p) || p === 'traductions.js' || /^images\/[a-z0-9/_-]+\.(jpe?g|png|webp|svg)$/i.test(p));

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const fail = (msg, status = 400) => json({ error: msg }, status);

/* ---------- Session (jeton signé, valable 12 h) ---------- */
const secret = () => crypto.createHash('sha256').update('jm-admin:' + env('ADMIN_PASSWORD') + ':' + env('GITHUB_TOKEN')).digest();
const sign = s => crypto.createHmac('sha256', secret()).update(s).digest('base64url');
const makeToken = () => { const body = Buffer.from(JSON.stringify({ exp: Date.now() + 12 * 3600e3 })).toString('base64url'); return body + '.' + sign(body); };
function checkToken(t) {
  if (!t || !t.includes('.')) return false;
  const [body, sig] = t.split('.');
  const good = Buffer.from(sign(body)), given = Buffer.from(sig || '');
  if (good.length !== given.length || !crypto.timingSafeEqual(good, given)) return false;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()).exp > Date.now(); } catch { return false; }
}
const sameSecret = (a, b) => { const h = x => crypto.createHash('sha256').update(String(x)).digest(); return crypto.timingSafeEqual(h(a), h(b)); };

/* ---------- GitHub ---------- */
async function gh(method, url, body) {
  const r = await fetch('https://api.github.com/repos/' + REPO() + url, {
    method, headers: { authorization: 'Bearer ' + env('GITHUB_TOKEN'), accept: 'application/vnd.github+json', 'user-agent': 'jm-admin', 'x-github-api-version': '2022-11-28', ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = r.status === 204 ? {} : await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error('GitHub ' + r.status + ' : ' + (data.message || '')); e.status = r.status; throw e; }
  return data;
}
const gitSha = buf => crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

async function readFiles(paths) {
  const out = {};
  for (const p of paths) {
    if (!WRITABLE(p)) throw new Error('Fichier non autorisé : ' + p);
    if (LOCAL()) {
      const buf = await fs.readFile(path.join(LOCAL(), p)).catch(() => null);
      out[p] = buf ? { text: buf.toString('utf8'), sha: gitSha(buf) } : null;
    } else {
      try {
        const d = await gh('GET', '/contents/' + encodeURI(p) + '?ref=' + BRANCH());
        let text = Buffer.from(d.content || '', 'base64').toString('utf8');
        if (!d.content && d.sha) text = Buffer.from((await gh('GET', '/git/blobs/' + d.sha)).content, 'base64').toString('utf8');   // fichiers > 1 Mo
        out[p] = { text, sha: d.sha };
      } catch (e) { if (e.status === 404) out[p] = null; else throw e; }
    }
  }
  return out;
}

// Envoie une image (base64) : renvoie son identifiant ; elle n'est visible qu'après « Publier »
async function uploadBlob(base64) {
  const buf = Buffer.from(base64, 'base64');
  if (buf.length > 4.5e6) throw new Error('Image trop lourde (4,5 Mo maximum).');
  if (LOCAL()) {
    const dir = path.join(LOCAL(), '.admin-blobs'); await fs.mkdir(dir, { recursive: true });
    const sha = gitSha(buf); await fs.writeFile(path.join(dir, sha), buf); return sha;
  }
  return (await gh('POST', '/git/blobs', { content: base64, encoding: 'base64' })).sha;
}

// Publie plusieurs fichiers en un seul envoi (une seule mise en ligne Netlify)
async function publish({ files = [], deletes = [], expected = {}, message }) {
  for (const f of files) if (!WRITABLE(f.path)) throw new Error('Fichier non autorisé : ' + f.path);
  for (const p of deletes) if (!WRITABLE(p) || !p.startsWith('images/')) throw new Error('Suppression non autorisée : ' + p);
  // Le fichier a-t-il changé depuis son ouverture dans l'admin ? (évite d'écraser une autre modification)
  const current = await readFiles(Object.keys(expected));
  for (const [p, sha] of Object.entries(expected)) {
    const now = current[p] ? current[p].sha : null;
    if (now !== sha) return { conflict: p };
  }
  const msg = (message || 'Mise à jour depuis l\'espace admin').slice(0, 200);
  if (LOCAL()) {
    for (const f of files) {
      const dest = path.join(LOCAL(), f.path); await fs.mkdir(path.dirname(dest), { recursive: true });
      const buf = f.blob ? await fs.readFile(path.join(LOCAL(), '.admin-blobs', f.blob)) : Buffer.from(f.text, 'utf8');
      await fs.writeFile(dest, buf);
    }
    for (const p of deletes) await fs.rm(path.join(LOCAL(), p), { force: true });
    return { ok: true, commit: 'local' };
  }
  const ref = await gh('GET', '/git/ref/heads/' + BRANCH());
  const base = await gh('GET', '/git/commits/' + ref.object.sha);
  const tree = [];
  for (const f of files) {
    if (f.blob) tree.push({ path: f.path, mode: '100644', type: 'blob', sha: f.blob });
    else tree.push({ path: f.path, mode: '100644', type: 'blob', content: f.text });
  }
  for (const p of deletes) tree.push({ path: p, mode: '100644', type: 'blob', sha: null });
  const newTree = await gh('POST', '/git/trees', { base_tree: base.tree.sha, tree });
  const commit = await gh('POST', '/git/commits', { message: msg, tree: newTree.sha, parents: [ref.object.sha] });
  await gh('PATCH', '/git/refs/heads/' + BRANCH(), { sha: commit.sha });
  return { ok: true, commit: commit.sha };
}

/* ---------- Netlify : demandes reçues et état des publications ---------- */
async function nf(method, url, context) {
  const site = env('SITE_ID') || context?.site?.id;
  const r = await fetch('https://api.netlify.com/api/v1' + url.replace('{site}', site), { method, headers: { authorization: 'Bearer ' + env('NETLIFY_TOKEN') } });
  if (!r.ok) throw new Error('Netlify ' + r.status);
  return r.status === 204 ? {} : r.json();
}
const DEMO_SUBS = [
  { id: 'demo1', form_name: 'formation', created_at: new Date().toISOString(), data: { demande: 'Demande de devis', formation: 'Initiation au motion design', name: 'Exemple Client', email: 'client@example.com', telephone: '+242 06 000 00 00', format: 'Dans votre structure', structure: 'Exemple SARL', participants: '12', message: 'Bonjour, nous aimerions former notre équipe en mars.' } },
  { id: 'demo2', form_name: 'contact', created_at: new Date(Date.now() - 864e5 * 3).toISOString(), data: { name: 'Exemple Contact', email: 'contact@example.com', telephone: '', message: 'Bonjour, je voudrais un logo pour ma boutique.' } }
];
async function submissions(context) {
  if (LOCAL() && !env('NETLIFY_TOKEN')) return DEMO_SUBS;
  const list = await nf('GET', '/sites/{site}/submissions?per_page=100', context);
  return list.map(s => ({ id: s.id, form_name: s.form_name, created_at: s.created_at, data: s.data || {} }));
}
async function deploys(context) {
  if (LOCAL() && !env('NETLIFY_TOKEN')) return [{ state: 'ready', created_at: new Date().toISOString(), title: 'Mode test local' }];
  const list = await nf('GET', '/sites/{site}/deploys?per_page=5', context);
  return list.map(d => ({ state: d.state, created_at: d.created_at, published_at: d.published_at, title: d.title || '', error: d.error_message || '' }));
}

/* ---------- Envoi d'e-mail (SMTP Hostinger, port 465 chiffré) ---------- */
const b64 = s => Buffer.from(s, 'utf8').toString('base64');
const mimeWord = s => /^[\x20-\x7e]*$/.test(s) ? s : '=?UTF-8?B?' + b64(s) + '?=';
function smtpSend({ to, subject, text, replyTo }) {
  const host = env('SMTP_HOST') || 'smtp.hostinger.com', user = env('SMTP_USER') || 'contact@jipsonmathas.com', pass = env('SMTP_PASS');
  if (LOCAL() && !pass) return Promise.resolve({ ok: true, demo: true });
  if (!pass) return Promise.reject(new Error('SMTP_PASS manquant dans les réglages Netlify.'));
  const fromName = 'Jipson Mathas';
  const body = b64(text.replace(/\r?\n/g, '\r\n')).replace(/.{1,76}/g, '$&\r\n');
  const msg = [
    `From: ${mimeWord(fromName)} <${user}>`, `To: <${to}>`, `Subject: ${mimeWord(subject)}`,
    `Date: ${new Date().toUTCString()}`, `Message-ID: <${crypto.randomUUID()}@jipsonmathas.com>`,
    ...(replyTo ? [`Reply-To: <${replyTo}>`] : []),
    'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: base64', '', body
  ].join('\r\n');
  const steps = [
    ['EHLO jipsonmathas.com', 250], ['AUTH LOGIN', 334], [b64(user), 334], [b64(pass), 235],
    [`MAIL FROM:<${user}>`, 250], [`RCPT TO:<${to}>`, 250], [`RCPT TO:<${user}>`, 250],   // copie dans la boîte contact@
    ['DATA', 354], [msg + '\r\n.', 250], ['QUIT', 221]
  ];
  return new Promise((resolve, reject) => {
    const sock = tls.connect(465, host, { servername: host });
    let buf = '', i = -1, done = false;
    const end = (err, v) => { if (done) return; done = true; sock.destroy(); err ? reject(err) : resolve(v); };
    sock.setTimeout(20000, () => end(new Error('Le serveur mail ne répond pas.')));
    sock.on('error', e => end(e));
    sock.on('data', d => {
      buf += d.toString('utf8');
      const lines = buf.split('\r\n'); if (lines[lines.length - 1] !== '') return;
      const last = lines[lines.length - 2] || '';
      if (!/^\d{3} /.test(last)) return;            // réponse sur plusieurs lignes pas encore complète
      const code = +last.slice(0, 3); buf = '';
      const want = i < 0 ? 220 : steps[i][1];
      if (code !== want) return end(new Error(i >= 3 ? 'Envoi refusé (' + last + ')' : 'Connexion à la boîte mail refusée : vérifiez SMTP_PASS. (' + code + ')'));
      i++;
      if (i >= steps.length) return end(null, { ok: true });
      sock.write(steps[i][0] + '\r\n');
    });
  });
}

/* ---------- Routeur ---------- */
export default async (req, context) => {
  if (req.method !== 'POST') return fail('Méthode non autorisée', 405);
  let body; try { body = await req.json(); } catch { return fail('Requête illisible'); }
  const action = body.action;
  try {
    if (action === 'login') {
      if (!env('ADMIN_PASSWORD')) return fail('ADMIN_PASSWORD n\'est pas encore réglé dans Netlify.', 500);
      if (!sameSecret(body.password || '', env('ADMIN_PASSWORD'))) { await new Promise(r => setTimeout(r, 1200)); return fail('Mot de passe incorrect.', 401); }
      return json({ token: makeToken(), local: !!LOCAL() });
    }
    if (!checkToken((req.headers.get('authorization') || '').replace(/^Bearer /, ''))) return fail('Session expirée : reconnectez-vous.', 401);

    if (action === 'read') return json({ files: await readFiles(body.paths || []) });
    if (action === 'upload') return json({ blob: await uploadBlob(body.base64 || '') });
    if (action === 'publish') return json(await publish(body));
    if (action === 'submissions') return json({ list: await submissions(context) });
    if (action === 'deleteSubmission') {
      if (!(LOCAL() && !env('NETLIFY_TOKEN'))) await nf('DELETE', '/submissions/' + encodeURIComponent(body.id), context);
      return json({ ok: true });
    }
    if (action === 'deploys') return json({ list: await deploys(context) });
    if (action === 'reply') {
      const to = String(body.to || '').trim();
      if (!/^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(to)) return fail('Adresse e-mail du destinataire invalide.');
      const subject = String(body.subject || '').slice(0, 200), text = String(body.text || '').slice(0, 20000);
      if (!text.trim()) return fail('Le message est vide.');
      return json(await smtpSend({ to, subject, text }));
    }
    return fail('Action inconnue');
  } catch (e) {
    return fail(e.message || 'Erreur', e.status === 401 || e.status === 403 ? 502 : 500);
  }
};
