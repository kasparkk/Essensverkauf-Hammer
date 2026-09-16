(function () {
  "use strict";

  const STORAGE_KEY = "gebaerden-assistent.history.v1";
  const MAX_HISTORY = 50;

  const micBtn = document.getElementById("mic-btn");
  const micLabel = document.getElementById("mic-label");
  const micStatus = document.getElementById("mic-status");
  const textForm = document.getElementById("text-form");
  const textInput = document.getElementById("text-input");
  const interimCaptionEl = document.getElementById("interim-caption");
  const finalCaptionEl = document.getElementById("final-caption");
  const fingerspellingToggle = document.getElementById("fingerspelling-toggle");
  const fingerspellingStrip = document.getElementById("fingerspelling-strip");
  const playBtn = document.getElementById("play-btn");
  const speedRange = document.getElementById("speed-range");
  const fontsizeRange = document.getElementById("fontsize-range");
  const historyList = document.getElementById("history-list");
  const historyItemTemplate = document.getElementById("history-item-template");
  const clearHistoryBtn = document.getElementById("clear-history-btn");
  const langSelect = document.getElementById("lang-select");

  const LANG_STORAGE_KEY = "gebaerden-assistent.lang.v1";
  const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
  if (savedLang) langSelect.value = savedLang;

  const SpeechRecognitionCtor =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;

  let recognition = null;
  let listening = false;
  let playbackTimer = null;
  let playbackTokens = [];
  let playbackIndex = 0;

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveHistory(history) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  }

  let history = loadHistory();

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderHistory() {
    historyList.innerHTML = "";
    for (const entry of history) {
      const node = historyItemTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector(".history-time").textContent = formatTime(entry.ts);
      node.querySelector(".history-text").textContent = entry.text;
      node.querySelector(".history-replay").addEventListener("click", () => {
        showFinalText(entry.text, false);
      });
      historyList.appendChild(node);
    }
  }

  function addToHistory(text) {
    if (!text.trim()) return;
    history.unshift({ text: text.trim(), ts: Date.now() });
    history = history.slice(0, MAX_HISTORY);
    saveHistory(history);
    renderHistory();
  }

  clearHistoryBtn.addEventListener("click", () => {
    if (!confirm("Verlauf wirklich löschen?")) return;
    history = [];
    saveHistory(history);
    renderHistory();
  });

  // ---- Fingeralphabet-Wiedergabe ------------------------------------

  function tokenize(text) {
    // Zerlegt in Wörter, Leerzeichen bleiben als eigenes Token für Pausen.
    const tokens = [];
    const words = text.split(/(\s+)/);
    for (const w of words) {
      if (!w) continue;
      if (/^\s+$/.test(w)) {
        tokens.push({ type: "space" });
      } else {
        for (const ch of w) {
          tokens.push({ type: "letter", value: ch });
        }
        tokens.push({ type: "wordend" });
      }
    }
    return tokens;
  }

  function stopPlayback() {
    if (playbackTimer) {
      clearTimeout(playbackTimer);
      playbackTimer = null;
    }
    playBtn.textContent = "▶️ Abspielen";
  }

  function highlightToken(index) {
    const nodes = fingerspellingStrip.querySelectorAll(".letter-tile");
    nodes.forEach((n) => n.classList.remove("active"));
    if (nodes[index]) {
      nodes[index].classList.add("active");
      nodes[index].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }

  function buildFingerspellingStrip(text) {
    fingerspellingStrip.innerHTML = "";
    playbackTokens = tokenize(text).filter((t) => t.type === "letter");
    playbackIndex = 0;
    stopPlayback();
    if (window.SignAvatar) window.SignAvatar.reset();

    if (!text.trim()) return;

    const words = text.trim().split(/\s+/);
    for (const word of words) {
      const wordEl = document.createElement("div");
      wordEl.className = "word-group";
      for (const ch of word) {
        const svg = window.Fingeralphabet.renderHandSVG(ch);
        const tile = document.createElement("div");
        tile.className = "letter-tile";
        if (svg) {
          tile.innerHTML = svg;
          const note = window.Fingeralphabet.getNote(ch);
          if (note) tile.title = note;
        } else {
          tile.classList.add("letter-tile--plain");
          tile.textContent = ch;
        }
        const caption = document.createElement("span");
        caption.className = "letter-caption";
        caption.textContent = ch === "ß" ? ch : ch.toUpperCase();
        tile.appendChild(caption);
        wordEl.appendChild(tile);
      }
      fingerspellingStrip.appendChild(wordEl);
    }
  }

  function playFingerspelling() {
    const tiles = fingerspellingStrip.querySelectorAll(".letter-tile");
    if (!tiles.length) return;
    if (playbackTimer) {
      stopPlayback();
      return;
    }
    playBtn.textContent = "⏸ Pause";
    if (playbackIndex >= tiles.length) playbackIndex = 0;

    const step = () => {
      if (playbackIndex >= tiles.length) {
        stopPlayback();
        playbackIndex = 0;
        if (window.SignAvatar) window.SignAvatar.reset();
        return;
      }
      const speed = Number(speedRange.value);
      highlightToken(playbackIndex);
      const token = playbackTokens[playbackIndex];
      if (window.SignAvatar && token) window.SignAvatar.showLetter(token.value, speed * 0.8);
      playbackIndex += 1;
      playbackTimer = setTimeout(step, speed);
    };
    step();
  }

  playBtn.addEventListener("click", playFingerspelling);

  // ---- Untertitel-Anzeige --------------------------------------------

  function showFinalText(text, saveToHistory) {
    finalCaptionEl.textContent = text;
    interimCaptionEl.textContent = "";
    if (fingerspellingToggle.checked) buildFingerspellingStrip(text);
    if (saveToHistory) addToHistory(text);
  }

  fontsizeRange.addEventListener("input", () => {
    finalCaptionEl.style.fontSize = fontsizeRange.value + "px";
  });
  finalCaptionEl.style.fontSize = fontsizeRange.value + "px";

  fingerspellingToggle.addEventListener("change", () => {
    document.querySelector(".fingerspelling-section").classList.toggle(
      "is-hidden",
      !fingerspellingToggle.checked
    );
    if (fingerspellingToggle.checked && finalCaptionEl.textContent) {
      buildFingerspellingStrip(finalCaptionEl.textContent);
    }
  });

  textForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = textInput.value.trim();
    if (!text) return;
    showFinalText(text, true);
    textForm.reset();
  });

  // ---- Spracherkennung -------------------------------------------------

  function setStatus(message) {
    micStatus.textContent = message;
  }

  if (!SpeechRecognitionCtor) {
    micBtn.disabled = true;
    micLabel.textContent = "Spracherkennung nicht unterstützt";
    setStatus(
      "Dieser Browser unterstützt keine Spracherkennung (Web Speech API). " +
        "Bitte Text manuell eingeben oder einen aktuellen Chrome/Edge verwenden."
    );
  } else {
    recognition = new SpeechRecognitionCtor();
    recognition.lang = langSelect.value || "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.addEventListener("start", () => {
      listening = true;
      micBtn.classList.add("is-listening");
      micLabel.textContent = "Mikrofon stoppen";
      setStatus("Höre zu … sprich jetzt.");
    });

    recognition.addEventListener("end", () => {
      listening = false;
      micBtn.classList.remove("is-listening");
      micLabel.textContent = "Mikrofon starten";
      if (!micStatus.dataset.error) setStatus("Mikrofon gestoppt.");
    });

    recognition.addEventListener("error", (event) => {
      delete micStatus.dataset.error;
      if (event.error === "no-speech") {
        setStatus("Keine Sprache erkannt – bitte weitersprechen.");
        return;
      }
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        micStatus.dataset.error = "1";
        setStatus("Mikrofonzugriff wurde verweigert. Bitte in den Browser-Einstellungen erlauben.");
        return;
      }
      micStatus.dataset.error = "1";
      setStatus("Fehler bei der Spracherkennung: " + event.error);
    });

    recognition.addEventListener("result", (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) interimCaptionEl.textContent = interim;
      if (final) showFinalText(final.trim(), true);
    });

    langSelect.addEventListener("change", () => {
      localStorage.setItem(LANG_STORAGE_KEY, langSelect.value);
      recognition.lang = langSelect.value;
      if (listening) {
        recognition.addEventListener("end", () => recognition.start(), { once: true });
        recognition.stop();
      }
    });

    micBtn.addEventListener("click", () => {
      if (listening) {
        recognition.stop();
      } else {
        delete micStatus.dataset.error;
        try {
          recognition.start();
        } catch {
          // Erkennung läuft bereits oder wurde zu schnell erneut gestartet.
        }
      }
    });
  }

  renderHistory();
})();
