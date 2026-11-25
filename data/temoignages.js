/* ============================================================
   Données du site — fichier modifié par l'espace d'administration (/admin).
   Format JSON : chaque valeur est entre guillemets doubles. Ne pas ajouter de code ici.
   Témoignages RÉELS de clients et de participants aux formations (jamais inventés).
   type : "projet" ou "formation" — lien : id du projet ou de la formation concernée (facultatif)
   Affichage : temoignages.js
   ============================================================ */
const TEMOIGNAGES = [
  {
    "id": "severin",
    "nom": "Severin",
    "texte": "La formation en design graphique m’a appris à mieux utiliser les couleurs, les typographies et la mise en page pour créer des visuels clairs et cohérents. J’ai aussi appris à préparer un visuel pour différents formats, comme une publication pour les réseaux sociaux ou une affiche.",
    "type": "formation",
    "date": "2026-11-25",
    "lien": "design-graphique"
  },
  {
    "id": "bonel",
    "nom": "Bonel",
    "texte": "J’ai appris à organiser les éléments d’un visuel, à choisir des polices lisibles et à harmoniser les couleurs. Les exercices sur la création d’affiches et de visuels pour les réseaux sociaux m’ont aidé à mieux structurer mes idées.",
    "type": "formation",
    "date": "2026-11-25",
    "lien": "design-graphique"
  },
  {
    "id": "veronica",
    "nom": "Véronica",
    "texte": "La formation en communication digitale m’a appris à définir une cible, à choisir les bons réseaux sociaux et à construire un calendrier éditorial. J’ai aussi appris à rédiger des publications avec un message clair et un appel à l’action adapté.",
    "type": "formation",
    "date": "2026-11-25",
    "lien": "communication-institutionnelle"
  },
  {
    "id": "yann",
    "nom": "Yann",
    "texte": "J’ai appris à formuler des consignes précises pour obtenir de meilleurs résultats avec les outils d’intelligence artificielle. La formation m’a aussi montré comment utiliser l’IA pour trouver des idées, résumer un texte et préparer un premier brouillon, tout en vérifiant les informations générées.",
    "type": "formation",
    "date": "2026-11-25",
    "lien": "ia-productivite"
  },
  {
    "id": "franck",
    "nom": "Franck",
    "texte": "La formation m’a appris à nettoyer et organiser un tableau de données, puis à utiliser des formules et des graphiques pour en faire ressortir les tendances. Je comprends mieux comment transformer des chiffres en informations utiles pour prendre une décision.",
    "type": "formation",
    "date": "2026-11-25",
    "lien": "analyse-donnees"
  },
  {
    "id": "eric",
    "nom": "Eric",
    "texte": "J’ai appris à trier et filtrer des données, à calculer des indicateurs simples et à présenter les résultats dans un tableau ou un graphique. Les exercices pratiques m’ont aidé à repérer les tendances et à expliquer clairement ce qu’elles signifient.",
    "type": "formation",
    "date": "2026-11-25",
    "lien": "analyse-donnees"
  },
  {
    "id": "rudel-yimbou",
    "nom": "Rudel Yimbou",
    "type": "projet",
    "intitule": "Communication de son entreprise",
    "texte": "Jipson m’a aidé à mieux communiquer sur les activités de mon entreprise. Nous avons travaillé ensemble sur notre communication, ce qui m’a permis de présenter plus clairement nos services à nos clients.",
    "date": "2026-11-25"
  },
  {
    "id": "doctrove-bamonkia",
    "nom": "Doctrové Bamonkia",
    "structure": "Docs English",
    "type": "projet",
    "intitule": "Charte graphique de Docs English",
    "texte": "Jipson a créé la charte graphique de Docs English, en définissant une identité visuelle cohérente avec notre activité. Les couleurs, les typographies et les éléments graphiques nous permettent de présenter notre structure de façon plus reconnaissable.",
    "date": "2026-11-25"
  },
  {
    "id": "ganghas-schadrack",
    "nom": "Ganghas Schadrack",
    "type": "projet",
    "intitule": "Communication et identités visuelles",
    "texte": "Jipson m’a aidé à accompagner mes clients dans leur communication et la création de leur identité visuelle. Son travail m’a apporté un appui concret pour mieux répondre à leurs besoins.",
    "date": "2026-11-25"
  },
  {
    "id": "bercy-malonga",
    "nom": "Bercy Malonga",
    "type": "projet",
    "intitule": "Affiche d’événement 2024",
    "texte": "Jipson a conçu l’affiche de notre événement de début d’année 2024. Il a organisé les informations et travaillé les visuels pour que le programme et les détails pratiques soient faciles à repérer.",
    "date": "2026-11-25"
  },
  {
    "id": "nelson-chisugi",
    "nom": "Nelson Chisugi",
    "type": "projet",
    "lien": "nelson-cishugi",
    "texte": "Jipson a créé une identité visuelle à partir de mon nom, puis a travaillé sur l’identité de certains de mes clients. Les propositions m’ont aidé à mieux présenter mon activité et à donner à chaque client une image qui lui correspond.",
    "date": "2026-11-25"
  },
  {
    "id": "cedric-ebale",
    "nom": "Cédric",
    "structure": "Ebalé",
    "type": "projet",
    "lien": "ebale",
    "texte": "Jipson m’a accompagné dans la mise en place de la structure Ebalé, créée pour initier les enfants à la science. Son aide a contribué à rendre le projet plus clair à présenter.",
    "date": "2026-11-25"
  }
];
