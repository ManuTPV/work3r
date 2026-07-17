// Fetches a JSON tile list and renders it into a .tile-grid container.
// Runs through the same cache-first fetch path as everything else, so it
// also proves that fetched (non-shell-HTML) data survives offline.
function renderGrid(containerId, dataUrl, renderTile) {
  const container = document.getElementById(containerId);
  fetch(dataUrl)
    .then(function (response) {
      return response.json();
    })
    .then(function (items) {
      container.innerHTML = items.map(renderTile).join("");
    })
    .catch(function () {
      container.innerHTML = '<p class="subtitle">Unable to load content.</p>';
    });
}
