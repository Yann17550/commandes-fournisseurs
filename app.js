//app.js - Entry point with modular architecture
// ================================================================
// Ce fichier charge les modules et initialise l'application
// ================================================================

console.log('=== APP.JS LOADING ===');

// ================================================================
// TEST: Check if modules exist
// ================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, initializing app...');
    
    // Wait a bit for modules to load
    setTimeout(() => {
        console.log('Checking modules...');
        console.log('initState exists?', typeof initState);
        console.log('getState exists?', typeof getState);
        console.log('updateAllUI exists?', typeof updateAllUI);
        console.log('loadAllEstablishments exists?', typeof loadAllEstablishments);
        console.log('initializeEtabSelector exists?', typeof initializeEtabSelector);
        
        if (typeof initState !== 'function') {
            alert('ERREUR: Les modules ne sont pas chargés correctement!');
            return;
        }
        
        try {
            // Initialize state
            console.log('Step 1: Init state');
            initState();
            console.log('State initialized:', getState());
            
            // Load establishments
            console.log('Step 2: Load establishments');
            loadAllEstablishments();
            console.log('Establishments loaded:', getState());
            
            // Initialize establishment selector
            console.log('Step 3: Init selector');
            initializeEtabSelector();
            
            // Navigate to app screen
            console.log('Step 4: Navigate to app');
            const screenTab = document.getElementById('screenTab');
            const screenApp = document.getElementById('screenApp');
            
            if (screenTab && screenApp) {
                screenTab.style.display = 'none';
                screenApp.style.display = 'block';
                console.log('Navigated to app screen');
            } else {
                console.error('Screen elements not found!', {screenTab, screenApp});
            }
            
            // Update UI
            console.log('Step 5: Update UI');
            updateAllUI();
            
            console.log('=== APP INITIALIZED SUCCESSFULLY ===');
            
        } catch(e) {
            console.error('INIT ERROR:', e);
            alert('ERREUR: ' + e.message);
        }
    }, 500);
});
