import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { JSDOM, VirtualConsole } from "jsdom";
const root = resolve(import.meta.dirname, ".."),
  errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => errors.push(e.message));
const dom = new JSDOM(readFileSync(root + "/dist/index.html", "utf8"), {
  url: "https://sereva.test/",
  runScripts: "outside-only",
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const w = dom.window,
  d = w.document;
w.scrollTo = () => {};
w.matchMedia = (q) => ({
  matches: false,
  media: q,
  addEventListener() {},
  removeEventListener() {},
});
w.HTMLElement.prototype.scrollIntoView = function () {};
w.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
w.HTMLDialogElement.prototype.close = function () {
  this.open = false;
  this.dispatchEvent(new w.Event("close"));
};
for (const f of ["catalog.js", "variations.js", "content.js", "store.js"])
  w.eval(readFileSync(root + "/dist/" + f, "utf8"));
const q = (s) => d.querySelector(s),
  qa = (s) => [...d.querySelectorAll(s)];
const go = (path) => {
  w.history.pushState({}, "", path);
  w.dispatchEvent(new w.PopStateEvent("popstate"));
};
const click = (s) => {
  assert(q(s), "Missing " + s);
  q(s).click();
};
const change = (s, v) => {
  const x = q(s);
  assert(x, "Missing " + s);
  if (x.type === "checkbox" || x.type === "radio") x.checked = v;
  else x.value = v;
  x.dispatchEvent(new w.Event("change", { bubbles: true }));
};
const submit = (s) => {
  assert(q(s).reportValidity(), "Invalid form " + s);
  q(s).dispatchEvent(
    new w.Event("submit", { bubbles: true, cancelable: true }),
  );
};
let checks = 0;
function pass(s) {
  console.log("PASS", s);
  checks++;
}
const config = JSON.parse(readFileSync(root + "/vercel.json", "utf8"));
const rewrite = new RegExp("^" + config.rewrites[0].source + "$");
for (const path of [
  "/style.css",
  "/store.js",
  "/assets/hero.webp",
  "/catalog.js",
  "/variations.js",
  "/content.js",
])
  assert(!rewrite.test(path), "Asset must bypass SPA rewrite: " + path);
assert(rewrite.test("/product/onyx-line/"));
assert.equal(config.outputDirectory, "dist");
const catalog = w.SEREVA_CATALOG;
assert.equal(catalog.products.length, 304);
assert.equal(Object.keys(w.SEREVA_VARIATIONS).length, 240);
for (const p of catalog.products) {
  assert(existsSync(root + "/dist" + p.image), p.slug + " missing local image");
  assert(p.price > 0);
  for (const v of p.variations) assert(w.SEREVA_VARIATIONS[v.id]);
}
assert.equal(q("h1").textContent, "A little silver.A lot of you.");
assert.equal(qa(".category-card").length, 5);
assert.equal(qa(".product-card").length, 8);
pass("Homepage, 304 products, 240 variations and local images");
click(".mega-toggle");
assert.equal(q("#mega-menu").hidden, false);
assert.deepEqual(
  qa("#mega-menu h3").map((e) => e.textContent),
  ["The silver edit", "Men", "Women"],
);
click('[data-open="menu"]');
assert(q("#drawer").open);
assert.deepEqual(
  qa(".mobile-menu > a, .mobile-menu > details > summary").map(
    (e) => e.textContent,
  ),
  [
    "Home",
    "Diwali Edit",
    "New Arrivals",
    "Women",
    "Men",
    "Shop All",
    "About Us",
    "Contact",
  ],
);
click("[data-close]");
pass("Desktop mega menu and preserved mobile menu hierarchy");
click('[data-open="search"]');
q("#search-input").value = "onyx";
q("#search-input").dispatchEvent(new w.Event("input", { bubbles: true }));
assert(q("#search-results").textContent.includes("Onyx Line"));
q("#search-input").value = "zzzzNOTFOUND";
q("#search-input").dispatchEvent(new w.Event("input", { bubbles: true }));
assert(q("#search-results").textContent.includes("No pieces found"));
click("[data-close]");
pass("Search suggestions and no-results state");
go("/shop/");
assert.equal(qa(".product-card").length, 24);
click("[data-load-more]");
assert.equal(qa(".product-card").length, 48);
change("#stock-filter", true);
assert(q(".results-count").textContent.includes("275"));
change("#sort-products", "price");
const prices = qa(".product-price").map((e) =>
  Number(e.textContent.replace(/[^0-9]/g, "")),
);
assert(prices[0] <= prices[1]);
change("#price-filter", "850");
assert(q(".results-count"));
click("[data-clear-filters]");
assert.equal(q(".results-count").textContent, "304 pieces");
go("/shop/page/2/");
assert.equal(qa(".product-card").length, 12);
assert(!q("#main").textContent.includes("No pieces match"));
w.matchMedia = (q) => ({ matches: true, media: q });
click("[data-toggle-filters]");
assert(q("#mobile-price-filter"));
assert.equal(qa("#price-filter").length, 1);
change("#mobile-stock-filter", true);
click("[data-apply-filters]");
assert.equal(q(".results-count").textContent, "275 pieces");
w.matchMedia = (q) => ({ matches: false, media: q });
pass("Filtering, sorting, load more and preserved pagination URLs");
let product = catalog.products.find((p) => p.slug === "onyx-line");
go(product.path);
assert.equal(q("h1").textContent, product.name);
assert(q("#add-to-bag").disabled);
assert(!q("#product-form").reportValidity());
const radio = q("#product-form input[type=radio]");
radio.checked = true;
radio.dispatchEvent(new w.Event("change", { bubbles: true }));
const variant = product.variations.find((v) =>
  v.attributes.some((a) => a.value === radio.value),
);
if (w.SEREVA_VARIATIONS[variant.id].stock) {
  assert(!q("#add-to-bag").disabled);
  submit("#product-form");
  assert(q("#drawer").open);
  assert(q("#drawer-body").textContent.includes("Onyx Line"));
  click("[data-close]");
}
const unavailableParent = catalog.products.find(
  (p) => p.stock && p.variations.some((v) => !w.SEREVA_VARIATIONS[v.id].stock),
);
const unavailableVariant = unavailableParent.variations.find(
  (v) => !w.SEREVA_VARIATIONS[v.id].stock,
);
go(unavailableParent.path);
for (const a of unavailableVariant.attributes) {
  const el = qa("#product-form input[type=radio]").find(
    (i) =>
      i.dataset.attribute.toLowerCase() === a.name.toLowerCase() &&
      i.value.toLowerCase() === a.value.toLowerCase(),
  );
  assert(el);
  el.checked = true;
  el.dispatchEvent(new w.Event("change", { bubbles: true }));
}
assert(q("#add-to-bag").disabled);
assert(q("#variation-message").textContent.includes("unavailable"));
go(product.path);
pass("Required product options, variation availability and Add to Bag");
click(`[data-wish="${product.id}"]`);
go("/wishlist/");
assert(q(".product-card").textContent.includes(product.name));
assert(
  JSON.parse(w.localStorage.getItem("sereva-v2-wishlist")).includes(product.id),
);
click(`[data-wish="${product.id}"]`);
assert(q("#main").textContent.includes("A space for your favourites"));
pass("Wishlist add, persistence, remove and empty state");
go(product.path);
click(`[data-compare="${product.id}"]`);
go("/compare/");
assert(q(".compare-table").textContent.includes(product.name));
click(`[data-compare="${product.id}"]`);
assert(q("#main").textContent.includes("A closer comparison"));
pass("Product comparison");
const simple = catalog.products.find((p) => p.slug === "prism");
go(simple.path);
submit("#product-form");
click("[data-close]");
go("/cart/");
assert(qa(".bag-line").length >= 1);
const qty = q('[data-qty][data-delta="1"]');
const key = qty.dataset.qty;
qty.click();
assert(q("#main").textContent.includes("Subtotal"));
q("#coupon-code").value = "WRONG";
submit("#coupon-form");
assert(q("#coupon-message").textContent.includes("not valid"));
q("#coupon-code").value = "SEREVA10";
submit("#coupon-form");
assert(q("#main").textContent.includes("Preview code SEREVA10"));
pass("Bag quantity updates, valid and invalid coupon states");
go("/checkout/");
assert(q("#checkout-form"));
change("[name=payment][value=failure]", true);
submit("#checkout-form");
assert(!q("#payment-error").hidden);
assert(q("#payment-error").textContent.includes("No payment was taken"));
assert(JSON.parse(w.localStorage.getItem("sereva-v2-bag")).length > 0);
change("[name=payment][value=success]", true);
submit("#checkout-form");
assert(w.location.pathname.includes("order-received"));
assert(q("h1").textContent.includes("A little silver"));
const order = JSON.parse(w.localStorage.getItem("sereva-v2-orders"))[0];
assert(order.id.startsWith("SRE-PREVIEW-"));
assert(!("email" in order));
assert(!("address" in order));
assert.equal(JSON.parse(w.localStorage.getItem("sereva-v2-bag")).length, 0);
pass("Declined payment, retry, demo order confirmation and bag clearing");
go("/order-tracking/");
q("[name=order]").value = order.id;
q("[name=email]").value = "guest@example.com";
submit("#tracking-form");
assert(q("#tracking-result").textContent.includes("Preview confirmed"));
q("[name=order]").value = "MISSING";
submit("#tracking-form");
assert(q("#tracking-result").textContent.includes("couldn’t find"));
pass("Demo order tracking and unknown-order state");
go("/my-account/?mode=register");
q("[name=name]").value = "Sample Customer";
q("[name=email]").value = "sample@example.com";
q("[name=password]").value = "SampleOnly123";
submit("#account-form");
assert(q(".account-main").textContent.includes("Hello, Sample Customer"));
assert(!Object.values(w.localStorage).some((v) => v.includes("SampleOnly123")));
go("/my-account/orders/");
assert(q(".account-main").textContent.includes(order.id));
go("/my-account/edit-address/");
q("[name=street]").value = "22 Preview Street";
submit("#address-form");
go("/my-account/edit-account/");
q("[name=name]").value = "New Sample";
submit("#profile-form");
go("/my-account/");
assert(q(".account-main").textContent.includes("Hello, New Sample"));
click("[data-logout]");
assert.equal(w.location.pathname, "/shop/");
pass(
  "Registration preview, account dashboard, orders, addresses, profile and logout",
);
go("/my-account/?return_to=/checkout/");
q("[name=email]").value = "sample@example.com";
q("[name=password]").value = "SampleOnly123";
submit("#account-form");
assert.equal(w.location.pathname, "/checkout/");
go("/my-account/");
click("[data-logout]");
go("/my-account/lost-password/");
q("[name=email]").value = "sample@example.com";
submit("#reset-form");
assert(q("#main").textContent.includes("No email has been sent"));
pass("Sign in, return to shopping and password reset preview");
go("/contact/");
q("[name=name]").value = "Sample Customer";
q("[name=email]").value = "sample@example.com";
q("[name=message]").value = "A sample sizing question for this design.";
submit("#contact-form");
assert(!q("#contact-status").hidden);
assert(q("#contact-status").textContent.includes("no message was sent"));
pass("Contact validation and honest unsent-message state");
// Regression checks for discovered collection/product edge cases.
go("/shop/page/25/?orderby=price-desc");
assert.equal(q("#sort-products").value, "price-desc");
change("#price-filter", "1600");
assert(!/\/page(?:\/|=)/.test(w.location.pathname));
assert(
  qa(".product-card").length > 0,
  "A filter must recover from a later page",
);
go("/shop/page/999/");
assert(
  q("#main").textContent.includes("This collection has no pieces on this page"),
);
const noGender = catalog.products.find(
  (p) => !p.categories.includes("men") && !p.categories.includes("women"),
);
go(noGender.path);
assert(!q('.breadcrumbs a[href="/product-category/women/"]'));
assert(!q('.breadcrumbs a[href="/product-category/men/"]'));
const descriptive = catalog.products.find((p) => p.slug === "onyx-line");
go(descriptive.path);
assert(qa(".detail-accordions details:first-child li").length >= 3);
assert(!q(".description").textContent.includes("Material:"));
assert.equal(q("#main-product-image").getAttribute("loading"), "eager");
const chooseVariant = (variant) => {
  for (const a of variant.attributes) {
    const input = qa("#product-form input[type=radio]").find(
      (i) =>
        i.dataset.attribute.toLowerCase() === a.name.toLowerCase() &&
        i.value.toLowerCase() === a.value.toLowerCase(),
    );
    assert(input);
    input.checked = true;
    input.dispatchEvent(new w.Event("change", { bubbles: true }));
  }
};
const varying = catalog.products.find(
  (p) =>
    p.stock &&
    p.variations.some(
      (v) =>
        w.SEREVA_VARIATIONS[v.id].stock &&
        w.SEREVA_VARIATIONS[v.id].price > 0 &&
        w.SEREVA_VARIATIONS[v.id].price !== p.price,
    ),
);
const pricedVariation = varying.variations.find(
  (v) =>
    w.SEREVA_VARIATIONS[v.id].stock &&
    w.SEREVA_VARIATIONS[v.id].price > 0 &&
    w.SEREVA_VARIATIONS[v.id].price !== varying.price,
);
go(varying.path);
assert(q("[data-mobile-add]").textContent.includes("Choose options"));
chooseVariant(pricedVariation);
assert.equal(q("#mobile-price").textContent, q("#detail-price").textContent);
assert(!q("[data-mobile-add]").disabled);
assert(q("[data-mobile-add]").textContent.includes("Add to Bag"));
for (const p of catalog.products.filter((p) =>
  p.variations.some((v) => w.SEREVA_VARIATIONS[v.id].price <= 0),
)) {
  go(p.path);
  chooseVariant(p.variations.find((v) => w.SEREVA_VARIATIONS[v.id].price <= 0));
  assert(q("#add-to-bag").disabled);
  assert(q("[data-mobile-add]").disabled);
  assert.equal(q("#mobile-price").textContent, "Price unavailable");
  assert(
    q("#variation-message").textContent.includes("Pricing is unavailable"),
  );
  const before = w.localStorage.getItem("sereva-v2-bag");
  submit("#product-form");
  assert.equal(
    w.localStorage.getItem("sereva-v2-bag"),
    before,
    "Missing price must not create a free bag item",
  );
}
pass(
  "Pagination recovery, accurate breadcrumbs, product specifications and mobile variation pricing",
);
for (const p of catalog.products) {
  go(p.path);
  assert.equal(q("h1").textContent, p.name, "Product route " + p.path);
  assert(q("#product-form"));
}
for (const c of catalog.categories) {
  go(c.path);
  assert(q("h1").textContent.includes(c.name), c.path);
}
for (const url of [
  "/privacy-policy/",
  "/refund-returns/",
  "/term-and-conditions/",
  "/jewellery-care/",
  "/about-us/",
  "/faq/",
  "/blog/",
  "/shop-2/",
  "/cart-2/",
  "/checkout-2/",
  "/my-account-2/",
  "/wishlist-2/",
  "/sample-page/",
  "/footers/footer-1/",
  "/not-a-page/",
]) {
  go(url);
  assert(q("h1, h2"), url);
  assert(!q("#main").textContent.includes("undefined"), url);
}
go("/product-tag/" + Object.keys(catalog.tags)[0] + "/");
assert(q(".results-count"));
const unavailable = catalog.products.find((p) => !p.stock);
go(unavailable.path);
assert(q("#add-to-bag").disabled);
assert(q("#add-to-bag").textContent.includes("Out of Stock"));
pass(
  "All 304 product routes, category templates, policy/support/legacy routes and out-of-stock state",
);
const scriptErrors = errors.filter((e) => !e.includes("requestSubmit"));
assert.deepEqual(scriptErrors, []);
pass("No JavaScript exceptions during interaction and route checks");
console.log(
  `\n${checks} groups passed. DOM integration only; no layout, keyboard/browser or real payment verification claimed.`,
);
w.close();
