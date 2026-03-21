// ============================================================
//  CONFIG — à modifier selon vos besoins
// ============================================================
const CONFIG = {
  // URLs Google Sheets publiées en TSV
  SHEETS: {
    produits:     'https://docs.google.com/spreadsheets/d/e/2PACX-1vS5BG2CIzft1vqqSf01koQxj9rvGsyfckUmV-BH9HE5lAwprxS8V_uPQyKdG7DJYEiazvNs5NQRmNZa/pub?gid=0&single=true&output=tsv',
    fournisseurs: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS5BG2CIzft1vqqSf01koQxj9rvGsyfckUmV-BH9HE5lAwprxS8V_uPQyKdG7DJYEiazvNs5NQRmNZa/pub?gid=1147908682&single=true&output=tsv',
  },

  // Nom affiché dans l'app
  APP_TITLE: 'Commandes Fournisseurs',

  // Devise
  DEVISE: '€',

  // Colonnes attendues dans la feuille produits (noms exacts en ligne 1)
  COLS: {
    fournisseur:  'Fournisseur',
    reference:    'Référence',
    designation:  'Désignation Produit',
    tva:          'TVA (%)',
    prix_ht:      'P.U. HT',
    droit_alcool: 'DROIT ALCOOL',
    taxe_secu:    'TAXE SECURITE SOCIALE',
    nom_court:    'Nom Court',
    categorie:    'Catégorie',
    colissage:    'colissage',
    prix_colis:   'prix_colis',
    actif:        'actif',
  },

  // Colonnes feuille fournisseurs
  COLS_F: {
    nom:               'nom',
    telephone:         'telephone',
    contact:           'contact',
    jour_saison:       'jour_appel saison',
    jour_hors_saison:  'jour_appel hors saison',
    notes:             'notes',
  },

  // Saison : mois où on est "en saison" (1=janvier … 12=décembre)
  MOIS_SAISON: [4, 5, 6, 7, 8, 9, 10],
};
