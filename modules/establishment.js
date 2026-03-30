// ================================================================
// modules/establishment.js - Establishment Switching Logic
// ================================================================
// This module handles switching between establishments and initialization
// Functions: Select establishment, initialize establishments, handle data loading
// ================================================================

// ================================================================
// Handle establishment selection change (FIXES RACE CONDITION)
// ================================================================
function selectEtab(etabName) {
  // Prevent race condition by checking if establishment exists
  if (!etabName || !STATE.etabs[etabName]) {
    initializeEtab(etabName);
  }
  
  // Set current establishment and save immediately
  setCurrentEtab(etabName);
  
  // Update all UI elements AFTER state is saved
  updateAllUI();
  
  showNotification(`Établissement changé en: ${etabName}`, 'info');
}

// ================================================================
// Initialize dropdown event listener
// ================================================================
function initializeEtabSelector() {
  const select = document.getElementById('etab_courant');
  if (!select) return;
  
  select.addEventListener('change', (e) => {
    selectEtab(e.target.value);
  });
}

// ================================================================
// Register new establishment
// ================================================================
function registerNewEstablishment(etabName) {
  if (!etabName || etabName.trim().length === 0) {
    showNotification('Nom d\'établissement invalide', 'error');
    return;
  }
  
  if (STATE.etabs[etabName]) {
    showNotification('Cet établissement existe déjà', 'warning');
    return;
  }
  
  initializeEtab(etabName);
  renderEtabSelect();
  selectEtab(etabName);
  showNotification(`Établissement "${etabName}" créé avec succès`, 'success');
}

// ================================================================
// Delete establishment and associated data
// ================================================================
function deleteEstablishment(etabName) {
  if (!STATE.etabs[etabName]) {
    showNotification('Cet établissement n\'existe pas', 'error');
    return;
  }
  
  if (Object.keys(STATE.etabs).length <= 1) {
    showNotification('Vous devez avoir au moins un établissement', 'error');
    return;
  }
  
  // Confirm deletion
  if (!confirm(`Êtes-vous sûr de vouloir supprimer "${etabName}" et toutes ses données?`)) {
    return;
  }
  
  delete STATE.etabs[etabName];
  
  // If deleted establishment was current, switch to another
  if (STATE.currentEtab === etabName) {
    const remainingEtabs = Object.keys(STATE.etabs);
    if (remainingEtabs.length > 0) {
      setCurrentEtab(remainingEtabs[0]);
    }
  }
  
  saveState();
  renderEtabSelect();
  updateAllUI();
  showNotification(`Établissement "${etabName}" supprimé avec succès`, 'success');
}

// ================================================================
// Load all establishments from state (called on app init)
// ================================================================
function loadAllEstablishments() {
  const state = getState();
  
  if (Object.keys(state.etabs).length === 0) {
    // Create default establishments if none exist
    initializeEtab('Pizza d\'Oléron');
    initializeEtab('Le Vésuv');
    setCurrentEtab('Pizza d\'Oléron');
  } else if (!state.currentEtab) {
    // If no current establishment, select first available
    const firstEtab = Object.keys(state.etabs)[0];
    setCurrentEtab(firstEtab);
  }
}

// ================================================================
// Get list of all establishments
// ================================================================
function getAllEstablishments() {
  return Object.keys(STATE.etabs);
}

// ================================================================
// Get current establishment name
// ================================================================
function getCurrentEtabName() {
  return STATE.currentEtab;
}

// ================================================================
// Check if establishment exists
// ================================================================
function establishmentExists(etabName) {
  return STATE.etabs.hasOwnProperty(etabName);
}
