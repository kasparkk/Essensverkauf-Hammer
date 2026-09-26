/**
 * Kinder-Lernmodus: Quiz (Avatar zeigt, Kind rät) und Nachmach-Modus
 * (Kind wählt Buchstabe, Avatar zeigt ihn in Zeitlupe). Nutzt dieselben
 * Fingeralphabet-Daten und denselben 3D-Avatar wie der Live-Modus.
 */
(function () {
  "use strict";

  const PROGRESS_KEY = "gebaerden-assistent.kids-progress.v1";
  const LEARNED_THRESHOLD = 3;

  const quizOptionsEl = document.getElementById("quiz-options");
  const quizFeedbackEl = document.getElementById("quiz-feedback");
  const quizRepeatBtn = document.getElementById("quiz-repeat-btn");
  const practiceGridEl = document.getElementById("practice-grid");
  const progressFillEl = document.getElementById("progress-fill");
  const progressTextEl = document.getElementById("progress-text");
  const kidsResetBtn = document.getElementById("kids-reset-btn");
  const quizPanel = document.getElementById("kids-quiz-panel");
  const practicePanel = document.getElementById("kids-practice-panel");
  const kidsTabQuiz = document.getElementById("kidstab-quiz");
  const kidsTabPractice = document.getElementById("kidstab-practice");

  function loadProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveProgress(progress) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  let progress = loadProgress();

  function letters() {
    return (window.Fingeralphabet && window.Fingeralphabet.letters) || [];
  }

  function updateProgressUI() {
    const all = letters();
    const learned = all.filter((l) => (progress[l] || 0) >= LEARNED_THRESHOLD).length;
    const pct = all.length ? Math.round((learned / all.length) * 100) : 0;
    progressFillEl.style.width = pct + "%";
    progressTextEl.textContent = `${learned} von ${all.length} Buchstaben gelernt`;
  }

  function markResult(letter, correct) {
    const current = progress[letter] || 0;
    progress[letter] = correct
      ? Math.min(current + 1, LEARNED_THRESHOLD)
      : Math.max(current - 1, 0);
    saveProgress(progress);
    updateProgressUI();
  }

  function randomLetter(exclude) {
    const all = letters();
    let pick;
    do {
      pick = all[Math.floor(Math.random() * all.length)];
    } while (all.length > 1 && pick === exclude);
    return pick;
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function showAvatarLetter(letter, durationMs) {
    if (window.SignAvatar) window.SignAvatar.showLetter(letter, durationMs || 700);
  }

  // ---- Quiz -------------------------------------------------------------

  let currentQuizLetter = null;
  let quizLocked = false;

  function nextQuizQuestion() {
    quizLocked = false;
    quizFeedbackEl.textContent = "";
    quizFeedbackEl.className = "quiz-feedback";
    currentQuizLetter = randomLetter(currentQuizLetter);
    showAvatarLetter(currentQuizLetter, 900);

    const all = letters();
    const distractors = shuffle(all.filter((l) => l !== currentQuizLetter)).slice(0, 3);
    const options = shuffle([currentQuizLetter, ...distractors]);

    quizOptionsEl.innerHTML = "";
    options.forEach((letter) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-option";
      btn.textContent = letter;
      btn.addEventListener("click", () => handleQuizAnswer(letter, btn));
      quizOptionsEl.appendChild(btn);
    });
  }

  function handleQuizAnswer(chosen, btn) {
    if (quizLocked) return;
    quizLocked = true;
    const correct = chosen === currentQuizLetter;
    markResult(currentQuizLetter, correct);

    quizOptionsEl.querySelectorAll(".quiz-option").forEach((el) => {
      el.disabled = true;
      if (el.textContent === currentQuizLetter) el.classList.add("is-correct");
    });

    if (correct) {
      btn.classList.add("is-correct");
      quizFeedbackEl.textContent = "Richtig! 🎉";
      quizFeedbackEl.className = "quiz-feedback is-correct";
    } else {
      btn.classList.add("is-wrong");
      quizFeedbackEl.textContent = `Fast! Das war „${currentQuizLetter}“. Nochmal versuchen!`;
      quizFeedbackEl.className = "quiz-feedback is-wrong";
    }

    setTimeout(nextQuizQuestion, correct ? 1400 : 2200);
  }

  quizRepeatBtn.addEventListener("click", () => {
    if (currentQuizLetter) showAvatarLetter(currentQuizLetter, 900);
  });

  // ---- Nachmach-Modus -----------------------------------------------------

  function buildPracticeGrid() {
    practiceGridEl.innerHTML = "";
    letters().forEach((letter) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "practice-letter";
      btn.textContent = letter;
      btn.addEventListener("click", () => {
        practiceGridEl
          .querySelectorAll(".practice-letter")
          .forEach((el) => el.classList.remove("is-active"));
        btn.classList.add("is-active");
        showAvatarLetter(letter, 1400);
      });
      practiceGridEl.appendChild(btn);
    });
  }

  // ---- Unter-Tabs (Quiz / Nachmachen) --------------------------------------

  function setKidsSubMode(sub) {
    const isPractice = sub === "practice";
    quizPanel.hidden = isPractice;
    practicePanel.hidden = !isPractice;
    kidsTabQuiz.classList.toggle("is-active", !isPractice);
    kidsTabPractice.classList.toggle("is-active", isPractice);
  }

  kidsTabQuiz.addEventListener("click", () => setKidsSubMode("quiz"));
  kidsTabPractice.addEventListener("click", () => setKidsSubMode("practice"));

  kidsResetBtn.addEventListener("click", () => {
    if (!confirm("Fortschritt wirklich zurücksetzen?")) return;
    progress = {};
    saveProgress(progress);
    updateProgressUI();
  });

  buildPracticeGrid();
  updateProgressUI();

  let initialized = false;
  window.KidsMode = {
    onActivate() {
      if (!initialized) {
        initialized = true;
        nextQuizQuestion();
        return;
      }
      if (!quizPanel.hidden && currentQuizLetter) {
        showAvatarLetter(currentQuizLetter, 700);
      } else if (!practicePanel.hidden) {
        const active = practiceGridEl.querySelector(".practice-letter.is-active");
        if (active) showAvatarLetter(active.textContent, 700);
      }
    },
  };
})();
