const WHATSAPP_NUMBER = "2290144755155"; // numéro de démonstration — à remplacer par celui du commerçant
const STORAGE_KEY = "whatsappshop_demo_products";

const STORE_ID_KEY = "whatsappshop_store_id";
function getStoreIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("boutique");
}
function showStoreIdFromUrl() {
  const storeId = getStoreIdFromUrl();

  if (storeId) {
    console.log("Boutique chargée :", storeId);
  } else {
    console.log("Aucune boutique indiquée dans l'URL");
  }
}

function getStoreId() {
  let storeId = localStorage.getItem(STORE_ID_KEY);

  if (!storeId) {
    storeId = "boutique-" + Date.now();
    localStorage.setItem(STORE_ID_KEY, storeId);
  }

  return storeId;
}
const DEFAULT_PRODUCTS = [
  { id: 1, emoji: "👕", name: "T-shirt", price: 5000 },
  { id: 2, emoji: "👟", name: "Chaussures", price: 12000 },
  { id: 3, emoji: "👜", name: "Sac", price: 8000 },
  { id: 4, emoji: "⌚", name: "Montre", price: 10000 }
];

let products = loadProducts();
let cart = {};
let mode = "client";
let editingId = null;

function loadProducts(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){ const parsed = JSON.parse(raw); if(Array.isArray(parsed) && parsed.length) return parsed; }
  }catch(e){}
  return DEFAULT_PRODUCTS.slice();
}
function saveProducts(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(products)); }catch(e){}
}
function formatPrice(n){ return n.toLocaleString('fr-FR') + ' FCFA'; }

function toggleMode(){
  mode = mode === 'client' ? 'commercant' : 'client';
  editingId = null;
  document.getElementById('mode-toggle').textContent = mode === 'client' ? '🧑‍💼 Mode commerçant' : '🛍️ Vue client';
  document.getElementById('mode-banner').style.display = mode === 'commercant' ? 'block' : 'none';
  document.getElementById('add-form').style.display = mode === 'commercant' ? 'flex' : 'none';
  document.getElementById('cart-section').classList.toggle('hidden', mode === 'commercant');
  renderCatalogue();
}

function addProduct(){
  const emoji = document.getElementById('new-emoji').value.trim() || '🛍️';
  const name = document.getElementById('new-name').value.trim();
  const price = parseInt(document.getElementById('new-price').value, 10);
  const imageInput = document.getElementById('new-image');
  const file = imageInput.files[0];

  if(!name || !price || price <= 0){
    showToast('Indique un nom et un prix valides');
    return;
  }

  if(file){
    const reader = new FileReader();

    reader.onload = function(event){
      products.push({
        id: Date.now(),
        emoji,
        name,
        price,
        image: event.target.result
      });

      saveProducts();

      document.getElementById('new-name').value = '';
      document.getElementById('new-price').value = '';
      imageInput.value = '';

      renderCatalogue();
      showToast(name + ' ajouté au catalogue ✓');
    };

    reader.readAsDataURL(file);

  } else {
    products.push({
      id: Date.now(),
      emoji,
      name,
      price,
      image: ""
    });

    saveProducts();

    document.getElementById('new-name').value = '';
    document.getElementById('new-price').value = '';
    imageInput.value = '';

    renderCatalogue();
    showToast(name + ' ajouté au catalogue ✓');
  }
}
function startEdit(id){
  editingId = id;
  renderCatalogue();
}
function cancelEdit(){ editingId = null; renderCatalogue(); }
function saveEdit(id){
  const p = products.find(p => p.id === id);

  const emoji = document.getElementById('edit-emoji-' + id).value.trim() || p.emoji;
  const name = document.getElementById('edit-name-' + id).value.trim();
  const price = parseInt(document.getElementById('edit-price-' + id).value, 10);

  const imageInput = document.getElementById('edit-image-' + id);
  const file = imageInput.files[0];

  if(!name || !price || price <= 0){
    showToast('Indique un nom et un prix valides');
    return;
  }

  p.emoji = emoji;
  p.name = name;
  p.price = price;

  if(file){
    const reader = new FileReader();

    reader.onload = function(event){
      p.image = event.target.result;

      saveProducts();
      editingId = null;
      renderCatalogue();

      showToast('Produit modifié ✓');
    };

    reader.readAsDataURL(file);

  } else {
    saveProducts();
    editingId = null;
    renderCatalogue();

    showToast('Produit modifié ✓');
  }
}
function deleteProduct(id){
  products = products.filter(p => p.id !== id);
  saveProducts();
  renderCatalogue();
  showToast('Produit supprimé');
}

function addToCart(name, price){
  cart[name] = cart[name] || { price, qty: 0 };
  cart[name].qty += 1;
  renderCart();
  showToast(name + ' ajouté au panier ✓');
}
function changeQty(name, delta){
  if(!cart[name]) return;
  cart[name].qty += delta;
  if(cart[name].qty <= 0) delete cart[name];
  renderCart();
}

function renderCatalogue(){
  const el = document.getElementById('catalogue');
  el.innerHTML = '';
  products.forEach(p => {
    const row = document.createElement('div');
    row.className = 'product';
    if(mode === 'commercant' && editingId === p.id){
      row.innerHTML = `
  <div class="edit-form">
    <input class="f-emoji" id="edit-emoji-${p.id}" maxlength="2" value="${p.emoji}">
    
    <input
      class="f-name"
      id="edit-name-${p.id}"
      value="${p.name}"
    >

    <input
      class="f-price"
      id="edit-price-${p.id}"
      type="number"
      value="${p.price}"
    >

    <input
      class="f-image"
      id="edit-image-${p.id}"
      type="file"
      accept="image/*"
    >

    <button class="btn add-btn" onclick="saveEdit(${p.id})">
      Enregistrer
    </button>

    <button class="btn icon-btn" onclick="cancelEdit()">
      Annuler
    </button>
  </div>`;
    } else if(mode === 'commercant'){

  const visual = p.image
    ? `<img class="product-image" src="${p.image}" alt="${p.name}">`
    : `<div class="swatch">${p.emoji}</div>`;

  row.innerHTML = `
    ${visual}

    <div class="details">
      <h2>${p.name}</h2>
      <div class="price">${formatPrice(p.price)}</div>
    </div>

    <div class="row-actions">
      <button class="btn icon-btn" onclick="startEdit(${p.id})">✏️</button>
      <button class="btn icon-btn danger" onclick="deleteProduct(${p.id})">🗑️</button>
    </div>`;
} else {
  const visual = p.image
    ? `<img class="product-image" src="${p.image}" alt="${p.name}">`
    : `<div class="swatch">${p.emoji}</div>`;

  row.innerHTML = `
    ${visual}
    <div class="details">
      <h2>${p.name}</h2>
      <div class="price">${formatPrice(p.price)}</div>
    </div>
    <button class="btn add-btn" onclick="addToCart('${p.name.replace(/'/g,"\\'")}', ${p.price})">Ajouter au panier</button>`;
}
    el.appendChild(row);
  });
}

function renderCart(){
  const itemsEl = document.getElementById('cart-items');
  const emptyEl = document.getElementById('cart-empty');
  const totalEl = document.getElementById('cart-total');
  const totalAmountEl = document.getElementById('cart-total-amount');
  const orderBtn = document.getElementById('order-btn');
  const names = Object.keys(cart);
  itemsEl.innerHTML = '';
  let total = 0, count = 0;
  if(names.length === 0){
    emptyEl.style.display = 'block'; totalEl.style.display = 'none'; orderBtn.classList.add('disabled');
  } else {
    emptyEl.style.display = 'none'; totalEl.style.display = 'flex'; orderBtn.classList.remove('disabled');
    names.forEach(name => {
      const { price, qty } = cart[name];
      total += price * qty; count += qty;
      const line = document.createElement('div');
      line.className = 'cart-line';
      line.innerHTML = `<button class="rm" onclick="changeQty('${name.replace(/'/g,"\\'")}', -1)" aria-label="Retirer">−</button><span class="name">${name} <span class="qty">x${qty}</span></span><span class="sub">${formatPrice(price*qty)}</span>`;
      itemsEl.appendChild(line);
    });
    const lines = names.map(n => `- ${n} x${cart[n].qty} — ${formatPrice(cart[n].price * cart[n].qty)}`).join('\n');
    const message = `Bonjour ! Je souhaite commander :\n${lines}\nTotal : ${formatPrice(total)}`;
    const settings = loadStoreSettings();
   orderBtn.href = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}`;
  }
  totalAmountEl.textContent = formatPrice(total);
  document.getElementById('cart-count').textContent = count;
  const pill = document.getElementById('cart-pill');
  pill.classList.remove('pulse'); void pill.offsetWidth; pill.classList.add('pulse');
}

let toastTimer;
function showToast(text){
  const toast = document.getElementById('toast');
  toast.textContent = text; toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

const initialStoreSettings = loadStoreSettings();
applyStoreSettings(initialStoreSettings);
loadStoreSettingsIntoForm();

displayStoreId();
displayStoreLink();
function displayStoreLink() {
  const storeLinkElement = document.getElementById("store-link");

  if (storeLinkElement) {
    storeLinkElement.textContent =
      window.location.origin + window.location.pathname + "?boutique=" + getStoreId();
  }
}

function copyStoreLink() {
  const link =
    window.location.origin + window.location.pathname + "?boutique=" + getStoreId();

  navigator.clipboard.writeText(link)
    .then(() => {
      showToast("Lien de boutique copié ✓");
    })
    .catch(() => {
      showToast("Impossible de copier le lien");
    });
}

renderCatalogue();
renderCart();

showStoreIdFromUrl();

function changeStoreName(newName) {
  document.getElementById("store-name").textContent = newName;
}

const STORE_SETTINGS_KEY = "whatsappshop_store_settings";

function loadStoreSettings() {
  try {
    const raw = localStorage.getItem(STORE_SETTINGS_KEY);

    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}

  return {
    name: "Boutique de Marie",
    whatsapp: WHATSAPP_NUMBER,
    description: "Bienvenue dans notre boutique. Découvrez nos produits et commandez directement sur WhatsApp."
  };
}

function saveStoreSettings() {
  const name = document.getElementById("store-name-input").value.trim();
  const whatsapp = document.getElementById("store-whatsapp-input").value.trim();
  const description = document.getElementById("store-description-input").value.trim();

  if (!name) {
    showToast("Indique le nom de la boutique");
    return;
  }

  if (!whatsapp) {
    showToast("Indique le numéro WhatsApp");
    return;
  }

  const settings = {
    name: name,
    whatsapp: whatsapp,
    description: description
  };

  try {
    localStorage.setItem(STORE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    showToast("Impossible de sauvegarder les paramètres");
    return;
  }

  applyStoreSettings(settings);

  showToast("Paramètres enregistrés ✓");
}

function applyStoreSettings(settings) {
  changeStoreName(settings.name);

  const descriptionElement = document.getElementById("store-description");

  if (descriptionElement) {
    descriptionElement.textContent = settings.description;
  }
}

function loadStoreSettingsIntoForm() {
  const settings = loadStoreSettings();

  document.getElementById("store-name-input").value = settings.name;
  document.getElementById("store-whatsapp-input").value = settings.whatsapp;
  document.getElementById("store-description-input").value = settings.description;
}

function displayStoreId() {
  const storeIdElement = document.getElementById("store-id");

  if (storeIdElement) {
    storeIdElement.textContent = getStoreId();
  }
}
