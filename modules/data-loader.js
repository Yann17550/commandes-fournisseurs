// data-loader.js - Chargement des données depuis Google Sheets

/**
 * Charge et parse les données TSV depuis une URL
 * @param {string} url - L'URL du fichier TSV
 * @returns {Promise<Array>} Les données parsées
 */
async function loadTSVData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const text = await response.text();
        return parseTSV(text);
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        throw error;
    }
}

/**
 * Parse un texte TSV en tableau d'objets
 * @param {string} tsvText - Le texte TSV
 * @returns {Array} Tableau d'objets avec les données
 */
function parseTSV(tsvText) {
    const lines = tsvText.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split('\t');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        
        data.push(row);
    }
    
    return data;
}

/**
 * Charge les produits depuis Google Sheets
 * @returns {Promise<Array>} Les produits chargés
 */
export async function loadProducts() {
    const url = CONFIG.PRODUCTS_TSV_URL;
    console.log('Chargement des produits depuis:', url);
    
    const data = await loadTSVData(url);
    console.log(`${data.length} produits chargés`);
    
    return data;
}

/**
 * Charge les fournisseurs depuis Google Sheets
 * @returns {Promise<Array>} Les fournisseurs chargés
 */
export async function loadSuppliers() {
    const url = CONFIG.SUPPLIERS_TSV_URL;
    console.log('Chargement des fournisseurs depuis:', url);
    
    const data = await loadTSVData(url);
    console.log(`${data.length} fournisseurs chargés`);
    
    return data;
}

/**
 * Initialise les données de l'application
 * Charge les produits et fournisseurs et retourne les données
 * @returns {Promise<Object>} Les données chargées {products, suppliers}
 */
export async function initializeData() {
    try {
        console.log('Initialisation des données...');
        
        // Charger les produits et fournisseurs en parallèle
        const [products, suppliers] = await Promise.all([
            loadProducts(),
            loadSuppliers()
        ]);
        
        console.log('Données initialisées avec succès');
        return { products, suppliers };
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des données:', error);
        throw error;
    }
}

/**
 * Recharge les données
 * @returns {Promise<Object>} Les données rechargées
 */
export async function reloadEstablishmentData() {
    console.log('Rechargement des données...');
    return await initializeData();
}
