const STORAGE_KEY = "wortschmiede-favoriten";

const wordDisplay = document.getElementById("wordDisplay");
const wordMeta = document.getElementById("wordMeta");
const wordMeaning = document.getElementById("wordMeaning");
const wordExample = document.getElementById("wordExample");
const genderBadge = document.getElementById("genderBadge");
const generateBtn = document.getElementById("generateBtn");
const saveBtn = document.getElementById("saveBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const favList = document.getElementById("favList");
const favEmpty = document.getElementById("favEmpty");
const favCount = document.getElementById("favCount");

let currentWord = null;
let lastKey = null;

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateWord() {
  let first, second, key;
  do {
    first = pickRandom(firstParts);
    second = pickRandom(secondParts);
    key = `${first.stem}-${second.suffix}`;
  } while (key === lastKey && firstParts.length * secondParts.length > 1);
  lastKey = key;

  const word = `${first.stem}${first.fugen}${second.suffix}`;
  const meaning = capitalize(second.build(first.clause));
  const example = pickRandom(exampleTemplates)(word);

  currentWord = {
    word,
    gender: second.gender,
    meaning,
    example,
  };
  return currentWord;
}

function render(entry) {
  genderBadge.textContent = entry.gender;
  genderBadge.dataset.gender = entry.gender;
  wordDisplay.textContent = `${entry.gender} ${entry.word}`;
  wordMeta.textContent = "Substantiv (erfunden) · noch nicht im Duden";
  wordMeaning.textContent = entry.meaning + ".";
  wordExample.textContent = `„${entry.example}“`;

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function renderFavorites() {
  const favorites = loadFavorites();
  favCount.textContent = favorites.length;
  favList.querySelectorAll("li.favorite-item").forEach((el) => el.remove());
  favEmpty.style.display = favorites.length === 0 ? "block" : "none";

  favorites
    .slice()
    .reverse()
    .forEach((entry) => {
      const li = document.createElement("li");
      li.className = "favorite-item";
      li.innerHTML = `
        <div class="favorite-item__word"><span class="favorite-item__gender">${entry.gender}</span> ${entry.word}</div>
        <div class="favorite-item__meaning">${entry.meaning}.</div>
      `;
      favList.appendChild(li);
    });
}

generateBtn.addEventListener("click", () => {
  const entry = generateWord();
  render(entry);
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
  const text = `${currentWord.gender} ${currentWord.word} – ${currentWord.meaning}.`;
  try {
    await navigator.clipboard.writeText(text);
    const original = copyBtn.textContent;
    copyBtn.textContent = "✅ Kopiert!";
    setTimeout(() => (copyBtn.textContent = original), 1200);
  } catch (e) {
    // Clipboard-Zugriff kann in manchen Umgebungen blockiert sein.
  }
});

clearBtn.addEventListener("click", () => {
  if (confirm("Wirklich alle gemerkten Wörter löschen?")) {
    saveFavorites([]);
    renderFavorites();
  }
});

renderFavorites();
