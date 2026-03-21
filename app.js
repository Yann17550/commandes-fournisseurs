// ============================================================
//  APP.JS — Commandes Fournisseurs v2
//  accordéon, apprentissage, mobile-first
// ============================================================

// ---- Apprentissage (localStorage) ------------------------
const LEARN_KEY = 'cmd_scores';
function getScores() {
  try { return JSON.parse(localStorage.getItem(LEARN_KEY) || '{}'); }
  catch { return {}; }
}
function saveScores(s) {
  try { localStorage.setItem(LEARN_KEY, JSON.stringify(s)); } catch {}
}
function recordOrder(quantities) {
  const scores = getScores();
  Object.entries(quantities).forEach(([key, qty]) => {
    if (qty > 0) scores[key] = (scores[key] || 0) + 1;
  });
  saveScores(scores);
}

// ---- State -----------------------------------------------
let state = {
  produits: [], fournisseurs: {}, quantities: {},
  openSupplier: null, search: '', loaded: false, error: null,
};

// ---- DOM -------------------------------------------------
const $ = id => document.getElementById(id);
const weekLabel = $('weekLabel'), mainContent = $('mainContent'),
      productList = $('productList'), loadingState = $('loadingState'),
      bottomBar = $('bottomBar'), totalAmount = $('totalAmount'),
      validateBtn = $('validateBtn'), summaryBtn = $('summaryBtn'),
      refreshBtn = $('refreshBtn'), summaryModal = $('summaryModal'),
      summaryContent = $('summaryContent'), searchInput = $('searchInput');

// ---- Utils -----------------------------------------------
function getWeekLabel() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  return `S${week} — ${now.toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}`;
}
function parseNum(s) {
  if (!s || !s.toString().trim()) return 0;
  return parseFloat(s.toString().replace(',', '.')) || 0;
}
function fmtPrice(n) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' €';
}
function productKey(p) { return p.fournisseur + '||' + p.reference + '||' + p.nom_court; }
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function showToast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

// ---- Nettoyage désignations ------------------------------
function cleanDesignation(s) {
  s = (s || '');
  [/\s*-\s*DROIT ALCOOL.*/i, /\s*-\s*droit sur alcool.*/i,
   /\s*\+\s*TAXE SECURITE SOCIALE.*/i, /\s*-\s*TAXE.*/i,
   /\s*\(pack x\d+\)/i].forEach(re => { s = s.replace(re, ''); });
  s = s.trim();
  if (s === s.toUpperCase()) s = s.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
  return s.trim();
}

// ---- Parsing TSV -----------------------------------------
function parseTSV(tsv) {
  const lines = tsv.trim().split('\n').map(l => l.split('\t').map(c => c.trim()));
  if (lines.length < 2) return [];
  const headers = lines[0];
  return lines.slice(1).filter(r => r.some(c => c !== '')).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] ?? '');
    return obj;
  });
}

function parseProduits(tsv) {
  const C = CONFIG.COLS;
  return parseTSV(tsv)
    .filter(r => {
      const a = (r[C.actif] || '').toUpperCase();
      return a === '' || a === 'TRUE';
    })
    .filter(r => (r[C.nom_court]||'').trim() && (r[C.fournisseur]||'').trim())
    .map(r => {
      const nom_court = (r[C.nom_court]||'').trim();
      const designation = (r[C.designation]||'').trim();
      return {
        fournisseur:  (r[C.fournisseur]||'').trim(),
        reference:    (r[C.reference]||'').trim(),
        designation, label: cleanDesignation(designation),
        tva: parseNum(r[C.tva]), prix_ht: parseNum(r[C.prix_ht]),
        droit_alcool: parseNum(r[C.droit_alcool]),
        taxe_secu: parseNum(r[C.taxe_secu]),
        nom_court, categorie: (r[C.categorie]||'Divers').trim(),
        colissage: parseNum(r[C.colissage]) || 1,
        prix_colis: parseNum(r[C.prix_colis]), actif: true,
      };
    });
}

function parseFournisseurs(tsv) {
  if (!tsv) return {};
  const CF = CONFIG.COLS_F;
  const map = {};
  parseTSV(tsv).forEach(r => {
    const nom = (r[CF.nom] || r['Fournisseur'] || '').trim();
    if (!nom) return;
    map[nom] = {
      telephone:        (r[CF.telephone]        || '').trim(),
      contact:          (r[CF.contact]          || '').trim(),
      jour_saison:      (r[CF.jour_saison]      || '').trim(),
      jour_hors_saison: (r[CF.jour_hors_saison] || '').trim(),
      notes:            (r[CF.notes]            || '').trim(),
    };
  });
  return map;
}

function isSaison() {
  const mois = new Date().getMonth() + 1; // 1-12
  return (CONFIG.MOIS_SAISON || []).includes(mois);
}

// Retourne le jour d'appel du jour courant pour un fournisseur, ou null
function getJourAppel(fournisseurNom) {
  const f = state.fournisseurs[fournisseurNom];
  if (!f) return null;
  const jours = isSaison() ? f.jour_saison : f.jour_hors_saison;
  if (!jours) return null;

  const today = new Date().getDay(); // 0=dim,1=lun,...,6=sam
  const MAP = { lun:1, mar:2, mer:3, jeu:4, ven:5, sam:6, dim:0, tlj:'all' };
  const joursLow = jours.toLowerCase();

  // "tlj" = tous les jours
  if (joursLow.includes('tlj')) return { label: jours, today: true };

  // Parse "lundi/mercredi" etc.
  const parts = joursLow.split(/[\/,; ]+/).map(s => s.trim().slice(0, 3));
  const nums  = parts.map(p => MAP[p]).filter(n => n !== undefined);
  const isToday = nums.includes(today);
  return { label: jours, today: isToday };
}

// ---- Chargement ------------------------------------------
async function loadData() {
  loadingState.style.display = 'flex';
  productList.style.display = 'none';
  state.error = null;
  try {
    const [tsvP, tsvF] = await Promise.all([
      fetch(CONFIG.SHEETS.produits, {cache:'no-store'}).then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' — produits');
        return r.text();
      }),
      fetch(CONFIG.SHEETS.fournisseurs, {cache:'no-store'}).then(r => r.text()).catch(() => ''),
    ]);
    state.produits = parseProduits(tsvP);
    state.fournisseurs = parseFournisseurs(tsvF);
    state.loaded = true;
    const sups = getSuppliers();
    if (sups.length) state.openSupplier = sups[0];
    render();
  } catch(err) {
    console.error(err);
    state.error = err.message;
    loadingState.style.display = 'none';
    renderError();
  }
}

// ---- Fournisseurs & tri ----------------------------------
function getSuppliers() {
  return [...new Set(state.produits.map(p => p.fournisseur))].sort((a,b) => a.localeCompare(b,'fr'));
}

function sortProducts(prods) {
  const scores = getScores();
  return [...prods].sort((a, b) => {
    const qa = state.quantities[productKey(a)] || 0;
    const qb = state.quantities[productKey(b)] || 0;
    if (qb > 0 && qa === 0) return 1;
    if (qa > 0 && qb === 0) return -1;
    const sa = scores[productKey(a)] || 0;
    const sb = scores[productKey(b)] || 0;
    if (sb !== sa) return sb - sa;
    return a.nom_court.localeCompare(b.nom_court, 'fr');
  });
}

// ---- Rendu -----------------------------------------------
function render() {
  loadingState.style.display = 'none';
  productList.style.display = 'block';
  weekLabel.textContent = getWeekLabel();
  renderAccordion();
  updateTotal();
}

function renderError() {
  document.querySelectorAll('.error-banner').forEach(e => e.remove());
  const div = document.createElement('div');
  div.className = 'error-banner';
  div.innerHTML = '<strong>Impossible de charger les données</strong><br>' + escHtml(state.error)
    + '<br><small>Vérifiez les URLs dans config.js et que les feuilles sont publiées en TSV.</small>';
  mainContent.prepend(div);
}

function renderAccordion() {
  const suppliers = getSuppliers();
  const search = state.search.toLowerCase();
  if (!suppliers.length) {
    productList.innerHTML = '<div class="empty-state"><div class="emoji">📭</div><p>Aucun produit chargé</p></div>';
    return;
  }

  let html = '';
  suppliers.forEach(sup => {
    const prods = state.produits.filter(p => {
      if (p.fournisseur !== sup) return false;
      if (!search) return true;
      return p.nom_court.toLowerCase().includes(search)
          || p.designation.toLowerCase().includes(search)
          || p.reference.toLowerCase().includes(search);
    });
    if (search && prods.length === 0) return;

    const isOpen   = state.openSupplier === sup;
    const ordered  = prods.filter(p => (state.quantities[productKey(p)] || 0) > 0);
    const supTotal = ordered.reduce((s, p) => s + (state.quantities[productKey(p)] || 0) * p.prix_ht, 0);

    const appel = getJourAppel(sup);
    const appelHtml = appel
      ? `<span class="acc-appel${appel.today ? ' acc-appel--today' : ''}">${appel.today ? '📞 Aujourd\'hui' : escHtml(appel.label)}</span>`
      : '';

    html += `<div class="accordion-block${isOpen ? ' is-open' : ''}" data-sup="${escHtml(sup)}">
      <button class="accordion-header" data-sup="${escHtml(sup)}">
        <div class="acc-left">
          <div class="acc-title-row">
            <span class="acc-name">${escHtml(sup)}</span>
            ${appelHtml}
          </div>
          ${ordered.length ? `<span class="acc-badge">${ordered.length} art. · ${fmtPrice(supTotal)}</span>` : ''}
        </div>
        <span class="acc-chevron">${isOpen ? '▾' : '▸'}</span>
      </button>
      ${isOpen ? renderSupplierBody(prods, search) : ''}
    </div>`;
  });

  productList.innerHTML = html || '<div class="empty-state"><div class="emoji">🔍</div><p>Aucun résultat</p></div>';

  productList.querySelectorAll('.accordion-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const sup = btn.dataset.sup;
      state.openSupplier = state.openSupplier === sup ? null : sup;
      renderAccordion();
      setTimeout(() => {
        const open = productList.querySelector('.accordion-block.is-open');
        if (open) open.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 40);
    });
  });

  bindSteppers();
}

function renderSupplierBody(prods, search) {
  if (!prods.length) return '<div class="acc-body"><div class="empty-state"><p>Aucun produit</p></div></div>';
  const scores   = getScores();
  const sorted   = sortProducts(prods);
  const sup      = prods[0].fournisseur;
  const fInfo    = state.fournisseurs[sup] || {};
  let html = '<div class="acc-body">';

  // Bandeau infos fournisseur
  const infos = [];
  if (fInfo.contact)   infos.push('👤 ' + escHtml(fInfo.contact));
  if (fInfo.telephone) infos.push('📱 ' + escHtml(fInfo.telephone));
  if (fInfo.notes)     infos.push('⚠️ ' + escHtml(fInfo.notes));
  if (infos.length) html += `<div class="acc-info-bar">${infos.join(' · ')}</div>`;

  if (search) {
    html += renderGrouped(sorted);
  } else {
    const habituels = sorted.filter(p => scores[productKey(p)] > 0);
    const autres    = sorted.filter(p => !scores[productKey(p)]);
    if (habituels.length) {
      html += '<div class="section-label">⭐ Habituels</div>' + renderGrouped(habituels);
      if (autres.length) html += '<div class="section-label section-label--secondary">Catalogue complet</div>' + renderGrouped(autres);
    } else {
      html += renderGrouped(sorted);
    }
  }
  html += '</div>';
  return html;
}

function renderGrouped(prods) {
  const groups = {};
  prods.forEach(p => {
    if (!groups[p.nom_court]) groups[p.nom_court] = [];
    groups[p.nom_court].push(p);
  });
  return Object.entries(groups).map(([nc, items]) => {
    if (items.length === 1) return renderRow(items[0], false);
    return `<div class="nc-group"><div class="nc-header">${escHtml(nc)}</div>${items.map(p => renderRow(p, true)).join('')}</div>`;
  }).join('');
}

function renderRow(p, isVariant) {
  const key = productKey(p);
  const qty = state.quantities[key] || 0;
  const total = qty * p.prix_ht;
  const hasAlcool = p.droit_alcool > 0 || p.taxe_secu > 0;
  const mainLabel = isVariant ? p.label : p.nom_court;
  const subLabel  = !isVariant && p.label !== p.nom_court ? p.label : '';
  return `<div class="product-card${qty > 0 ? ' has-qty' : ''}${isVariant ? ' is-variant' : ''}" data-key="${escHtml(key)}">
    <div class="product-info">
      <div class="product-nom">${escHtml(mainLabel)}</div>
      ${subLabel ? `<div class="product-sub">${escHtml(subLabel)}</div>` : ''}
      <div class="product-meta">
        <span class="product-ref">${escHtml(p.reference)}</span>
        <span class="product-prix">${fmtPrice(p.prix_ht)}</span>
        ${qty > 0 ? `<span class="product-prix-total">= ${fmtPrice(total)}</span>` : ''}
        ${hasAlcool ? '<span class="badge-alcool">🍷</span>' : ''}
      </div>
    </div>
    <div class="qty-stepper">
      <button class="qty-btn" data-key="${escHtml(key)}" data-delta="-1">−</button>
      <input class="qty-input" type="number" min="0" step="1" value="${qty}" data-key="${escHtml(key)}" inputmode="numeric">
      <button class="qty-btn" data-key="${escHtml(key)}" data-delta="1">+</button>
    </div>
  </div>`;
}

function bindSteppers() {
  productList.querySelectorAll('.qty-btn').forEach(b => b.addEventListener('click', onQtyBtn));
  productList.querySelectorAll('.qty-input').forEach(i => {
    i.addEventListener('change', onQtyInput);
    i.addEventListener('focus', e => e.target.select());
  });
}

// ---- Qty -------------------------------------------------
function onQtyBtn(e) {
  const key = e.currentTarget.dataset.key;
  setQty(key, Math.max(0, (state.quantities[key] || 0) + parseInt(e.currentTarget.dataset.delta)));
}
function onQtyInput(e) {
  setQty(e.currentTarget.dataset.key, Math.max(0, parseInt(e.currentTarget.value) || 0));
}

function setQty(key, qty) {
  state.quantities[key] = qty;
  const card = productList.querySelector(`.product-card[data-key="${CSS.escape(key)}"]`);
  if (card) {
    const p = state.produits.find(p => productKey(p) === key);
    if (p) {
      const isVariant = card.classList.contains('is-variant');
      const tmp = document.createElement('div');
      tmp.innerHTML = renderRow(p, isVariant);
      const newCard = tmp.firstElementChild;
      card.replaceWith(newCard);
      newCard.querySelectorAll('.qty-btn').forEach(b => b.addEventListener('click', onQtyBtn));
      newCard.querySelectorAll('.qty-input').forEach(i => {
        i.addEventListener('change', onQtyInput);
        i.addEventListener('focus', e => e.target.select());
      });
    }
  }
  updateAccordionBadge(key);
  updateTotal();
}

function updateAccordionBadge(changedKey) {
  const p = state.produits.find(p => productKey(p) === changedKey);
  if (!p) return;
  const block = productList.querySelector(`.accordion-block[data-sup="${CSS.escape(p.fournisseur)}"]`);
  if (!block) return;
  const prods   = state.produits.filter(pr => pr.fournisseur === p.fournisseur);
  const ordered = prods.filter(pr => (state.quantities[productKey(pr)] || 0) > 0);
  const total   = ordered.reduce((s,pr) => s + (state.quantities[productKey(pr)]||0)*pr.prix_ht, 0);
  const left    = block.querySelector('.acc-left');
  const badge   = left.querySelector('.acc-badge');
  if (ordered.length) {
    const html = `<span class="acc-badge">${ordered.length} art. · ${fmtPrice(total)}</span>`;
    if (badge) badge.outerHTML = html; else left.insertAdjacentHTML('beforeend', html);
  } else if (badge) badge.remove();
}

function updateTotal() {
  let total = 0, hasAny = false;
  state.produits.forEach(p => {
    const qty = state.quantities[productKey(p)] || 0;
    if (qty > 0) { total += qty * p.prix_ht; hasAny = true; }
  });
  totalAmount.textContent = fmtPrice(total);
  bottomBar.style.display  = hasAny ? 'flex' : 'none';
  summaryBtn.style.display = hasAny ? 'flex' : 'none';
}

// ---- Récapitulatif ---------------------------------------
function openSummary() {
  const bySupplier = {};
  state.produits.forEach(p => {
    const qty = state.quantities[productKey(p)] || 0;
    if (!qty) return;
    (bySupplier[p.fournisseur] = bySupplier[p.fournisseur] || []).push({...p, qty});
  });
  if (!Object.keys(bySupplier).length) return;

  let grandTotal = 0;
  const htmlParts = [], textParts = ['=== COMMANDE ' + getWeekLabel().toUpperCase() + ' ===\n'];

  Object.entries(bySupplier).sort(([a],[b]) => a.localeCompare(b,'fr')).forEach(([sup, items]) => {
    let supTotal = 0;
    const lines = items.map(p => { const t = p.qty * p.prix_ht; supTotal += t; return {p,t}; });
    grandTotal += supTotal;
    htmlParts.push(`<div class="summary-supplier">
      <div class="summary-supplier-name">${escHtml(sup)}</div>
      ${lines.map(({p,t}) => `<div class="summary-line">
        <span class="summary-line-qty">${p.qty}×</span>
        <span class="summary-line-name">${escHtml(p.label||p.nom_court)}</span>
        <span class="summary-line-ref">${escHtml(p.reference)}</span>
        <span class="summary-line-price">${fmtPrice(t)}</span>
      </div>`).join('')}
      <div class="summary-supplier-total">Sous-total : ${fmtPrice(supTotal)}</div>
    </div>`);
    textParts.push('\n--- ' + sup + ' ---');
    lines.forEach(({p}) => textParts.push(p.qty + 'x ' + (p.label||p.nom_court) + ' (réf: ' + p.reference + ')'));
    textParts.push('Sous-total HT : ' + fmtPrice(supTotal));
  });

  htmlParts.push(`<div class="summary-grand-total"><span>Total général HT</span><span>${fmtPrice(grandTotal)}</span></div>`);
  textParts.push('\nTOTAL HT : ' + fmtPrice(grandTotal));
  summaryContent.innerHTML = htmlParts.join('');
  summaryModal.dataset.text = textParts.join('\n');
  summaryModal.style.display = 'flex';
}

function closeSummary() { summaryModal.style.display = 'none'; }

// ---- Événements ------------------------------------------
validateBtn.addEventListener('click', openSummary);
summaryBtn.addEventListener('click', openSummary);
$('closeModal').addEventListener('click', closeSummary);
summaryModal.addEventListener('click', e => { if (e.target === summaryModal) closeSummary(); });

$('copyBtn').addEventListener('click', () => {
  recordOrder(state.quantities); // apprentissage au moment de copier
  navigator.clipboard.writeText(summaryModal.dataset.text || '')
    .then(() => showToast('✓ Copié — commande mémorisée'));
});

$('resetBtn').addEventListener('click', () => {
  if (!confirm('Vider toute la commande en cours ?')) return;
  state.quantities = {};
  closeSummary();
  renderAccordion();
  updateTotal();
});

refreshBtn.addEventListener('click', () => {
  state.quantities = {}; state.loaded = false;
  productList.style.display = 'none';
  loadData(); showToast('↻ Rechargement...');
});

searchInput.addEventListener('input', () => {
  state.search = searchInput.value;
  // En mode recherche, ouvre tous les blocs
  if (state.search) state.openSupplier = '__ALL__';
  renderAccordion();
});

// ---- Init ------------------------------------------------
weekLabel.textContent = getWeekLabel();
loadData();
