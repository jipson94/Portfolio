/* ============================================================
   Compteur de visites — jipsonmathas.com (Cloudflare Worker + base D1, offre gratuite)
   POST /hit    : le site envoie une visite (page, provenance). Pas de cookie, aucune adresse IP enregistrée.
   GET  /stats  : l'admin lit les statistiques. Accès réservé : clé GitHub ayant le droit de modifier le dépôt.
   Mise en ligne : voir stats/README.md
   ============================================================ */
const ORIGINS = ['https://jipsonmathas.com', 'https://www.jipsonmathas.com', 'https://jipson94.github.io', 'http://localhost:5501'];
const PUBLIC = /^https:\/\/(www\.)?jipsonmathas\.com$|^https:\/\/jipson94\.github\.io$/;   // origines dont les visites comptent
const REPO = 'jipson94/Portfolio';
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp\/|telegram|curl|wget|python|monitor|pingdom|vercel|scan/i;
const PATH_OK = /^(\/[a-z0-9._-]*(\?id=[a-z0-9_-]{1,80})?|evt:[a-z0-9:_-]{1,120})$/i;

// Provenance lisible à partir du site d'origine (ou du paramètre utm_source)
const SOURCES = [
  [/facebook|fb\.|^fb$/, 'Facebook'], [/instagram/, 'Instagram'], [/linkedin|lnkd\.in/, 'LinkedIn'], [/whatsapp|wa\.me/, 'WhatsApp'],
  [/t\.co$|twitter|x\.com/, 'X / Twitter'], [/tiktok/, 'TikTok'], [/youtube|youtu\.be/, 'YouTube'], [/google/, 'Google'], [/bing/, 'Bing'],
  [/yahoo/, 'Yahoo'], [/duckduckgo/, 'DuckDuckGo'], [/chatgpt|openai/, 'ChatGPT'], [/claude\.ai|perplexity|gemini/, 'IA (Claude, Perplexity…)'],
  [/mail|outlook|gmail/, 'E-mail'], [/github/, 'GitHub']
];
function source(ref, utm) {
  const raw = (utm || '').toLowerCase().trim();
  let host = '';
  if (!raw) { try { host = new URL(ref).hostname.replace(/^www\./, '').toLowerCase(); } catch { return 'Accès direct'; } }
  if (host && /jipsonmathas\.com$|jipson94\.github\.io$/.test(host)) return null;   // navigation interne
  const key = raw || host;
  for (const [re, name] of SOURCES) if (re.test(key)) return name;
  return key.slice(0, 60) || 'Accès direct';
}
const device = ua => /ipad|tablet/i.test(ua) ? 'Tablette' : /mobi|android|iphone/i.test(ua) ? 'Téléphone' : 'Ordinateur';

async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].slice(0, 8).map(x => x.toString(16).padStart(2, '0')).join('');
}

async function hit(req, env, text) {
  const origin = req.headers.get('origin') || (() => { try { return new URL(req.headers.get('referer')).origin; } catch { return ''; } })();
  if (!PUBLIC.test(origin)) return;
  const ua = req.headers.get('user-agent') || '';
  if (!ua || BOT.test(ua)) return;
  let b; try { b = JSON.parse(text); } catch { return; }
  const path = String(b.p || '').slice(0, 140);
  if (!PATH_OK.test(path)) return;
  const now = new Date(), day = now.toISOString().slice(0, 10);
  const ip = req.headers.get('cf-connecting-ip') || '';
  // Identifiant anonyme d'un visiteur pour la journée seulement (impossible de remonter à l'IP, change chaque jour)
  const vid = await sha(day + '|' + ip + '|' + ua + '|' + (env.SEL || 'jm'));
  const cf = req.cf || {};
  const isEvt = path.startsWith('evt:');
  await env.DB.prepare('INSERT INTO hits (ts, day, path, ref, country, city, device, vid) VALUES (?,?,?,?,?,?,?,?)')
    .bind(now.getTime(), day, path, isEvt ? null : source(String(b.r || ''), String(b.s || '')), cf.country || null, cf.city || null, device(ua), vid).run();
  if (Math.random() < 0.01) await env.DB.prepare('DELETE FROM hits WHERE ts < ?').bind(now.getTime() - 400 * 864e5).run();   // garde ~13 mois
}

/* ---------- Connexion à l'admin par mot de passe ----------
   Le mot de passe (haché) et la clé GitHub (chiffrée) sont gardés dans la base, table « config ».
   Première fois : l'admin propose de créer le mot de passe avec le code d'installation (secret SETUP_CODE).
   L'admin reçoit une session de 30 jours ; ses appels GitHub passent par /gh/… avec la clé gardée ici.
   Secret SESSION_KEY : signe les sessions et chiffre la clé GitHub. */
const SESSION_DAYS = 30, MAX_ESSAIS = 5, FENETRE = 15 * 60e3, ITER = 100000;
const enc = s => new TextEncoder().encode(s);
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const unhex = h => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)));
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey('raw', enc(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc(msg)));
}
const pareil = async (env, a, b) => (await hmac(env.SESSION_KEY, String(a))) === (await hmac(env.SESSION_KEY, String(b)));   // comparaison à temps constant
async function pbkdf2(pw, salt) {
  const k = await crypto.subtle.importKey('raw', enc(pw), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITER }, k, 256));
}
async function hacher(pw) { const salt = crypto.getRandomValues(new Uint8Array(16)); return 'pbkdf2$' + ITER + '$' + hex(salt) + '$' + (await pbkdf2(pw, salt)); }
async function verifier(env, pw, stored) { const [, , s, h] = String(stored || '').split('$'); return !!(s && h) && pareil(env, await pbkdf2(pw, unhex(s)), h); }
async function cleAES(env) { return crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', enc(env.SESSION_KEY + '|github')), 'AES-GCM', false, ['encrypt', 'decrypt']); }
async function chiffrer(env, txt) { const iv = crypto.getRandomValues(new Uint8Array(12)); return hex(iv) + '.' + hex(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await cleAES(env), enc(txt))); }
async function dechiffrer(env, v) { const [iv, c] = String(v || '').split('.'); if (!iv || !c) return ''; return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unhex(iv) }, await cleAES(env), unhex(c))); }

async function config(env) { const r = await env.DB.prepare('SELECT k, v FROM config').all(); return Object.fromEntries(r.results.map(x => [x.k, x.v])); }
async function ecrire(env, o) { await env.DB.batch(Object.entries(o).map(([k, v]) => env.DB.prepare('INSERT INTO config (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').bind(k, v))); }
const nouvelleVersion = () => hex(crypto.getRandomValues(new Uint8Array(8)));

// Sessions : « expiration.signature », liées à la version du mot de passe (changer de mot de passe déconnecte les autres appareils)
const signe = (env, exp, ver) => hmac(env.SESSION_KEY, 'jm|' + exp + '|' + ver);
async function nouvelleSession(env, ver) { const exp = Date.now() + SESSION_DAYS * 864e5; return exp + '.' + (await signe(env, exp, ver)); }
async function sessionValide(env, t) {
  const m = /^(\d{13})\.([0-9a-f]{64})$/.exec(t || ''); if (!m || !env.SESSION_KEY || +m[1] < Date.now()) return false;
  const c = await config(env); if (!c.pw) return false;
  return pareil(env, await signe(env, m[1], c.ver || ''), m[2]);
}

// Anti-force brute : 5 erreurs en 15 minutes par connexion Internet
async function cleEssais(req, env) { return sha('login|' + (req.headers.get('cf-connecting-ip') || '') + '|' + (env.SEL || '')); }
async function bloque(req, env) {
  await env.DB.prepare('DELETE FROM logins WHERE ts < ?').bind(Date.now() - FENETRE).run();
  return (await env.DB.prepare('SELECT COUNT(*) AS n FROM logins WHERE k = ?').bind(await cleEssais(req, env)).first()).n >= MAX_ESSAIS;
}
async function echec(req, env) { await env.DB.prepare('INSERT INTO logins (k, ts) VALUES (?, ?)').bind(await cleEssais(req, env), Date.now()).run(); await new Promise(r => setTimeout(r, 600)); }
const TROP = [429, { erreur: 'Trop d’essais. Réessayez dans 15 minutes.' }];

async function corps(req) { try { return await req.json(); } catch { return {}; } }
const motDePasseValide = pw => typeof pw === 'string' && pw.length >= 8 && pw.length <= 200;
async function testerGithub(token) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_]{20,255}$/.test(token.trim())) return 'Cette clé GitHub n’a pas le bon format (elle commence par github_pat_…).';
  const r = await fetch('https://api.github.com/repos/' + REPO, { headers: { authorization: 'Bearer ' + token.trim(), accept: 'application/vnd.github+json', 'user-agent': 'jm-admin' } });
  if (r.status === 401) return 'GitHub refuse cette clé (expirée ou mal copiée).';
  if (!r.ok) return 'Cette clé n’a pas accès au dépôt Portfolio (GitHub ' + r.status + ').';
  const repo = await r.json();
  if (!repo.permissions || !repo.permissions.push) return 'Cette clé peut lire le dépôt mais pas le modifier : donnez-lui « Contents : Read and write ».';
  return '';
}

async function etat(env) { const c = await config(env); return { configure: !!c.pw, github: !!c.gh || !!env.GITHUB_TOKEN }; }

// Première installation : code d'installation + mot de passe + clé GitHub
async function installer(req, env) {
  if (!env.SESSION_KEY || !env.SETUP_CODE) return [503, { erreur: 'Installation indisponible.' }];
  if ((await config(env)).pw) return [409, { erreur: 'Le mot de passe est déjà créé : connectez-vous.' }];
  if (await bloque(req, env)) return TROP;
  const b = await corps(req);
  if (!(await pareil(env, String(b.code || '').trim().toUpperCase(), env.SETUP_CODE))) { await echec(req, env); return [401, { erreur: 'Code d’installation incorrect.' }]; }
  if (!motDePasseValide(b.password)) return [400, { erreur: 'Le mot de passe doit faire au moins 8 caractères.' }];
  const err = await testerGithub(b.github); if (err) return [400, { erreur: err }];
  const ver = nouvelleVersion();
  await ecrire(env, { pw: await hacher(b.password), gh: await chiffrer(env, b.github.trim()), ver });
  return [200, { session: await nouvelleSession(env, ver), jours: SESSION_DAYS }];
}
async function login(req, env) {
  if (!env.SESSION_KEY) return [503, { erreur: 'Connexion indisponible.' }];
  const c = await config(env);
  if (!c.pw) return [409, { erreur: 'Le mot de passe n’est pas encore créé.', installer: true }];
  if (await bloque(req, env)) return TROP;
  const b = await corps(req);
  if (!motDePasseValide(b.password) || !(await verifier(env, b.password, c.pw))) { await echec(req, env); return [401, { erreur: 'Mot de passe incorrect.' }]; }
  await env.DB.prepare('DELETE FROM logins WHERE k = ?').bind(await cleEssais(req, env)).run();
  return [200, { session: await nouvelleSession(env, c.ver || ''), jours: SESSION_DAYS }];
}
// Depuis l'admin (connecté) : changer le mot de passe et/ou la clé GitHub, avec le mot de passe actuel
async function compte(req, env) {
  if (await bloque(req, env)) return TROP;
  const b = await corps(req), c = await config(env);
  if (!(await verifier(env, String(b.actuel || ''), c.pw))) { await echec(req, env); return [401, { erreur: 'Mot de passe actuel incorrect.' }]; }
  const maj = {};
  if (b.github) { const err = await testerGithub(b.github); if (err) return [400, { erreur: err }]; maj.gh = await chiffrer(env, b.github.trim()); }
  if (b.nouveau) { if (!motDePasseValide(b.nouveau)) return [400, { erreur: 'Le nouveau mot de passe doit faire au moins 8 caractères.' }]; maj.pw = await hacher(b.nouveau); maj.ver = nouvelleVersion(); }
  if (!Object.keys(maj).length) return [400, { erreur: 'Rien à modifier.' }];
  await ecrire(env, maj);
  return [200, { ok: true, session: maj.ver ? await nouvelleSession(env, maj.ver) : undefined }];
}

const bearer = req => (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
async function allowed(req, env) {
  if (env.TEST_LOCAL === 'oui') return true;   // uniquement pour les essais sur l'ordinateur (wrangler dev --var TEST_LOCAL:oui)
  return sessionValide(env, bearer(req));
}
async function cleGithub(env) { if (env.GITHUB_TOKEN) return env.GITHUB_TOKEN; try { return await dechiffrer(env, (await config(env)).gh); } catch { return ''; } }
// Relais vers GitHub, limité au dépôt du site et aux opérations dont l'admin a besoin
const GH_OK = /^(|\/contents\/[^?#]*|\/git\/(blobs|trees|commits|refs?\/heads)(\/[A-Za-z0-9._\/-]*)?|\/actions\/runs)$/;
async function ghProxy(req, env, url) {
  const p = url.pathname.slice(3);
  if (!GH_OK.test(p) || !['GET', 'POST', 'PATCH'].includes(req.method)) return new Response(JSON.stringify({ message: 'Opération non autorisée' }), { status: 403 });
  const token = await cleGithub(env);
  if (!token) return new Response(JSON.stringify({ message: 'Clé GitHub pas encore configurée' }), { status: 503 });
  const r = await fetch('https://api.github.com/repos/' + REPO + p + url.search, {
    method: req.method, body: req.method === 'GET' ? undefined : await req.text(),
    headers: { authorization: 'Bearer ' + token, accept: 'application/vnd.github+json', 'content-type': 'application/json', 'user-agent': 'jm-admin', 'x-github-api-version': '2022-11-28' }
  });
  return new Response(r.status === 204 ? null : await r.text(), { status: r.status === 401 ? 502 : r.status });   // 502 : la clé GitHub enregistrée est refusée
}

async function stats(url, env) {
  const days = Math.min(400, Math.max(1, parseInt(url.searchParams.get('jours') || '30', 10) || 30));
  const since = new Date(Date.now() - (days - 1) * 864e5).toISOString().slice(0, 10);
  const P = "path NOT LIKE 'evt:%'";
  const q = (sql, ...a) => env.DB.prepare(sql).bind(...a);
  const [jours, pages, evts, sources, pays, villes, appareils, recents, direct] = await env.DB.batch([
    q(`SELECT day, COUNT(*) AS vues, COUNT(DISTINCT vid) AS visiteurs FROM hits WHERE day >= ? AND ${P} GROUP BY day ORDER BY day`, since),
    q(`SELECT path, COUNT(*) AS vues, COUNT(DISTINCT day || vid) AS visiteurs FROM hits WHERE day >= ? AND ${P} GROUP BY path ORDER BY vues DESC LIMIT 300`, since),
    q(`SELECT path, COUNT(*) AS n, COUNT(DISTINCT day || vid) AS visiteurs FROM hits WHERE day >= ? AND path LIKE 'evt:%' GROUP BY path ORDER BY n DESC LIMIT 300`, since),
    q(`SELECT ref AS k, COUNT(DISTINCT day || vid) AS n FROM hits WHERE day >= ? AND ${P} AND ref IS NOT NULL GROUP BY ref ORDER BY n DESC LIMIT 15`, since),
    q(`SELECT country AS k, COUNT(DISTINCT day || vid) AS n FROM hits WHERE day >= ? AND ${P} GROUP BY country ORDER BY n DESC LIMIT 15`, since),
    q(`SELECT city || ' (' || country || ')' AS k, COUNT(DISTINCT day || vid) AS n FROM hits WHERE day >= ? AND ${P} AND city IS NOT NULL GROUP BY city, country ORDER BY n DESC LIMIT 15`, since),
    q(`SELECT device AS k, COUNT(DISTINCT day || vid) AS n FROM hits WHERE day >= ? AND ${P} GROUP BY device ORDER BY n DESC`, since),
    q(`SELECT ts, path, ref, country, city, device FROM hits ORDER BY ts DESC LIMIT 40`),
    q(`SELECT COUNT(DISTINCT vid) AS n FROM hits WHERE ts >= ?`, Date.now() - 30 * 60e3)
  ]);
  return { jours: days, depuis: since, parJour: jours.results, pages: pages.results, actions: evts.results, sources: sources.results, pays: pays.results, villes: villes.results, appareils: appareils.results, recents: recents.results, enLigne: (direct.results[0] || {}).n || 0 };
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url), origin = req.headers.get('origin') || '';
    const cors = { 'access-control-allow-origin': ORIGINS.includes(origin) ? origin : ORIGINS[0], 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS', 'access-control-max-age': '86400', vary: 'origin' };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (url.pathname === '/hit' && req.method === 'POST') { const text = (await req.text()).slice(0, 2000); ctx.waitUntil(hit(req, env, text).catch(() => {})); return new Response(null, { status: 204, headers: cors }); }
    const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
    if (url.pathname === '/etat' && req.method === 'GET') return json(await etat(env));
    if (url.pathname === '/installer' && req.method === 'POST') { const [st, o] = await installer(req, env); return json(o, st); }
    if (url.pathname === '/login' && req.method === 'POST') { const [st, o] = await login(req, env); return json(o, st); }
    if (url.pathname === '/compte' && req.method === 'POST') { if (!(await allowed(req, env))) return json({ erreur: 'Session expirée' }, 401); const [st, o] = await compte(req, env); return json(o, st); }
    if (url.pathname === '/session' && req.method === 'GET') return json({ ok: await allowed(req, env) }, (await allowed(req, env)) ? 200 : 401);
    if (url.pathname === '/gh' || url.pathname.startsWith('/gh/')) {
      if (!(await allowed(req, env))) return json({ message: 'Session expirée' }, 401);
      const r = await ghProxy(req, env, url); const h = new Headers(cors); h.set('content-type', 'application/json; charset=utf-8'); h.set('cache-control', 'no-store');
      return new Response(r.body, { status: r.status, headers: h });
    }
    if (url.pathname === '/stats' && req.method === 'GET') {
      if (!(await allowed(req, env))) return json({ erreur: 'Accès refusé' }, 401);
      try { return json(await stats(url, env)); } catch (e) { return json({ erreur: String(e.message || e) }, 500); }
    }
    return new Response('Compteur de visites jipsonmathas.com', { headers: cors });
  }
};
