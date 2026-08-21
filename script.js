const STORAGE_KEY = "wortschmiede-werkbank";

const wordDisplay = document.getElementById("wordDisplay");
const wordMeta = document.getElementById("wordMeta");
const meaningBlock = document.getElementById("meaningBlock");
const wordMeaning = document.getElementById("wordMeaning");
const exampleBlock = document.getElementById("exampleBlock");
const wordExample = document.getElementById("wordExample");
const kindBadge = document.getElementById("kindBadge");
const serial = document.getElementById("serial");
const generateBtn = document.getElementById("generateBtn");
const saveBtn = document.getElementById("saveBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const favList = document.getElementById("favList");
const favEmpty = document.getElementById("favEmpty");
const favCount = document.getElementById("favCount");

let currentWord = null;
let lastWord = null;
let strikeCount = 0;

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildSyllable() {
  return pickRandom(onsets) + pickRandom(nuclei) + pickRandom(codas);
}

function buildStem() {
  const count = Math.random() < 0.7 ? 2 : 3;
  let stem = "";
  for (let i = 0; i < count; i++) stem += buildSyllable();
  return stem;
}

function badgeLabel(kind) {
  if (kind === "verb") return "Verb";
  if (kind === "adj") return "Adj.";
  return kind;
}

function kindColorVar(kind) {
  if (kind === "der") return "var(--der)";
  if (kind === "die") return "var(--die)";
  if (kind === "das") return "var(--das)";
  if (kind === "verb") return "var(--verb)";
  return "var(--adj)";
}

function generateNoun() {
  const stem = buildStem();
  const ending = pickRandom(nounEndings);
  const word = capitalize(stem + ending.suffix);
  const meaning = capitalize(pickRandom(nounTemplates)(pickRandom(scenarios))) + ".";
  const example = `„${pickRandom(nounExamples)(word)}“`;
  return { word, kind: ending.gender, metaLabel: "Substantiv", meaning, example };
}

function generateVerb() {
  const stem = buildStem();
  const word = stem + pickRandom(verbEndings);
  const meaning = capitalize(pickRandom(verbActions)) + ".";
  const example = `„${pickRandom(verbExamples)(word)}“`;
  return { word, kind: "verb", metaLabel: "Verb", meaning, example };
}

function generateAdj() {
  const stem = buildStem();
  const word = stem + pickRandom(adjEndings);
  const meaning = capitalize(pickRandom(adjQualities)) + ".";
  const example = `„${pickRandom(adjExamples)(word)}“`;
  return { word, kind: "adj", metaLabel: "Adjektiv", meaning, example };
}

function generateWord() {
  let entry;
  do {
    const cls = pickRandom(wordClasses);
    entry = cls === "noun" ? generateNoun() : cls === "verb" ? generateVerb() : generateAdj();
  } while (entry.word === lastWord);
  lastWord = entry.word;
  currentWord = entry;
  return entry;
}

function render(entry) {
  strikeCount += 1;
  serial.textContent = String(strikeCount).padStart(3, "0");

  kindBadge.textContent = badgeLabel(entry.kind);
  kindBadge.dataset.kind = entry.kind;

  wordDisplay.classList.remove("word--empty");
  wordDisplay.textContent = entry.word;

  const wrap = wordDisplay.parentElement;
  const existingGlow = wrap.querySelector(".word__glow");
  if (existingGlow) existingGlow.remove();
  const glow = document.createElement("div");
  glow.className = "word__glow";
  wrap.appendChild(glow);
  requestAnimationFrame(() => {
    glow.classList.add("is-struck");
    setTimeout(() => glow.classList.remove("is-struck"), 650);
  });

  wordMeta.style.display = "block";
  wordMeta.textContent = `${entry.metaLabel} · erfunden · nicht im Duden`;
  meaningBlock.style.display = "block";
  exampleBlock.style.display = "block";
  wordMeaning.textContent = entry.meaning;
  wordExample.textContent = entry.example;

  saveBtn.disabled = false;
  copyBtn.disabled = false;
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveFavorites(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    // localStorage kann in manchen Umgebungen blockiert sein.
  }
}

function renderFavorites() {
  const favorites = loadFavorites();
  favCount.textContent = favorites.length;

  favList.querySelectorAll("li.tag").forEach((el) => el.remove());
  favEmpty.style.display = favorites.length === 0 ? "block" : "none";

  favorites
    .slice()
    .reverse()
    .forEach((entry) => {
      const li = document.createElement("li");
      li.className = "tag";
      li.style.setProperty("--tag-color", kindColorVar(entry.kind));
      li.innerHTML = `
        <div class="tag__word"><span class="tag__kind">${badgeLabel(entry.kind)}</span>${entry.word}</div>
        <p class="tag__meaning">${entry.meaning}</p>
      `;
      favList.appendChild(li);
    });
}

generateBtn.addEventListener("click", () => {
  render(generateWord());
});

saveBtn.addEventListener("click", () => {
  if (!currentWord) return;
  const favorites = loadFavorites();
  const alreadySaved = favorites.some((f) => f.word === currentWord.word);
  if (!alreadySaved) {
    favorites.push(currentWord);
    saveFavorites(favorites);
    renderFavorites();
  }
});

copyBtn.addEventListener("click", async () => {
  if (!currentWord) return;
  const prefix = ["der", "die", "das"].includes(currentWord.kind) ? `${currentWord.kind} ` : "";
  const text = `${prefix}${currentWord.word} – ${currentWord.meaning}`;
  try {
    await navigator.clipboard.writeText(text);
    const original = copyBtn.textContent;
    copyBtn.textContent = "Kopiert";
    setTimeout(() => (copyBtn.textContent = original), 1200);
  } catch (e) {
    // Clipboard-Zugriff kann in manchen Umgebungen blockiert sein.
  }
});

clearBtn.addEventListener("click", () => {
  if (confirm("Wirklich alles von der Werkbank räumen?")) {
    saveFavorites([]);
    renderFavorites();
  }
});

renderFavorites();
