# Commandes Fournisseurs 🧾

Application mobile-friendly pour passer les commandes hebdomadaires auprès des fournisseurs, depuis un catalogue Google Sheets.

## Fonctionnalités

- Chargement automatique des produits depuis Google Sheets
- Navigation par fournisseur (onglets)
- Recherche par nom court, désignation, référence ou catégorie
- Saisie des quantités avec stepper +/−
- Calcul du total HT en temps réel
- Récapitulatif de commande par fournisseur, copiable en texte

## Structure des fichiers

```
├── index.html   # Interface principale
├── style.css    # Styles mobile-first
├── app.js       # Logique de l'application
├── config.js    # 👈 URLs Google Sheets + paramètres à modifier
└── README.md
```

## Configuration

Ouvrez `config.js` et renseignez vos URLs Google Sheets :

```js
const CONFIG = {
  SHEETS: {
    produits:     'https://docs.google.com/spreadsheets/d/e/VOTRE_ID/pub?gid=0&single=true&output=tsv',
    fournisseurs: 'https://docs.google.com/spreadsheets/d/e/VOTRE_ID/pub?gid=XXXX&single=true&output=tsv',
  },
  // ...
};
```

## Structure du Google Sheet

### Feuille `produits` (colonnes exactes)

| Fournisseur | Référence | Désignation Produit | TVA (%) | P.U. HT | DROIT ALCOOL | TAXE SECURITE SOCIALE | Nom Court | Catégorie | colissage | prix_colis | actif |
|---|---|---|---|---|---|---|---|---|---|---|---|

- `actif` : `TRUE` pour afficher le produit, `FALSE` pour le masquer

### Feuille `fournisseurs` (optionnelle)

| nom | telephone | contact | jour_appel | notes |
|---|---|---|---|---|

## Publication Google Sheets

1. `Fichier` → `Partager` → `Publier sur le web`
2. Sélectionner la feuille `produits`, format **TSV**
3. Cliquer `Publier` → copier l'URL
4. Coller dans `config.js`

## Déploiement GitHub Pages

1. Créer un repo GitHub (ex: `commandes-fournisseurs`)
2. Pusher ces fichiers
3. `Settings` → `Pages` → Source : **main / (root)**
4. L'app est disponible sur `https://VOTRE-LOGIN.github.io/commandes-fournisseurs/`

## Mise à jour des produits

Modifiez simplement le Google Sheet → les prix et produits sont rechargés à chaque ouverture de l'app (ou via le bouton ↻).
