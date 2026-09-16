/**
 * Vereinfachtes Fingeralphabet-Schema (angenähert an gängige einhändige
 * Fingeralphabete). Dies ist eine schematische Lern-/Demo-Darstellung,
 * KEINE amtlich geprüfte DGS-Referenz. Siehe README für Hinweise zu
 * verlässlichen Quellen (z. B. Gehörlosenverbände, DGS-Kurse).
 *
 * Jeder Buchstabe wird als Konfiguration für einen generischen
 * Hand-Piktogramm-Renderer beschrieben (index/middle/ring/pinky
 * ausgestreckt oder eingerollt, Daumenhaltung, Rotation, Sonderformen).
 */
(function (global) {
  "use strict";

  // fingers: [index, middle, ring, pinky] – true = ausgestreckt
  const LETTERS = {
    A: { fingers: [0, 0, 0, 0], thumb: "in" },
    B: { fingers: [1, 1, 1, 1], thumb: "in" },
    C: { fingers: [0, 0, 0, 0], thumb: "out", shape: "curve" },
    D: { fingers: [1, 0, 0, 0], thumb: "loop", loopWith: 1 },
    E: { fingers: [0, 0, 0, 0], thumb: "in", curl: true },
    F: { fingers: [0, 1, 1, 1], thumb: "loop", loopWith: 0 },
    G: { fingers: [1, 0, 0, 0], thumb: "out", rotate: -90 },
    H: { fingers: [1, 1, 0, 0], thumb: "in", rotate: -90 },
    I: { fingers: [0, 0, 0, 1], thumb: "in" },
    J: { fingers: [0, 0, 0, 1], thumb: "in", rotate: 20, note: "mit Schwungbewegung gezeichnet" },
    K: { fingers: [1, 1, 0, 0], thumb: "out" },
    L: { fingers: [1, 0, 0, 0], thumb: "out" },
    M: { fingers: [0, 0, 0, 0], thumb: "in", note: "Daumen unter drei Fingern" },
    N: { fingers: [0, 0, 0, 0], thumb: "in", note: "Daumen unter zwei Fingern" },
    O: { fingers: [0, 0, 0, 0], thumb: "out", shape: "curve", closed: true },
    P: { fingers: [1, 1, 0, 0], thumb: "out", rotate: 120 },
    Q: { fingers: [1, 0, 0, 0], thumb: "out", rotate: 110 },
    R: { fingers: [1, 1, 0, 0], thumb: "in", crossed: true },
    S: { fingers: [0, 0, 0, 0], thumb: "in" },
    T: { fingers: [0, 0, 0, 0], thumb: "in", note: "Daumen zwischen Zeige- und Mittelfinger" },
    U: { fingers: [1, 1, 0, 0], thumb: "in" },
    V: { fingers: [1, 1, 0, 0], thumb: "in", spread: true },
    W: { fingers: [1, 1, 1, 0], thumb: "in", spread: true },
    X: { fingers: [1, 0, 0, 0], thumb: "in", hook: true },
    Y: { fingers: [0, 0, 0, 1], thumb: "out" },
    Z: { fingers: [1, 0, 0, 0], thumb: "in", note: "gezeichnetes Z (Bewegung)" },
    "Ä": { fingers: [0, 0, 0, 0], thumb: "in", umlaut: true },
    "Ö": { fingers: [0, 0, 0, 0], thumb: "out", shape: "curve", closed: true, umlaut: true },
    "Ü": { fingers: [1, 1, 0, 0], thumb: "in", umlaut: true },
    "ß": { fingers: [0, 0, 0, 0], thumb: "in", note: "vereinfacht wie „ss“ dargestellt" },
  };

  /**
   * "ß".toUpperCase() ergibt in JavaScript "SS" statt "ß" – das würde
   * den Tabellen-Lookup für ß zerstören. Deshalb ß gesondert behandeln.
   */
  function normalizeKey(letter) {
    const raw = String(letter || "");
    return raw === "ß" ? raw : raw.toUpperCase();
  }

  const FINGER_X = [36, 46, 56, 66];
  const FINGER_LEN = [30, 34, 30, 24];

  function svgEl(tag, attrs) {
    let s = "<" + tag;
    for (const key in attrs) s += ` ${key}="${attrs[key]}"`;
    return s + "/>";
  }

  function renderFinger(index, extended, opts) {
    const baseX = FINGER_X[index];
    const spreadAngles = [-14, -4, 6, 16];
    const rotate = opts.spread ? spreadAngles[index] : 0;
    if (opts.hook && index === 0 && !extended) {
      return (
        svgEl("rect", {
          class: "finger",
          x: baseX - 3.5,
          y: 40,
          width: 7,
          height: 20,
          rx: 3.5,
        }) + svgEl("circle", { class: "finger-tip", cx: baseX + 5, cy: 39, r: 4 })
      );
    }
    if (extended) {
      const len = FINGER_LEN[index];
      const y = 60 - len;
      return svgEl("rect", {
        class: "finger finger-extended",
        x: baseX - 3.5,
        y: y,
        width: 7,
        height: len,
        rx: 3.5,
        transform: rotate ? `rotate(${rotate} ${baseX} 60)` : undefined,
      }).replace(' transform="undefined"', "");
    }
    return svgEl("rect", {
      class: "finger finger-curled",
      x: baseX - 3.5,
      y: 48,
      width: 7,
      height: 12,
      rx: 3.5,
    });
  }

  function renderThumb(mode) {
    if (mode === "in") {
      return svgEl("rect", {
        class: "thumb thumb-in",
        x: 20,
        y: 64,
        width: 14,
        height: 10,
        rx: 4,
        transform: "rotate(-15 27 69)",
      });
    }
    if (mode === "loop") {
      return svgEl("rect", {
        class: "thumb thumb-loop",
        x: 22,
        y: 46,
        width: 7,
        height: 18,
        rx: 3.5,
        transform: "rotate(-55 22 62)",
      });
    }
    // out
    return svgEl("rect", {
      class: "thumb thumb-out",
      x: 18,
      y: 44,
      width: 7,
      height: 24,
      rx: 3.5,
      transform: "rotate(-55 22 66)",
    });
  }

  function renderCrossed() {
    return (
      svgEl("rect", {
        class: "finger finger-extended",
        x: 32.5,
        y: 30,
        width: 7,
        height: 30,
        rx: 3.5,
        transform: "rotate(12 36 60)",
      }) +
      svgEl("rect", {
        class: "finger finger-extended",
        x: 42.5,
        y: 26,
        width: 7,
        height: 34,
        rx: 3.5,
        transform: "rotate(-12 46 60)",
      })
    );
  }

  function renderCurveShape(closed) {
    const d = closed
      ? "M 30 50 C 20 55, 20 70, 30 76 C 40 84, 60 84, 70 76 C 80 70, 80 55, 70 50"
      : "M 34 46 C 20 52, 18 70, 32 80";
    let out = svgEl("path", { class: "curve-shape", d: d, fill: "none" });
    if (closed) {
      out += svgEl("path", {
        class: "curve-shape",
        d: "M 70 50 C 78 55, 78 68, 70 76",
        fill: "none",
      });
    }
    return out;
  }

  function loopConnector(index) {
    const baseX = FINGER_X[index];
    return svgEl("path", {
      class: "loop-connector",
      d: `M 27 56 C 22 60, 22 64, ${baseX - 5} 58`,
      fill: "none",
    });
  }

  function umlautDots() {
    return (
      svgEl("circle", { class: "umlaut-dot", cx: 40, cy: 18, r: 3 }) +
      svgEl("circle", { class: "umlaut-dot", cx: 60, cy: 18, r: 3 })
    );
  }

  /**
   * Baut das SVG-Markup (als String) für einen Buchstaben. Gibt null
   * zurück, wenn kein Piktogramm existiert (z. B. Leerzeichen).
   */
  function renderHandSVG(letter) {
    const upper = normalizeKey(letter);
    const cfg = LETTERS[upper];
    if (!cfg) return null;

    let inner = "";
    inner += svgEl("rect", { class: "wrist", x: 40, y: 98, width: 20, height: 20, rx: 6 });
    inner += svgEl("rect", { class: "palm", x: 26, y: 56, width: 48, height: 46, rx: 17 });

    if (cfg.thumb === "in") inner += renderThumb("in");

    if (cfg.crossed) {
      inner += renderCrossed();
    } else if (cfg.shape === "curve") {
      inner += renderCurveShape(!!cfg.closed);
    } else {
      cfg.fingers.forEach((extended, i) => {
        inner += renderFinger(i, !!extended, cfg);
      });
    }

    if (cfg.thumb === "out" && cfg.shape !== "curve") inner += renderThumb("out");
    if (cfg.thumb === "loop") {
      inner += renderThumb("loop");
      inner += loopConnector(cfg.loopWith);
    }

    if (cfg.umlaut) inner += umlautDots();

    const rotateWrap = cfg.rotate
      ? `<g transform="rotate(${cfg.rotate} 50 80)">${inner}</g>`
      : inner;

    return (
      `<svg class="hand-icon" viewBox="0 0 100 124" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Fingeralphabet ${upper}">` +
      rotateWrap +
      `</svg>`
    );
  }

  function hasLetter(letter) {
    return !!LETTERS[normalizeKey(letter)];
  }

  function getNote(letter) {
    const cfg = LETTERS[normalizeKey(letter)];
    return (cfg && cfg.note) || "";
  }

  /**
   * Gibt die rohe Konfiguration eines Buchstabens zurück (für andere
   * Renderer, z. B. den 3D-Avatar), damit die Gesten-Daten nur an einer
   * Stelle gepflegt werden. Liefert eine Kopie, kein Original-Objekt.
   */
  function getConfig(letter) {
    const cfg = LETTERS[normalizeKey(letter)];
    return cfg ? JSON.parse(JSON.stringify(cfg)) : null;
  }

  global.Fingeralphabet = {
    letters: Object.keys(LETTERS),
    renderHandSVG: renderHandSVG,
    hasLetter: hasLetter,
    getNote: getNote,
    getConfig: getConfig,
  };
})(window);
