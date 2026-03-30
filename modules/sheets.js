// ================================================================
// modules/sheets.js - Google Sheets Integration
// ================================================================
// This module handles all interactions with Google Sheets
// Functions: Send data to Sheets, fetch data from Sheets, sync operations
// ================================================================

const SHEET_CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercontent',
  // Replace YOUR_SCRIPT_ID with your actual Google Apps Script deployment ID
};

// ================================================================
// Send command data to Google Sheets
// ================================================================
function sendCommandsToSheet(etabName) {
  const etabState = STATE.etabs[etabName];
  if (!etabState) return;
  
  const commandData = {
    action: 'recordCommand',
    establishment: etabName,
    commands: etabState.products || [],
    timestamp: new Date().toISOString(),
  };
  
  fetch(SHEET_CONFIG.SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(commandData),
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      showNotification(`Commandes envoyées pour ${etabName}`, 'success');
    } else {
      showNotification(`Erreur: ${result.error}`, 'error');
    }
  })
  .catch(error => {
    console.error('Error sending commands:', error);
    showNotification('Erreur de connexion', 'error');
  });
}

// ================================================================
// Fetch all commands for manager view
// ================================================================
function fetchAllCommandsForManager() {
  const payload = {
    action: 'getManagerData',
  };
  
  fetch(SHEET_CONFIG.SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  .then(response => response.json())
  .then(result => {
    if (result.success && result.data) {
      displayManagerView(result.data);
    } else {
      console.error('Failed to fetch manager data:', result.error);
    }
  })
  .catch(error => {
    console.error('Error fetching manager data:', error);
  });
}

// ================================================================
// Display manager view with commands from all establishments
// ================================================================
function displayManagerView(data) {
  const managerContainer = document.getElementById('manager_view');
  if (!managerContainer) return;
  
  managerContainer.innerHTML = '<h2>Vue Gérant</h2>';
  
  if (!data || Object.keys(data).length === 0) {
    managerContainer.innerHTML += '<p>Aucune donnée</p>';
    return;
  }
  
  Object.entries(data).forEach(([etab, commands]) => {
    const section = document.createElement('div');
    section.className = 'manager-section';
    section.innerHTML = `<h3>${etab}</h3>`;
    
    if (!commands || commands.length === 0) {
      section.innerHTML += '<p>Aucune commande</p>';
    } else {
      const table = document.createElement('table');
      table.className = 'manager-table';
      table.innerHTML = `
        <thead>
          <tr>
            <th>Produit</th>
            <th>Fournisseur</th>
            <th>Quantité</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
      `;
      
      commands.forEach(cmd => {
        table.innerHTML += `
          <tr>
            <td>${cmd.name || ''}</td>
            <td>${cmd.fournisseur || ''}</td>
            <td>${cmd.quantity || 0}</td>
            <td>${cmd.date || ''}</td>
          </tr>
        `;
      });
      
      table.innerHTML += '</tbody></table>';
      section.appendChild(table);
    }
    
    managerContainer.appendChild(section);
  });
}

// ================================================================
// Sync current state with Sheets (backup)
// ================================================================
function syncStateToSheets() {
  const state = getState();
  const payload = {
    action: 'backupState',
    state: state,
    timestamp: new Date().toISOString(),
  };
  
  fetch(SHEET_CONFIG.SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      console.log('State synced successfully');
    }
  })
  .catch(error => {
    console.error('Error syncing state:', error);
  });
}

// ================================================================
// Recover state from Sheets backup (if local storage is cleared)
// ================================================================
function recoverStateFromSheets() {
  const payload = {
    action: 'getBackupState',
  };
  
  fetch(SHEET_CONFIG.SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  .then(response => response.json())
  .then(result => {
    if (result.success && result.state) {
      STATE.etabs = result.state.etabs;
      STATE.currentEtab = result.state.currentEtab;
      saveState();
      updateAllUI();
      showNotification('Données récupérées depuis les sauvegardes', 'info');
    }
  })
  .catch(error => {
    console.error('Error recovering state:', error);
  });
}
