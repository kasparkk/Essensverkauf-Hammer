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

  function formatNumber(value) {
    return value.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatEuro(value) {
    return formatNumber(value) + " €";
  }

  /**
   * Liest einen Preis so, wie er hierzulande eingetippt wird: "2,50" ebenso
   * wie "2.50". Gibt null zurück, wenn die Eingabe kein gültiger Preis ist.
   */
  function parsePrice(text) {
    const normalized = String(text).replace(/\s/g, "").replace(",", ".");
    if (!normalized) return null;
    const value = Number(normalized);
    if (!Number.isFinite(value) || value < 0) return null;
    return Math.round(value * 100) / 100;
  }

  function fillRow(node, item) {
    node.dataset.id = item.id;
    node.querySelector(".item-name").textContent = item.name;
    node.querySelector(".item-price").textContent = formatEuro(item.price) + " / Stück";
    node.querySelector(".tally-count").textContent = String(item.count);
    const subtotal = item.price * item.count;
    node.querySelector(".item-subtotal").textContent =
      item.count > 0 ? `${item.count} × = ${formatEuro(subtotal)}` : "";
  }

  function updateTotals() {
    let totalCount = 0;
    let totalRevenue = 0;
    for (const item of items) {
      totalCount += item.count;
      totalRevenue += item.price * item.count;
    }
    totalCountEl.textContent = String(totalCount);
    totalRevenueEl.textContent = formatEuro(totalRevenue);
  }

  /**
   * Ersetzt Bezeichnung oder Preis an Ort und Stelle durch ein Eingabefeld.
   * Der Zählerstand bleibt dabei unberührt.
   */
  function beginEdit(node, item, field) {
    const isPrice = field === "price";
    const target = node.querySelector(isPrice ? ".item-price" : ".item-name");
    if (target.hidden) return;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "field-editor" + (isPrice ? " field-editor--price" : "");
    if (isPrice) {
      input.value = formatNumber(item.price);
      input.inputMode = "decimal";
      input.setAttribute("aria-label", "Preis in Euro bearbeiten");
    } else {
      input.value = item.name;
      input.maxLength = 40;
      input.setAttribute("aria-label", "Bezeichnung bearbeiten");
    }

    target.hidden = true;
    target.insertAdjacentElement("afterend", input);
    input.focus();
    input.select();

    let closed = false;
    const finish = (save) => {
      if (closed) return;
      closed = true;
      if (save) {
        if (isPrice) {
          const price = parsePrice(input.value);
          if (price !== null) item.price = price;
        } else {
          const name = input.value.trim();
          if (name) item.name = name;
        }
        saveItems();
      }
      input.remove();
      target.hidden = false;
      fillRow(node, item);
      updateTotals();
    };

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        finish(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        finish(false);
      }
    });
    input.addEventListener("blur", () => finish(true));
  }

  function render() {
    itemListEl.innerHTML = "";

    for (const item of items) {
      const node = itemTemplate.content.firstElementChild.cloneNode(true);
      fillRow(node, item);

      node.querySelector(".plus").addEventListener("click", () => changeCount(item.id, 1));
      node.querySelector(".minus").addEventListener("click", () => changeCount(item.id, -1));
      node.querySelector(".remove-item").addEventListener("click", () => removeItem(item.id));

      for (const field of ["name", "price"]) {
        const el = node.querySelector(field === "price" ? ".item-price" : ".item-name");
        el.classList.add("editable");
        el.tabIndex = 0;
        el.setAttribute("role", "button");
        el.title = field === "price" ? "Preis bearbeiten" : "Bezeichnung bearbeiten";
        el.addEventListener("click", () => beginEdit(node, item, field));
        el.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            beginEdit(node, item, field);
          }
        });
      }

      itemListEl.appendChild(node);
    }

    updateTotals();
  }

  function changeCount(id, delta) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    item.count = Math.max(0, item.count + delta);
    saveItems();
    const node = itemListEl.querySelector(`[data-id="${item.id}"]`);
    if (node) fillRow(node, item);
    updateTotals();
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
    const price = parsePrice(priceInput.value);
    if (!name || price === null) return;

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
