# WhatsAppShop — démo boutique en ligne

Prototype d'une boutique en ligne avec panier et commande finale envoyée
sur WhatsApp. Mode client (parcourir, ajouter au panier, commander) et
mode commerçant (ajouter/modifier/supprimer des produits).

## Structure

```
whatsappshop-demo/
├── index.html   → structure de la page
├── style.css    → apparence (couleurs, polices, mise en page)
├── script.js    → logique (panier, produits, message WhatsApp)
└── README.md    → ce fichier
```

## Avant de publier

Dans `script.js`, ligne 1, remplace le numéro de démonstration par le
vrai numéro WhatsApp du commerçant (format international, sans le +) :

```js
const WHATSAPP_NUMBER = "2290144755155";  #voici le vrai num #
```

## Important à savoir

Les produits ajoutés/modifiés en mode commerçant sont sauvegardés dans
le navigateur de chaque visiteur (`localStorage`), pas sur un serveur
partagé. Deux personnes qui ouvrent le même lien voient chacune leur
propre version. Pour une vraie boutique où tout le monde voit les
mêmes produits, il faut un backend avec une base de données (voir la
feuille de route qu'on a préparée).

## Héberger ce site (gratuit, en quelques minutes)

**Option A — Netlify (le plus simple)**
1. Va sur https://app.netlify.com/drop
2. Fais glisser le dossier `whatsappshop-demo` entier dans la fenêtre
3. Netlify te donne immédiatement un lien public (ex: `boutique-marie.netlify.app`)
4. Tu peux ensuite relier un vrai nom de domaine dans les réglages du site

**Option B — GitHub Pages**
1. Crée un dépôt GitHub et mets-y ces 3 fichiers (`index.html`, `style.css`, `script.js`)
2. Dans les réglages du dépôt → Pages → active GitHub Pages sur la branche `main`
3. Ton site est disponible sur `https://tonpseudo.github.io/nom-du-depot`

Les deux options sont gratuites et ne nécessitent pas de savoir
programmer côté serveur.
