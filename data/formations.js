/* ============================================================
   Données du site — fichier modifié par l'espace d'administration (/admin).
   Format JSON : chaque valeur est entre guillemets doubles. Ne pas ajouter de code ici.
   Affichage : formations.js
   ============================================================ */
const FORMATIONS = [
  {
    "id": "communication-institutionnelle",
    "prix": 105000,
    "prixEntreprise": 840000,
    "image": "images/photos/formation-communication-institutionnelle.jpg",
    "titre": "Communication institutionnelle : construire des messages clairs",
    "theme": "Communication",
    "icone": "building",
    "duree": "1 mois",
    "public": "Chargés de communication, responsables d'institutions et d'organisations",
    "resume": "Définir une stratégie éditoriale, rédiger des messages adaptés à chaque public et valoriser l'action de son organisation.",
    "objectifs": [
      "Identifier ses publics et adapter son message à chacun",
      "Structurer une stratégie éditoriale simple et réaliste",
      "Rédiger communiqués, publications et supports institutionnels",
      "Planifier et évaluer ses actions de communication"
    ]
  },
  {
    "id": "relations-publiques",
    "prix": 85000,
    "prixEntreprise": 630000,
    "image": "images/photos/formation-relations-publiques.jpg",
    "titre": "Relations publiques et relations presse",
    "theme": "Communication",
    "icone": "mega",
    "duree": "2 semaines",
    "public": "Dirigeants, porte-parole, équipes communication",
    "resume": "Préparer ses prises de parole, entretenir de bonnes relations avec la presse et les parties prenantes.",
    "objectifs": [
      "Cartographier ses parties prenantes",
      "Préparer un message clé et des éléments de langage",
      "Organiser un point presse ou une rencontre publique",
      "Gérer les questions sensibles avec sérénité"
    ]
  },
  {
    "id": "prise-de-parole",
    "prix": 70000,
    "prixEntreprise": 560000,
    "image": "images/photos/formation-prise-de-parole.jpg",
    "titre": "Prise de parole en public : convaincre avec aisance",
    "theme": "Communication",
    "icone": "mic",
    "duree": "2 semaines",
    "public": "Dirigeants, cadres, porte-parole, entrepreneurs, étudiants",
    "resume": "Gérer son trac, structurer son discours et captiver son auditoire, en réunion, en conférence ou face à une caméra.",
    "objectifs": [
      "Maîtriser son trac et gagner en assurance",
      "Structurer un message clair et mémorable",
      "Travailler sa voix, sa posture et son regard",
      "S'exprimer face à une caméra et répondre aux questions"
    ]
  },
  {
    "id": "ia-productivite",
    "prix": 105000,
    "prixEntreprise": 840000,
    "image": "images/photos/formation-ia-productivite.jpg",
    "titre": "L'intelligence artificielle au service de la communication",
    "theme": "Intelligence artificielle",
    "icone": "spark",
    "duree": "1 mois",
    "public": "Professionnels de la communication, administrations, entrepreneurs",
    "resume": "Découvrir et utiliser concrètement les outils d'IA pour rédiger, créer, analyser et gagner du temps — en toute responsabilité.",
    "objectifs": [
      "Comprendre ce que l'IA sait faire (et ne sait pas faire)",
      "Écrire des consignes (prompts) efficaces",
      "Produire textes, visuels et synthèses avec l'IA",
      "Adopter de bonnes pratiques : vérification, confidentialité, éthique"
    ]
  },
  {
    "id": "design-graphique",
    "prix": 140000,
    "prixEntreprise": 1050000,
    "image": "images/photos/formation-design-graphique.jpg",
    "titre": "Design graphique : créer des visuels professionnels",
    "theme": "Création visuelle",
    "icone": "palette",
    "duree": "2 mois",
    "public": "Chargés de communication, community managers, porteurs de projets",
    "resume": "Les bases de la composition, de la typographie et de la couleur pour concevoir des visuels efficaces pour tous les canaux.",
    "objectifs": [
      "Appliquer les règles de composition et de hiérarchie visuelle",
      "Choisir typographies et couleurs avec cohérence",
      "Concevoir affiches, flyers et visuels pour les réseaux sociaux",
      "Respecter et faire vivre une charte graphique"
    ]
  },
  {
    "id": "motion-design",
    "prix": 210000,
    "prixEntreprise": 1400000,
    "image": "images/photos/formation-motion-design.jpg",
    "titre": "Initiation au motion design",
    "theme": "Création visuelle",
    "icone": "play",
    "duree": "3 mois",
    "public": "Créatifs, communicants, monteurs débutants",
    "resume": "Animer textes, formes et logos pour rendre ses messages plus vivants et plus clairs sur les réseaux et à l'écran.",
    "objectifs": [
      "Comprendre les principes de l'animation",
      "Animer un titre, un logo et une infographie simple",
      "Construire une courte vidéo explicative",
      "Exporter pour les réseaux sociaux et la diffusion"
    ]
  },
  {
    "id": "analyse-donnees",
    "prix": 140000,
    "prixEntreprise": 1050000,
    "image": "images/photos/formation-analyse-donnees.jpg",
    "titre": "Analyser et présenter ses données",
    "theme": "Données & numérique",
    "icone": "chart",
    "duree": "6 semaines",
    "public": "Cadres, chargés d'études, équipes de suivi-évaluation",
    "resume": "Organiser, interpréter et mettre en forme des données pour faciliter la compréhension et la prise de décision.",
    "objectifs": [
      "Organiser et nettoyer un jeu de données",
      "Calculer et lire des indicateurs clés",
      "Choisir le bon graphique pour le bon message",
      "Construire un tableau de bord lisible"
    ]
  },
  {
    "id": "site-web",
    "prix": 140000,
    "prixEntreprise": 1050000,
    "image": "images/photos/formation-site-web.jpg",
    "titre": "Créer et gérer un site web professionnel",
    "theme": "Données & numérique",
    "icone": "code",
    "duree": "2 mois",
    "public": "Entrepreneurs, associations, petites structures",
    "resume": "Concevoir, mettre en ligne et faire vivre un site vitrine simple, rapide et adapté au mobile.",
    "objectifs": [
      "Définir l'objectif et l'architecture du site",
      "Rédiger des contenus clairs pour le web",
      "Mettre en ligne un site et le relier à un nom de domaine",
      "Mettre à jour et mesurer la fréquentation"
    ]
  }
];

const PROGRAMMES = {
  "communication-institutionnelle": {
    "modules": [
      {
        "periode": "Semaine 1",
        "titre": "Comprendre la communication institutionnelle",
        "points": [
          "Rôle et enjeux de la communication d'une organisation",
          "Identifier et cartographier ses publics",
          "Diagnostic de la communication existante"
        ]
      },
      {
        "periode": "Semaine 2",
        "titre": "Construire une stratégie éditoriale",
        "points": [
          "Définir objectifs, messages clés et ton",
          "Choisir les bons canaux",
          "Bâtir un calendrier éditorial"
        ]
      },
      {
        "periode": "Semaine 3",
        "titre": "Rédiger pour chaque public",
        "points": [
          "Communiqué de presse, discours, note d’information",
          "Écrire pour le web et les réseaux sociaux",
          "Ateliers de réécriture sur des cas réels"
        ]
      },
      {
        "periode": "Semaine 4",
        "titre": "Piloter et évaluer",
        "points": [
          "Plan de communication et budget",
          "Indicateurs de suivi et évaluation",
          "Présentation du projet final"
        ]
      }
    ],
    "projet": "Un plan de communication complet pour votre organisation, avec ses premiers supports rédigés."
  },
  "prise-de-parole": {
    "modules": [
      {
        "periode": "Semaine 1",
        "titre": "Gagner en assurance",
        "points": [
          "Comprendre et apprivoiser son trac",
          "Respiration, voix et posture",
          "Exercices d’improvisation en petit groupe"
        ]
      },
      {
        "periode": "Semaine 2",
        "titre": "Convaincre son auditoire",
        "points": [
          "Structurer un discours clair et mémorable",
          "Raconter une histoire et captiver",
          "Prise de parole face caméra et réponses aux questions"
        ]
      }
    ],
    "projet": "Une intervention de 5 minutes filmée, avec retours personnalisés et pistes de progression."
  },
  "relations-publiques": {
    "modules": [
      {
        "periode": "Semaine 1",
        "titre": "Préparer ses messages",
        "points": [
          "Cartographie des parties prenantes",
          "Message clé et éléments de langage",
          "Construire un dossier et un communiqué de presse"
        ]
      },
      {
        "periode": "Semaine 2",
        "titre": "Prendre la parole",
        "points": [
          "Organiser un point presse ou une rencontre publique",
          "Entraînement à l’interview face caméra",
          "Gérer les questions difficiles et les situations sensibles"
        ]
      }
    ],
    "projet": "Un kit presse prêt à l'emploi et une simulation d'interview filmée, avec retours personnalisés."
  },
  "ia-productivite": {
    "modules": [
      {
        "periode": "Semaine 1",
        "titre": "Comprendre l'IA",
        "points": [
          "Ce que l’IA sait faire et ses limites",
          "Panorama des outils utiles en communication",
          "Premiers essais guidés"
        ]
      },
      {
        "periode": "Semaine 2",
        "titre": "Écrire de bonnes consignes",
        "points": [
          "Structure d’un prompt efficace",
          "Rédiger, résumer, reformuler, traduire",
          "Adapter un message à plusieurs publics"
        ]
      },
      {
        "periode": "Semaine 3",
        "titre": "Créer avec l’IA",
        "points": [
          "Générer et retoucher des visuels",
          "Sous-titres, voix et vidéos courtes",
          "Analyser des retours et des commentaires"
        ]
      },
      {
        "periode": "Semaine 4",
        "titre": "Utiliser l’IA de façon responsable",
        "points": [
          "Vérification des faits et des sources",
          "Confidentialité des données et éthique",
          "Intégrer l’IA dans son organisation de travail"
        ]
      }
    ],
    "projet": "Une boîte à outils personnelle : vos consignes types et un mini-guide d'usage de l'IA pour votre structure."
  },
  "design-graphique": {
    "modules": [
      {
        "periode": "Semaines 1–2",
        "titre": "Les fondamentaux",
        "points": [
          "Composition, grille et hiérarchie visuelle",
          "Lire et analyser un visuel",
          "Prise en main des outils de création"
        ]
      },
      {
        "periode": "Semaines 3–4",
        "titre": "Typographie et couleur",
        "points": [
          "Choisir et associer les typographies",
          "Construire une palette de couleurs",
          "Lisibilité et accessibilité"
        ]
      },
      {
        "periode": "Semaines 5–6",
        "titre": "Créer des supports",
        "points": [
          "Affiches et flyers",
          "Visuels pour les réseaux sociaux",
          "Présentations et documents"
        ]
      },
      {
        "periode": "Semaines 7–8",
        "titre": "Identité et charte graphique",
        "points": [
          "Logo et déclinaisons",
          "Rédiger une charte simple",
          "Préparer les fichiers pour l’impression et le web"
        ]
      }
    ],
    "projet": "Une mini-identité visuelle et une série de supports (affiche, visuels réseaux, présentation)."
  },
  "motion-design": {
    "modules": [
      {
        "periode": "Semaines 1–2",
        "titre": "Les principes de l'animation",
        "points": [
          "Timing, rythme et courbes d’accélération",
          "Prise en main du logiciel d’animation",
          "Animer des formes simples"
        ]
      },
      {
        "periode": "Semaines 3–4",
        "titre": "Animer du texte",
        "points": [
          "Titres et sous-titres animés",
          "Typographie en mouvement",
          "Transitions entre plans"
        ]
      },
      {
        "periode": "Semaines 5–6",
        "titre": "Logos et éléments graphiques",
        "points": [
          "Préparer ses fichiers graphiques",
          "Animer un logo",
          "Habillage d’une vidéo (bandeaux, cartons)"
        ]
      },
      {
        "periode": "Semaines 7–8",
        "titre": "Infographies animées",
        "points": [
          "Animer des chiffres et des graphiques",
          "Expliquer un processus en images",
          "Icônes et pictogrammes animés"
        ]
      },
      {
        "periode": "Semaines 9–10",
        "titre": "Raconter une histoire",
        "points": [
          "Écrire un script court",
          "Réaliser un storyboard",
          "Son, musique et voix off"
        ]
      },
      {
        "periode": "Semaines 11–12",
        "titre": "Projet final et diffusion",
        "points": [
          "Réalisation d’une vidéo explicative",
          "Formats et export pour chaque réseau",
          "Présentation et retours"
        ]
      }
    ],
    "projet": "Une vidéo explicative animée de 30 à 60 secondes, prête à être diffusée."
  },
  "analyse-donnees": {
    "modules": [
      {
        "periode": "Semaine 1",
        "titre": "Les bases",
        "points": [
          "Types de données et sources",
          "Prise en main du tableur",
          "Bonnes pratiques de saisie"
        ]
      },
      {
        "periode": "Semaine 2",
        "titre": "Organiser et nettoyer",
        "points": [
          "Repérer et corriger les erreurs",
          "Trier, filtrer, structurer",
          "Fusionner plusieurs fichiers"
        ]
      },
      {
        "periode": "Semaine 3",
        "titre": "Calculer et analyser",
        "points": [
          "Formules essentielles",
          "Tableaux croisés dynamiques",
          "Indicateurs clés"
        ]
      },
      {
        "periode": "Semaine 4",
        "titre": "Visualiser",
        "points": [
          "Choisir le bon graphique",
          "Rendre un graphique lisible",
          "Éviter les erreurs d’interprétation"
        ]
      },
      {
        "periode": "Semaine 5",
        "titre": "Tableau de bord",
        "points": [
          "Concevoir un tableau de bord",
          "Mises à jour simplifiées",
          "Partager ses résultats"
        ]
      },
      {
        "periode": "Semaine 6",
        "titre": "Présenter et décider",
        "points": [
          "Raconter avec des données",
          "Préparer une note de synthèse",
          "Présentation du projet final"
        ]
      }
    ],
    "projet": "Un tableau de bord construit sur vos propres données, avec une note de synthèse."
  },
  "site-web": {
    "modules": [
      {
        "periode": "Semaines 1–2",
        "titre": "Préparer son site",
        "points": [
          "Objectifs et public visé",
          "Arborescence des pages",
          "Nom de domaine et hébergement"
        ]
      },
      {
        "periode": "Semaines 3–4",
        "titre": "Écrire et illustrer",
        "points": [
          "Rédiger pour le web",
          "Images légères et de qualité",
          "Bases du référencement (SEO)"
        ]
      },
      {
        "periode": "Semaines 5–6",
        "titre": "Construire le site",
        "points": [
          "Structure des pages",
          "Design adapté au mobile",
          "Formulaires et liens utiles"
        ]
      },
      {
        "periode": "Semaines 7–8",
        "titre": "Mettre en ligne et faire vivre",
        "points": [
          "Mise en ligne et nom de domaine",
          "Mises à jour et sécurité",
          "Mesurer la fréquentation"
        ]
      }
    ],
    "projet": "Votre site vitrine en ligne, relié à votre nom de domaine."
  }
};

