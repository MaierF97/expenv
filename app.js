const products = [
  { id: 'weinflasche', name: 'Weinflasche', category: 'Getränke', price: 14 },
  { id: 'wasser', name: 'AFG 0,5 l', category: 'Getränke', price: 3 },
  { id: 'cola-fanta', name: 'AFG 0,33 l', category: 'Getränke', price: 2.5 },
  { id: 'weinschorle', name: 'Weinschorle', category: 'Getränke', price: 4 },
  { id: 'laternmass', name: 'Laternmaß', category: 'Getränke', price: 10 },
  { id: 'kaas-100g', name: '100 g Kaas', category: 'Brotzeit', price: 5 },
  { id: 'obazda-brot', name: 'Obazda mit Brot', category: 'Brotzeit', price: 7.5 },
  { id: 'obazda-breze', name: 'Obazda mit einer großen Breze', category: 'Brotzeit', price: 10 },
  { id: 'kaasspiesse', name: 'Kaas-Spieße mit Weintrauben', category: 'Brotzeit', price: 5 },
  { id: 'kaasplattn-brot', name: 'Kaasplattn mit Brot', category: 'Brotzeit', price: 9 },
  { id: 'kaasplattn-breze', name: 'Kaasplattn mit einer großen Breze', category: 'Brotzeit', price: 11.5 },
  { id: 'brotzeitplattn-brot', name: 'Brotzeitplattn mit Brot', category: 'Brotzeit', price: 9 },
  { id: 'brotzeitplattn-breze', name: 'Brotzeitplattn mit einer großen Breze', category: 'Brotzeit', price: 11.5 },
  { id: 'grosse-brotzeitplattn', name: 'Große Brotzeitplattn mit Brot für 4 Pers.', category: 'Brotzeit', price: 35 },
  { id: 'rahmfleckerl', name: 'Rahmfleckerl', category: 'Brotzeit', price: 8 },
  { id: 'steaksemmel', name: 'Steaksemmel', category: 'Brotzeit', price: 4 },
  { id: 'pommes', name: 'Portion Pommes', category: 'Brotzeit', price: 3.5 },
  { id: 'grosse-breze', name: 'Große Breze', category: 'Brotzeit', price: 4.5 },
];

const depositOptions = [
  { id: 'deposit-added', name: 'Pfand 2€', category: 'Pfand', action: 'added' },
  { id: 'deposit-returned', name: 'Pfand ZURÜCK', category: 'Pfand', action: 'returned' },
];

const order = new Map();
const depositPrice = 2;
let depositAdded = 0;
let depositReturned = 0;
let lastAdded = '';
const money = (value) => `${value.toFixed(2).replace('.', ',')} EUR`;
const productGrid = document.querySelector('#product-grid');
const receiptItems = document.querySelector('#receipt-items');
const itemCount = document.querySelector('#item-count');
const total = document.querySelector('#total');
const depositBalance = document.querySelector('#deposit-balance');
const customerCreditInput = document.querySelector('#customer-credit');
const paymentStatus = document.querySelector('#payment-status');
const change = document.querySelector('#change');
const checkout = document.querySelector('#checkout');
const toast = document.querySelector('#toast');
const lastAddedElement = document.querySelector('#last-added');
const mobileTotal = document.querySelector('#mobile-total');

function renderProducts(category = 'Alle') {
  const menuItems = category === 'Pfand' ? depositOptions : category === 'Alle' ? [...products, ...depositOptions] : products;
  productGrid.innerHTML = menuItems
    .filter((product) => category === 'Alle' || product.category === category)
    .map((product) => {
      const isDeposit = product.action;
      const price = isDeposit ? depositPrice : product.price;
      const dataAttribute = isDeposit ? `data-deposit="${product.action}"` : `data-add="${product.id}"`;
      return `<article class="product-card ${isDeposit ? 'deposit-card' : ''}" ${dataAttribute} tabindex="0" role="button"><div class="product-name">${product.name}</div><div class="product-price">${money(price)}</div></article>`;
    })
    .join('');
}

function renderReceipt() {
  const entries = [...order.entries()];
  const count = entries.reduce((sum, [, quantity]) => sum + quantity, 0) + depositAdded + depositReturned;
  const foodAndDrinks = entries.reduce((sum, [id, quantity]) => sum + products.find((product) => product.id === id).price * quantity, 0);
  const added = depositAdded;
  const returned = depositReturned;
  const amount = foodAndDrinks + ((added - returned) * depositPrice);
  const credit = Math.max(0, Number.parseFloat(customerCreditInput.value) || 0);
  const difference = credit - amount;
  itemCount.textContent = `${count} ${count === 1 ? 'Artikel' : 'Artikel'}`;
  depositBalance.textContent = added - returned;
  total.textContent = money(amount);
  mobileTotal.textContent = money(amount);
  lastAddedElement.textContent = lastAdded || 'Noch keine Auswahl';
  change.textContent = money(Math.abs(difference));
  paymentStatus.textContent = difference >= 0 ? 'Rückgeld' : 'Noch zu zahlen';
  checkout.disabled = count === 0 || difference < 0;
  const receiptRows = entries.map(([id, quantity]) => {
    const product = products.find((entry) => entry.id === id);
    return `<div class="receipt-item"><div><div class="receipt-item-name">${product.name}</div><div class="receipt-item-price">${money(product.price)}</div></div><div class="quantity-controls"><button data-decrease="${id}" type="button" aria-label="Ein ${product.name} weniger">-</button><strong>${quantity}</strong><button data-increase="${id}" type="button" aria-label="Ein ${product.name} mehr">+</button></div></div>`;
  });
  if (added > 0) receiptRows.push(`<div class="receipt-item"><div><div class="receipt-item-name">Pfand hinzufügen</div><div class="receipt-item-price">${money(depositPrice)}</div></div><div class="quantity-controls"><button data-deposit-decrease="added" type="button" aria-label="Ein hinzugefügtes Pfand weniger">-</button><strong>${added}</strong><button data-deposit-increase="added" type="button" aria-label="Ein Pfand hinzufügen">+</button></div></div>`);
  if (returned > 0) receiptRows.push(`<div class="receipt-item"><div><div class="receipt-item-name">Pfand zurücknehmen</div><div class="receipt-item-price">${money(depositPrice)}</div></div><div class="quantity-controls"><button data-deposit-decrease="returned" type="button" aria-label="Ein zurückgenommenes Pfand weniger">-</button><strong>${returned}</strong><button data-deposit-increase="returned" type="button" aria-label="Ein Pfand zurücknehmen">+</button></div></div>`);
  receiptItems.innerHTML = receiptRows.length ? receiptRows.join('') : '<div class="empty-state">Keine Artikel in dieser Bestellung.</div>';
}

function changeQuantity(id, amount) {
  const next = (order.get(id) || 0) + amount;
  if (next > 0) order.set(id, next); else order.delete(id);
  renderReceipt();
}

document.addEventListener('click', (event) => {
  const productCard = event.target.closest('.product-card');
  const add = event.target.closest('[data-add]');
  const increase = event.target.closest('[data-increase]');
  const decrease = event.target.closest('[data-decrease]');
  const deposit = event.target.closest('[data-deposit]');
  const depositIncrease = event.target.closest('[data-deposit-increase]');
  const depositDecrease = event.target.closest('[data-deposit-decrease]');
  if (add) {
    const product = products.find((entry) => entry.id === add.dataset.add);
    lastAdded = product.name;
    changeQuantity(add.dataset.add, 1);
  }
  if (increase) changeQuantity(increase.dataset.increase, 1);
  if (decrease) changeQuantity(decrease.dataset.decrease, -1);
  if (deposit?.dataset.deposit === 'added') {
    lastAdded = 'Pfand hinzufügen';
    depositAdded += 1;
  }
  if (deposit?.dataset.deposit === 'returned') {
    lastAdded = 'Pfand zurücknehmen';
    depositReturned += 1;
  }
  if (depositIncrease?.dataset.depositIncrease === 'added') depositAdded += 1;
  if (depositIncrease?.dataset.depositIncrease === 'returned') depositReturned += 1;
  if (depositDecrease?.dataset.depositDecrease === 'added') depositAdded = Math.max(0, depositAdded - 1);
  if (depositDecrease?.dataset.depositDecrease === 'returned') depositReturned = Math.max(0, depositReturned - 1);
  if (deposit || depositIncrease || depositDecrease) renderReceipt();
  if (productCard && (add || deposit)) {
    productCard.classList.remove('selected-flash');
    window.requestAnimationFrame(() => productCard.classList.add('selected-flash'));
    window.setTimeout(() => productCard.classList.remove('selected-flash'), 420);
  }
});

document.querySelector('.category-tabs').addEventListener('click', (event) => {
  const tab = event.target.closest('.category-tab');
  if (!tab) return;
  document.querySelectorAll('.category-tab').forEach((button) => button.classList.remove('active'));
  tab.classList.add('active');
  renderProducts(tab.dataset.category);
});

function resetOrder() {
  order.clear();
  depositAdded = 0;
  depositReturned = 0;
  lastAdded = '';
  customerCreditInput.value = '';
  renderReceipt();
}

document.querySelector('#clear-order').addEventListener('click', resetOrder);
customerCreditInput.addEventListener('input', renderReceipt);
checkout.addEventListener('click', () => {
  toast.textContent = 'Bestellung abgeschlossen. Bereit für den nächsten Gast.';
  toast.classList.add('visible');
  resetOrder();
  window.setTimeout(() => toast.classList.remove('visible'), 2600);
});

renderProducts();
renderReceipt();