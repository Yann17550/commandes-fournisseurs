// ============================================================
//  APP.JS — Commandes Fournisseurs
// ============================================================

// ---- State ------------------------------------------------
let state = {
  produits: [],           // tous les produits chargés
  fournisseurs: {},       // { nom: { tel, contact, jour_appel, notes } }
  quantities: {},         // { ref_fournisseur_key: qty }
  activeTab: 'TOUS',
  search: '',
  loaded: false,
  error: null,
};

// ---- DOM refs --------------------------------------------
const $ = id => document.getElementById(id);
const weekLabel    = $('weekLabel');
const supplierTabs = $('supplierTabs');
const mainContent  = $('mainContent');
const productList  = $('productList');
const loadingState = $('loadingState');
const bottomBar    = $('bottomBar');
const totalAmount  = $('totalAmount');
const validateBtn  = $('validateBtn');
const summaryBtn   = $('summaryBtn');
const refreshBtn   = $('refreshBtn');
const summaryModal = $('summaryModal');
const summaryContent = $('summaryContent');
const searchInput  = $('searchInput');

// ---- Utils -----------------------------------------------
function getWeekLabel() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  return `Semaine ${week} — ${now.toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}`;
}

function parseNum(str) {
  if (!str || str.trim() === '') return 0;
  return parseFloat(String(str).replace(',', '.')) || 0;
}

function fmtPrice(n) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function productKey(p) {
  return `${p.fournisseur}||${p.reference}||${p.nom_court}`;
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2100);
}

// ---- Load data from Google Sheets ------------------------
async function loadData() {
  loadingState.style.display = 'flex';
  productList.style.display = 'none';
  state.error = null;

  try {
    const [tsvProduits, tsvFournisseurs] = await Promise.all([
      fetchTSV(CONFIG.SHEETS.produits),
      fetchTSV(CONFIG.SHEETS.fournisseurs).catch(() => ''),
    ]);

    state.produits = parseProduits(tsvProduits);
    state.fournisseurs = parseFournisseurs(tsvFournisseurs);
    state.loaded = true;

    render();
  } catch (err) {
    console.error(err);
    state.error = 'Impossible de charger les données. Vérifiez votre connexion ou les URLs dans config.js.';
    loadingState.style.display = 'none';
    renderError();
  }
}

async function fetchTSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function parseTSV(tsv) {
  const lines = tsv.trim().split('\n').map(l => l.split('\t').map(c => c.trim()));
  if (lines.length < 2) return [];
  const headers = lines[0];
  return lines.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] ?? '');
    return obj;
  });
}

// Nettoie la désignation : retire les suffixes légaux/logistiques bruyants
// pour garder la partie "lisible" du nom produit
function cleanDesignation(designation, nom_court) {
  let s = designation || '';

  // Retire les mentions légales et commerciales en fin de chaîne
  const toStrip = [
    /\s*-\s*DROIT ALCOOL.*/i,
    /\s*-\s*droit sur alcool.*/i,
    /\s*\+\s*TAXE SECURITE SOCIALE.*/i,
    /\s*-\s*TAXE.*/i,
    /\s*\(pack x\d+\)/i,
  ];
  toStrip.forEach(re => { s = s.replace(re, ''); });

  // Capitalise proprement (tout en minuscule sauf 1ère lettre des mots importants)
  s = s.trim();
  // Garde la casse d'origine mais retire les excès de majuscules (tout caps → Title case)
  if (s === s.toUpperCase()) {
    s = s.toLowerCase().replace(/\b(\w)/g, c => c.toUpperCase());
  }

  return s.trim();
}

function parseProduits(tsv) {
  const rows = parseTSV(tsv);
  const C = CONFIG.COLS;
  return rows
    .filter(r => {
      const actif = r[C.actif];
      return !actif || actif.toUpperCase() === 'TRUE';
    })
    .filter(r => r[C.nom_court] && r[C.fournisseur])
    .map(r => {
      const nom_court   = r[C.nom_court]   || '';
      const designation = r[C.designation] || '';
      return {
        fournisseur:  r[C.fournisseur]  || '',
        reference:    r[C.reference]    || '',
        designation:  designation,
        label:        cleanDesignation(designation, nom_court), // ← affiché dans la carte
        tva:          parseNum(r[C.tva]),
        prix_ht:      parseNum(r[C.prix_ht]),
        droit_alcool: parseNum(r[C.droit_alcool]),
        taxe_secu:    parseNum(r[C.taxe_secu]),
        nom_court:    nom_court,
        categorie:    r[C.categorie]    || 'Divers',
        colissage:    parseNum(r[C.colissage]) || 1,
        prix_colis:   parseNum(r[C.prix_colis]),
        actif:        true,
      };
    });
}

function parseFournisseurs(tsv) {
  if (!tsv) return {};
  const rows = parseTSV(tsv);
  const map = {};
  rows.forEach(r => {
    const nom = (r['nom'] || r['Fournisseur'] || '').trim();
    if (nom) map[nom] = r;
  });
  return map;
}

// ---- Render ----------------------------------------------
function render() {
  loadingState.style.display = 'none';
  productList.style.display = 'block';
  weekLabel.textContent = getWeekLabel();

  renderTabs();
  renderProducts();
  updateTotal();
}

function renderError() {
  const existing = document.querySelector('.error-banner');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.className = 'error-banner';
  div.textContent = state.error;
  mainContent.prepend(div);
}

function getSuppliers() {
  const set = new Set(state.produits.map(p => p.fournisseur));
  return ['TOUS', ...Array.from(set).sort()];
}

function renderTabs() {
  const suppliers = getSuppliers();
  supplierTabs.innerHTML = suppliers.map(s => {
    const hasQty = s === 'TOUS'
      ? Object.values(state.quantities).some(q => q > 0)
      : state.produits.filter(p => p.fournisseur === s).some(p => (state.quantities[productKey(p)] || 0) > 0);
    return `<button class="tab-btn ${state.activeTab === s ? 'active' : ''}" data-tab="${s}">
      ${s}${hasQty ? '<span class="tab-dot"></span>' : ''}
    </button>`;
  }).join('');

  supplierTabs.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.dataset.tab;
      renderTabs();
      renderProducts();
    });
  });
}

function getVisibleProducts() {
  let list = state.produits;
  if (state.activeTab !== 'TOUS') {
    list = list.filter(p => p.fournisseur === state.activeTab);
  }
  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter(p =>
      p.nom_court.toLowerCase().includes(q) ||
      p.designation.toLowerCase().includes(q) ||
      p.reference.toLowerCase().includes(q) ||
      p.categorie.toLowerCase().includes(q)
    );
  }
  return list;
}

function renderProducts() {
  const visible = getVisibleProducts();

  if (visible.length === 0) {
    productList.innerHTML = `<div class="empty-state"><div class="emoji">🔍</div><p>Aucun produit trouvé</p></div>`;
    return;
  }

  // Niveau 1 : Catégorie (+ fournisseur si onglet TOUS)
  // Niveau 2 : Nom court (groupe de variantes)
  // Niveau 3 : Produit individuel avec sa désignation complète
  const catGroups = {};
  visible.forEach(p => {
    const catKey = state.activeTab === 'TOUS'
      ? `${p.fournisseur} — ${p.categorie}`
      : p.categorie;
    if (!catGroups[catKey]) catGroups[catKey] = {};
    const ncKey = p.nom_court;
    if (!catGroups[catKey][ncKey]) catGroups[catKey][ncKey] = [];
    catGroups[catKey][ncKey].push(p);
  });

  productList.innerHTML = Object.entries(catGroups)
    .sort(([a], [b]) => a.localeCompare(b, 'fr'))
    .map(([cat, nomCourts]) => `
      <div class="cat-group">
        <div class="cat-header">${cat}</div>
        ${Object.entries(nomCourts)
          .sort(([a], [b]) => a.localeCompare(b, 'fr'))
          .map(([nomCourt, prods]) => {
            if (prods.length === 1) return renderCard(prods[0], false);
            return `<div class="nc-group">
              <div class="nc-header">${nomCourt}</div>
              ${prods.map(p => renderCard(p, true)).join('')}
            </div>`;
          }).join('')}
      </div>
    `).join('');

  bindSteppers();
}

function bindSteppers() {
  productList.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', onQtyBtn);
  });
  productList.querySelectorAll('.qty-input').forEach(inp => {
    inp.addEventListener('change', onQtyInput);
    inp.addEventListener('focus', e => e.target.select());
  });
}

function renderCard(p, isVariant) {
  const key = productKey(p);
  const qty = state.quantities[key] || 0;
  const total = qty * p.prix_ht;
  const hasAlcool = p.droit_alcool > 0 || p.taxe_secu > 0;
  // En mode variante, affiche la désignation nettoyée ; sinon nom_court + désignation
  const mainLabel  = isVariant ? p.label : p.nom_court;
  const subLabel   = isVariant ? '' : (p.label !== p.nom_court ? p.label : '');

  return `<div class="product-card ${qty > 0 ? 'has-qty' : ''} ${isVariant ? 'is-variant' : ''}" data-key="${key}">
    <div class="product-info">
      <div class="product-nom">${mainLabel}</div>
      ${subLabel ? `<div class="product-sub">${subLabel}</div>` : ''}
      <div class="product-meta">
        <span class="product-ref">${p.reference}</span>
        <span class="product-prix">${fmtPrice(p.prix_ht)}/u</span>
        ${qty > 0 ? `<span class="product-prix-total">= ${fmtPrice(total)}</span>` : ''}
        <span class="badge-tva">TVA ${p.tva}%</span>
        ${hasAlcool ? '<span class="badge-alcool">🍷 Alcool</span>' : ''}
      </div>
    </div>
    <div class="qty-stepper">
      <button class="qty-btn" data-key="${key}" data-delta="-1">−</button>
      <input class="qty-input" type="number" min="0" step="1"
             value="${qty}" data-key="${key}">
      <button class="qty-btn" data-key="${key}" data-delta="1">+</button>
    </div>
  </div>`;
}

// ---- Qty events ------------------------------------------
function onQtyBtn(e) {
  const key = e.currentTarget.dataset.key;
  const delta = parseInt(e.currentTarget.dataset.delta);
  const cur = state.quantities[key] || 0;
  const next = Math.max(0, cur + delta);
  setQty(key, next);
}

function onQtyInput(e) {
  const key = e.currentTarget.dataset.key;
  const val = parseInt(e.currentTarget.value) || 0;
  setQty(key, Math.max(0, val));
}

function setQty(key, qty) {
  state.quantities[key] = qty;
  const card = productList.querySelector(`.product-card[data-key="${key}"]`);
  if (card) {
    const p = state.produits.find(p => productKey(p) === key);
    if (p) {
      const isVariant = card.classList.contains('is-variant');
      card.outerHTML = renderCard(p, isVariant);
      const newCard = productList.querySelector(`.product-card[data-key="${key}"]`);
      if (newCard) {
        newCard.querySelectorAll('.qty-btn').forEach(b => b.addEventListener('click', onQtyBtn));
        newCard.querySelectorAll('.qty-input').forEach(i => {
          i.addEventListener('change', onQtyInput);
          i.addEventListener('focus', e => e.target.select());
        });
      }
    }
  }
  updateTotal();
  updateTabDots();
}

function updateTotal() {
  let total = 0;
  let hasAny = false;
  state.produits.forEach(p => {
    const qty = state.quantities[productKey(p)] || 0;
    if (qty > 0) { total += qty * p.prix_ht; hasAny = true; }
  });

  totalAmount.textContent = fmtPrice(total);
  bottomBar.style.display = hasAny ? 'flex' : 'none';
  summaryBtn.style.display = hasAny ? 'flex' : 'none';
}

function updateTabDots() {
  supplierTabs.querySelectorAll('.tab-btn').forEach(btn => {
    const s = btn.dataset.tab;
    const hasQty = s === 'TOUS'
      ? Object.values(state.quantities).some(q => q > 0)
      : state.produits.filter(p => p.fournisseur === s).some(p => (state.quantities[productKey(p)] || 0) > 0);
    const dot = btn.querySelector('.tab-dot');
    if (hasQty && !dot) btn.insertAdjacentHTML('beforeend', '<span class="tab-dot"></span>');
    if (!hasQty && dot) dot.remove();
  });
}

// ---- Summary modal ---------------------------------------
function openSummary() {
  // Build summary grouped by fournisseur
  const bySupplier = {};
  state.produits.forEach(p => {
    const qty = state.quantities[productKey(p)] || 0;
    if (qty <= 0) return;
    if (!bySupplier[p.fournisseur]) bySupplier[p.fournisseur] = [];
    bySupplier[p.fournisseur].push({ ...p, qty });
  });

  if (Object.keys(bySupplier).length === 0) return;

  let grandTotal = 0;
  let htmlParts = [];
  let textParts = [`=== COMMANDE ${getWeekLabel().toUpperCase()} ===\n`];

  Object.entries(bySupplier).sort(([a],[b]) => a.localeCompare(b,'fr')).forEach(([sup, items]) => {
    let supTotal = 0;
    const lines = items.map(p => {
      const total = p.qty * p.prix_ht;
      supTotal += total;
      return { p, total };
    });
    grandTotal += supTotal;

    htmlParts.push(`
      <div class="summary-supplier">
        <div class="summary-supplier-name">${sup}</div>
        ${lines.map(({p, total}) => `
          <div class="summary-line">
            <span class="summary-line-qty">${p.qty}×</span>
            <span class="summary-line-name">${p.nom_court}</span>
            <span class="summary-line-ref">${p.reference}</span>
            <span class="summary-line-price">${fmtPrice(total)}</span>
          </div>
        `).join('')}
        <div class="summary-supplier-total">Sous-total : ${fmtPrice(supTotal)}</div>
      </div>
    `);

    textParts.push(`\n--- ${sup} ---`);
    lines.forEach(({p}) => textParts.push(`${p.qty}x ${p.nom_court} (réf: ${p.reference})`));
    textParts.push(`Sous-total HT : ${fmtPrice(supTotal)}`);
  });

  htmlParts.push(`
    <div class="summary-grand-total">
      <span>Total général HT</span>
      <span>${fmtPrice(grandTotal)}</span>
    </div>
  `);
  textParts.push(`\nTOTAL HT : ${fmtPrice(grandTotal)}`);

  summaryContent.innerHTML = htmlParts.join('');
  summaryModal.dataset.text = textParts.join('\n');
  summaryModal.style.display = 'flex';
}

function closeSummary() {
  summaryModal.style.display = 'none';
}

// ---- Events ----------------------------------------------
validateBtn.addEventListener('click', openSummary);
summaryBtn.addEventListener('click', openSummary);
$('closeModal').addEventListener('click', closeSummary);
summaryModal.addEventListener('click', e => { if (e.target === summaryModal) closeSummary(); });

$('copyBtn').addEventListener('click', () => {
  const text = summaryModal.dataset.text || '';
  navigator.clipboard.writeText(text).then(() => showToast('✓ Copié dans le presse-papier'));
});

$('resetBtn').addEventListener('click', () => {
  if (!confirm('Vider toute la commande en cours ?')) return;
  state.quantities = {};
  closeSummary();
  renderProducts();
  updateTotal();
  renderTabs();
});

refreshBtn.addEventListener('click', () => {
  state.quantities = {};
  state.loaded = false;
  productList.style.display = 'none';
  loadData();
  showToast('↻ Rechargement...');
});

searchInput.addEventListener('input', () => {
  state.search = searchInput.value;
  renderProducts();
});

// ---- Init ------------------------------------------------
weekLabel.textContent = getWeekLabel();
loadData();
