//app.js - Entry point with modular architecture
// ================================================================
// Ce fichier charge les modules et initialise l'application
// ================================================================

console.log('=== APP.JS LOADING ===');

// ================================================================
// Initialize app on DOM ready
// ================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, initializing app...');
    
    // Wait a bit for modules to load
    setTimeout(() => {
        console.log('Checking modules...');
        console.log('initState exists?', typeof initState);
        console.log('getState exists?', typeof getState);
        console.log('initializeData exists?', typeof initializeData);
        console.log('renderEtabSelect exists?', typeof renderEtabSelect);
        
        if (typeof initState !== 'function') {
            alert('ERREUR: Les modules ne sont pas chargés correctement!');
            return;
        }
        
        try {
            // Step 1: Initialize state
            console.log('Step 1: Init state');
            initState();
            
            // Step 2: Load data from TSV files (establishments, suppliers, sheets)
            initializeData();
            
            const state = getState();
            console.log('State after load:', state);
            
            // Step 3: Generate establishment cards on selection screen
            console.log('Step 3: Generate establishment cards');
            const etabCards = document.getElementById('etabCards');
            
            if (!etabCards) {
                console.error('ERROR: etabCards element not found!');
                return;
            }
            
            // Clear existing cards
            etabCards.innerHTML = '';
            
            // Get list of establishments
            const establishments = Object.keys(state.etabs);
            console.log('Establishments to display:', establishments);
            
            if (establishments.length === 0) {
                etabCards.innerHTML = '<p class="etab-sub">Aucun établissement configuré</p>';
                return;
            }
            
            // Create a card for each establishment
            establishments.forEach(etabName => {
                const card = document.createElement('div');
                card.className = 'etab-card';
                card.textContent = etabName;
                card.dataset.etab = etabName;
                
                // Add click handler
                card.addEventListener('click', function() {
                    console.log('Card clicked for:', etabName);
                    
                    // Set current establishment
                    if (typeof setCurrentEtab === 'function') {
                        setCurrentEtab(etabName);
                    } else {
                        console.error('setCurrentEtab function not found!');
                        return;
                    }
                    
                    // Navigate to app screen
                    const screenEtab = document.getElementById('screenEtab');
                    const screenApp = document.getElementById('screenApp');
                    
                    if (screenEtab && screenApp) {
                        screenEtab.style.display = 'none';
                        screenApp.style.display = 'block';
                        console.log('Navigated to app screen for:', etabName);
                    } else {
                        console.error('Screen elements not found!', {screenEtab, screenApp});
                    }
                    
                    // Load data for establishment
                    if (typeof initializeData === 'function') {
                        initializeData().then(() => {
                            console.log('Data loaded successfully');
                            // Update UI
                            if (typeof updateAllUI === 'function') {
                                updateAllUI();
                            }
                        }).catch(error => {
                            console.error('Error loading data:', error);
                            alert('Erreur lors du chargement des données');
                        });
                    } else {
                        // Fallback if initializeData not available
                        if (typeof updateAllUI === 'function') {
                            updateAllUI();
                        }
                    }
                    
                    // Update UI
                    if (typeof updateAllUI === 'function') {
                        updateAllUI();
                    }
                });
                
                etabCards.appendChild(card);
            });
            
            console.log('=== APP INITIALIZED SUCCESSFULLY ===');
            console.log('User can now select an establishment');
            
        } catch(e) {
            console.error('INIT ERROR:', e);
            alert('ERREUR: ' + e.message);
        }
        
    }, 500);
});
