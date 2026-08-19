(function () {
  "use strict";

  const STORAGE_KEY = "essensverkauf.items.v1";

  const itemListEl = document.getElementById("item-list");
  const itemTemplate = document.getElementById("item-template");
  const addItemForm = document.getElementById("add-item-form");
  const nameInput = document.getElementById("item-name");
  const priceInput = document.getElementById("item-price");
  const resetBtn = document.getElementById("reset-btn");
  const totalCountEl = document.getElementById("total-count");
  const totalRevenueEl = document.getElementById("total-revenue");

  /** @type {{id: string, name: string, price: number, count: number}[]} */
  let items = loadItems();

  function loadItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultItems();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return defaultItems();
      return parsed;
    } catch {
      return defaultItems();
    }
  }

  function defaultItems() {
    return [
      { id: cryptoId(), name: "Bratwurst", price: 2.5, count: 0 },
      { id: cryptoId(), name: "Kuchen", price: 1.5, count: 0 },
      { id: cryptoId(), name: "Getränk", price: 1.0, count: 0 },
    ];
  }

  function cryptoId() {
    return Math.random().toString(36).slice(2, 10);
  }

  function saveItems() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function formatEuro(value) {
    return value.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €";
  }

  function render() {
    itemListEl.innerHTML = "";
    let totalCount = 0;
    let totalRevenue = 0;

    for (const item of items) {
      const node = itemTemplate.content.firstElementChild.cloneNode(true);
      node.dataset.id = item.id;
      node.querySelector(".item-name").textContent = item.name;
      node.querySelector(".item-price").textContent = formatEuro(item.price) + " / Stück";
      node.querySelector(".tally-count").textContent = String(item.count);
      const subtotal = item.price * item.count;
      node.querySelector(".item-subtotal").textContent =
        item.count > 0 ? `${item.count} × = ${formatEuro(subtotal)}` : "";

      node.querySelector(".plus").addEventListener("click", () => changeCount(item.id, 1));
      node.querySelector(".minus").addEventListener("click", () => changeCount(item.id, -1));
      node.querySelector(".remove-item").addEventListener("click", () => removeItem(item.id));

      itemListEl.appendChild(node);

      totalCount += item.count;
      totalRevenue += subtotal;
    }

    totalCountEl.textContent = String(totalCount);
    totalRevenueEl.textContent = formatEuro(totalRevenue);
  }

  function changeCount(id, delta) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    item.count = Math.max(0, item.count + delta);
    saveItems();
    render();
  }

  function removeItem(id) {
    if (!confirm("Diesen Artikel wirklich entfernen?")) return;
    items = items.filter((i) => i.id !== id);
    saveItems();
    render();
  }

  addItemForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    if (!name || Number.isNaN(price) || price < 0) return;

    items.push({ id: cryptoId(), name, price, count: 0 });
    saveItems();
    render();

    addItemForm.reset();
    nameInput.focus();
  });

  resetBtn.addEventListener("click", () => {
    if (!confirm("Alle Zähler auf 0 setzen? Die Artikel bleiben erhalten.")) return;
    for (const item of items) item.count = 0;
    saveItems();
    render();
  });

  render();
})();
