// ================================================================
// modules/suppliers.js - Supplier Management
// ================================================================
// This module handles supplier-related operations
// Functions: Register supplier, update supplier info, manage supplier commands
// ================================================================

// ================================================================
// Register a new supplier for current establishment
// ================================================================
function registerSupplier(supplierName, orderDayOfWeek = null, contactInfo = '') {
  const etabState = getCurrentEtabState();
  if (!etabState) {
    showNotification('Aucun établissement sélectionné', 'error');
    return;
  }
  
  if (!supplierName || supplierName.trim().length === 0) {
    showNotification('Nom de fournisseur invalide', 'error');
    return;
  }
  
  if (etabState.fournisseurs[supplierName]) {
    showNotification('Ce fournisseur existe déjà', 'warning');
    return;
  }
  
  etabState.fournisseurs[supplierName] = {
    name: supplierName.trim(),
    orderDayOfWeek: orderDayOfWeek,
    contactInfo: contactInfo.trim(),
    registeredAt: new Date().toISOString(),
  };
  
  saveState();
  showNotification(`Fournisseur "${supplierName}" ajouté avec succès`, 'success');
}

// ================================================================
// Get all suppliers for current establishment
// ================================================================
function getAllSuppliersForEtab() {
  const etabState = getCurrentEtabState();
  return etabState && etabState.fournisseurs ? Object.keys(etabState.fournisseurs) : [];
}

// ================================================================
// Get supplier info
// ================================================================
function getSupplierInfo(supplierName) {
  const etabState = getCurrentEtabState();
  if (!etabState || !etabState.fournisseurs[supplierName]) return null;
  return etabState.fournisseurs[supplierName];
}

// ================================================================
// Update supplier contact info
// ================================================================
function updateSupplierContactInfo(supplierName, newContactInfo) {
  const etabState = getCurrentEtabState();
  if (!etabState || !etabState.fournisseurs[supplierName]) return;
  
  etabState.fournisseurs[supplierName].contactInfo = newContactInfo.trim();
  saveState();
  showNotification(`Information de contact mise à jour pour ${supplierName}`, 'success');
}

// ================================================================
// Update supplier order day
// ================================================================
function updateSupplierOrderDay(supplierName, dayOfWeek) {
  const etabState = getCurrentEtabState();
  if (!etabState || !etabState.fournisseurs[supplierName]) return;
  
  etabState.fournisseurs[supplierName].orderDayOfWeek = dayOfWeek;
  saveState();
  const dayName = dayOfWeek ? getDayName(dayOfWeek) : 'Non défini';
  showNotification(`Jour de commande pour ${supplierName} mis à jour: ${dayName}`, 'success');
}

// ================================================================
// Get product count for specific supplier
// ================================================================
function getProductCountForSupplier(supplierName) {
  const etabState = getCurrentEtabState();
  if (!etabState || !etabState.products) return 0;
  
  return etabState.products.filter(p => p.fournisseur === supplierName).length;
}

// ================================================================
// Helper: Convert day number to day name
// ================================================================
function getDayName(dayOfWeek) {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[dayOfWeek] || 'Jour invalide';
}

// ================================================================
// Remove supplier (with confirmation)
// ================================================================
function removeSupplier(supplierName) {
  const etabState = getCurrentEtabState();
  if (!etabState || !etabState.fournisseurs[supplierName]) {
    showNotification('Fournisseur non trouvé', 'error');
    return;
  }
  
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur "${supplierName}"?`)) {
    return;
  }
  
  delete etabState.fournisseurs[supplierName];
  saveState();
  renderSuppliersList();
  showNotification(`Fournisseur "${supplierName}" supprimé avec succès`, 'success');
}
