// TEST: Are modules loaded?
console.log('=== MODULE LOAD TEST ===');
console.log('initState exists?', typeof initState);
console.log('getState exists?', typeof getState);
console.log('updateAllUI exists?', typeof updateAllUI);
console.log('loadAllEstablishments exists?', typeof loadAllEstablishments);

if (typeof initState !== 'function') {
  alert('ERREUR: modules/state.js n\'est pas chargé!');
} else {
  alert('SUCCES: Les modules sont bien chargés! On peut initialiser.');
  
  // Try to init
  document.addEventListener('DOMContentLoaded', function() {
    console.log('App initializing...');
    try {
      initState();
      console.log('State initialized');
      loadAllEstablishments();
      console.log('Establishments loaded');
    } catch(e) {
      console.error('ERROR:', e);
      alert('ERREUR: ' + e.message);
    }
  });
}
