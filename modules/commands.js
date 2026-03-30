// ================================================================
// modules/commands.js - Command Recording and Management
// ================================================================
// This module handles recording, updating, and managing commands
// Functions: Add product, record order, clear commands, update quantities
// ================================================================

// ================================================================
// Add product to current establishment's command list
// ================================================================
function addProductCommand(productName, supplierName, quantity, notes = '') {
  const etabState = getCurrentEtabState();
  if (!etabState) {
    showNotification('Aucun établissement sélectionné', 'error');
    return;
  }
  
  // Validate input
  if (!productName || productName.trim().length === 0) {
    showNotification('Nom de produit invalide', 'error');
    return;
  }
  
  if (!supplierName || supplierName.trim().length === 0) {
    showNotification('Nom de fournisseur invalide', 'error');
    return;
  }
  
  // Create product object
  const product = {
    name: productName.trim(),
    fournisseur: supplierName.trim(),
    quantity: Math.max(0, parseFloat(quantity) || 0),
    notes: notes.trim(),
    addedAt: new Date().toISOString(),
  };
  
  // Add to products array
  etabState.products.push(product);
  
  // Update learning scores (for autocomplete)
  recordCommandLearning(productName, supplierName);
  
  // Save and update UI
  saveState();
  renderProductsTable();
  showNotification(`${productName} ajouté chez ${supplierName}`, 'success');
}

// ================================================================
// Record command learning (for autocomplete suggestions)
// ================================================================
function recordCommandLearning(productName, supplierName) {
  const scores = getLearningScores();
  const key = `${productName}|${supplierName}`;
  
  scores[key] = (scores[key] || 0) + 1;
  saveLearningScores(scores);
}

// ================================================================
// Update product quantity
// ================================================================
function updateProductQuantity(productIndex, newQuantity) {
  const etabState = getCurrentEtabState();
  if (!etabState || !etabState.products[productIndex]) return;
  
  etabState.products[productIndex].quantity = Math.max(0, parseFloat(newQuantity) || 0);
  saveState();
  renderProductsTable();
}

// ================================================================
// Record order (send to Sheets)
// ================================================================
function recordOrder() {
  const etabName = getCurrentEtabName();
  const etabState = getCurrentEtabState();
  
  if (!etabName || !etabState || etabState.products.length === 0) {
    showNotification('Aucune commande à enregistrer', 'warning');
    return;
  }
  
  // Send to Sheets
  sendCommandsToSheet(etabName);
  
  // Don't clear commands - user must explicitly clear them
  // This prevents accidental data loss
}

// ================================================================
// Clear all commands for current establishment (requires confirmation)
// ================================================================
function clearAllCommands() {
  const etabName = getCurrentEtabName();
  
  if (!confirm(`Êtes-vous sûr de vouloir supprimer toutes les commandes pour ${etabName}?`)) {
    return;
  }
  
  clearAllCommandsForEtab(etabName);
  renderProductsTable();
  showNotification('Toutes les commandes ont été supprimées', 'info');
}

// ================================================================
// Get product suggestions based on learning scores
// ================================================================
function getProductSuggestions(partialSupplier) {
  const scores = getLearningScores();
  const suggestions = [];
  
  Object.keys(scores).forEach(key => {
    const [product, supplier] = key.split('|');
    if (supplier.toLowerCase().includes(partialSupplier.toLowerCase())) {
      suggestions.push({
        product,
        supplier,
        frequency: scores[key],
      });
    }
  });
  
  // Sort by frequency (most common first)
  return suggestions.sort((a, b) => b.frequency - a.frequency);
}

// ================================================================
// Get current establishment's command count
// ================================================================
function getCommandCount() {
  const etabState = getCurrentEtabState();
  return etabState && etabState.products ? etabState.products.length : 0;
}

// ================================================================
// Export commands as CSV (for download)
// ================================================================
function exportCommandsAsCSV() {
  const etabName = getCurrentEtabName();
  const etabState = getCurrentEtabState();
  
  if (!etabState || etabState.products.length === 0) {
    showNotification('Aucune commande à exporter', 'warning');
    return;
  }
  
  let csv = 'Produit,Fournisseur,Quantité,Notes\n';
  
  etabState.products.forEach(product => {
    csv += `"${product.name}","${product.fournisseur}",${product.quantity},"${product.notes}"\n`;
  });
  
  // Create download link
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
  element.setAttribute('download', `commandes-${etabName}-${new Date().toISOString().split('T')[0]}.csv`);
  element.style.display = 'none';
  
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  
  showNotification('Commandes exportées en CSV', 'success');
}
