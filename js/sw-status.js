// Renders the persistent bottom status bar: SW state, cache version,
// online/offline state, and the update-available banner/button.
(function () {
  const bar = document.getElementById("sw-status-bar");
  bar.innerHTML =
    '<span class="status-item"><span id="sw-dot" class="status-dot"></span><span id="sw-label">Service Worker: checking…</span></span>' +
    '<span class="status-item"><span id="net-dot" class="status-dot"></span><span id="net-label">Checking connection…</span></span>' +
    '<span class="status-item"><span id="version-label">Cache: —</span></span>' +
    '<span id="update-banner"><span>New version available</span><button id="update-btn">Update</button></span>';

  const swDot = document.getElementById("sw-dot");
  const swLabel = document.getElementById("sw-label");
  const netDot = document.getElementById("net-dot");
  const netLabel = document.getElementById("net-label");
  const versionLabel = document.getElementById("version-label");
  const updateBanner = document.getElementById("update-banner");
  const updateBtn = document.getElementById("update-btn");

  function setNetStatus() {
    const online = navigator.onLine;
    netDot.className = "status-dot " + (online ? "good" : "bad");
    netLabel.textContent = online ? "Online" : "Offline";
  }
  window.addEventListener("online", setNetStatus);
  window.addEventListener("offline", setNetStatus);
  setNetStatus();

  window.addEventListener("sw-state", function (event) {
    const state = event.detail.state;
    if (state === "unsupported") {
      swDot.className = "status-dot bad";
      swLabel.textContent = "Service Worker: unsupported";
    } else if (state === "registering") {
      swDot.className = "status-dot";
      swLabel.textContent = "Service Worker: registering…";
    } else if (state === "active") {
      swDot.className = "status-dot good";
      swLabel.textContent = "Service Worker: active";
    }
  });

  window.addEventListener("sw-version", function (event) {
    const detail = event.detail;
    versionLabel.textContent =
      "Cache: " +
      detail.version +
      (detail.cacheAvailable === false ? " (offline unavailable)" : "");
  });

  window.addEventListener("sw-version-timeout", function () {
    versionLabel.textContent = "Cache: no response";
  });

  let pendingRegistration = null;
  window.addEventListener("sw-update-available", function (event) {
    pendingRegistration = event.detail.registration;
    updateBanner.classList.add("visible");
  });

  updateBtn.addEventListener("click", function () {
    if (window.applyUpdate && pendingRegistration) {
      updateBtn.disabled = true;
      updateBtn.textContent = "Updating…";
      window.applyUpdate(pendingRegistration);
    }
  });
})();
