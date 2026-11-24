/* ============================================================
   Prévient Bing (et les autres moteurs IndexNow) que des pages ont changé,
   pour qu'ils les relisent tout de suite au lieu d'attendre leur prochain passage.
   Usage : node scripts/indexnow.mjs fichier1.html fichier2.html …
   Lancé par GitHub (.github/workflows/fiches.yml) après chaque publication.
   La clé est le fichier <clé>.txt à la racine du site.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'jipsonmathas.com', SITE = 'https://' + HOST + '/';
const cle = (fs.readdirSync(ROOT).find(f => /^[0-9a-f]{32}\.txt$/.test(f)) || '').slice(0, -4);
if (!cle) { console.log('Pas de clé IndexNow : rien envoyé.'); process.exit(0); }

// Pages publiques seulement (pas l'admin, ni les modèles, ni les pages techniques)
const EXCLUES = /^(merci|pressbook|programme|projet|article|_.*)\.html$/;
const urls = [...new Set(process.argv.slice(2)
  .map(f => f.trim().replace(/\\/g, '/'))
  .filter(f => /^[a-z0-9_-]+\.html$/i.test(f) && !EXCLUES.test(f) && fs.existsSync(path.join(ROOT, f)))
  .map(f => f === 'index.html' ? SITE : SITE + f))];
if (!urls.length) { console.log('Aucune page publique modifiée : rien envoyé.'); process.exit(0); }

const r = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: cle, keyLocation: SITE + cle + '.txt', urlList: urls.slice(0, 10000) })
});
console.log(`IndexNow : ${urls.length} page(s) signalée(s) → réponse ${r.status} ${r.statusText}`);
urls.forEach(u => console.log(' - ' + u));
if (r.status >= 400 && r.status !== 422) process.exitCode = 0;   // un refus ne doit pas bloquer la publication
