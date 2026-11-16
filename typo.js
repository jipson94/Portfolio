/* Typographie française : empêche les coupures de ligne maladroites.
   - espace insécable avant  : ; ? ! »  et après  «
   - pas de coupure entre un nombre et son unité (2 mois, 30 secondes, 7 domaines…)
   - les petits mots (à, de, la, le, un, et, en…) restent collés au mot suivant
   À charger en DERNIER sur chaque page (après les scripts qui génèrent du contenu). */
(function () {
  const lang = document.documentElement.lang || 'fr';
  if (lang.slice(0, 2) !== 'fr') { window.typoFix = function () {}; return; }   // pas de typographie française en anglais / chinois
  const NB = ' ';   // espace insécable
  const NNB = ' ';  // espace fine insécable (avant ; ? !)
  const PETITS = 'à|a|de|du|des|la|le|les|l’|un|une|et|en|au|aux|ou|par|pour|sur|son|sa|ses|ce|ces|se|sans|avec|dans|chez|vos|nos|mon|ma|mes|ton|ta|tes|votre|notre|leur|qui|que|ne|pas|il|je|tu|on|y|—|–';
  const rePetits = new RegExp('(^|[\\s(«' + NB + '])(' + PETITS + ') (?=\\S)', 'gi');

  function fix(t) {
    return t
      .replace(/ ([;?!])/g, NNB + '$1')
      .replace(/ :/g, NB + ':')
      .replace(/« /g, '«' + NB).replace(/ »/g, NB + '»')
      .replace(/(\d) (?=[A-Za-zÀ-ÿ%°€$])/g, '$1' + NB)       // 2 mois, 30 secondes, 4 K
      .replace(rePetits, (m, a, b) => a + b + NB)            // à côté, de la, et les…
      .replace(rePetits, (m, a, b) => a + b + NB);           // 2e passe pour les suites (« de la »)
  }

  function run(root) {
    const skip = el => el.closest('script,style,code,pre,textarea,svg,.hero-name,.track');
    const w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.nodeValue.trim() && !skip(n.parentElement)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(n => { const v = fix(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; });
  }

  window.typoFix = run;   // utilisable après un ajout de contenu : typoFix(element)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => run()); else run();
})();
