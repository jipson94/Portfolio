/* ============================================================
   Ajoute un article rédigé en Markdown simple dans data/articles.js
   (# titre, **gras**, ## intertitres, listes « - » / « * », liens [texte](https://…)),
   avec une couverture 1200×672 tirée de l'image fournie.
   Usage : node scripts/article-md.cjs <article.md> <id> <catégorie> <image> "<résumé>" [chemin vers sharp]
   Ensuite : node scripts/build-pages.mjs
   ============================================================ */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..') + '/';
const [md, id, categorie, imgSrc, resume, sharpPath] = process.argv.slice(2);
if (!resume) { console.error('Usage : node scripts/article-md.cjs <article.md> <id> <catégorie> <image> "<résumé>" [sharp]'); process.exit(1); }
const sharp = require(sharpPath || 'sharp'); sharp.cache(false);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s)
  .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
let titre = '', liste = []; const out = [];
const flush = () => { if (liste.length) { out.push('<ul>' + liste.map(x => `<li>${inline(x)}</li>`).join('') + '</ul>'); liste = []; } };
for (const l of fs.readFileSync(md, 'utf8').replace(/\r/g, '').split('\n').map(x => x.trim())) {
  if (!l) { flush(); continue; }
  if (/^# /.test(l)) { titre = l.slice(2).trim(); continue; }
  if (/^#{2,4} /.test(l)) { flush(); out.push(`<h3>${inline(l.replace(/^#+ /, ''))}</h3>`); continue; }
  if (/^[*-] /.test(l)) { liste.push(l.slice(2)); continue; }
  flush(); out.push(`<p>${inline(l)}</p>`);
}
flush();
const contenu = '\n' + out.join('\n');
(async () => {
  const image = `images/articles/${id}.jpg`;
  await sharp(fs.readFileSync(imgSrc)).resize(1200, 672, { fit: 'cover' }).jpeg({ quality: 84, mozjpeg: true }).toFile(ROOT + image);
  const F = ROOT + 'data/articles.js', s = fs.readFileSync(F, 'utf8');
  const pre = s.slice(0, s.indexOf('const ARTICLES')), A = eval(s.slice(s.indexOf('['), s.lastIndexOf(']') + 1));
  if (A.some(a => a.id === id)) throw new Error('Un article porte déjà cet identifiant : ' + id);
  const mots = contenu.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  A.unshift({ id, titre, categorie, date: new Date().toISOString().slice(0, 10), lecture: Math.max(1, Math.round(mots / 230)) + ' min', image, resume, contenu });
  fs.writeFileSync(F, pre + 'const ARTICLES = ' + JSON.stringify(A, null, 2) + ';\n');
  console.log(`ok | ${titre} | ${mots} mots | ${(contenu.match(/<a /g) || []).length} liens | ${(contenu.match(/<h3>/g) || []).length} intertitres`);
})();
