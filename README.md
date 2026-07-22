# Portfolio — Jipson Mathas

Site portfolio d'une seule page (one-page), inspiré du press-book.
Trois fichiers, aucune installation requise.

```
index.html   → le contenu de la page
styles.css   → l'apparence (couleurs, typographies, mise en page)
script.js    → les petites interactions (menu mobile, apparitions)
```

## 👀 Voir le site

Double-cliquez sur **`index.html`** : il s'ouvre dans votre navigateur.

## ✏️ Personnaliser

### 1. Ajouter votre photo
Dans `index.html`, cherchez `portrait-placeholder` (section « À propos »).
Créez un dossier `images/`, déposez-y votre photo, puis remplacez tout le bloc par :
```html
<img src="images/jipson.jpg" alt="Jipson Mathas" />
```

### 2. Ajouter les vrais logos clients
Dans la section « Réalisations », chaque carte contient un monogramme, ex. `<span class="work-mono">JC</span>`.
Remplacez-le par le logo :
```html
<img src="images/jovial.png" alt="Logo Jovial Cosmetics" />
```

### 3. Changer les couleurs / polices
Tout est centralisé en haut de `styles.css` dans le bloc `:root` (les variables `--gold`, `--paper`, `--ink`…).

### 4. Corriger un texte
Modifiez directement le texte concerné dans `index.html`.

## 🌐 Mettre en ligne gratuitement

Options simples, sans serveur :
- **Netlify Drop** — glissez le dossier sur https://app.netlify.com/drop
- **GitHub Pages** — hébergement gratuit depuis un dépôt GitHub
- **Cloudflare Pages** — https://pages.cloudflare.com

## Bon à savoir
- **Palette** : « Noir & minimal » (monochrome + accent or discret). Tout se règle dans `:root` (`styles.css`).
- **Localisation** : *Brazzaville, Congo* (confirmée), affichée dans le contact et le pied de page.
- **LinkedIn** : lien vers `linkedin.com/in/jipsonmathas` dans le contact et le pied de page.
- À compléter si souhaité : portrait, vrais logos, intitulés de poste, dates, études.
