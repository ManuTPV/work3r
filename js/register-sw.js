// Owns the Service Worker registration + update lifecycle.
// Communicates with sw-status.js via events on `window`:
//   'sw-state'            -> { state: 'unsupported'|'registering'|'active' }
//   'sw-update-available' -> new worker installed and waiting
//   'sw-version'          -> { version, cacheAvailable } reported by the active worker
//   'sw-version-timeout'  -> no version response after registration (the
//                            worker likely never finished activating — e.g.
//                            this device blocks persistent Cache Storage)
//
// window.applyUpdate() is exposed for the status bar's "Update" button.

(function () {
  if (!("serviceWorker" in navigator)) {
    window.dispatchEvent(
      new CustomEvent("sw-state", { detail: { state: "unsupported" } })
    );
    return;
  }

  window.dispatchEvent(
    new CustomEvent("sw-state", { detail: { state: "registering" } })
  );

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  let versionReceived = false;
  navigator.serviceWorker.addEventListener("message", function (event) {
    if (event.data && event.data.type === "VERSION") {
      versionReceived = true;
      window.dispatchEvent(
        new CustomEvent("sw-version", {
          detail: {
            version: event.data.version,
            cacheAvailable: event.data.cacheAvailable,
          },
        })
      );
    }
  });

  function requestVersion() {
    if (!navigator.serviceWorker.controller) return;
    navigator.serviceWorker.controller.postMessage({ type: "GET_VERSION" });

    // If nothing answers, the worker likely never finished activating (no
    // controller ever really "took" despite registration succeeding) — tell
    // the status bar instead of leaving it blank forever.
    setTimeout(function () {
      if (!versionReceived) {
        window.dispatchEvent(new CustomEvent("sw-version-timeout"));
      }
    }, 4000);
  }

  window.applyUpdate = function (registration) {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  };

  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(function (registration) {
        window.dispatchEvent(
          new CustomEvent("sw-state", { detail: { state: "active" } })
        );
        requestVersion();

        if (registration.waiting && navigator.serviceWorker.controller) {
          window.dispatchEvent(
            new CustomEvent("sw-update-available", { detail: { registration: registration } })
          );
        }

        registration.addEventListener("updatefound", function () {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", function () {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              window.dispatchEvent(
                new CustomEvent("sw-update-available", { detail: { registration: registration } })
              );
            }
          });
        });
      })
      .catch(function () {
        window.dispatchEvent(
          new CustomEvent("sw-state", { detail: { state: "unsupported" } })
        );
      });
  });
})();
