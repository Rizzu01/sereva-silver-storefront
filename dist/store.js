"use strict";

const paths = {
  menu:'M3 6h18M3 12h18M3 18h18', search:'M21 21l-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  person:'M20 21v-2a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z',
  bag:'M5 8h14l2 13H3L5 8Zm3 2V6a4 4 0 0 1 8 0v4', close:'m6 6 12 12M18 6 6 18',
  arrow:'M4 12h15m-6-6 6 6-6 6', sparkle:'M12 2c.7 5.7 4.3 9.3 10 10-5.7.7-9.3 4.3-10 10-.7-5.7-4.3-9.3-10-10 5.7-.7 9.3-4.3 10-10Z',
  truck:'M1 5h14v12H1V5Zm14 4h4l4 4v4h-8M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm14 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  return:'M5 7h10a5 5 0 0 1 0 10H9M5 7l4-4M5 7l4 4'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
document.querySelectorAll("[data-icon]").forEach(el => el.innerHTML = icon(el.dataset.icon));

const items = [
  {id:"lustre",name:"Aster Eternity Ring",price:1600,type:"Rings",wear:["Women","Men"],image:"ring",options:["India 12 / US 6","India 14 / US 7","India 16 / US 8"]},
  {id:"astera",name:"Meher Floral Pendant Set",price:3199,type:"Pendants",wear:["Women"],image:"pendant",options:["White","Green"]},
  {id:"pyramid",name:"Facet Silver Cufflinks",price:5800,type:"Cufflinks",wear:["Men"],image:"cufflinks"},
  {id:"bloom",name:"Ira Bloom Bracelet",price:3199,type:"Bracelets & Kadas",wear:["Women"],image:"bracelet"},
  {id:"hoops",name:"Sculpted Silver Hoops",price:2399,type:"Earrings",wear:["Women"],image:"earrings"},
  {id:"chain",name:"Twist Silver Chain",price:2899,type:"Chains",wear:["Women","Men"],image:"chain"}
];
const categories = [["Rings","ring"],["Earrings","earrings"],["Bracelets & Kadas","bracelet"],["Pendants","pendant"],["Chains","chain"]];
const types = [...categories.map(([type]) => type),"Cufflinks"];
const audiences = ["All","Women","Men"];
const money = new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0});
const load = (key, fallback) => { try {return JSON.parse(localStorage.getItem("sereva-"+key)) ?? fallback;} catch {return fallback;} };
const save = (key, value) => {try {localStorage.setItem("sereva-"+key,JSON.stringify(value));} catch {}};
const itemById = id => items.find(item => item.id === id);
const $ = id => document.getElementById(id);
const panel = $("panel");
const content = $("panel-content");
let favorites = load("wishlist",[]).filter(id => itemById(id));
let bag = load("bag",[]).filter(line => itemById(line.id) && Number.isInteger(line.qty) && line.qty>0);
let activeAudience = "All";
let activeEdit = "";
const edits = {"Diwali Edit":["astera","pyramid","bloom"],"New Arrivals":["hoops","chain","lustre"]};
let activePanel = "";
let toastTimer;
let lastTrigger;
const image = (item, extra="") => `<img ${extra} src="assets/${item.image}.webp" alt="${item.name}" loading="lazy">`;

$("category-list").innerHTML = categories.map(([type, file]) => `<button class="category" data-type="${type}"><div class="category-img"><img src="assets/${file}.webp" alt="" loading="lazy"></div><span class="category-title">${type}${icon("arrow")}</span></button>`).join("");
$("type-filter").insertAdjacentHTML("beforeend",types.map(type => `<option>${type}</option>`).join(""));
function renderCatalog() {
  $("audiences").innerHTML = audiences.map(audience => `<button data-audience="${audience}" aria-pressed="${audience===activeAudience}">${audience==="All"?"Shop all":audience}</button>`).join("");
  const type = $("type-filter").value;
  const matches = items.filter(item => (activeAudience==="All" || item.wear.includes(activeAudience)) && (type==="All" || item.type===type) && (!activeEdit || edits[activeEdit].includes(item.id)));
  const sort = $("sort").value;
  if (sort !== "featured") matches.sort((a,b) => sort==="low"?a.price-b.price:b.price-a.price);
  $("result-info").textContent = `${activeEdit ? activeEdit+" · " : ""}${matches.length} ${matches.length===1?"piece":"pieces"}`;
  $("products").innerHTML = matches.length ? matches.map(item => `<article class="product"><button class="product-main" data-product="${item.id}"><div class="product-img">${image(item)}</div><span class="product-title">${item.name}</span><span class="product-price">${money.format(item.price)}</span></button><button class="icon-button product-fav" data-favorite="${item.id}" aria-pressed="${favorites.includes(item.id)}" aria-label="Save ${item.name} to wishlist">${icon("heart")}</button></article>`).join("") : '<p class="empty">No pieces match these filters. Try a different jewellery type.</p>';
}
function notify(message) {
  clearTimeout(toastTimer);
  $("toast").textContent = message;
  $("toast").hidden = false;
  toastTimer = setTimeout(() => {$("toast").hidden = true;}, 2400);
}
function updateBag() {
  const count = bag.reduce((total,line)=>total+line.qty,0);
  $("bag-count").textContent = count;
  $("bag-count").hidden = count===0;
  save("bag",bag);
}
function openPanel(name,title,markup) {
  const alreadyOpen = panel.open;
  if (!alreadyOpen) lastTrigger = document.activeElement;
  activePanel = name;
  $("panel-title").textContent = title;
  content.innerHTML = markup;
  if (!alreadyOpen) panel.showModal();
  if (name==="search") $("search-input").focus();
  else $("close-panel").focus();
}
const shopButton = '<button class="button secondary full" data-continue>Continue shopping</button>';
function openProduct(id) {
  const product=itemById(id);
  const options=product.options ? `<label class="panel-label" for="variant">${id==="lustre"?"Ring size":"Colour"}</label><select id="variant" class="input">${product.options.map(option=>`<option>${option}</option>`).join("")}</select>` : "";
  openPanel("product",product.name,`${image(product,'class="panel-photo"')}<p class="panel-price">${money.format(product.price)}</p><p class="muted">Sterling silver jewellery · ${product.type}</p>${options}
  <button class="button primary full" data-add="${id}">Add to bag</button><p class="muted" style="margin-top:15px">Concept imagery and sample price.</p>`);
}
function renderWishlist() {
  openPanel("wishlist","Wishlist",favorites.length?`<ul class="panel-list">${favorites.map(id=>{const item=itemById(id);return `<li>${image(item)}<div><button class="text-button" data-product="${id}">${item.name}</button><br>${money.format(item.price)}</div><button class="icon-button" data-favorite="${id}" aria-label="Remove ${item.name} from wishlist">${icon("close")}</button></li>`;}).join("")}</ul>`:'<p>Your wishlist is empty.</p>'+shopButton);
}
function renderBag() {
  const total=bag.reduce((n,line)=>n+itemById(line.id).price*line.qty,0);
  openPanel("bag","Shopping bag",bag.length?`<ul class="panel-list">${bag.map((line,index)=>{const item=itemById(line.id);const option=item.options?.find(value=>value===line.option);return `<li>${image(item)}<div><button class="text-button" data-product="${item.id}">${item.name}</button>${option?`<br><small>${option}</small>`:""}<div class="quantity"><button data-quantity="${index}" data-delta="-1" aria-label="Decrease ${item.name} quantity">−</button>${line.qty}<button data-quantity="${index}" data-delta="1" aria-label="Increase ${item.name} quantity">+</button></div></div><span>${money.format(item.price*line.qty)}</span></li>`;}).join("")}</ul><div class="total"><span>Subtotal</span><span>${money.format(total)}</span></div><button class="button primary full" data-panel="checkout">Preview checkout</button>`:'<p>Your shopping bag is empty.</p>'+shopButton);
}
function searchResults() {
  const query=$("search-input").value.trim().toLowerCase();
  const matches=query?items.filter(item=>[item.name,item.type,...item.wear].some(word=>word.toLowerCase().includes(query))):items.slice(0,4);
  $("search-results").innerHTML=matches.length?matches.map(item=>`<li>${image(item)}<button class="text-button" data-product="${item.id}">${item.name}</button><span>${money.format(item.price)}</span></li>`).join(""):"<li>No matching jewellery found.</li>";
}
function showAccount(mode) {
  const labels={login:"Sign in",signup:"Create an account",reset:"Reset password"};
  openPanel("account","My account",`<p class="muted">Account layout preview. This demo illustrates sign-in, registration and password reset.</p><div class="tabs" aria-label="Account options">${Object.entries(labels).map(([value,label])=>`<button data-account-mode="${value}" aria-pressed="${mode===value}">${label}</button>`).join("")}</div><label class="panel-label" for="account-email">Email address</label><input id="account-email" class="input" placeholder="name@example.com" disabled>${mode==="reset"?"":'<label class="panel-label" for="account-password">Password</label><input id="account-password" type="password" class="input" placeholder="••••••••" disabled>'}<button class="button primary full" data-account-demo="${mode}">${mode==="login"?"Preview account":mode==="reset"?"Preview reset message":"Preview registration message"}</button>`);
}
function show(name) {
  if(name==="wishlist") return renderWishlist();
  if(name==="bag") return renderBag();
  if(name==="account") return showAccount("login");
  if(name==="search"){openPanel("search","Search jewellery",'<label class="sr-only" for="search-input">Search jewellery</label><input type="search" class="input" id="search-input" placeholder="Try rings or pendants"><ul id="search-results" class="panel-list" aria-live="polite"></ul>');searchResults();return;}
  if(name==="checkout"){openPanel("checkout","Checkout preview",'<p>Guests can check out without creating an account.</p><p class="muted">This demo does not collect addresses, place orders or take payments.</p>'+shopButton);return;}
  const information={
    about:["About Us","Sereva Silver is a fictional Indian jewellery brand created by Creative Rizz to demonstrate a sterling silver shopping experience."],
    contact:["Contact","In a live store this page would connect customers with the team for product, sizing and order help."],
    tracking:["Track an order","In a live store customers would use their order details to see the current delivery status."],
    returns:["Returns and exchanges","A live store would publish its return window, eligibility and exchange instructions here."]
  };
  if(information[name]){const [title,detail]=information[name];openPanel(name,title,`<p>${detail}</p>`+shopButton);return;}
  openPanel("menu","Shop Sereva",'<nav class="panel-nav" aria-label="Mobile menu"><a href="#" data-continue>Home</a><a href="#shop" data-edit="Diwali Edit">Diwali Edit</a><a href="#shop" data-edit="New Arrivals">New Arrivals</a><a href="#shop" data-shop="Women">Women</a><a href="#shop" data-shop="Men">Men</a><a href="#shop" data-shop="All">Shop All</a><button data-panel="about">About Us</button><button data-panel="contact">Contact</button><button data-panel="account">My account</button><button data-panel="wishlist">Wishlist</button></nav>');
}
document.addEventListener("click", event => {
  const control=event.target.closest("button,a");
  if(!control) return;
  const data=control.dataset;
  const storeMenu=document.querySelector(".store-menu");
  if(storeMenu.open && !control.closest(".store-menu")) storeMenu.open=false;
  if(data.shop || data.edit){
    activeAudience=data.shop||"All";
    activeEdit=data.edit||"";
    $("type-filter").value="All";
    renderCatalog();
    storeMenu.open=false;
    if(panel.open) panel.close();
    return;
  }
  if(data.audience){activeAudience=data.audience;activeEdit="";renderCatalog();document.querySelector(`[data-audience="${activeAudience}"]`).focus();return;}
  if(data.type){activeAudience="All";activeEdit="";$("type-filter").value=data.type;renderCatalog();$("shop").scrollIntoView();return;}
  if(data.panel) return show(data.panel);
  if(data.product) return openProduct(data.product);
  if(data.favorite){
    const id=data.favorite;
    const removing=favorites.includes(id);
    favorites=removing?favorites.filter(value=>value!==id):[...favorites,id];
    save("wishlist",favorites);
    renderCatalog();
    if(activePanel==="wishlist"&&panel.open) renderWishlist();
    else document.querySelector(`[data-favorite="${id}"]`)?.focus({preventScroll:true});
    notify(removing?"Removed from wishlist":"Saved to wishlist");
    return;
  }
  if(data.add){
    const id=data.add;
    const option=$("variant")?.value??"";
    const line=bag.find(entry=>entry.id===id&&entry.option===option);
    if(line) line.qty+=1; else bag.push({id,option,qty:1});
    updateBag();return renderBag();
  }
  if(data.quantity!==undefined){
    const index=Number(data.quantity);
    bag[index].qty+=Number(data.delta);
    if(bag[index].qty<=0) bag.splice(index,1);
    updateBag();return renderBag();
  }
  if(data.accountMode) return showAccount(data.accountMode);
  if(data.accountDemo){
    const message={login:"Account overview",signup:"Registration",reset:"Password reset"}[data.accountDemo];
    return openPanel("account",message,`<p>${data.accountDemo==="login"?"Your orders would appear here after signing in.": data.accountDemo==="signup"?"An online store would confirm your new account by email.":"An online store would send a password reset link to your email."}</p><p class="muted">Preview only. No account data has been submitted.</p><button class="button secondary full" data-account-mode="login">Back to sign in</button>`);
  }
  if(data.continue!==undefined || control.id==="close-panel") panel.close();
});
document.addEventListener("keydown",event=>{const menu=document.querySelector(".store-menu");if(event.key==="Escape"&&menu.open){menu.open=false;menu.querySelector("summary").focus();}});
document.addEventListener("input", event=>{if(event.target.id==="search-input") searchResults();});
["type-filter","sort"].forEach(id=>$(id).addEventListener("change",renderCatalog));
panel.addEventListener("click",event=>{if(event.target===panel){const bounds=panel.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right)panel.close();}});
panel.addEventListener("close",()=>{activePanel="";if(lastTrigger?.isConnected)lastTrigger.focus({preventScroll:true});});
renderCatalog();
updateBag();
