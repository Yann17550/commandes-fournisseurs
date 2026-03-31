// ================================================================
// app.js - Refactored Entry Point
// ================================================================
// This file orchestrates all modules and initializes the application
// Modules are loaded in order: state, ui, sheets, establishment, commands, suppliers
// ================================================================

// ================================================================
// Initialize Application on Page Load
// ================================================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('App initializing...');
  
  // 1. Initialize state from localStorage
  initState();
  console.log('State initialized');
  
  // 2. Load all establishments (or create defaults)
  loadAllEstablishments();
  console.log('Establishments loaded');
  
  // 3. Initialize establishment selector listener
  initializeEtabSelector();
  console.log('Etab selector initialized');
  
  // 4. Render all UI elements
  updateAllUI();
  console.log('UI updated');
  
  // 5. Attach event listeners for buttons
  attachEventListeners();
  console.log('Event listeners attached');
  
  console.log('✅ Application ready!');
});

// ================================================================
// Attach Event Listeners to UI Elements
// ================================================================
function attachEventListeners() {
  // NOTE: Add button event listeners here based on your HTML IDs
  // This is a placeholder for future button handlers
}
