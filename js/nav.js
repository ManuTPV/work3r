(function () {
  const NAV_ITEMS = [
    { page: "channels", href: "index.html", label: "TV & Radio" },
    { page: "apps", href: "apps.html", label: "Apps" },
    { page: "hotel-info", href: "hotel-info.html", label: "Hotel Info" },
    { page: "travel-info", href: "travel-info.html", label: "Travel Info" },
  ];

  const activePage = document.body.dataset.page;

  const links = NAV_ITEMS.map(function (item) {
    const activeClass = item.page === activePage ? " active" : "";
    return (
      '<a class="' +
      "nav-link" +
      activeClass +
      '" href="' +
      item.href +
      '"' +
      (item.page === activePage ? ' aria-current="page"' : "") +
      ">" +
      item.label +
      "</a>"
    );
  }).join("");

  document.getElementById("site-header").innerHTML =
    '<div class="brand">Hotel<span>Cast</span></div>' +
    '<nav class="main-nav">' +
    links +
    "</nav>";
})();
