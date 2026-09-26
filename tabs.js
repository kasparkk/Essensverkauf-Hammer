(function () {
  "use strict";

  const liveTab = document.getElementById("tab-live");
  const kidsTab = document.getElementById("tab-kids");
  const liveMode = document.getElementById("mode-live");
  const kidsMode = document.getElementById("mode-kids");
  const avatarCanvas = document.getElementById("avatar-canvas");
  const kidsAvatarSlot = document.getElementById("kids-avatar-slot");

  // Es gibt nur einen 3D-Avatar (eine WebGL-Instanz). Beim Moduswechsel
  // wird sein Canvas-Element zwischen Live- und Kinder-Bereich verschoben,
  // statt einen zweiten Avatar zu erzeugen.
  const liveAvatarHome = avatarCanvas.parentElement;
  const liveAvatarNextSibling = avatarCanvas.nextSibling;

  function setMode(mode) {
    const isKids = mode === "kids";
    liveMode.hidden = isKids;
    kidsMode.hidden = !isKids;
    liveTab.classList.toggle("is-active", !isKids);
    kidsTab.classList.toggle("is-active", isKids);
    liveTab.setAttribute("aria-selected", String(!isKids));
    kidsTab.setAttribute("aria-selected", String(isKids));

    if (isKids) {
      kidsAvatarSlot.appendChild(avatarCanvas);
      if (window.KidsMode) window.KidsMode.onActivate();
    } else if (liveAvatarNextSibling) {
      liveAvatarHome.insertBefore(avatarCanvas, liveAvatarNextSibling);
    } else {
      liveAvatarHome.appendChild(avatarCanvas);
    }
  }

  liveTab.addEventListener("click", () => setMode("live"));
  kidsTab.addEventListener("click", () => setMode("kids"));
})();
