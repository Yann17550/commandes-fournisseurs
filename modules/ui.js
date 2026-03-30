// ================================================================
// modules/ui.js - UI Rendering and DOM Manipulation
// ================================================================
// This module handles all DOM updates and UI rendering
// Functions: Update UI elements, render product lists, update displays
// ================================================================

// ================================================================
// Render establishment dropdown
// ================================================================
function renderEtabSelect() {
  const select = document.getElementById('etab_courant');
  if (!select) return;
  
  const state = getState();
  select.innerHTML = '';
  
  Object.keys(state.etabs).forEach(etabName => {
    const option = document.createElement('option');
    option.value = etabName;
    option.textContent = etabName;
    if (etabName === state.currentEtab) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

// ================================================================
// Render products table for current establishment
// ================================================================
function renderProductsTable() {
  const etabState = getCurrentEtabState();
  if (!etabState) return;
  
  const tbody = document.querySelector('#products_table tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (!etabState.products || etabState.products.length === 0) {
    const row = tbody.insertRow();
    row.innerHTML = '<td colspan="5" class="text-center">Aucun produit enregistré</td>';
    return;
  }
  
  etabState.products.forEach((product, index) => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${product.name || ''}</td>
      <td>${product.fournisseur || ''}</td>
      <td><input type="number" value="${product.quantity || 0}" data-index="${index}" class="qty-input"></td>
      <td>${product.notes || ''}</td>
      <td><button class="btn-remove" data-index="${index}">Supprimer</button></td>
    `;
  });
  
  // Attach event listeners for quantity changes
  document.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.index);
      const newQty = parseFloat(e.target.value) || 0;
      if (etabState.products[index]) {
        etabState.products[index].quantity = newQty;
        saveState();
      }
    });
  });
  
  // Attach event listeners for remove buttons
  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      if (etabState.products[index]) {
        etabState.products.splice(index, 1);
        saveState();
        renderProductsTable();
      }
    });
  });
}

// ================================================================
// Render suppliers list
// ================================================================
function renderSuppliersList() {
  const etabState = getCurrentEtabState();
  if (!etabState) return;
  
  const container = document.getElementById('suppliers_list');
  if (!container) return;
  
  container.innerHTML = '';
  
  const suppliers = Object.keys(etabState.fournisseurs || {});
  
  if (suppliers.length === 0) {
    container.innerHTML = '<p>Aucun fournisseur</p>';
    return;
  }
  
  suppliers.forEach(supplierName => {
    const div = document.createElement('div');
    div.className = 'supplier-item';
    div.innerHTML = `
      <h4>${supplierName}</h4>
      <button class="btn-reset-supplier" data-supplier="${supplierName}">Réinitialiser</button>
    `;
    container.appendChild(div);
  });
  
  // Attach event listeners for supplier reset buttons
  document.querySelectorAll('.btn-reset-supplier').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const supplierName = e.target.dataset.supplier;
      const etab = getState().currentEtab;
      clearCommandsForSupplier(etab, supplierName);
      renderSuppliersList();
      renderProductsTable();
    });
  });
}

// ================================================================
// Update header with current establishment
// ================================================================
function updateEtabHeader() {
  const state = getState();
  const header = document.getElementById('etab_header');
  if (header) {
    header.textContent = state.currentEtab || 'Non sélectionné';
  }
}

// ================================================================
// Update all UI elements (master refresh function)
// ================================================================
function updateAllUI() {
  renderEtabSelect();
  renderProductsTable();
  renderSuppliersList();
  updateEtabHeader();
}

// ================================================================
// Show notification message
// ================================================================
function showNotification(message, type = 'info') {
  const notificationArea = document.getElementById('notifications');
  if (!notificationArea) return;
  
  const div = document.createElement('div');
  div.className = `notification notification-${type}`;
  div.textContent = message;
  notificationArea.appendChild(div);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    div.remove();
  }, 3000);
}

// ================================================================
// Clear all UI notifications
// ================================================================
function clearNotifications() {
  const notificationArea = document.getElementById('notifications');
  if (notificationArea) {
    notificationArea.innerHTML = '';
  }
}
