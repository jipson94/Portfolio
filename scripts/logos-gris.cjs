/* ============================================================
   Logos de la bande d'accueil : versions en niveaux de gris pour le fond bleu nuit.
   Chaque couleur du logo reçoit sa propre nuance de gris (du gris moyen au blanc) :
   les détails restent lisibles, au lieu d'une silhouette blanche uniforme.
   - les tons sont répartis selon leur fréquence (égalisation d'histogramme) ;
   - la couleur principale du logo devient la plus claire.
   Entrée : images/logos/*.png  →  Sortie : images/logos/gris/*.png
   Usage : node scripts/logos-gris.cjs [chemin vers sharp]
   ============================================================ */
const fs = require('fs'), path = require('path');
const sharp = require(process.argv[2] || 'sharp'); sharp.cache(false);
const ROOT = path.resolve(__dirname, '..'), SRC = path.join(ROOT, 'images/logos'), OUT = path.join(SRC, 'gris');
const BAS = 138, HAUT = 255;   // gris le plus sombre / le plus clair utilisés (lisibles sur #0b1850)
// Réglages par logo si besoin : inverser le sens, ou resserrer la plage
const REGLAGES = { 'logo-ndule.png': { inverser: true } };
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  for (const f of fs.readdirSync(SRC).filter(x => x.endsWith('.png'))) {
    const { data, info } = await sharp(fs.readFileSync(path.join(SRC, f))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const n = info.width * info.height, L = new Float32Array(n), hist = new Float64Array(256);
    for (let i = 0; i < n; i++) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3] / 255;
      L[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (a > 0.15) hist[Math.round(L[i])] += a;
    }
    // Courbe cumulée (rang de chaque luminosité parmi les pixels visibles)
    const tot = hist.reduce((s, x) => s + x, 0) || 1, cdf = new Float64Array(256);
    let c = 0; for (let k = 0; k < 256; k++) { c += hist[k]; cdf[k] = (c - hist[k] / 2) / tot; }
    // Sens : la luminosité la plus fréquente (couleur principale) doit devenir la plus claire
    let mode = 0; for (let k = 1; k < 256; k++) if (hist[k] > hist[mode]) mode = k;
    let inverser = cdf[mode] < 0.5;
    if (REGLAGES[f] && 'inverser' in REGLAGES[f]) inverser = REGLAGES[f].inverser;
    const out = Buffer.alloc(n * 4);
    for (let i = 0; i < n; i++) {
      let t = cdf[Math.max(0, Math.min(255, Math.round(L[i])))];
      if (inverser) t = 1 - t;
      const v = Math.round(BAS + (HAUT - BAS) * t);
      out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v; out[i * 4 + 3] = data[i * 4 + 3];
    }
    await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png({ compressionLevel: 9, palette: true }).toFile(path.join(OUT, f));
    console.log(f.padEnd(30), inverser ? 'inversé' : 'direct');
  }
})();
