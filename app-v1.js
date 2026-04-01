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
        console.log('loadAllEstablishments exists?', typeof loadAllEstablishments);
        console.log('getState exists?', typeof getState);
        
        if (typeof initState !== 'function') {
            alert('ERREUR: Les modules ne sont pas chargés correctement!');
            return;
        }
        
        try {
            // Step 1: Initialize state
            console.log('Step 1: Init state');
            initState();
            
            // Step 2: Load/initialize establishments
            console.log('Step 2: Load establishments');
            if (typeof loadAllEstablishments === 'function') {
                loadAllEstablishments();
            } else {
                console.error('loadAllEstablishments function not found!');
                // Fallback: create default establishments
                if (typeof initializeEtab === 'function') {
                    initializeEtab("Pizza d'Oléron");
                    initializeEtab('Le Vésuv');
                    if (typeof setCurrentEtab === 'function') {
                        setCurrentEtab("Pizza d'Oléron");
                    }
                }
            }
            
            const state = getState();
            console.log('State after init:', state);
            
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
                card.addEventListener('click', async function() {
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
                    
                    // Load data for establishment (if available)
                    if (typeof initializeData === 'function') {
                        try {
                            console.log('Loading data from TSV files...');
                            const data = await initializeData();
                            console.log('Data loaded successfully:', data);
                            
                            // Store data in current establishment state
                            const currentState = getCurrentEtabState();
                            if (currentState && data) {
                                currentState.products = data.products || [];
                                // Convert suppliers array to object keyed by name
                                if (data.suppliers) {
                                    currentState.fournisseurs = {};
                                    data.suppliers.forEach(supplier => {
                                        currentState.fournisseurs[supplier.Nom || supplier.nom] = supplier;
                                    });
                                }
                                saveState();
                            }
                            
                            // Update UI
                            if (typeof updateAllUI === 'function') {
                                updateAllUI();
                            }
                        } catch (error) {
                            console.error('Error loading data:', error);
                            alert('Erreur lors du chargement des données: ' + error.message);
                        }
                    } else {
                        console.warn('initializeData not available, using cached data');
                        // Update UI with cached data
                        if (typeof updateAllUI === 'function') {
                            updateAllUI();
                        }
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
