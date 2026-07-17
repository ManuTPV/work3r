// Arrow-key "D-pad" focus navigation for TV remote controls.
// Browsers only move focus on Tab by default — a remote's directional pad
// sends ArrowUp/Down/Left/Right key events, which do nothing on their own.
// This finds the nearest focusable element in the pressed direction and
// focuses it, so any page (nav bar, tile grid, update banner) is navigable
// without extra per-page wiring.
(function () {
  const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const DIRECTIONS = {
    ArrowUp: { dx: 0, dy: -1 },
    ArrowDown: { dx: 0, dy: 1 },
    ArrowLeft: { dx: -1, dy: 0 },
    ArrowRight: { dx: 1, dy: 0 },
  };

  function focusableElements() {
    return Array.prototype.slice
      .call(document.querySelectorAll(FOCUSABLE_SELECTOR))
      .filter(function (el) {
        return el.offsetParent !== null;
      });
  }

  function center(el) {
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function findNext(current, key) {
    const dir = DIRECTIONS[key];
    const from = center(current);
    let best = null;
    let bestScore = Infinity;

    focusableElements().forEach(function (el) {
      if (el === current) return;

      const to = center(el);
      const dx = to.x - from.x;
      const dy = to.y - from.y;

      // Displacement along the pressed direction must be positive, i.e.
      // the candidate actually lies "that way" from the current element.
      const along = dx * dir.dx + dy * dir.dy;
      if (along <= 0) return;

      // Reject anything outside a 45-degree cone around the pressed
      // direction. Without this, the rightmost tile in a grid row finds
      // nothing further right and falls back to "nearest thing that way" —
      // which is often a header nav link far above, teleporting focus into
      // an unrelated zone instead of just stopping at the grid's edge.
      const across = Math.abs(dx * dir.dy - dy * dir.dx);
      if (across > along) return;

      const score = along + across * 3;

      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    });

    return best;
  }

  document.addEventListener("keydown", function (event) {
    if (!(event.key in DIRECTIONS)) return;

    const current = document.activeElement;
    const hasFocus =
      current && current !== document.body && current !== document.documentElement;

    const next = hasFocus ? findNext(current, event.key) : focusableElements()[0];

    if (next) {
      event.preventDefault();
      next.focus();
    }
  });

  // Land focus somewhere useful on load so the very first remote press works.
  // Prefer the active nav link (matches the visual highlight) over whatever
  // happens to be first in the DOM.
  window.addEventListener("load", function () {
    const current = document.activeElement;
    const hasFocus =
      current && current !== document.body && current !== document.documentElement;
    if (hasFocus) return;

    const active = document.querySelector(".main-nav a.active");
    const first = active || focusableElements()[0];
    if (first) first.focus();
  });
})();
