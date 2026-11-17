"use strict";
/* Presentation layer. Catalog and content are read-only snapshots.
   Browser cart/account/payment state is a labelled preview, never a WooCommerce session. */
const {
  products: PRODUCTS,
  categories: CATEGORIES,
  tags: TAGS,
} = window.SEREVA_CATALOG;
const CONTENT = window.SEREVA_CONTENT,
  VARIATIONS = window.SEREVA_VARIATIONS;
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icons = {
  search: "M21 21l-5-5M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z",
  person:
    "M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 5a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z",
  bag: "M5 8h14l2 13H3L5 8Zm3 1V6a4 4 0 0 1 8 0v3",
  arrow: "M3 12h17m-6-6 6 6-6 6",
  down: "m7 10 5 5 5-5",
  close: "m6 6 12 12M18 6 6 18",
  menu: "M3 7h18M3 16h18",
  sparkle:
    "M12 2c.5 6 4 9.5 10 10-6 .5-9.5 4-10 10-.5-6-4-9.5-10-10 6-.5 9.5-4 10-10Z",
  truck:
    "M1 5h14v12H1V5Zm14 4h4l4 4v4h-8M5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm14 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  return: "M5 7h10a5 5 0 0 1 0 10H9M5 7l4-4M5 7l4 4",
  filter: "M3 6h18M3 12h18M3 18h18M7 3v6M17 9v6M10 15v6",
  check: "m5 12 4 4L19 6M22 12a10 10 0 1 1-5-8.7",
  zoom: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM10 6v8M6 10h8",
  orders: "M4 3h16v18H4V3Zm4 5h8M8 12h8M8 16h5",
  pin: "M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 1 1 14 0Zm-4 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  compare: "M4 3v18M20 3v18M1 7h6M17 17h6M8 12h8m-3-3 3 3-3 3",
};
const icon = (n) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[n] || icons.sparkle}"/></svg>`;
const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
const getProduct = (id) => PRODUCTS.find((p) => p.id === Number(id));
const bySlug = (s) => PRODUCTS.find((p) => p.slug === s);
const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem("sereva-v2-" + key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem("sereva-v2-" + key, JSON.stringify(value));
  } catch {
    /* Browsing still works when storage is disabled. */
  }
};
const state = {
  wishlist: read("wishlist", []).filter((id) => getProduct(id)),
  bag: read("bag", []).filter(
    (l) =>
      getProduct(l.id) && Number.isInteger(l.qty) && l.qty > 0 && l.qty <= 20,
  ),
  compare: read("compare", [])
    .filter((id) => getProduct(id))
    .slice(0, 3),
  orders: read("orders", []),
  coupon: "",
  qty: 1,
  account: null,
  address: null,
  filter: {},
  limit: 24,
  sidebar: true,
};
const drawer = $("#drawer");
let returnFocus,
  toastTimer,
  currentDrawer = "",
  activeProduct = null,
  lastSearch = "";
function toast(text) {
  clearTimeout(toastTimer);
  $("#toast").textContent = text;
  $("#toast").hidden = false;
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 3300);
}
function image(p, attrs = "") {
  const loading = attrs.includes('fetchpriority="high"') ? "eager" : "lazy";
  return `<img src="${p.image}" alt="${esc(p.name)}" width="720" height="810" loading="${loading}" onerror="this.onerror=null;this.src='/assets/photo-pending.svg'" ${attrs}>`;
}
function categoryName(p) {
  const c = p.categories.find(
    (s) =>
      s !== "men" &&
      s !== "women" &&
      s !== "diwali-edit" &&
      s !== "new-arrivals",
  );
  return CATEGORIES.find((i) => i.slug === c)?.name || "925 Sterling Silver";
}
function header() {
  const c = state.bag.reduce((s, l) => s + l.qty, 0);
  $("#header").innerHTML =
    `<div class="masthead bound"><button class="mobile-toggle icon-button" data-open="menu" aria-label="Open navigation">${icon("menu")}</button><button class="header-search" data-open="search">${icon("search")}<span>Find your silver</span></button><a class="wordmark" href="/" aria-label="Sereva home">SEREVA<span>THE FEELING IS YOURS</span></a><div class="header-actions"><button class="icon-button mobile-search" data-open="search" aria-label="Search jewellery">${icon("search")}</button><a class="icon-button account-icon" href="/my-account/" aria-label="My account">${icon("person")}</a><a class="icon-button header-wishlist" href="/wishlist/" aria-label="Wishlist, ${state.wishlist.length} saved pieces">${icon("heart")}${state.wishlist.length ? `<span class="count">${state.wishlist.length}</span>` : ""}</a><button class="icon-button" data-open="bag" aria-label="Shopping bag, ${c} items">${icon("bag")}<span class="count" id="bag-count">${c}</span></button></div></div><nav class="main-nav" aria-label="Main navigation"><a href="/">Home</a><a href="/product-category/diwali-edit/">Diwali Edit</a><div class="mega"><button class="mega-toggle" aria-expanded="false" aria-controls="mega-menu">Store ${icon("down")}</button><div class="mega-menu" id="mega-menu" hidden><div><h3>The silver edit</h3><a href="/product-category/new-arrivals/">New Arrivals</a><a href="/shop/">Shop all products ${icon("arrow")}</a></div><div><h3><a href="/product-category/men/">Men</a></h3>${navChildren("men")}</div><div><h3><a href="/product-category/women/">Women</a></h3>${navChildren("women")}</div><a class="mega-edit" href="/product-category/diwali-edit/"><img src="/assets/edit-pendant.webp" alt="Silver pendant in soft light"><span>The Diwali Edit — a little light, every day ${icon("arrow")}</span></a></div></div><a href="/about-us/">About Us</a><a href="/contact/">Contact</a></nav>`;
}
const MENU = {
  men: [
    ["Brooches", "brooches-men"],
    ["Chains", "chain-men"],
    ["Rings", "rings-men"],
    ["Bracelets & Kadas", "bracelets-men"],
  ],
  women: [
    ["Pendants & Pendant Sets", "pendants-pendants-sets-women"],
    ["Rings", "rings-women"],
    ["Earrings", "earrings-women"],
    ["Bracelets & Kadas", "bracelets-kadas-women"],
    ["Chains", "chains-women"],
  ],
};
function navChildren(g, mobile = false) {
  let arr = MENU[g];
  if (mobile && g === "women") arr = [arr[0], arr[3], arr[2], arr[1], arr[4]];
  return arr
    .map(([n, s]) => `<a href="/product-category/${g}/${s}/">${n}</a>`)
    .join("");
}
function footer() {
  $("#footer").innerHTML =
    `<div class="bound footer-grid"><div class="footer-about"><a href="/" class="wordmark">SEREVA<span>925 STERLING SILVER</span></a><p>Quiet confidence.<br>Personal by nature.<br>Made to become part of you.</p></div><div class="footer-links"><h2>Information</h2><a href="/privacy-policy/">Privacy Policy</a><a href="/refund-returns/">Refund Policy</a><a href="/term-and-conditions/">Terms & Conditions</a></div><div class="footer-links"><h2>About Us</h2><a href="/about-us/">Our Story</a><a href="/jewellery-care/">Jewellery Care</a><a href="/contact/">Contact Us</a></div><div class="footer-links"><h2>Your Sereva</h2><a href="/my-account/">My Account</a><a href="/order-tracking/">Track Your Order</a><a href="/wishlist/">Wishlist</a><a href="/faq/">FAQs</a><a href="/blog/">The Sereva Journal</a><a href="/compare/">Compare Pieces</a></div></div><div class="bound footer-bottom"><span>© ${new Date().getFullYear()} Sereva. All rights reserved.<br>Storefront design preview · Catalog snapshot, 17 November 2026</span><a href="/shop/">Crafted in silver. Chosen by you.</a><span>INDIA / INR ₹</span></div>`;
}
function productCard(p) {
  return `<article class="product-card"><div class="product-photo"><a href="${p.path}" aria-label="View ${esc(p.name)}">${image(p)}</a><button class="icon-button product-fav" data-wish="${p.id}" aria-pressed="${state.wishlist.includes(p.id)}" aria-label="${state.wishlist.includes(p.id) ? "Remove" : "Save"} ${esc(p.name)} ${state.wishlist.includes(p.id) ? "from" : "to"} wishlist">${icon("heart")}</button>${!p.stock ? '<span class="pill product-badge">Out of stock</span>' : p.categories.includes("new-arrivals") ? '<span class="pill product-badge">New arrival</span>' : ""}<button class="quick-view" data-quick="${p.id}">A closer look</button></div><div class="product-info"><p class="product-category">${esc(categoryName(p))}</p><a href="${p.path}" class="product-title">${esc(p.name)}</a><p class="product-price">${money(p.price)}${p.regular > p.price ? `<del>${money(p.regular)}</del>` : ""}</p>${
    p.attributes.some((a) => a.variation)
      ? `<p class="product-options">${p.attributes
          .filter((a) => a.variation)
          .map(
            (a) => `${a.options.length} ${esc(a.name.toLowerCase())} options`,
          )
          .join(" · ")}</p>`
      : ""
  }</div></article>`;
}
const curated = (slugs) => slugs.map(bySlug).filter(Boolean);
function home() {
  const cats = [
    ["Rings", "rings-women", "lustre-band"],
    ["Earrings", "earrings-women", "/assets/edit-earrings.webp"],
    ["Bracelets & Kadas", "bracelets-kadas-women", "bloom-trio-bracelet"],
    [
      "Pendants & Pendant Sets",
      "pendants-pendants-sets-women",
      "/assets/edit-pendant.webp",
    ],
    [
      "Chains",
      "chain-men",
      PRODUCTS.find(
        (p) => p.categories.includes("chain-men") && p.gallery.length,
      )?.slug || "/assets/photo-pending.svg",
    ],
  ];
  return `<section class="hero"><img class="hero-photo" src="/assets/hero.webp" alt="Editorial portrait of a woman wearing silver jewellery" width="1536" height="864" fetchpriority="high"><div class="hero-content bound"><p class="eyebrow">925 Sterling Silver · The everyday edit</p><h1>A little silver.<br><em>A lot of you.</em></h1><p class="hero-copy">For the moments that become memories.<br>And the everyday that makes you, you.</p><div class="hero-actions"><a href="/product-category/women/" class="button light">Shop Women ${icon("arrow")}</a><a href="/product-category/men/" class="button ghost-light">Shop Men ${icon("arrow")}</a></div></div><div class="hero-foot"><span>THE FEELING IS YOURS</span><span>THOUGHTFULLY CHOSEN. ALWAYS PERSONAL.</span></div></section><div class="benefits"><div>${icon("sparkle")}<span>925 Sterling Silver</span></div><div>${icon("truck")}<span>Free Shipping Across India</span></div><a href="/refund-returns/">${icon("return")}<span>Easy 5-Day Returns*</span></a></div><section class="section bound"><div class="section-head"><div><p class="eyebrow">Find your everyday signature</p><h2>Shop by Category</h2></div><a href="/shop/" class="text-link">All jewellery ${icon("arrow")}</a></div><div class="category-grid">${cats
    .map(([n, s, img]) => {
      const p = bySlug(img);
      return `<a class="category-card" href="${CATEGORIES.find((c) => c.slug === s)?.path || "/shop/"}"><div class="photo"><img src="${p ? p.image : img}" alt="${esc(n)}" width="400" height="460" loading="lazy"></div><span class="category-name">${n}${icon("arrow")}</span></a>`;
    })
    .join(
      "",
    )}</div></section><p class="quiet-line">Not just something you wear.<br><span>Something you feel.</span></p><section class="featured"><div class="bound section"><div class="section-head"><div><p class="eyebrow">A few pieces to fall for</p><h2>Everyday, extraordinary.</h2></div><a class="text-link" href="/product-category/new-arrivals/">Discover the new ${icon("arrow")}</a></div><div class="product-grid">${curated(["lustre-band", "astera-pendant-set", "bloom-trio-bracelet", "onyx-line"]).map(productCard).join("")}</div></div></section><section class="section bound"><div class="story-grid"><a class="story-card" href="/product-category/diwali-edit/"><img src="/assets/edit-brooch.webp" alt="Colourful statement brooch from the original editorial imagery" loading="lazy"><div><div><p class="eyebrow">Made for your moments</p><h3>A little more<br>celebration.</h3></div><span class="text-link">The Diwali Edit ${icon("arrow")}</span></div></a><a class="story-card" href="/product-category/men/"><img src="/assets/edit-men.webp" alt="A silver signet ring styled with a notebook" loading="lazy"><div><div><p class="eyebrow">His kind of silver</p><h3>Understated.<br>Unmistakable.</h3></div><span class="text-link">Explore Men ${icon("arrow")}</span></div></a></div></section><section class="editorial"><img src="/assets/edit-pendant.webp" alt="A delicate silver pendant in natural light" loading="lazy" width="900" height="1000"><div class="editorial-copy"><p class="eyebrow">The Sereva philosophy</p><h2>Quiet confidence.<br>In sterling silver.</h2><p>Born from an appreciation for the effortless beauty of silver. Pieces that feel personal, refined, and comfortable enough to become part of your everyday.</p><a href="/about-us/" class="text-link">A little about us ${icon("arrow")}</a></div></section><section class="section bound"><div class="section-head"><div><p class="eyebrow">Better together</p><h2>Make it your own.</h2><p>Thoughtful pairings. Unexpected favourites. Discover the pieces that feel like you.</p></div><a class="text-link" href="/shop/">Find your favourites ${icon("arrow")}</a></div><div class="product-grid">${curated(["prism", "onyx-line", "bloom-trio-bracelet", "pyramid-gleam-cufflinks"]).map(productCard).join("")}</div></section><section class="featured"><div class="section bound"><div class="section-head"><div><p class="eyebrow">Notes on silver & style</p><h2>The Sereva Journal</h2></div><a class="text-link" href="/blog/">Read the journal ${icon("arrow")}</a></div>${journalCards()}</div></section><div class="brand-promise"><span class="symbol" aria-hidden="true">✧</span><p>For your everyday.<br>For your own kind of extraordinary.</p><span class="eyebrow">Sereva · The feeling is yours</span></div>`;
}
function breadcrumbs(items) {
  return `<nav class="breadcrumbs bound" aria-label="Breadcrumb"><a href="/">Home</a>${items.map(([n, u]) => `<span aria-hidden="true">/</span>${u ? `<a href="${u}">${esc(n)}</a>` : `<span aria-current="page">${esc(n)}</span>`}`).join("")}</nav>`;
}
function pageTitle(title, sub = "", eyebrow = "The Sereva edit") {
  return `<div class="page-title"><p class="eyebrow">${eyebrow}</p><h1>${esc(title)}</h1>${sub ? `<p>${sub}</p>` : ""}</div>`;
}
function empty(title, text, ico = "bag") {
  return `<div class="empty-state">${icon(ico)}<h2>${title}</h2><p>${text}</p><a href="/shop/" class="button">Discover your silver ${icon("arrow")}</a></div>`;
}
function currentCollection() {
  const path = location.pathname
    .replace(/\/page(?:\/|=)\d+\/?$/, "")
    .replace(/\/$/, "");
  const slug = path.split("/").pop();
  if (path === "/shop" || path === "/shop-2")
    return { title: "All Jewellery", kind: "all" };
  if (path === "/new-arrivals")
    return { title: "New Arrivals", kind: "category", slug: "new-arrivals" };
  if (path.startsWith("/product-tag/"))
    return {
      title: TAGS[slug]?.name || slug.replace(/-/g, " "),
      kind: "tag",
      slug,
    };
  const c = CATEGORIES.find((c) => c.slug === slug);
  return { title: c?.name || "Uncategorized", kind: "category", slug };
}
function collectionStart() {
  return location.pathname.replace(/\/page(?:\/|=)\d+\/?$/, "") || "/shop/";
}
function resetCollectionPage() {
  const first = collectionStart();
  if (first !== location.pathname)
    history.replaceState({}, "", first + location.search + location.hash);
}
function filteredProducts() {
  const col = currentCollection(),
    f = state.filter;
  let arr = PRODUCTS.filter(
    (p) =>
      col.kind === "all" ||
      (col.kind === "category" ? p.categories : p.tags).includes(col.slug),
  );
  const q = new URLSearchParams(location.search).get("s");
  if (q)
    arr = arr.filter((p) =>
      (p.name + " " + p.description + " " + p.categories.join(" "))
        .toLowerCase()
        .includes(q.toLowerCase()),
    );
  if (f.categories?.length)
    arr = arr.filter((p) => f.categories.some((c) => p.categories.includes(c)));
  if (f.stock) arr = arr.filter((p) => p.stock);
  if (f.max) arr = arr.filter((p) => p.price <= Number(f.max));
  if (f.attribute)
    arr = arr.filter((p) =>
      p.attributes.some((a) => a.options.includes(f.attribute)),
    );
  if (f.finish)
    arr = arr.filter((p) => p.description.toLowerCase().includes(f.finish));
  const order = f.sort || new URLSearchParams(location.search).get("orderby");
  if (order === "price") arr.sort((a, b) => a.price - b.price);
  if (order === "price-desc") arr.sort((a, b) => b.price - a.price);
  if (order === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
  return arr;
}
function filtersMarkup(prefix = "") {
  const f = state.filter;
  const attrs = [
    ...new Set(PRODUCTS.flatMap((p) => p.attributes.flatMap((a) => a.options))),
  ].sort();
  return `<aside class="filters" aria-label="Product filters"><details open><summary>Category</summary>${[
    ["Women", "women"],
    ["Men", "men"],
    ["New Arrivals", "new-arrivals"],
    ["Diwali Edit", "diwali-edit"],
  ]
    .map(
      ([n, s]) =>
        `<label><input type="checkbox" name="filter-category" value="${s}" ${(f.categories || []).includes(s) ? "checked" : ""}>${n}</label>`,
    )
    .join(
      "",
    )}</details><details open><summary>Price</summary><label class="sr-only" for="price-filter">Maximum price</label><input type="range" id="price-filter" min="850" max="38000" step="50" value="${f.max || 38000}"><div class="filter-range"><span>₹850</span><output id="price-value">${money(f.max || 38000)}</output></div></details><details open><summary>Size & colour</summary><label class="sr-only" for="attribute-filter">Size or colour</label><select id="attribute-filter"><option value="">All options</option>${attrs.map((a) => `<option value="${esc(a)}" ${f.attribute === a ? "selected" : ""}>${esc(a)}</option>`).join("")}</select></details><details><summary>Finish</summary><label class="sr-only" for="finish-filter">Finish</label><select id="finish-filter"><option value="">All finishes</option>${["Rhodium", "Gold", "Rose Gold", "Oxidised", "Silver"].map((s) => `<option ${f.finish === s.toLowerCase() ? "selected" : ""} value="${s.toLowerCase()}">${s}</option>`).join("")}</select></details><details open><summary>Availability</summary><label><input type="checkbox" id="stock-filter" ${f.stock ? "checked" : ""}>In stock only</label></details><button class="text-link" data-clear-filters>Clear all filters</button><button class="button full filter-apply" data-apply-filters>Show pieces ${icon("arrow")}</button></aside>`
    .replaceAll('id="', 'id="' + prefix)
    .replaceAll('for="', 'for="' + prefix);
}
function collection() {
  const col = currentCollection(),
    q = new URLSearchParams(location.search).get("s");
  const title = q ? `Results for “${esc(q)}”` : esc(col.title);
  const arr = filteredProducts();
  return `${breadcrumbs([[q ? "Search" : col.title]])}<section class="bound"><div class="collection-heading"><div><p class="eyebrow">925 Sterling Silver · Considered in every detail</p><h1>${title}</h1><p>${col.slug === "diwali-edit" ? "A little light, a lasting feeling. Silver to celebrate your own kind of special." : "Pieces to make your own. Explore the details, find your favourites, and wear what feels like you."}</p></div><span class="eyebrow">The feeling is yours</span></div><div class="category-chips"><a class="chip ${col.kind === "all" ? "active" : ""}" href="/shop/">All Jewellery</a>${[
    "new-arrivals",
    "women",
    "men",
    "diwali-edit",
  ]
    .map((s) => {
      const c = CATEGORIES.find((c) => c.slug === s);
      return c
        ? `<a class="chip ${col.slug === s ? "active" : ""}" href="${c.path}">${esc(c.name)}</a>`
        : "";
    })
    .join(
      "",
    )}</div><div class="catalog-toolbar"><div class="toolbar-left"><button class="filter-button" data-toggle-filters>${icon("filter")}Filters</button><p class="results-count" aria-live="polite">${arr.length} pieces</p></div><label><span class="sr-only">Sort products</span><select class="sort-select" id="sort-products">${[
    ["featured", "Featured"],
    ["price", "Price: low to high"],
    ["price-desc", "Price: high to low"],
    ["name", "Name: A to Z"],
  ]
    .map(
      ([v, n]) =>
        `<option value="${v}" ${(state.filter.sort || new URLSearchParams(location.search).get("orderby") || "featured") === v ? "selected" : ""}>${n}</option>`,
    )
    .join(
      "",
    )}</select></label></div><div id="catalog-layout" class="catalog-layout ${!state.sidebar ? "no-sidebar" : ""}">${state.sidebar ? filtersMarkup() : ""}<div id="catalog-results">${catalogResults(arr)}</div></div></section>`;
}
function catalogResults(arr) {
  const page = Number(location.pathname.match(/\/page(?:\/|=)(\d+)/)?.[1] || 0);
  const start = page ? (page - 1) * 12 : 0;
  const stop = page ? page * 12 : state.limit;
  if (arr.length && start >= arr.length)
    return `<div class="empty-state">${icon("search")}<h2>There’s more to discover.</h2><p>This collection has no pieces on this page. Return to its beginning to explore the available selection.</p><a href="${esc(collectionStart())}" class="button">Back to the collection ${icon("arrow")}</a></div>`;
  const f = state.filter;
  const chips = [
    ...(f.categories || []),
    ...(f.stock ? ["In stock"] : []),
    ...(f.max ? [`Under ${money(f.max)}`] : []),
    ...(f.attribute ? [f.attribute] : []),
    ...(f.finish ? [f.finish] : []),
  ];
  return `${chips.length ? `<div class="active-filters">${chips.map((c) => `<button data-clear-filters aria-label="Clear active filters">${esc(c)} ×</button>`).join("")}</div>` : ""}<div class="product-grid">${arr.length ? arr.slice(start, stop).map(productCard).join("") : empty("A different kind of sparkle?", "No pieces match your selection. Clear your filters or try another search.", "search")}</div>${arr.length ? `<div class="load-more"><span>Showing ${Math.min(start + 1, arr.length)}–${Math.min(stop, arr.length)} of ${arr.length} pieces</span>${page ? `<div>${page > 1 ? `<a class="button outline" href="${location.pathname.replace(/\/page(?:\/|=)\d+\/?$/, "")}/page/${page - 1}/">Previous</a>` : ""}${stop < arr.length ? `<a class="button outline" href="${location.pathname.replace(/\/page(?:\/|=)\d+\/?$/, "")}/page/${page + 1}/">Next page</a>` : ""}</div>` : state.limit < arr.length ? '<button class="button outline" data-load-more>Discover more pieces</button>' : ""}</div>` : `<div style="text-align:center"><button class="text-link" data-clear-filters>Clear filters</button></div>`}`;
}
function updateResults() {
  resetCollectionPage();
  state.limit = 24;
  const arr = filteredProducts();
  $("#catalog-results").innerHTML = catalogResults(arr);
  $(".results-count").textContent = `${arr.length} pieces`;
}
function productCopy(p) {
  const parts = p.description
    .split("•")
    .map((s) => s.trim())
    .filter(Boolean);
  const specification =
    /^(?:material|polish|stone|length|width|size|closure|style|sku|ideal for)\s*:/i;
  return specification.test(parts[0] || "")
    ? { desc: "", specs: parts }
    : { desc: parts.shift() || "", specs: parts };
}
function productTrail(p) {
  const parent = CATEGORIES.find(
    (c) => p.categories.includes(c.slug) && ["men", "women"].includes(c.slug),
  );
  const category = CATEGORIES.find(
    (c) =>
      p.categories.includes(c.slug) &&
      c.slug !== parent?.slug &&
      (!parent || c.path.startsWith(parent.path)),
  );
  return [
    ["Shop All", "/shop/"],
    ...(parent ? [[parent.name, parent.path]] : []),
    ...(category ? [[category.name, category.path]] : []),
    [p.name],
  ];
}
function availableVariation(v) {
  return Boolean(v?.stock) && Number.isFinite(v.price) && v.price > 0;
}
function productPage(p) {
  activeProduct = p;
  state.qty = 1;
  const { desc, specs } = productCopy(p);
  return `${breadcrumbs(productTrail(p))}<div class="bound product-layout"><section class="gallery" aria-label="Product photographs"><button class="gallery-main" data-zoom="${p.id}" aria-label="Zoom image of ${esc(p.name)}">${image(p, 'id="main-product-image" fetchpriority="high"')}<span>${icon("zoom")}</span></button><div class="gallery-thumbs">${[p.image, ...p.gallery.slice(1)].map((src, i) => `<button class="${i === 0 ? "active" : ""}" data-gallery="${esc(src)}" aria-label="View image ${i + 1}"><img src="${esc(src)}" alt="${esc(p.name)} — view ${i + 1}" loading="lazy"></button>`).join("")}</div></section><section class="product-summary"><p class="eyebrow">Sereva · ${esc(categoryName(p))}</p><h1>${esc(p.name)}</h1><p class="detail-price" id="detail-price">${money(p.price)}${p.regular > p.price ? `<del>${money(p.regular)}</del>` : ""}</p><p class="tax-note">Price shown in Indian rupees.</p><p class="stock-line" id="stock-state"><span class="stock-dot"></span>${p.stock ? "In stock" : "Currently out of stock"} · Catalog preview</p><p class="description">${esc(desc || "Explore the detail and quiet beauty of this sterling silver piece.")}</p><form id="product-form" data-id="${p.id}">${p.attributes
    .filter((a) => a.variation)
    .map(
      (a, i) =>
        `<fieldset class="variant-group"><legend>${esc(a.name)}${/siz/i.test(a.name) ? '<button type="button" data-open="size">Size guidance</button>' : ""}</legend><div class="options">${a.options.map((v) => `<label class="option"><input type="radio" name="variant-${i}" value="${esc(v)}" data-attribute="${esc(a.name)}" required><span>${esc(v)}</span></label>`).join("")}</div></fieldset>`,
    )
    .join(
      "",
    )}<div id="variation-message" class="preview-note" role="status" aria-live="polite" ${p.type === "variable" ? "" : "hidden"}>Choose your options to see availability.</div><div class="product-purchase"><div class="quantity"><button type="button" data-product-qty="-1" aria-label="Decrease quantity">−</button><output id="product-qty">1</output><button type="button" data-product-qty="1" aria-label="Increase quantity">+</button></div><button class="button" id="add-to-bag" ${!p.stock || !p.purchasable || p.type === "variable" ? "disabled" : ""}>${p.stock ? "Add to Bag" : "Out of Stock"} ${icon("arrow")}</button></div></form><div class="detail-actions"><button data-wish="${p.id}" aria-pressed="${state.wishlist.includes(p.id)}">${icon("heart")} ${state.wishlist.includes(p.id) ? "Saved to wishlist" : "Save to wishlist"}</button><button data-compare="${p.id}">${icon("compare")}Compare</button></div><div class="detail-accordions"><details open><summary>The details</summary><ul>${specs.length ? specs.map((s) => `<li>${esc(s)}</li>`).join("") : `<li>${esc(p.description || "Product specifications are pending confirmation.")}</li>`}</ul></details><details><summary>Delivery & returns</summary><p>Delivery within India. The published policy allows around 2 business days for dispatch, then 4–5 business days for delivery. Timings depend on location. <a href="/term-and-conditions/">Delivery details</a></p><p>Eligible return requests within 5 days of delivery. Earrings are excluded except for damaged, defective or incorrect items. An uninterrupted unboxing video is required. <a href="/refund-returns/">Read the full policy</a></p></details><details><summary>Care for your silver</summary><p>Keep away from water, perfume and chemicals. Store each piece separately in a dry pouch. Natural tarnishing is a characteristic of silver. <a href="/jewellery-care/">Explore the care guide</a></p></details></div><p class="detail-sku">SKU: ${esc(p.sku || "Pending")} · Product ID: ${p.id}</p></section></div><section class="bound product-review"><div><p class="eyebrow">Your experience, in your words</p><h2>Reviews</h2></div><div><p>${p.reviews ? `${p.reviews} published reviews · Rating ${p.rating}/5. Review text requires the WordPress review feed.` : "No published reviews yet. Be the first to share your experience once customer reviews are connected."}</p></div></section><section class="featured"><div class="section bound"><div class="section-head"><div><p class="eyebrow">A little more to love</p><h2>Better together.</h2></div><a class="text-link" href="/shop/">Explore all ${icon("arrow")}</a></div><div class="product-grid">${PRODUCTS.filter(
    (i) =>
      i.id !== p.id &&
      i.categories.some(
        (c) =>
          p.categories.includes(c) &&
          c !== "diwali-edit" &&
          c !== "new-arrivals",
      ),
  )
    .slice(0, 4)
    .map(productCard)
    .join(
      "",
    )}</div></div></section><div class="mobile-purchase"><div><span id="mobile-price">${money(p.price)}</span><small id="mobile-selection">${p.type === "variable" ? "Select your options" : "925 Sterling Silver"}</small></div><button class="button" data-mobile-add ${!p.stock || !p.purchasable ? "disabled" : ""}>${!p.stock || !p.purchasable ? "Unavailable" : p.type === "variable" ? "Choose options" : "Add to Bag"} ${icon("arrow")}</button></div>`;
}
function selectedVariation(p) {
  const selected = [
    ...$("#product-form").querySelectorAll("input[type=radio]:checked"),
  ].map((i) => ({ name: i.dataset.attribute, value: i.value }));
  const total = p.attributes.filter((a) => a.variation).length;
  if (selected.length < total) return null;
  return p.variations.find((v) =>
    v.attributes.every((a) =>
      selected.some(
        (s) =>
          s.name.toLowerCase() === a.name.toLowerCase() &&
          s.value.toLowerCase() === a.value.toLowerCase(),
      ),
    ),
  );
}
function updateVariation() {
  const p = activeProduct;
  const v = selectedVariation(p);
  const detail = v ? VARIATIONS[v.id] : null;
  const complete =
    $$("#product-form input:checked").length ===
    p.attributes.filter((a) => a.variation).length;
  const priced = detail && Number.isFinite(detail.price) && detail.price > 0;
  const enabled = availableVariation(detail) && p.stock && p.purchasable;
  let text = "Choose your options to see availability.";
  if (v)
    text = !priced
      ? "Pricing is unavailable for this option. Please choose another."
      : enabled
        ? "Your selection is in stock."
        : "This variation is currently unavailable.";
  else if (complete)
    text = "This combination is unavailable. Please choose another option.";
  const displayedPrice =
    v && !priced ? "Price unavailable" : money(detail?.price ?? p.price);
  $("#detail-price").textContent = displayedPrice;
  $("#mobile-price").textContent = displayedPrice;
  $("#mobile-selection").textContent = v
    ? v.attributes.map((a) => a.value).join(" · ")
    : "Select your options";
  if (detail?.image) $("#main-product-image").src = detail.image;
  $("#variation-message").textContent = text;
  $("#stock-state").innerHTML = `<span class="stock-dot"></span>${text}`;
  $("#add-to-bag").disabled = !enabled;
  const mobileButton = $("[data-mobile-add]");
  mobileButton.disabled = !p.stock || !p.purchasable || (complete && !enabled);
  mobileButton.innerHTML = `${enabled ? "Add to Bag" : complete ? "Unavailable" : "Choose options"} ${icon("arrow")}`;
}
function addToBag(p, variation = null) {
  if (!p.stock || !p.purchasable) {
    toast("This piece is currently unavailable.");
    return;
  }
  if (
    p.type === "variable" &&
    (!variation || !availableVariation(VARIATIONS[variation.id]))
  ) {
    toast("Please choose an available option.");
    return;
  }
  const key = variation?.id || p.id;
  let line = state.bag.find((l) => l.key === key);
  if (line) {
    if (line.qty + state.qty > 20) {
      toast("Maximum 20 of each piece in the preview bag.");
      return;
    }
    line.qty += state.qty;
  } else
    state.bag.push({
      key,
      id: p.id,
      variation: variation?.id || null,
      option:
        variation?.attributes.map((a) => `${a.name}: ${a.value}`).join(" · ") ||
        "",
      qty: state.qty,
    });
  save("bag", state.bag);
  header();
  openDrawer("bag");
  toast(`${p.name} added to your bag.`);
}
function linePrice(l) {
  return l.variation
    ? (VARIATIONS[l.variation]?.price ?? getProduct(l.id).price)
    : getProduct(l.id).price;
}
function totals() {
  let subtotal = state.bag.reduce((n, l) => n + linePrice(l) * l.qty, 0);
  let discount = state.coupon === "SEREVA10" ? Math.round(subtotal * 0.1) : 0;
  return { subtotal, discount, total: subtotal - discount };
}
function bagLines() {
  return `<ul class="bag-list">${state.bag
    .map((l) => {
      const p = getProduct(l.id);
      return `<li class="bag-line"> <a href="${p.path}">${image(p)}</a><div><a href="${p.path}"><h3>${esc(p.name)}</h3></a><p class="line-option">${esc(l.option || "925 Sterling Silver")}</p><div class="quantity"><button data-qty="${l.key}" data-delta="-1" aria-label="Decrease ${esc(p.name)} quantity">−</button><output>${l.qty}</output><button data-qty="${l.key}" data-delta="1" aria-label="Increase ${esc(p.name)} quantity">+</button></div><button class="remove" data-remove="${l.key}">Remove</button></div><p class="line-price">${money(linePrice(l) * l.qty)}</p></li>`;
    })
    .join("")}</ul>`;
}
function summary(checkout = false) {
  const t = totals();
  return `<aside class="order-summary"><h2>Your bag, considered.</h2><div class="summary-row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>${t.discount ? `<div class="summary-row"><span>Preview code SEREVA10 <button data-remove-coupon aria-label="Remove coupon">×</button></span><span>− ${money(t.discount)}</span></div>` : ""}<div class="summary-row"><span>Shipping <small>(preview)</small></span><span>Complimentary</span></div><div class="summary-row"><span>Taxes</span><span><small>Not calculated in preview</small></span></div><div class="summary-row total"><span>Preview total</span><span>${money(t.total)}</span></div>${!checkout ? `<form class="coupon-form" id="coupon-form"><label class="sr-only" for="coupon-code">Preview coupon code</label><input id="coupon-code" placeholder="Preview code: SEREVA10" autocomplete="off"><button>Apply</button></form><p id="coupon-message" class="search-meta" aria-live="polite"></p><a class="button full" href="/checkout/">Continue to checkout ${icon("arrow")}</a><a class="text-link" href="/shop/">Continue shopping</a>` : ""}<p class="preview-note">Design preview. Shipping, taxes and coupon settings will be supplied by WooCommerce. No payment is taken.</p></aside>`;
}
function cart() {
  return `${breadcrumbs([["Shopping Bag"]])}<div class="bound">${pageTitle("Your Bag", "A few things that feel like you.")}<div class="${state.bag.length ? "bag-layout" : "page-section"}">${state.bag.length ? bagLines() + summary() : empty("Your bag is waiting.", "There’s a little silver with your name on it. Find a piece to make your own.")}</div></div>`;
}
function wishlist() {
  return `${breadcrumbs([["Wishlist"]])}<section class="bound page-section">${pageTitle("The pieces you love.", "Save a little silver for another day.", "Your Wishlist")}<div class="product-grid">${state.wishlist.length ? state.wishlist.map((id) => productCard(getProduct(id))).join("") : empty("A space for your favourites.", "Tap the heart on a piece you love. We’ll keep it here on this browser.", "heart")}</div></section>`;
}
function checkout() {
  if (!state.bag.length)
    return `${breadcrumbs([["Checkout"]])}<section class="bound page-section">${empty("Begin with something you love.", "Add a piece to your bag before exploring the checkout.")}</section>`;
  return `${breadcrumbs([["Shopping Bag", "/cart/"], ["Checkout"]])}<section class="bound">${pageTitle("Almost yours.", "Explore the checkout using sample details. No order or payment will be submitted.", "Checkout Preview")}<p class="preview-note">Already have an account? <a class="text-link" href="/my-account/?return_to=/checkout/">Sign in</a> · Guest checkout is available in this design preview. The WordPress store’s existing guest settings must be preserved during integration.</p><div class="checkout-layout"><form id="checkout-form" class="checkout-form"><h2>Contact details</h2><div class="form-grid"><label class="field span-all">Email address<input type="email" name="email" placeholder="you@example.com" value="guest@example.com" autocomplete="off" required></label></div><h2>Delivery address</h2><div class="form-grid"><label class="field">First name<input name="first" placeholder="First name" value="Preview" required></label><label class="field">Last name<input name="last" placeholder="Last name" value="Customer" required></label><label class="field span-all">Street address<input name="address" placeholder="House number and street" value="12 Sample Street" required></label><label class="field">City<input name="city" value="Jaipur" placeholder="City" required></label><label class="field">State<input name="state" value="Rajasthan" placeholder="State" required></label><label class="field">PIN code<input name="pin" inputmode="numeric" pattern="[1-9][0-9]{5}" maxlength="6" value="302001" placeholder="6-digit PIN" required></label><label class="field">Phone number<input name="phone" type="tel" pattern="[6-9][0-9]{9}" maxlength="10" placeholder="10-digit Indian mobile" value="9000000000" required></label><label class="field span-all">Country<select name="country"><option>India</option></select></label></div><h2>Delivery</h2><p class="preview-note">Complimentary shipping — estimated from the published storefront. Actual delivery rates will be confirmed at checkout on the approved store.</p><h2>Payment preview</h2><div class="payment-options"><label class="payment-option"><input type="radio" name="payment" value="success" checked>Sandbox success — preview a confirmed order</label><label class="payment-option"><input type="radio" name="payment" value="failure">Sandbox decline — preview payment failure</label></div><div id="payment-error" role="alert" hidden></div><p class="search-meta">No card, UPI or bank details are collected. Sample address fields are discarded after this screen.</p><button class="button full">Preview order ${icon("arrow")}</button><p class="auth-foot">By continuing you preview the <a href="/term-and-conditions/">Terms</a> and <a href="/privacy-policy/">Privacy Policy</a>. No purchase agreement is created.</p></form>${summary(true)}</div></section>`;
}
function confirmation() {
  const id = new URLSearchParams(location.search).get("order");
  const o = state.orders.find((o) => o.id === id);
  return `${breadcrumbs([["Order Confirmation"]])}<section class="confirmation bound">${icon("check")}<p class="eyebrow">${o ? "A preview of something special" : "Order confirmation preview"}</p><h1>${o ? "A little silver.\nA lovely choice." : "Thank you, beautifully."}</h1><p>${o ? "Your preview order is confirmed. Nothing has been charged and no live order or confirmation email has been created." : "A real order confirmation appears here after WooCommerce verifies successful payment. No order is associated with this page."}</p>${o ? `<div class="order-summary"><h2>Order ${esc(o.id)}</h2><div class="summary-row"><span>Status</span><span>Preview confirmed</span></div>${o.lines.map((l) => `<div class="summary-row"><span>${esc(getProduct(l.id)?.name || "Silver piece")} × ${l.qty}</span><span>${money(l.price * l.qty)}</span></div>`).join("")}<div class="summary-row total"><span>Total</span><span>${money(o.total)}</span></div><small>No payment taken.</small></div>` : ""}<a href="/shop/" class="button">Keep discovering ${icon("arrow")}</a>${o ? `<a class="text-link" style="margin:20px" href="/order-tracking/?order=${o.id}">View order status</a>` : ""}</section>`;
}
function previewAccountNote() {
  return '<p class="preview-note">Account preview. Use sample details. No real account is created, no password is stored, and no email is sent.</p>';
}
function account() {
  const path = location.pathname;
  const params = new URLSearchParams(location.search);
  if (path.includes("lost-password") || params.get("mode") === "reset")
    return `${breadcrumbs([["My Account", "/my-account/"], ["Reset Password"]])}<div class="bound">${pageTitle("Find your way back.", "Enter a sample email to preview the password reset message.", "Reset Password")}<div class="auth-wrap">${previewAccountNote()}<form class="auth-form" id="reset-form"><label class="field">Email address<input type="email" name="email" placeholder="you@example.com" required autocomplete="off"></label><button class="button full">Preview reset link ${icon("arrow")}</button></form><p class="auth-foot"><a href="/my-account/">Back to sign in</a></p></div></div>`;
  if (state.account) return dashboard();
  const signup = params.get("mode") === "register";
  return `${breadcrumbs([["My Account"]])}<div class="bound">${pageTitle(signup ? "Make yourself at home." : "Welcome back.", "A little space for the things you love.", "Your Sereva")}<div class="auth-wrap"><nav class="auth-tabs" aria-label="Account options"><a class="${!signup ? "active" : ""}" href="/my-account/${params.get("return_to") ? "?return_to=" + encodeURIComponent(params.get("return_to")) : ""}">Sign in</a><a class="${signup ? "active" : ""}" href="/my-account/?mode=register">Create account</a></nav>${previewAccountNote()}<form class="auth-form" id="account-form" data-signup="${signup}">${signup ? '<label class="field">Your name<input name="name" placeholder="Preview Customer" required maxlength="60" autocomplete="off"></label>' : ""}<label class="field">Email address<input type="email" name="email" placeholder="you@example.com" required autocomplete="off"></label><label class="field">Password (sample only)<input type="password" name="password" placeholder="At least 8 characters" minlength="8" required autocomplete="off"></label><div class="form-footer">${!signup ? '<span>Use sample details only</span><a href="/my-account/lost-password/">Forgot password?</a>' : "<span>Your sample password is discarded immediately.</span>"}</div><button class="button full">${signup ? "Preview registration" : "Preview sign in"} ${icon("arrow")}</button></form><p class="auth-foot">${signup ? 'Already part of Sereva? <a href="/my-account/">Sign in</a>' : 'New to Sereva? <a href="/my-account/?mode=register">Create an account</a>'}</p></div></div>`;
}
function dashboard() {
  const path = location.pathname,
    tab = path.includes("orders")
      ? "orders"
      : path.includes("edit-address")
        ? "address"
        : path.includes("edit-account")
          ? "profile"
          : "dashboard";
  const nav = [
    ["dashboard", "My account", "/my-account/"],
    ["orders", "Orders", "/my-account/orders/"],
    ["address", "Addresses", "/my-account/edit-address/"],
    ["profile", "Account details", "/my-account/edit-account/"],
  ];
  let body = "";
  if (tab === "dashboard")
    body = `<h2>Hello, ${esc(state.account.name)}.</h2><p>Your personal corner of Sereva. Explore your preview orders, edit a sample address, or find your next favourite.</p><div class="dashboard-cards"><a href="/my-account/orders/">${icon("orders")}Your orders ${icon("arrow")}</a><a href="/my-account/edit-address/">${icon("pin")}Your addresses ${icon("arrow")}</a><a href="/wishlist/">${icon("heart")}Your wishlist ${icon("arrow")}</a></div>`;
  if (tab === "orders")
    body = `<h2>Your orders</h2>${state.orders.length ? state.orders.map((o) => `<div class="order-summary" style="margin-bottom:15px"><div class="summary-row"><span>${esc(o.id)}</span><span>Preview confirmed</span></div><div class="summary-row"><span>${o.lines.length} pieces · ${esc(o.date)}</span><span>${money(o.total)}</span></div><a class="text-link" href="/checkout/order-received/?order=${o.id}">View preview order ${icon("arrow")}</a></div>`).join("") : empty("Your story starts here.", "Preview orders placed on this browser will appear here.", "orders")}`;
  if (tab === "address")
    body = `<h2>Your addresses</h2><p>Edit a sample address for this preview session. It is held in memory and is cleared when the page is refreshed.</p><form id="address-form" class="form-grid"><label class="field span-all">Street address<input name="street" value="${esc(state.address?.street || "12 Sample Street")}" required></label><label class="field">City<input name="city" value="${esc(state.address?.city || "Jaipur")}" required></label><label class="field">PIN code<input name="pin" value="${esc(state.address?.pin || "302001")}" inputmode="numeric" pattern="[1-9][0-9]{5}" required></label><button class="button span-all">Save preview address</button></form>`;
  if (tab === "profile")
    body = `<h2>Account details</h2><form id="profile-form" class="form-grid"><label class="field span-all">Display name<input name="name" value="${esc(state.account.name)}" required maxlength="60"></label><label class="field span-all">Email address<input name="email" type="email" value="${esc(state.account.email)}" required></label><button class="button span-all">Save preview details</button></form><p class="preview-note">Password changes will use WooCommerce’s native account security flow after integration.</p>`;
  return `${breadcrumbs([["My Account"]])}<section class="bound">${pageTitle("Your Sereva.", "", "Account Preview")}<div class="account-layout"><nav class="account-nav" aria-label="Account navigation">${nav.map(([t, n, u]) => `<a href="${u}" class="${t === tab ? "active" : ""}">${n}</a>`).join("")}<button data-logout>Log out</button></nav><div class="account-main">${previewAccountNote()}${body}</div></div></section>`;
}
function tracking() {
  const id = new URLSearchParams(location.search).get("order") || "";
  return `${breadcrumbs([["Order Tracking"]])}<section class="bound">${pageTitle("Follow your silver.", "Enter a preview order number to explore its status.", "Order Tracking")}<div class="auth-wrap"><p class="preview-note">This preview looks up only demo orders placed on this browser. Live tracking will be available on the approved store.</p><form class="auth-form" id="tracking-form"><label class="field">Order number<input name="order" placeholder="SRE-PREVIEW-…" value="${esc(id)}" required></label><label class="field">Billing email<input name="email" type="email" placeholder="guest@example.com" required autocomplete="off"></label><button class="button full">Preview order status ${icon("arrow")}</button></form><div id="tracking-result" aria-live="polite"></div></div></section>`;
}
const articles = [
  {
    slug: "how-to-start-your-own-meaningful-jewelry-collection",
    title: "A collection that tells your story.",
    image: "edit-pendant",
    kicker: "Personal style",
    intro: "The best collection begins with a feeling.",
    body: "Start with a piece that belongs in your everyday: a chain, a simple ring, or a pair of earrings. Notice what you reach for most often, then add a different texture or a more expressive shape. A collection grows more meaningful when each addition feels like your own choice.",
  },
  {
    slug: "how-to-choose-the-perfect-earrings-for-your-face-shape",
    title: "Find your kind of earrings.",
    image: "edit-earrings",
    kicker: "The styling notes",
    intro: "A small detail can change the way you feel.",
    body: "Explore proportion, length and movement. A small stud brings quiet polish, while a longer silhouette creates a different rhythm around the face. Try the pieces that catch your eye, and pay attention to comfort as much as appearance. Your own preference is the best starting point.",
  },
  {
    slug: "the-one-piece-of-jewelry-that-instantly-elevates-any-outfit",
    title: "The everyday, elevated.",
    image: "edit-ring",
    kicker: "Everyday rituals",
    intro: "Sometimes, one piece is all you need.",
    body: "A familiar ring, a delicate pendant or a considered bracelet can become a signature. Wear it with the clothes you love, allow the silver to catch the light, and keep everything else simple. The detail is small. The feeling is personal.",
  },
];
function journalCards() {
  return `<div class="journal-grid">${articles.map((a) => `<article class="journal-card"><a href="/${a.slug}/"><img src="/assets/${a.image}.webp" alt="${esc(a.title)}" loading="lazy"></a><div><p class="eyebrow">${a.kicker}</p><h3><a href="/${a.slug}/">${a.title}</a></h3><a class="text-link" href="/${a.slug}/">Read the story ${icon("arrow")}</a></div></article>`).join("")}</div>`;
}
function journal() {
  const remaining = CONTENT.posts.filter(
    (p) => !articles.some((a) => p.slug === a.slug),
  );
  return `${breadcrumbs([["The Journal"]])}<section class="bound journal-page">${pageTitle("The Sereva Journal", "Silver, style, and the small things that make a difference.", "Notes from Sereva")}${journalCards()}<div class="content-narrow"><h2 style="margin-bottom:20px">From the archive</h2>${remaining.map((p) => `<p style="margin:18px 0"><a class="text-link" href="${p.path}">${esc(p.title)} ${icon("arrow")}</a></p>`).join("")}</div></section>`;
}
function article(slug) {
  const a = articles.find((a) => a.slug === slug);
  const archived = CONTENT.posts.find((p) => p.slug === slug);
  if (!a)
    return legacy(
      archived?.title || "Journal archive",
      "This legacy editorial page is inventoried. Its original template contains demo or unapproved content and needs editorial approval before migration.",
    );
  return `${breadcrumbs([["Journal", "/blog/"], [a.title]])}<article class="bound">${pageTitle(a.title, "", a.kicker)}<div class="content-narrow prose"><img class="article-hero" src="/assets/${a.image}.webp" alt="Silver jewellery in soft light"><p class="lead">${a.intro}</p><p>${a.body}</p><h2>Make it your own.</h2><p>Explore sterling silver pieces and follow the detail that feels like you. Keep your favourites in your wishlist, and return whenever the moment feels right.</p><a class="button" href="/shop/">Explore the collection ${icon("arrow")}</a><p class="preview-note" style="margin-top:30px">Original Sereva concept copy. Existing editorial URL preserved for the future WordPress implementation.</p></div></article>`;
}
function about() {
  return `${breadcrumbs([["About Us"]])}<section class="bound">${pageTitle("A feeling, in silver.", "Quiet confidence. Personal by nature.", "Our Story")}<div class="about-split"><img src="/assets/edit-pendant.webp" alt="A silver pendant in a pool of natural light"><div><p class="eyebrow">The Sereva philosophy</p><h2>Quiet confidence,<br>engineered in silver.</h2><p>We are drawn to silver for its effortless beauty. Sereva is a design concept inspired by the belief that luxury can feel personal, refined, and comfortable enough to wear every day.</p><p>The original brand’s story is rooted in Jaipur’s jewellery and design traditions. This storefront carries that appreciation for 925 sterling silver into a calmer, more considered shopping experience.</p><a href="/shop/" class="text-link" style="margin-top:24px">Find your everyday signature ${icon("arrow")}</a></div></div><div class="content-narrow prose"><p class="lead">More than jewellery. A way to feel like yourself.</p><p>Our pieces are here for the smallest details and the moments that matter. Explore the shapes, textures and finishes that feel personal to you.</p><h2>Designed around your everyday.</h2><p>From a quiet ring to a statement bracelet, your jewellery should sit comfortably within your own rhythm. Keep it simple, make it expressive, or find your own balance.</p></div></section>`;
}
const faqs = [
  [
    "What is the jewellery made from?",
    "The published catalog describes 925 sterling silver. Refer to each product’s specifications for its finish, stone and other details.",
  ],
  [
    "How should I care for silver?",
    "Keep it dry and away from fragrance, lotions and chemicals. Store each piece separately. Natural tarnishing is a characteristic of silver.",
  ],
  [
    "How long does delivery take?",
    "The published delivery policy estimates dispatch within 2 business days, followed by around 4–5 business days in transit within India. Courier and location can affect timings.",
  ],
  [
    "Can I return a piece?",
    "The dedicated returns policy allows eligible requests within 5 days of delivery. Items must be unused and in original packaging. A continuous unboxing video is required. Earrings are excluded unless damaged, defective or incorrect. Read the full Refund Policy for conditions.",
  ],
  [
    "How do I track an order?",
    "After WordPress integration, your account and dispatch updates will provide tracking. You can explore demo order tracking on this preview.",
  ],
  [
    "Which payment methods are available?",
    "The published terms specify prepaid orders and no Cash on Delivery. Available gateways, payment methods and shipping settings require verification within WooCommerce. This design preview takes no payment.",
  ],
  [
    "Can I exchange a ring for another size?",
    "The published return policy permits one eligible exchange per order, subject to availability. Check the full policy and the product’s size information.",
  ],
  [
    "Will my wishlist be saved?",
    "Your preview wishlist is saved on this browser. Your favourites will be here when you return.",
  ],
];
function faq() {
  return `${breadcrumbs([["FAQs"]])}<section class="bound">${pageTitle("A little clarity.", "The details that make choosing your silver easier.", "Frequently Asked Questions")}<div class="content-narrow faq">${faqs.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}<p class="preview-note">Policy summaries reflect the published dedicated policy pages. Some original FAQ wording conflicts with these policies and requires merchant approval.</p><a href="/contact/" class="button" style="margin-top:25px">We’re here to help ${icon("arrow")}</a></div></section>`;
}
function policy(slug) {
  const p = CONTENT.pages[slug];
  return `${breadcrumbs([[p?.title || "Information"]])}<section class="bound">${pageTitle(p?.title || "Information", "", "Sereva · Customer Care")}<div class="content-narrow prose">${["privacy-policy", "refund-returns", "term-and-conditions"].includes(slug) ? '<p class="preview-note">Policy design preview, adapted from the original published page. Sereva’s business details and final wording need approval before launch. No policy acceptance or data processing takes place here.</p>' : ""}${p?.html || "<p>Content requires verification.</p>"}<a href="/contact/" class="text-link">Contact the store team ${icon("arrow")}</a></div></section>`;
}
function contact() {
  return `${breadcrumbs([["Contact"]])}<section class="bound">${pageTitle("A little help, whenever.", "For questions about sizing, styling, or the pieces you love.", "Contact Sereva")}<div class="contact-layout"><div class="contact-details"><h2>Let’s talk silver.</h2><p>Find answers to common questions in our care guide and FAQs, or explore the contact form.</p><p>Monday–Saturday<br>10:00 AM–6:00 PM IST<br><small>Support details to be confirmed for Sereva.</small></p><a href="/faq/" class="text-link">Read the FAQs ${icon("arrow")}</a><p class="preview-note">This form validates locally. Messages are not sent or stored. Approved Sereva contact details will be added during WordPress implementation.</p></div><form id="contact-form"><div class="form-grid"><label class="field">Your name<input name="name" placeholder="Your name" required autocomplete="off"></label><label class="field">Email address<input type="email" name="email" placeholder="you@example.com" required autocomplete="off"></label><label class="field span-all">What can we help with?<select name="subject"><option>Sizing & styling</option><option>Order help</option><option>Returns & exchanges</option><option>Something else</option></select></label><label class="field span-all">Order number (optional)<input name="order" placeholder="Order number" autocomplete="off"></label><label class="field span-all">Your message<textarea name="message" placeholder="Tell us a little more…" required minlength="10"></textarea></label><button class="button span-all">Preview message ${icon("arrow")}</button></div><p id="contact-status" class="preview-note" hidden role="status"></p></form></div></section>`;
}
function compare() {
  const ps = state.compare.map(getProduct);
  return `${breadcrumbs([["Compare"]])}<section class="bound">${pageTitle("The finer details.", "Compare up to three pieces, side by side.", "Compare Jewellery")}${ps.length ? `<div class="compare-wrap"><table class="compare-table"><tbody><tr><th>Piece</th>${ps.map((p) => `<td>${image(p)}<h3><a href="${p.path}">${esc(p.name)}</a></h3><button class="text-link" data-compare="${p.id}">Remove ×</button></td>`).join("")}</tr><tr><th>Price</th>${ps.map((p) => `<td>${money(p.price)}</td>`).join("")}</tr><tr><th>Availability</th>${ps.map((p) => `<td>${p.stock ? "In stock" : "Out of stock"}${p.type === "variable" ? " · choose options" : ""}</td>`).join("")}</tr><tr><th>Options</th>${ps.map((p) => `<td>${p.attributes.map((a) => `${esc(a.name)}: ${a.options.map(esc).join(", ")}`).join("<br>") || "No variations"}</td>`).join("")}</tr><tr><th>Details</th>${ps.map((p) => `<td>${esc(p.description)}<a href="${p.path}" class="button">View piece</a></td>`).join("")}</tr></tbody></table></div>` : empty("A closer comparison.", "Use Compare on any product page to see the finer details side by side.", "compare")}</section>`;
}
function legacy(title, text) {
  return `${breadcrumbs([[title]])}<section class="bound legacy-page">${pageTitle(title, "", "Page awaiting approval")}<div class="content-narrow prose"><p class="preview-note">${esc(text)}</p><p>This route has been preserved in the audit. The storefront design is ready for approved content. No redirect or deletion has been applied.</p><a href="/shop/" class="button">Explore Sereva ${icon("arrow")}</a></div></section>`;
}
function notFound() {
  return `${breadcrumbs([["Page not found"]])}<section class="bound page-section">${empty("A little off the beaten path.", "We couldn’t find that page. Let’s find a piece you’ll love instead.", "search")}</section>`;
}
function render() {
  activeProduct = null;
  document.body.classList.remove("has-mobile-purchase");
  const path = decodeURI(location.pathname).replace(/\/+$/, "") || "/";
  const slug = path.split("/").pop();
  const query = new URLSearchParams(location.search);
  let html = "",
    title = "Sereva — A feeling, in silver.";
  if (path === "/" && !query.get("s") && !query.get("elementskit_template"))
    html = home();
  else if (query.get("elementskit_template"))
    html = legacy(
      "Footer template",
      "The source exposes an internal Elementor footer template. It is inventoried as a legacy template, not a customer page.",
    );
  else if (path.startsWith("/product/")) {
    const p = bySlug(slug);
    html = p ? productPage(p) : notFound();
    title = p ? `${p.name} | Sereva` : title;
    if (p) document.body.classList.add("has-mobile-purchase");
  } else if (
    path.startsWith("/product-category/") ||
    path.startsWith("/product-tag/") ||
    ["/shop", "/shop-2", "/new-arrivals"].includes(path) ||
    path.startsWith("/shop/page") ||
    query.get("s")
  ) {
    html = collection();
    title = `${query.get("s") ? "Search" : currentCollection().title} | Sereva`;
  } else if (["/cart", "/cart-2"].includes(path)) {
    html = cart();
    title = "Your Bag | Sereva";
  } else if (path.includes("/order-received")) {
    html = confirmation();
    title = "Order Preview | Sereva";
  } else if (["/checkout", "/checkout-2"].includes(path)) {
    html = checkout();
    title = "Checkout Preview | Sereva";
  } else if (["/wishlist", "/wishlist-2"].includes(path)) {
    html = wishlist();
    title = "Your Wishlist | Sereva";
  } else if (
    path.startsWith("/my-account") ||
    ["/dashboard", "/my-orders"].includes(path)
  ) {
    html = account();
    title = "Your Account | Sereva";
  } else if (path === "/about-us") {
    html = about();
    title = "Our Story | Sereva";
  } else if (path === "/contact") {
    html = contact();
    title = "Contact | Sereva";
  } else if (path === "/faq") {
    html = faq();
    title = "FAQs | Sereva";
  } else if (path === "/order-tracking") {
    html = tracking();
    title = "Track Your Order | Sereva";
  } else if (path === "/compare") {
    html = compare();
    title = "Compare Pieces | Sereva";
  } else if (
    ["/blog", "/category/uncategorized", "/author/admin"].includes(path) ||
    path.startsWith("/tag/")
  ) {
    html = journal();
    title = "The Journal | Sereva";
  } else if (CONTENT.posts.some((p) => p.slug === slug)) {
    html = article(slug);
    title = `${CONTENT.posts.find((p) => p.slug === slug).title} | Sereva`;
  } else if (
    [
      "privacy-policy",
      "refund-returns",
      "term-and-conditions",
      "jewellery-care",
    ].includes(slug)
  ) {
    html = policy(slug);
    title = `${CONTENT.pages[slug]?.title} | Sereva`;
  } else if (CONTENT.pages[slug] || path.startsWith("/footers/")) {
    html = legacy(
      CONTENT.pages[slug]?.title || "Footer template",
      "The published source contains a duplicate, empty, demo, or internal page. Its intended customer-facing purpose requires confirmation.",
    );
  } else html = notFound();
  $("#main").innerHTML = html;
  document.title = title;
  header();
  footer();
  if (path.includes("my-orders") && state.account) {
    history.replaceState({}, "", "/my-account/orders/");
    render();
    return;
  }
}
function navigate(url) {
  const u = new URL(url, location.origin);
  if (drawer.open) drawer.close();
  if ($("#lightbox").open) $("#lightbox").close();
  if (location.pathname !== u.pathname) {
    state.filter = {};
    state.limit = 24;
    state.qty = 1;
  }
  history.pushState({}, "", u.pathname + u.search + u.hash);
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
  $("#main").focus({ preventScroll: true });
}
function openDrawer(kind, payload) {
  returnFocus = document.activeElement;
  currentDrawer = kind;
  const titles = {
    bag: "Your Bag",
    search: "Find your silver.",
    menu: "Explore Sereva",
    size: "A little sizing help.",
    quick: "A closer look.",
    filters: "Find your favourites",
  };
  $("#drawer-title").textContent = titles[kind] || "Sereva";
  drawer.classList.toggle("mobile-filter", kind === "filters");
  const d = $("#drawer-body");
  if (kind === "bag")
    d.innerHTML = state.bag.length
      ? bagLines() +
        `<div class="order-summary"><div class="summary-row total"><span>Subtotal</span><span>${money(totals().subtotal)}</span></div><a href="/checkout/" class="button full">Checkout preview ${icon("arrow")}</a><a href="/cart/" class="button outline full" style="margin-top:10px">View your bag</a><p class="search-meta" style="margin-top:14px">Design preview. No payment is taken.</p></div>`
      : empty(
          "Your bag is waiting.",
          "Find a little silver that feels like you.",
        );
  if (kind === "menu")
    d.innerHTML = `<nav class="mobile-menu" aria-label="Mobile navigation"><a href="/">Home</a><a href="/product-category/diwali-edit/">Diwali Edit</a><a href="/product-category/new-arrivals/">New Arrivals</a><details><summary>Women</summary><a href="/product-category/women/">Shop all Women</a>${navChildren("women", true)}</details><details><summary>Men</summary><a href="/product-category/men/">Shop all Men</a>${navChildren("men", true)}</details><a href="/shop/">Shop All</a><a href="/about-us/">About Us</a><a href="/contact/">Contact</a></nav><div class="mobile-menu-footer"><a href="/my-account/">My Account</a><a href="/wishlist/">Wishlist (${state.wishlist.length})</a><a href="/order-tracking/">Track an order</a></div><p class="eyebrow" style="text-align:center;color:var(--brand);margin-top:40px">✧ &nbsp; 925 Sterling Silver</p>`;
  if (kind === "search") {
    d.innerHTML = `<form class="search-form" id="search-form"><label class="sr-only" for="search-input">Search jewellery</label><input id="search-input" type="search" placeholder="Try rings, a colour, a feeling…" autocomplete="off" value="${esc(lastSearch)}"><button aria-label="View all search results">${icon("arrow")}</button></form><div class="search-suggestions"><a href="/product-category/women/rings-women/">Rings</a><a href="/product-category/women/earrings-women/">Earrings</a><a href="/product-category/new-arrivals/">New Arrivals</a></div><div id="search-results" aria-live="polite"></div>`;
    updateSearch(lastSearch);
  }
  if (kind === "size")
    d.innerHTML = `<div class="prose"><p class="lead">Find your comfortable fit.</p><p>Product options use the original catalog’s size labels. Measure an existing ring that fits the intended finger, and compare its inner diameter with the merchant’s official chart.</p><h3>Before you choose</h3><ul><li>Measure at the end of the day, when your hands are at their usual temperature.</li><li>A ring should pass comfortably over the knuckle without slipping off.</li><li>Wider bands can feel tighter. Ask for advice if you are between sizes.</li></ul><p class="preview-note">Size labels follow the product catalog. For a conversion chart or a precise fit, please ask the store team.</p><a href="/contact/" class="text-link">Ask about sizing ${icon("arrow")}</a></div>`;
  if (kind === "quick") {
    const p = getProduct(payload);
    d.innerHTML = `<div class="quickview">${image(p, 'class="quickview-image"')}<p class="eyebrow">${esc(categoryName(p))}</p><h3>${esc(p.name)}</h3><p class="detail-price">${money(p.price)}</p><p class="description">${esc(p.description.split("•")[0])}</p><a href="${p.path}" class="button full">${p.type === "variable" ? "Choose options" : "Explore this piece"} ${icon("arrow")}</a><button data-wish="${p.id}" class="text-link" aria-pressed="${state.wishlist.includes(p.id)}">${icon("heart")}Save to wishlist</button></div>`;
  }
  if (kind === "filters") d.innerHTML = filtersMarkup("mobile-");
  if (!drawer.open) drawer.showModal();
  if (kind === "search") $("#search-input").focus();
  else $("[data-close]").focus();
}
function updateSearch(q) {
  lastSearch = q;
  const text = q.trim().toLowerCase();
  const result = text
    ? PRODUCTS.filter((p) =>
        (p.name + " " + p.description + " " + p.categories.join(" "))
          .toLowerCase()
          .includes(text),
      )
    : curated([
        "lustre-band",
        "astera-pendant-set",
        "bloom-trio-bracelet",
        "prism",
      ]);
  $("#search-results").innerHTML =
    `<p class="search-meta">${text ? `${result.length} matching pieces` : "A few favourites to begin with"}</p><div class="search-list">${result
      .slice(0, 6)
      .map(
        (p) =>
          `<a class="search-item" href="${p.path}">${image(p)}<div><h3>${esc(p.name)}</h3><p>${money(p.price)}</p></div>${icon("arrow")}</a>`,
      )
      .join(
        "",
      )}</div>${!result.length ? '<p class="preview-note">No pieces found. Try “ring”, “pendant”, or a colour.</p>' : text ? `<a href="/shop/?s=${encodeURIComponent(q)}" class="button outline full">View all results ${icon("arrow")}</a>` : ""}`;
}
function toggleWish(id) {
  id = Number(id);
  if (state.wishlist.includes(id)) {
    state.wishlist = state.wishlist.filter((i) => i !== id);
    toast("Removed from your wishlist.");
  } else {
    state.wishlist.push(id);
    toast("Saved for another day.");
  }
  save("wishlist", state.wishlist);
  const y = window.scrollY;
  if (location.pathname.startsWith("/wishlist")) {
    render();
    window.scrollTo(0, y);
  } else
    $$(`[data-wish="${id}"]`).forEach((b) => {
      const yes = state.wishlist.includes(id);
      b.setAttribute("aria-pressed", yes);
      const p = getProduct(id);
      b.setAttribute(
        "aria-label",
        `${yes ? "Remove" : "Save"} ${p.name} ${yes ? "from" : "to"} wishlist`,
      );
      if (b.closest(".detail-actions"))
        b.innerHTML =
          icon("heart") + (yes ? "Saved to wishlist" : "Save to wishlist");
    });
  header();
}
function refreshBag() {
  save("bag", state.bag);
  header();
  if (drawer.open && currentDrawer === "bag") openDrawer("bag");
  else {
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }
}
function safeReturn() {
  const r = new URLSearchParams(location.search).get("return_to");
  return r && r.startsWith("/") && !r.startsWith("//") && !r.includes("\\")
    ? r
    : "/my-account/";
}
function changeFilter(target) {
  const filterId = target.id.replace(/^mobile-/, "");
  if (target.name === "filter-category") {
    const values = $$(
      drawer.open && currentDrawer === "filters"
        ? "#drawer-body [name=filter-category]:checked"
        : "#main [name=filter-category]:checked",
    ).map((e) => e.value);
    state.filter.categories = values;
  }
  if (filterId === "price-filter") state.filter.max = Number(target.value);
  if (filterId === "stock-filter") state.filter.stock = target.checked;
  if (filterId === "attribute-filter") state.filter.attribute = target.value;
  if (filterId === "finish-filter") state.filter.finish = target.value;
  if (!(drawer.open && currentDrawer === "filters")) updateResults();
}
document.addEventListener("click", (e) => {
  const target = e.target.closest("button,a");
  if (!target) return;
  if (target.matches("a[href]")) {
    const u = new URL(target.href, location.href);
    if (
      u.origin === location.origin &&
      !target.hasAttribute("download") &&
      !target.target &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.shiftKey
    ) {
      if (u.hash && u.pathname === location.pathname) {
        if (u.hash === "#main") {
          $("#main").focus();
          return;
        }
      } else {
        e.preventDefault();
        navigate(u.href);
        return;
      }
    }
  }
  if (target.hasAttribute("data-open")) openDrawer(target.dataset.open);
  if (target.hasAttribute("data-close")) drawer.close();
  if (target.matches(".mega-toggle")) {
    const expanded = target.getAttribute("aria-expanded") === "true";
    target.setAttribute("aria-expanded", !expanded);
    $("#mega-menu").hidden = expanded;
  }
  if (target.hasAttribute("data-wish")) toggleWish(target.dataset.wish);
  if (target.hasAttribute("data-quick"))
    openDrawer("quick", target.dataset.quick);
  if (target.hasAttribute("data-gallery")) {
    $("#main-product-image").src = target.dataset.gallery;
    $$(".gallery-thumbs button").forEach((b) =>
      b.classList.toggle("active", b === target),
    );
  }
  if (target.hasAttribute("data-zoom")) {
    const mainImage = $("#main-product-image");
    const localPhoto = new URL(activeProduct.image, location.origin).href;
    $("#zoom-image").src =
      mainImage.src === localPhoto
        ? activeProduct.gallery[0] || activeProduct.image
        : mainImage.src;
    $("#zoom-image").alt = activeProduct.name;
    $("#lightbox").showModal();
  }
  if (target.hasAttribute("data-close-zoom")) $("#lightbox").close();
  if (target.hasAttribute("data-product-qty")) {
    state.qty = Math.min(
      20,
      Math.max(1, state.qty + Number(target.dataset.productQty)),
    );
    $("#product-qty").textContent = state.qty;
  }
  if (target.hasAttribute("data-mobile-add")) {
    const form = $("#product-form");
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    form.requestSubmit();
  }
  if (target.hasAttribute("data-remove")) {
    state.bag = state.bag.filter(
      (l) => l.key !== Number(target.dataset.remove),
    );
    refreshBag();
    toast("Piece removed from your bag.");
  }
  if (target.hasAttribute("data-qty")) {
    const line = state.bag.find((l) => l.key === Number(target.dataset.qty));
    if (line) {
      line.qty = Math.min(20, line.qty + Number(target.dataset.delta));
      state.bag = state.bag.filter((l) => l.qty > 0);
      refreshBag();
    }
  }
  if (target.hasAttribute("data-compare")) {
    const id = Number(target.dataset.compare);
    if (state.compare.includes(id)) {
      state.compare = state.compare.filter((i) => i !== id);
      toast("Removed from comparison.");
    } else {
      if (state.compare.length >= 3) {
        toast("You can compare three pieces at a time.");
        return;
      }
      state.compare.push(id);
      toast("Added to Compare. Find your comparison in the footer.");
    }
    save("compare", state.compare);
    if (location.pathname.startsWith("/compare")) render();
  }
  if (target.hasAttribute("data-toggle-filters")) {
    if (window.matchMedia("(max-width:760px)").matches) openDrawer("filters");
    else {
      state.sidebar = !state.sidebar;
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
    }
  }
  if (target.hasAttribute("data-clear-filters")) {
    resetCollectionPage();
    state.filter = { sort: state.filter.sort };
    if (drawer.open && currentDrawer === "filters") {
      $("#drawer-body").innerHTML = filtersMarkup("mobile-");
    } else {
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
    }
  }
  if (target.hasAttribute("data-apply-filters")) drawer.close();
  if (target.hasAttribute("data-load-more")) {
    state.limit += 24;
    $("#catalog-results").innerHTML = catalogResults(filteredProducts());
  }
  if (target.hasAttribute("data-logout")) {
    state.account = null;
    state.address = null;
    toast("Signed out of the preview.");
    navigate("/shop/");
  }
  if (target.hasAttribute("data-remove-coupon")) {
    state.coupon = "";
    refreshBag();
  }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.matches("#product-form input[type=radio]")) updateVariation();
  if (t.id === "sort-products") {
    state.filter.sort = t.value;
    updateResults();
  }
  if (
    t.matches(
      '[name=filter-category],[id$="price-filter"],[id$="stock-filter"],[id$="attribute-filter"],[id$="finish-filter"]',
    )
  )
    changeFilter(t);
});
document.addEventListener("input", (e) => {
  if (e.target.id === "search-input") updateSearch(e.target.value);
  if (e.target.id.endsWith("price-filter")) {
    e.target.closest(".filters").querySelector("output").textContent = money(
      e.target.value,
    );
  }
});
document.addEventListener("submit", (e) => {
  const form = e.target;
  if (
    !form.matches(
      "#product-form,#coupon-form,#checkout-form,#account-form,#reset-form,#tracking-form,#contact-form,#address-form,#profile-form,#search-form",
    )
  )
    return;
  e.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  if (form.id === "product-form") {
    const p = getProduct(form.dataset.id);
    addToBag(p, p.type === "variable" ? selectedVariation(p) : null);
  }
  if (form.id === "coupon-form") {
    const val = $("#coupon-code").value.trim().toUpperCase();
    if (val === "SEREVA10") {
      state.coupon = val;
      refreshBag();
      toast("Preview discount applied.");
    } else {
      $("#coupon-message").textContent =
        "That preview code is not valid. Try SEREVA10.";
    }
  }
  if (form.id === "checkout-form") {
    if (data.get("payment") === "failure") {
      const err = $("#payment-error");
      err.hidden = false;
      err.className = "form-error";
      err.innerHTML =
        "<strong>Payment declined — preview state.</strong><br>No payment was taken. Your bag is safe. Select sandbox success to retry.";
      err.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    const t = totals();
    const order = {
      id: "SRE-PREVIEW-" + Date.now().toString(36).toUpperCase(),
      date: new Date().toLocaleDateString("en-IN"),
      total: t.total,
      lines: state.bag.map((l) => ({
        id: l.id,
        qty: l.qty,
        option: l.option,
        price: linePrice(l),
      })),
    };
    state.orders.unshift(order);
    save("orders", state.orders.slice(0, 30));
    state.bag = [];
    state.coupon = "";
    save("bag", []);
    navigate("/checkout/order-received/?order=" + order.id);
  }
  if (form.id === "account-form") {
    const email = data.get("email");
    state.account = { name: data.get("name") || "Silver lover", email };
    const url = safeReturn();
    form.reset();
    toast(
      form.dataset.signup === "true"
        ? "Preview account created. No real account was registered."
        : "Signed in to the account preview.",
    );
    navigate(url);
  }
  if (form.id === "reset-form") {
    form.innerHTML =
      '<div class="notice" role="status"><h3>Check your inbox — preview.</h3><p style="margin-top:15px">On the WordPress store, a reset link would be sent if this email belongs to an account. No email has been sent from this preview.</p></div>';
    toast("Password reset message previewed.");
  }
  if (form.id === "tracking-form") {
    const o = state.orders.find(
      (o) => o.id === String(data.get("order")).trim(),
    );
    $("#tracking-result").innerHTML = o
      ? `<div class="notice"><h3>Order ${esc(o.id)}</h3><div class="tracking-steps"><div class="done">Preview confirmed</div><div>Preparing your piece</div><div>On its way</div></div><p>No shipment was created. Live tracking connects to WooCommerce and the configured courier.</p><a class="text-link" href="/checkout/order-received/?order=${o.id}">Order details ${icon("arrow")}</a></div>`
      : '<p class="form-error">We couldn’t find that preview order on this browser. Check the number, or place a demo order first.</p>';
  }
  if (form.id === "contact-form") {
    form.reset();
    $("#contact-status").hidden = false;
    $("#contact-status").textContent =
      "Your message passes validation. This is a design preview; no message was sent or stored.";
  }
  if (form.id === "address-form") {
    state.address = {
      street: data.get("street"),
      city: data.get("city"),
      pin: data.get("pin"),
    };
    toast("Sample address saved for this preview session.");
  }
  if (form.id === "profile-form") {
    state.account = { name: data.get("name"), email: data.get("email") };
    toast("Preview account details updated.");
  }
  if (form.id === "search-form")
    navigate("/shop/?s=" + encodeURIComponent($("#search-input").value.trim()));
});
drawer.addEventListener("close", () => {
  if (currentDrawer === "filters") {
    resetCollectionPage();
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
    $("[data-toggle-filters]")?.focus({ preventScroll: true });
    currentDrawer = "";
    return;
  }
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
});
drawer.addEventListener("click", (e) => {
  if (e.target === drawer) {
    const r = drawer.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      drawer.close();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("#mega-menu")) {
    $("#mega-menu").hidden = true;
    $(".mega-toggle")?.setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".mega") && $("#mega-menu")) {
    $("#mega-menu").hidden = true;
    $(".mega-toggle")?.setAttribute("aria-expanded", "false");
  }
});
window.addEventListener("popstate", () => {
  if (drawer.open) drawer.close();
  state.filter = {};
  state.limit = 24;
  render();
});
render();
