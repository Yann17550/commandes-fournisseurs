// ================================================================
// modules/state.js - State and localStorage Management
// ================================================================
// This module handles all state management and data persistence
// Functions: Initialize state, get/set state, localStorage sync
// ================================================================

const STATE = {
  currentEtab: null,
  etabs: {},
  // Structure: etabs[etabName] = { products: [], fournisseurs: {}, quantities: {}, quantities_a: {} }
};

const STORAGE_KEYS = {
  LEARN_KEY: 'cmd_scores',
  ETAB_KEY: 'cmd_etab',
  STATE_KEY: 'cmd_state',
};

// ================================================================
// Initialize state from localStorage
// ================================================================
function initState() {
  // Load saved state from localStorage
  const savedState = localStorage.getItem(STORAGE_KEYS.STATE_KEY);
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      STATE.etabs = parsed.etabs || {};
      STATE.currentEtab = parsed.currentEtab || null;
    } catch (e) {
      console.error('Error loading state:', e);
      STATE.etabs = {};
    }
  }
  
  // Load last selected establishment
  const savedEtab = localStorage.getItem(STORAGE_KEYS.ETAB_KEY);
  if (savedEtab) {
    STATE.currentEtab = savedEtab;
  }
}

// ================================================================
// Get current state
// ================================================================
function getState() {
  return STATE;
}

// ================================================================
// Get current establishment state
// ================================================================
function getCurrentEtabState() {
  if (!STATE.currentEtab || !STATE.etabs[STATE.currentEtab]) {
    return null;
  }
  return STATE.etabs[STATE.currentEtab];
}

// ================================================================
// Initialize establishment state (called when switching to new etab)
// ================================================================
function initializeEtab(etabName) {
  if (!STATE.etabs[etabName]) {
    STATE.etabs[etabName] = {
      products: [],
      fournisseurs: {},
      quantities: {},     // for commands of current type (A or B)
      quantities_a: {},   // for type A commands (if applicable)
    };
  }
  STATE.currentEtab = etabName;
  saveState();
  return STATE.etabs[etabName];
}

// ================================================================
// Set current establishment
// ================================================================
function setCurrentEtab(etabName) {
  if (!STATE.etabs[etabName]) {
    initializeEtab(etabName);
  }
  STATE.currentEtab = etabName;
  localStorage.setItem(STORAGE_KEYS.ETAB_KEY, etabName);
  saveState();
  return STATE.etabs[etabName];
}

// ================================================================
// Save all state to localStorage
// ================================================================
function saveState() {
  try {
    const stateToSave = {
      etabs: STATE.etabs,
      currentEtab: STATE.currentEtab,
    };
    localStorage.setItem(STORAGE_KEYS.STATE_KEY, JSON.stringify(stateToSave));
  } catch (e) {
    console.error('Error saving state:', e);
  }
}

// ================================================================
// Get commands for current establishment
// ================================================================
function getCommandsForEtab(etabName) {
  return STATE.etabs[etabName] || {};
}

// ================================================================
// Clear commands for specific establishment and supplier (optional)
// ================================================================
function clearCommandsForSupplier(etabName, supplierName) {
  if (!STATE.etabs[etabName]) return;
  
  const etabState = STATE.etabs[etabName];
  
  // Clear products that belong to this supplier
  if (etabState.products) {
    etabState.products = etabState.products.filter(p => p.fournisseur !== supplierName);
  }
  
  // Clear quantities for this supplier
  if (etabState.quantities) {
    Object.keys(etabState.quantities).forEach(key => {
      const q = etabState.quantities[key];
      if (q && q.fournisseur === supplierName) {
        delete etabState.quantities[key];
      }
    });
  }
  
  // Clear quantities_a for this supplier
  if (etabState.quantities_a) {
    Object.keys(etabState.quantities_a).forEach(key => {
      const q = etabState.quantities_a[key];
      if (q && q.fournisseur === supplierName) {
        delete etabState.quantities_a[key];
      }
    });
  }
  
  saveState();
}

// ================================================================
// Clear all commands for specific establishment
// ================================================================
function clearAllCommandsForEtab(etabName) {
  if (STATE.etabs[etabName]) {
    STATE.etabs[etabName] = {
      products: [],
      fournisseurs: {},
      quantities: {},
      quantities_a: {},
    };
    saveState();
  }
}

// ================================================================
// Get learning scores (command frequency)
// ================================================================
function getLearningScores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LEARN_KEY)) || {};
  } catch (e) {
    return {};
  }
}

// ================================================================
// Save learning scores
// ================================================================
function saveLearningScores(scores) {
  try {
    localStorage.setItem(STORAGE_KEYS.LEARN_KEY, JSON.stringify(scores));
  } catch (e) {
    console.error('Error saving learning scores:', e);
  }
}
