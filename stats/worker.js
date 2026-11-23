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

const okTokens = new Map();   // clé GitHub vérifiée -> expiration (mémoire courte)
async function allowed(req, env) {
  if (env.TEST_LOCAL === 'oui') return true;   // uniquement pour les essais sur l'ordinateur (wrangler dev --var TEST_LOCAL:oui)
  const t = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!t || t.length > 300) return false;
  const k = await sha(t), exp = okTokens.get(k);
  if (exp && exp > Date.now()) return true;
  const r = await fetch('https://api.github.com/repos/' + REPO, { headers: { authorization: 'Bearer ' + t, accept: 'application/vnd.github+json', 'user-agent': 'jm-stats' } });
  if (!r.ok) return false;
  const repo = await r.json();
  if (!repo.permissions || !repo.permissions.push) return false;
  okTokens.set(k, Date.now() + 10 * 60e3);
  return true;
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
    const cors = { 'access-control-allow-origin': ORIGINS.includes(origin) ? origin : ORIGINS[0], 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-max-age': '86400', vary: 'origin' };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (url.pathname === '/hit' && req.method === 'POST') { const text = (await req.text()).slice(0, 2000); ctx.waitUntil(hit(req, env, text).catch(() => {})); return new Response(null, { status: 204, headers: cors }); }
    if (url.pathname === '/stats' && req.method === 'GET') {
      const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
      if (!(await allowed(req, env))) return json({ erreur: 'Accès refusé' }, 401);
      try { return json(await stats(url, env)); } catch (e) { return json({ erreur: String(e.message || e) }, 500); }
    }
    return new Response('Compteur de visites jipsonmathas.com', { headers: cors });
  }
};
