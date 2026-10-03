(function () {
  "use strict";

  const STORAGE_KEY = "zeiterfassung.state.v1";

  const DEFAULT_SETTINGS = {
    name: "",
    company: "",
    street: "",
    zip: "",
    city: "",
    email: "",
    phone: "",
    taxNumber: "",
    vatId: "",
    bank: "",
    iban: "",
    bic: "",
    defaultRate: 60,
    roundingMinutes: 15,
    vatRate: 19,
    paymentDays: 14,
    smallBusiness: false,
    invoicePrefix: "RE-" + new Date().getFullYear() + "-",
    nextInvoiceNumber: 1,
  };

  /**
   * @typedef {{id: string, name: string, contact: string, street: string, zip: string,
   *   city: string, email: string, rate: number|null}} Client
   * @typedef {{id: string, clientId: string, description: string, start: number,
   *   end: number, invoiceId: string|null}} Entry
   * @typedef {{description: string, quantity: number, unit: string, unitPriceCents: number}} InvoiceItem
   */

  let state = loadState();

  function loadState() {
    const empty = {
      settings: { ...DEFAULT_SETTINGS },
      clients: [],
      entries: [],
      invoices: [],
      timer: null,
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return empty;
      return normalizeState(JSON.parse(raw)) || empty;
    } catch {
      return empty;
    }
  }

  function normalizeState(data) {
    if (!data || typeof data !== "object") return null;
    if (!Array.isArray(data.clients) || !Array.isArray(data.entries) || !Array.isArray(data.invoices)) {
      return null;
    }
    return {
      settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
      clients: data.clients,
      entries: data.entries,
      invoices: data.invoices,
      timer: data.timer || null,
    };
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function cryptoId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  }

  // ---------------------------------------------------------------------------
  // Formatierung und Eingabe
  // ---------------------------------------------------------------------------

  function formatNumber(value, digits = 2) {
    return value.toLocaleString("de-DE", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function formatEuro(cents) {
    return formatNumber(cents / 100) + " €";
  }

  /** "2,50" ebenso wie "2.50" → 2.5; ungültige Eingaben → null. */
  function parseDecimal(text) {
    const normalized = String(text).replace(/\s/g, "").replace(",", ".");
    if (!normalized) return null;
    const value = Number(normalized);
    if (!Number.isFinite(value) || value < 0) return null;
    return value;
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  /** Lokales Datum als "YYYY-MM-DD" (passend für <input type="date">). */
  function isoDate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function formatDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  }

  function formatTime(ms) {
    const d = new Date(ms);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function formatDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}:${pad(m)} h`;
  }

  function addDays(iso, days) {
    const [y, m, d] = iso.split("-").map(Number);
    return isoDate(new Date(y, m - 1, d + days));
  }

  function escapeHtml(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ---------------------------------------------------------------------------
  // Berechnungen
  // ---------------------------------------------------------------------------

  function entryMinutes(entry) {
    return Math.max(0, (entry.end - entry.start) / 60000);
  }

  /** Abrechenbare Minuten: angefangene Takte werden aufgerundet. */
  function billableMinutes(entry) {
    const step = Number(state.settings.roundingMinutes) || 1;
    const raw = entryMinutes(entry);
    return Math.ceil(raw / step - 1e-9) * step;
  }

  function clientById(id) {
    return state.clients.find((c) => c.id === id) || null;
  }

  function rateCentsFor(client) {
    const rate = client && client.rate != null ? client.rate : Number(state.settings.defaultRate) || 0;
    return Math.round(rate * 100);
  }

  function lineTotalCents(item) {
    return Math.round(item.quantity * item.unitPriceCents);
  }

  function computeTotals(items, vatRate, smallBusiness) {
    const net = items.reduce((sum, item) => sum + lineTotalCents(item), 0);
    const vat = smallBusiness ? 0 : Math.round((net * vatRate) / 100);
    return { net, vat, gross: net + vat };
  }

  function suggestedInvoiceNumber() {
    const s = state.settings;
    return s.invoicePrefix + String(s.nextInvoiceNumber).padStart(3, "0");
  }

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------

  const tabs = document.querySelectorAll(".tab");

  function showTab(name) {
    for (const tab of tabs) {
      const active = tab.dataset.tab === name;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      document.getElementById("tab-" + tab.dataset.tab).hidden = !active;
    }
    try {
      localStorage.setItem(STORAGE_KEY + ".tab", name);
    } catch {
      /* egal */
    }
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => showTab(tab.dataset.tab));
  }

  // ---------------------------------------------------------------------------
  // Kundenauswahl (wird in mehreren Formularen gebraucht)
  // ---------------------------------------------------------------------------

  function renderClientSelects() {
    for (const select of document.querySelectorAll(".client-select")) {
      const previous = select.value;
      select.innerHTML = "";
      if (state.clients.length === 0) {
        select.append(new Option("– bitte zuerst einen Kunden anlegen –", ""));
        continue;
      }
      for (const client of state.clients) {
        select.append(new Option(client.name, client.id));
      }
      if (clientById(previous)) select.value = previous;
    }
  }

  // ---------------------------------------------------------------------------
  // Stoppuhr
  // ---------------------------------------------------------------------------

  const timerForm = document.getElementById("timer-form");
  const timerClient = document.getElementById("timer-client");
  const timerDesc = document.getElementById("timer-desc");
  const timerDisplay = document.getElementById("timer-display");
  const timerBtn = document.getElementById("timer-btn");

  function updateTimerUi() {
    const running = !!state.timer;
    timerBtn.textContent = running ? "Stopp" : "Start";
    timerBtn.classList.toggle("running", running);
    timerClient.disabled = running;
    if (running) {
      timerClient.value = state.timer.clientId;
      timerDesc.value = state.timer.description;
    }
    tickTimer();
  }

  function tickTimer() {
    if (!state.timer) {
      timerDisplay.textContent = "0:00:00";
      document.title = "Zeiterfassung & Rechnungen";
      return;
    }
    const seconds = Math.floor((Date.now() - state.timer.startedAt) / 1000);
    const text = `${Math.floor(seconds / 3600)}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
    timerDisplay.textContent = text;
    document.title = "⏱ " + text + " – Zeiterfassung";
  }

  setInterval(tickTimer, 1000);

  timerDesc.addEventListener("input", () => {
    if (state.timer) {
      state.timer.description = timerDesc.value;
      save();
    }
  });

  timerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.timer) {
      const end = Date.now();
      if (end - state.timer.startedAt < 60000) {
        if (!confirm("Weniger als eine Minute gelaufen. Trotzdem speichern?")) {
          state.timer = null;
          save();
          updateTimerUi();
          return;
        }
      }
      state.entries.push({
        id: cryptoId(),
        clientId: state.timer.clientId,
        description: timerDesc.value.trim(),
        start: state.timer.startedAt,
        end,
        invoiceId: null,
      });
      state.timer = null;
      timerDesc.value = "";
      save();
      renderEntries();
    } else {
      if (!clientById(timerClient.value)) {
        alert("Bitte zuerst unter „Kunden“ einen Kunden anlegen.");
        return;
      }
      state.timer = {
        clientId: timerClient.value,
        description: timerDesc.value.trim(),
        startedAt: Date.now(),
      };
      save();
    }
    updateTimerUi();
  });

  // ---------------------------------------------------------------------------
  // Manuelle Einträge
  // ---------------------------------------------------------------------------

  const manualForm = document.getElementById("manual-form");

  manualForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const clientId = document.getElementById("manual-client").value;
    if (!clientById(clientId)) {
      alert("Bitte zuerst unter „Kunden“ einen Kunden anlegen.");
      return;
    }
    const date = document.getElementById("manual-date").value;
    const [y, m, d] = date.split("-").map(Number);
    const [sh, sm] = document.getElementById("manual-start").value.split(":").map(Number);
    const [eh, em] = document.getElementById("manual-end").value.split(":").map(Number);
    const start = new Date(y, m - 1, d, sh, sm).getTime();
    let end = new Date(y, m - 1, d, eh, em).getTime();
    // "22:00 bis 01:00" geht über Mitternacht.
    if (end <= start) end += 24 * 60 * 60000;

    state.entries.push({
      id: cryptoId(),
      clientId,
      description: document.getElementById("manual-desc").value.trim(),
      start,
      end,
      invoiceId: null,
    });
    save();
    renderEntries();

    document.getElementById("manual-desc").value = "";
    document.getElementById("manual-start").value = "";
    document.getElementById("manual-end").value = "";
  });

  // ---------------------------------------------------------------------------
  // Eintragsliste
  // ---------------------------------------------------------------------------

  const entryList = document.getElementById("entry-list");
  const showBilled = document.getElementById("show-billed");
  const entriesSummary = document.getElementById("entries-summary");

  showBilled.addEventListener("change", renderEntries);

  function renderEntries() {
    entryList.innerHTML = "";
    const visible = state.entries
      .filter((e) => showBilled.checked || !e.invoiceId)
      .sort((a, b) => b.start - a.start);

    let openMinutes = 0;
    let openCents = 0;
    for (const entry of state.entries) {
      if (entry.invoiceId) continue;
      const minutes = billableMinutes(entry);
      openMinutes += minutes;
      openCents += Math.round((minutes / 60) * rateCentsFor(clientById(entry.clientId)));
    }
    entriesSummary.textContent =
      `Offen (noch nicht abgerechnet): ${formatDuration(openMinutes)} ≈ ${formatEuro(openCents)} netto`;

    if (visible.length === 0) {
      const li = document.createElement("li");
      li.className = "muted empty";
      li.textContent = "Noch keine Einträge.";
      entryList.append(li);
      return;
    }

    for (const entry of visible) {
      const client = clientById(entry.clientId);
      const invoice = entry.invoiceId ? state.invoices.find((i) => i.id === entry.invoiceId) : null;
      const li = document.createElement("li");
      li.className = "entry" + (entry.invoiceId ? " billed" : "");
      li.innerHTML = `
        <div class="entry-main">
          <strong>${escapeHtml(client ? client.name : "(gelöschter Kunde)")}</strong>
          <span>${escapeHtml(entry.description || "–")}</span>
        </div>
        <div class="entry-meta">
          <span>${formatDate(isoDate(new Date(entry.start)))}, ${formatTime(entry.start)}–${formatTime(entry.end)}</span>
          <span class="entry-duration">${formatDuration(entryMinutes(entry))}</span>
          ${invoice ? `<span class="badge">${escapeHtml(invoice.number)}</span>` : ""}
        </div>`;
      if (!entry.invoiceId) {
        const del = document.createElement("button");
        del.type = "button";
        del.className = "icon-btn";
        del.setAttribute("aria-label", "Eintrag löschen");
        del.textContent = "×";
        del.addEventListener("click", () => {
          if (!confirm("Diesen Eintrag löschen?")) return;
          state.entries = state.entries.filter((e) => e.id !== entry.id);
          save();
          renderEntries();
        });
        li.append(del);
      }
      entryList.append(li);
    }
  }

  // ---------------------------------------------------------------------------
  // Kunden
  // ---------------------------------------------------------------------------

  const clientForm = document.getElementById("client-form");
  const clientList = document.getElementById("client-list");
  const clientCancel = document.getElementById("client-cancel");
  const clientFields = ["name", "contact", "street", "zip", "city", "email"];

  function resetClientForm() {
    clientForm.reset();
    document.getElementById("client-id").value = "";
    document.getElementById("client-form-title").textContent = "Neuer Kunde";
    clientCancel.hidden = true;
  }

  function editClient(client) {
    document.getElementById("client-id").value = client.id;
    for (const f of clientFields) document.getElementById("client-" + f).value = client[f] || "";
    document.getElementById("client-rate").value =
      client.rate != null ? formatNumber(client.rate) : "";
    document.getElementById("client-form-title").textContent = "Kunde bearbeiten";
    clientCancel.hidden = false;
    document.getElementById("client-name").focus();
  }

  clientCancel.addEventListener("click", resetClientForm);

  clientForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = document.getElementById("client-id").value;
    const data = {};
    for (const f of clientFields) data[f] = document.getElementById("client-" + f).value.trim();
    const rateText = document.getElementById("client-rate").value.trim();
    data.rate = rateText ? parseDecimal(rateText) : null;
    if (rateText && data.rate === null) {
      alert("Der Stundensatz ist keine gültige Zahl.");
      return;
    }
    if (!data.name) return;

    const existing = clientById(id);
    if (existing) Object.assign(existing, data);
    else state.clients.push({ id: cryptoId(), ...data });
    save();
    resetClientForm();
    renderAll();
  });

  function renderClients() {
    clientList.innerHTML = "";
    if (state.clients.length === 0) {
      const li = document.createElement("li");
      li.className = "muted empty";
      li.textContent = "Noch keine Kunden angelegt.";
      clientList.append(li);
      return;
    }
    for (const client of state.clients) {
      const li = document.createElement("li");
      const address = [client.street, [client.zip, client.city].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ");
      li.innerHTML = `
        <div class="list-main">
          <strong>${escapeHtml(client.name)}</strong>
          <span class="muted">${escapeHtml(address || "keine Adresse")}</span>
          <span class="muted">${formatEuro(rateCentsFor(client))} / h${client.rate == null ? " (Standard)" : ""}</span>
        </div>
        <div class="list-actions">
          <button type="button" class="btn-secondary small" data-act="edit">Bearbeiten</button>
          <button type="button" class="btn-danger small" data-act="delete">Löschen</button>
        </div>`;
      li.querySelector('[data-act="edit"]').addEventListener("click", () => editClient(client));
      li.querySelector('[data-act="delete"]').addEventListener("click", () => {
        if (state.entries.some((e) => e.clientId === client.id)) {
          alert("Zu diesem Kunden gibt es noch Zeiteinträge. Bitte diese zuerst löschen.");
          return;
        }
        if (!confirm(`Kunde „${client.name}“ löschen?`)) return;
        state.clients = state.clients.filter((c) => c.id !== client.id);
        save();
        renderAll();
      });
      clientList.append(li);
    }
  }

  // ---------------------------------------------------------------------------
  // Rechnungs-Editor
  // ---------------------------------------------------------------------------

  const invoiceForm = document.getElementById("invoice-form");
  const invClient = document.getElementById("inv-client");
  const invFrom = document.getElementById("inv-from");
  const invTo = document.getElementById("inv-to");
  const invItemsBody = document.getElementById("inv-items");
  const invTotals = document.getElementById("inv-totals");

  /** @type {{items: InvoiceItem[], entryIds: string[]}} */
  let draft = { items: [], entryIds: [] };

  function resetInvoiceForm() {
    draft = { items: [], entryIds: [] };
    invoiceForm.reset();
    document.getElementById("inv-group").checked = true;
    document.getElementById("inv-number").value = suggestedInvoiceNumber();
    document.getElementById("inv-date").value = isoDate(new Date());
    document.getElementById("inv-due-days").value = state.settings.paymentDays;
    renderClientSelects();
    renderDraftItems();
  }

  function loadOpenEntries() {
    const client = clientById(invClient.value);
    if (!client) {
      alert("Bitte einen Kunden auswählen.");
      return;
    }
    const from = invFrom.value;
    const to = invTo.value;
    const entries = state.entries
      .filter((e) => e.clientId === client.id && !e.invoiceId)
      .filter((e) => {
        const day = isoDate(new Date(e.start));
        return (!from || day >= from) && (!to || day <= to);
      })
      .sort((a, b) => a.start - b.start);

    if (entries.length === 0) {
      alert("Für diesen Kunden gibt es im gewählten Zeitraum keine offenen Zeiten.");
      return;
    }

    const rate = rateCentsFor(client);
    const items = [];
    if (document.getElementById("inv-group").checked) {
      const groups = new Map();
      for (const e of entries) {
        const key = e.description || "Dienstleistung";
        groups.set(key, (groups.get(key) || 0) + billableMinutes(e));
      }
      for (const [description, minutes] of groups) {
        items.push({ description, quantity: round2(minutes / 60), unit: "Std.", unitPriceCents: rate });
      }
    } else {
      for (const e of entries) {
        items.push({
          description: `${formatDate(isoDate(new Date(e.start)))}: ${e.description || "Dienstleistung"}`,
          quantity: round2(billableMinutes(e) / 60),
          unit: "Std.",
          unitPriceCents: rate,
        });
      }
    }

    // Manuell ergänzte Positionen bleiben stehen, nur die Zeit-Positionen werden ersetzt.
    draft.items = draft.items.filter((i) => !i.fromEntries).concat(items.map((i) => ({ ...i, fromEntries: true })));
    draft.entryIds = entries.map((e) => e.id);
    if (!from) invFrom.value = isoDate(new Date(entries[0].start));
    if (!to) invTo.value = isoDate(new Date(entries[entries.length - 1].start));
    renderDraftItems();
  }

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function renderDraftItems() {
    invItemsBody.innerHTML = "";
    if (draft.items.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="6" class="muted empty">Noch keine Positionen – offene Zeiten übernehmen oder Position hinzufügen.</td>`;
      invItemsBody.append(tr);
    }
    draft.items.forEach((item, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input type="text" class="it-desc" maxlength="200" /></td>
        <td class="num"><input type="text" inputmode="decimal" class="it-qty num" /></td>
        <td><input type="text" class="it-unit" maxlength="15" /></td>
        <td class="num"><input type="text" inputmode="decimal" class="it-price num" /></td>
        <td class="num it-total"></td>
        <td><button type="button" class="icon-btn" aria-label="Position entfernen">×</button></td>`;
      const desc = tr.querySelector(".it-desc");
      const qty = tr.querySelector(".it-qty");
      const unit = tr.querySelector(".it-unit");
      const price = tr.querySelector(".it-price");
      const total = tr.querySelector(".it-total");
      desc.value = item.description;
      qty.value = formatNumber(item.quantity);
      unit.value = item.unit;
      price.value = formatNumber(item.unitPriceCents / 100);
      total.textContent = formatEuro(lineTotalCents(item));

      desc.addEventListener("input", () => (item.description = desc.value));
      unit.addEventListener("input", () => (item.unit = unit.value));
      const onNumber = () => {
        const q = parseDecimal(qty.value);
        const p = parseDecimal(price.value);
        qty.classList.toggle("invalid", q === null);
        price.classList.toggle("invalid", p === null);
        item.quantity = q ?? 0;
        item.unitPriceCents = Math.round((p ?? 0) * 100);
        total.textContent = formatEuro(lineTotalCents(item));
        renderDraftTotals();
      };
      qty.addEventListener("input", onNumber);
      price.addEventListener("input", onNumber);
      tr.querySelector(".icon-btn").addEventListener("click", () => {
        draft.items.splice(index, 1);
        if (!draft.items.some((i) => i.fromEntries)) draft.entryIds = [];
        renderDraftItems();
      });
      invItemsBody.append(tr);
    });
    renderDraftTotals();
  }

  function renderDraftTotals() {
    const s = state.settings;
    const vatRate = Number(s.vatRate) || 0;
    const t = computeTotals(draft.items, vatRate, s.smallBusiness);
    invTotals.innerHTML = `
      <div><span>Netto</span><span>${formatEuro(t.net)}</span></div>
      ${s.smallBusiness ? `<div class="muted"><span>Kleinunternehmer, keine USt.</span><span></span></div>`
        : `<div><span>zzgl. ${formatNumber(vatRate, vatRate % 1 ? 1 : 0)}&nbsp;% USt.</span><span>${formatEuro(t.vat)}</span></div>`}
      <div class="grand"><span>Gesamt</span><span>${formatEuro(t.gross)}</span></div>`;
  }

  document.getElementById("inv-load").addEventListener("click", loadOpenEntries);
  document.getElementById("inv-clear").addEventListener("click", () => {
    if (draft.items.length && !confirm("Formular wirklich leeren?")) return;
    resetInvoiceForm();
  });
  document.getElementById("inv-add-item").addEventListener("click", () => {
    draft.items.push({ description: "", quantity: 1, unit: "Stk.", unitPriceCents: 0 });
    renderDraftItems();
    const inputs = invItemsBody.querySelectorAll(".it-desc");
    inputs[inputs.length - 1].focus();
  });
  invClient.addEventListener("change", () => {
    // Übernommene Zeiten gehören zum vorher gewählten Kunden.
    if (draft.entryIds.length) {
      draft.items = draft.items.filter((i) => !i.fromEntries);
      draft.entryIds = [];
      renderDraftItems();
    }
  });

  invoiceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const client = clientById(invClient.value);
    if (!client) {
      alert("Bitte einen Kunden auswählen.");
      return;
    }
    const items = draft.items.filter((i) => i.description.trim() || i.quantity || i.unitPriceCents);
    if (items.length === 0) {
      alert("Die Rechnung hat noch keine Positionen.");
      return;
    }
    if (invItemsBody.querySelector(".invalid")) {
      alert("Bitte die rot markierten Felder korrigieren.");
      return;
    }
    const number = document.getElementById("inv-number").value.trim();
    if (state.invoices.some((i) => i.number === number)) {
      alert(`Die Rechnungsnummer „${number}“ ist bereits vergeben.`);
      return;
    }

    const s = state.settings;
    const date = document.getElementById("inv-date").value;
    const dueDays = Number(document.getElementById("inv-due-days").value) || 0;
    const invoice = {
      id: cryptoId(),
      number,
      date,
      dueDate: addDays(date, dueDays),
      periodFrom: invFrom.value,
      periodTo: invTo.value,
      subject: document.getElementById("inv-subject").value.trim(),
      notes: document.getElementById("inv-notes").value.trim(),
      // Absender und Empfänger werden eingefroren: spätere Änderungen an
      // „Meine Daten“ oder am Kunden verändern eine ausgestellte Rechnung nicht.
      sender: { ...s },
      client: { ...client },
      items: items.map(({ description, quantity, unit, unitPriceCents }) => ({
        description: description.trim(),
        quantity,
        unit: unit.trim(),
        unitPriceCents,
      })),
      vatRate: Number(s.vatRate) || 0,
      smallBusiness: !!s.smallBusiness,
      entryIds: [...draft.entryIds],
      paid: false,
    };

    state.invoices.push(invoice);
    for (const entry of state.entries) {
      if (invoice.entryIds.includes(entry.id)) entry.invoiceId = invoice.id;
    }
    if (number === suggestedInvoiceNumber()) s.nextInvoiceNumber = Number(s.nextInvoiceNumber) + 1;
    save();

    resetInvoiceForm();
    renderAll();
    openInvoice(invoice);
  });

  // ---------------------------------------------------------------------------
  // Rechnungsliste
  // ---------------------------------------------------------------------------

  const invoiceList = document.getElementById("invoice-list");

  function renderInvoices() {
    invoiceList.innerHTML = "";
    if (state.invoices.length === 0) {
      const li = document.createElement("li");
      li.className = "muted empty";
      li.textContent = "Noch keine Rechnungen erstellt.";
      invoiceList.append(li);
      return;
    }
    const sorted = [...state.invoices].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    for (const invoice of sorted) {
      const t = computeTotals(invoice.items, invoice.vatRate, invoice.smallBusiness);
      const overdue = !invoice.paid && invoice.dueDate < isoDate(new Date());
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="list-main">
          <strong>${escapeHtml(invoice.number)} · ${escapeHtml(invoice.client.name)}</strong>
          <span class="muted">${formatDate(invoice.date)} · ${formatEuro(t.gross)}</span>
          <span class="badge ${invoice.paid ? "paid" : overdue ? "overdue" : ""}">
            ${invoice.paid ? "bezahlt" : overdue ? "überfällig" : "offen bis " + formatDate(invoice.dueDate)}
          </span>
        </div>
        <div class="list-actions">
          <button type="button" class="btn-primary small" data-act="open">Anzeigen</button>
          <button type="button" class="btn-secondary small" data-act="paid">${invoice.paid ? "Als offen markieren" : "Als bezahlt markieren"}</button>
          <button type="button" class="btn-danger small" data-act="delete">Löschen</button>
        </div>`;
      li.querySelector('[data-act="open"]').addEventListener("click", () => openInvoice(invoice));
      li.querySelector('[data-act="paid"]').addEventListener("click", () => {
        invoice.paid = !invoice.paid;
        save();
        renderInvoices();
      });
      li.querySelector('[data-act="delete"]').addEventListener("click", () => {
        if (!confirm(
          `Rechnung ${invoice.number} löschen? Die zugehörigen Zeiten werden wieder als offen markiert.\n\n` +
          "Hinweis: Bereits verschickte Rechnungen sollten statt gelöscht besser storniert werden."
        )) return;
        state.invoices = state.invoices.filter((i) => i.id !== invoice.id);
        for (const entry of state.entries) {
          if (entry.invoiceId === invoice.id) entry.invoiceId = null;
        }
        save();
        renderAll();
      });
      invoiceList.append(li);
    }
  }

  // ---------------------------------------------------------------------------
  // Rechnungsansicht (Druck / PDF)
  // ---------------------------------------------------------------------------

  const invoiceView = document.getElementById("invoice-view");
  const invoicePaper = document.getElementById("invoice-paper");
  const mainEl = document.querySelector("main");
  const headerEl = document.querySelector(".app-header");

  function addressLines(p) {
    return [p.company, p.name, p.contact, p.street, [p.zip, p.city].filter(Boolean).join(" ")]
      .filter(Boolean)
      .map(escapeHtml);
  }

  function renderInvoiceHtml(inv) {
    const s = inv.sender;
    const c = inv.client;
    const t = computeTotals(inv.items, inv.vatRate, inv.smallBusiness);
    const senderOneLine = [s.company || s.name, s.street, [s.zip, s.city].filter(Boolean).join(" ")]
      .filter(Boolean)
      .map(escapeHtml)
      .join(" · ");
    const period =
      inv.periodFrom && inv.periodTo && inv.periodFrom !== inv.periodTo
        ? `${formatDate(inv.periodFrom)} – ${formatDate(inv.periodTo)}`
        : formatDate(inv.periodFrom || inv.periodTo || inv.date);

    const rows = inv.items
      .map(
        (item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(item.description)}</td>
          <td class="num">${formatNumber(item.quantity)} ${escapeHtml(item.unit)}</td>
          <td class="num">${formatEuro(item.unitPriceCents)}</td>
          <td class="num">${formatEuro(lineTotalCents(item))}</td>
        </tr>`
      )
      .join("");

    const footerCols = [
      addressLines(s).concat([s.email, s.phone].filter(Boolean).map(escapeHtml)),
      [
        s.taxNumber && "Steuernummer: " + escapeHtml(s.taxNumber),
        s.vatId && "USt-IdNr.: " + escapeHtml(s.vatId),
      ].filter(Boolean),
      [
        s.bank && escapeHtml(s.bank),
        s.iban && "IBAN: " + escapeHtml(s.iban),
        s.bic && "BIC: " + escapeHtml(s.bic),
      ].filter(Boolean),
    ];

    return `
      <div class="inv-head">
        <div class="inv-sender-name">${escapeHtml(s.company || s.name || "Ihr Name")}</div>
      </div>
      <div class="inv-top">
        <div class="inv-recipient">
          <div class="inv-sender-line">${senderOneLine}</div>
          ${addressLines(c).join("<br />")}
        </div>
        <table class="inv-meta">
          <tr><td>Rechnungsnummer</td><td>${escapeHtml(inv.number)}</td></tr>
          <tr><td>Rechnungsdatum</td><td>${formatDate(inv.date)}</td></tr>
          <tr><td>Leistungszeitraum</td><td>${period}</td></tr>
          <tr><td>Fällig am</td><td>${formatDate(inv.dueDate)}</td></tr>
        </table>
      </div>

      <h2 class="inv-title">${escapeHtml(inv.subject || "Rechnung")} ${escapeHtml(inv.number)}</h2>
      <p>${c.contact ? "Sehr geehrte/r " + escapeHtml(c.contact) + "," : "Sehr geehrte Damen und Herren,"}</p>
      <p>für meine Leistungen erlaube ich mir, Ihnen folgende Positionen in Rechnung zu stellen:</p>

      <table class="inv-items">
        <thead>
          <tr><th>Pos.</th><th>Beschreibung</th><th class="num">Menge</th><th class="num">Einzelpreis</th><th class="num">Gesamt</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <table class="inv-sum">
        <tr><td>Summe netto</td><td class="num">${formatEuro(t.net)}</td></tr>
        ${inv.smallBusiness ? "" : `<tr><td>zzgl. ${formatNumber(inv.vatRate, inv.vatRate % 1 ? 1 : 0)} % USt.</td><td class="num">${formatEuro(t.vat)}</td></tr>`}
        <tr class="grand"><td>Rechnungsbetrag</td><td class="num">${formatEuro(t.gross)}</td></tr>
      </table>

      ${inv.smallBusiness ? "<p>Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.</p>" : ""}
      <p>Bitte überweisen Sie den Rechnungsbetrag bis zum <strong>${formatDate(inv.dueDate)}</strong>
        unter Angabe der Rechnungsnummer auf das unten genannte Konto.</p>
      ${inv.notes ? `<p class="inv-notes">${escapeHtml(inv.notes).replace(/\n/g, "<br />")}</p>` : ""}
      <p>Mit freundlichen Grüßen<br />${escapeHtml(s.name || s.company)}</p>

      <footer class="inv-footer">
        ${footerCols.map((col) => `<div>${col.join("<br />")}</div>`).join("")}
      </footer>`;
  }

  function openInvoice(invoice) {
    invoicePaper.innerHTML = renderInvoiceHtml(invoice);
    invoiceView.hidden = false;
    mainEl.hidden = true;
    headerEl.hidden = true;
    document.title = `Rechnung ${invoice.number}`;
    window.scrollTo(0, 0);
  }

  function closeInvoice() {
    invoiceView.hidden = true;
    mainEl.hidden = false;
    headerEl.hidden = false;
    tickTimer();
  }

  document.getElementById("inv-back").addEventListener("click", closeInvoice);
  document.getElementById("inv-print").addEventListener("click", () => window.print());

  // ---------------------------------------------------------------------------
  // Meine Daten
  // ---------------------------------------------------------------------------

  const settingsForm = document.getElementById("settings-form");
  const numericSettings = ["defaultRate", "vatRate"];

  function fillSettingsForm() {
    const s = state.settings;
    for (const el of settingsForm.elements) {
      if (!el.name) continue;
      if (el.type === "checkbox") el.checked = !!s[el.name];
      else if (numericSettings.includes(el.name)) el.value = formatNumber(Number(s[el.name]) || 0);
      else el.value = s[el.name] ?? "";
    }
  }

  settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const next = { ...state.settings };
    for (const el of settingsForm.elements) {
      if (!el.name) continue;
      if (el.type === "checkbox") next[el.name] = el.checked;
      else if (numericSettings.includes(el.name)) {
        const value = parseDecimal(el.value);
        if (value === null) {
          alert("Bitte eine gültige Zahl eingeben: " + el.closest("label").firstChild.textContent.trim());
          el.focus();
          return;
        }
        next[el.name] = value;
      } else if (el.type === "number" || el.tagName === "SELECT") next[el.name] = Number(el.value) || 0;
      else next[el.name] = el.value.trim();
    }
    next.nextInvoiceNumber = Math.max(1, next.nextInvoiceNumber);
    state.settings = next;
    save();
    renderAll();

    const saved = document.getElementById("settings-saved");
    saved.hidden = false;
    setTimeout(() => (saved.hidden = true), 2000);
  });

  // ---------------------------------------------------------------------------
  // Backup
  // ---------------------------------------------------------------------------

  document.getElementById("export-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `zeiterfassung-backup-${isoDate(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  });

  document.getElementById("import-file").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imported = normalizeState(JSON.parse(await file.text()));
      if (!imported) throw new Error("Format");
      if (!confirm("Alle aktuellen Daten durch das Backup ersetzen?")) return;
      state = imported;
      save();
      resetInvoiceForm();
      renderAll();
      alert("Backup eingespielt.");
    } catch {
      alert("Die Datei ist kein gültiges Backup dieser App.");
    }
  });

  // ---------------------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------------------

  function renderAll() {
    renderClientSelects();
    renderClients();
    renderEntries();
    renderInvoices();
    fillSettingsForm();
    renderDraftTotals();
    updateTimerUi();
    const numberInput = document.getElementById("inv-number");
    if (!draft.items.length) numberInput.value = suggestedInvoiceNumber();
  }

  document.getElementById("manual-date").value = isoDate(new Date());

  let initialTab = "time";
  try {
    initialTab = localStorage.getItem(STORAGE_KEY + ".tab") || "time";
  } catch {
    /* egal */
  }
  if (state.clients.length === 0) initialTab = "clients";
  showTab(initialTab);

  resetInvoiceForm();
  renderAll();
})();
