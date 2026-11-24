/* ============================================================
   Allège les images du site sans perte visible :
   - JPG de plus de 120 Ko : 1600 px de large au maximum, qualité 80 (mozjpeg, progressif)
   - PNG de plus de 40 Ko : palette optimisée
   Une image n'est remplacée que si le gain dépasse 10 %.
   Usage : node scripts/alleger-images.cjs [chemin vers sharp]
   ============================================================ */
const fs = require('fs'), path = require('path');
const sharp = require(process.argv[2] || 'sharp');
sharp.cache(false);   // sinon Windows garde les fichiers ouverts
const ROOT = path.resolve(__dirname, '..');
const DOSSIERS = ['images', 'videos'];
const liste = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? liste(path.join(d, e.name)) : [path.join(d, e.name)]);

(async () => {
  let avant = 0, apres = 0, n = 0;
  for (const dossier of DOSSIERS) for (const f of liste(path.join(ROOT, dossier))) {
    const ext = path.extname(f).toLowerCase(), taille = fs.statSync(f).size;
    let buf = null;
    try {
      if ((ext === '.jpg' || ext === '.jpeg') && taille > 120 * 1024)
        buf = await sharp(fs.readFileSync(f)).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true, progressive: true }).toBuffer();
      else if (ext === '.png' && taille > 40 * 1024)
        buf = await sharp(fs.readFileSync(f)).png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 }).toBuffer();
    } catch (e) { console.log('ignorée :', path.relative(ROOT, f), e.message); continue; }
    if (buf && buf.length < taille * 0.9) {
      fs.writeFileSync(f, buf); avant += taille; apres += buf.length; n++;
    }
  }
  console.log(`${n} images allégées : ${(avant / 1048576).toFixed(1)} Mo → ${(apres / 1048576).toFixed(1)} Mo (−${Math.round(100 - 100 * apres / (avant || 1))} %)`);
})();
