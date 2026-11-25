/* ============================================================
   Press-book, version légère pour le site : copies réduites des images
   utilisées par pressbook.html?leger, rangées dans images/pressbook/mini/.
   - image principale d’un projet : 800 px de large au plus
   - autres images (mosaïques, photos des pages d'expertise) : 400 à 420 px au plus
   - portrait détouré : 520 px (PNG, transparence gardée)
   Usage : node scripts/pressbook-mini.cjs [chemin vers sharp]
   Puis : imprimer http://localhost:5501/pressbook.html?leger en PDF (Edge) vers documents/press-book-jipson-mathas.pdf
   ============================================================ */
const fs = require('fs'), path = require('path');
const sharp = require(process.argv[2] || 'sharp'); sharp.cache(false);
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'images/pressbook/mini');
// Même nom que dans pressbook.html : chemin aplati
const mini = s => s.replace(/^images\//, '').replace(/\//g, '__').replace(/\.(png|webp|jpe?g)$/i, '') ;
global.window = {};
eval(fs.readFileSync(path.join(ROOT, 'data/projets.js'), 'utf8').replace('const PROJETS', 'global.PROJETS'));
const html = fs.readFileSync(path.join(ROOT, 'pressbook.html'), 'utf8');
const exp = [...html.matchAll(/'(images\/photos\/[^']+\.jpg)'/g)].map(m => m[1]);

const jobs = new Map();   // source → largeur max
for (const p of PROJETS) {
  const im = (p.images || []).slice(0, 4); if (!im.length && p.poster) im.push(p.poster);
  im.forEach((s, i) => jobs.set(s, Math.max(jobs.get(s) || 0, i ? 400 : 800)));
}
exp.forEach(s => jobs.set(s, Math.max(jobs.get(s) || 0, 420)));

fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  let tot = 0, n = 0;
  for (const [src, w] of jobs) {
    const f = path.join(ROOT, src); if (!fs.existsSync(f)) { console.log('absente :', src); continue; }
    const out = path.join(OUT, mini(src) + '.jpg');
    const i = await sharp(fs.readFileSync(f)).flatten({ background: '#ffffff' }).resize({ width: w, height: w, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 58, mozjpeg: true }).toFile(out);
    tot += i.size; n++;
  }
  const d = await sharp(fs.readFileSync(path.join(ROOT, 'images/jipson-detoure-2.webp'))).resize({ width: 520 }).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(path.join(OUT, 'jipson-detoure-2.png'));
  tot += d.size; n++;
  console.log(n, 'images,', (tot / 1e6).toFixed(2), 'Mo');
})();
