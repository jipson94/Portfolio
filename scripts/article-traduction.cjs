/* ============================================================
   Ajoute les traductions anglaise et chinoise des articles dans data/articles.js (champ tr).
   Un fichier par article et par langue : <id>.en.md, <id>.zh.md
     ligne 1 : # titre traduit
     ligne 2 : > résumé traduit
     puis le texte en Markdown simple (## intertitres, **gras**, *italique*, listes « - », liens [texte](https://…)) ;
     une ligne qui commence par « < » (ex. <figure>…</figure>) est reprise telle quelle.
   Contrôle : même nombre de liens, d'intertitres et d'images que la version française.
   Usage : node scripts/article-traduction.cjs <dossier des fichiers .md>
   Ensuite : node scripts/build-pages.mjs
   ============================================================ */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), DIR = process.argv[2];
if (!DIR) { console.error('Usage : node scripts/article-traduction.cjs <dossier>'); process.exit(1); }
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s)
  .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, '$1<em>$2</em>');
function convert(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  let titre = '', resume = '', liste = []; const out = [];
  const flush = () => { if (liste.length) { out.push('<ul>' + liste.map(x => `<li>${inline(x)}</li>`).join('') + '</ul>'); liste = []; } };
  for (const l of lines.map(x => x.trim())) {
    if (!l) { flush(); continue; }
    if (/^# /.test(l) && !titre) { titre = l.slice(2).trim(); continue; }
    if (/^> /.test(l) && !resume) { resume = l.slice(2).trim(); continue; }
    if (l.startsWith('<')) { flush(); out.push(l); continue; }
    if (/^#{2,4} /.test(l)) { flush(); out.push(`<h3>${inline(l.replace(/^#+ /, ''))}</h3>`); continue; }
    if (/^[*-] /.test(l)) { liste.push(l.slice(2)); continue; }
    flush(); out.push(`<p>${inline(l)}</p>`);
  }
  flush();
  return { titre, resume, contenu: '\n' + out.join('\n') };
}
const count = (h, re) => (h.match(re) || []).length;
const F = path.join(ROOT, 'data/articles.js'), s = fs.readFileSync(F, 'utf8');
const pre = s.slice(0, s.indexOf('const ARTICLES')), A = eval(s.slice(s.indexOf('['), s.lastIndexOf(']') + 1));
let ok = 0, erreurs = 0;
for (const f of fs.readdirSync(DIR).filter(x => /\.(en|zh)\.md$/.test(x))) {
  const [, id, lang] = f.match(/^(.+)\.(en|zh)\.md$/);
  const a = A.find(x => x.id === id); if (!a) { console.log('✗ article inconnu :', id); erreurs++; continue; }
  const t = convert(fs.readFileSync(path.join(DIR, f), 'utf8'));
  const diff = [['liens', /<a /g], ['intertitres', /<h3>/g], ['images', /<img /g], ['puces', /<li>/g]]
    .filter(([, re]) => count(a.contenu, re) !== count(t.contenu, re)).map(([n, re]) => `${n} ${count(t.contenu, re)}/${count(a.contenu, re)}`);
  if (!t.titre || !t.resume || diff.length) { console.log('✗', f, !t.titre ? 'titre manquant' : '', !t.resume ? 'résumé manquant' : '', diff.join(', ')); erreurs++; continue; }
  a.tr = a.tr || {}; a.tr[lang] = t; ok++;
  console.log('✓', f);
}
if (erreurs) { console.log(erreurs, 'erreur(s) : rien n’a été enregistré.'); process.exit(1); }
fs.writeFileSync(F, pre + 'const ARTICLES = ' + JSON.stringify(A, null, 2) + ';\n');
console.log(ok, 'traductions enregistrées.');
