/* References to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const selectedCount = document.getElementById("selectedCount");
const clearSelectionBtn = document.getElementById("clearSelectionBtn");
const generateRoutineBtn = document.getElementById("generateRoutine");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const userInput = document.getElementById("userInput");
const dirToggleBtn = document.getElementById("dirToggleBtn");
const dirToggleLabel = document.getElementById("dirToggleLabel");

/* RTL Direction state & handling */
const DIR_STORAGE_KEY = "loreal_text_direction";

function setPageDirection(isRtl) {
  if (isRtl) {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
    if (dirToggleBtn) {
      dirToggleBtn.setAttribute("aria-pressed", "true");
      dirToggleLabel.textContent = "LTR (English)";
    }
  } else {
    document.documentElement.setAttribute("dir", "ltr");
    document.documentElement.setAttribute("lang", "en");
    if (dirToggleBtn) {
      dirToggleBtn.setAttribute("aria-pressed", "false");
      dirToggleLabel.textContent = "RTL (العربية / עברית)";
    }
  }
  try {
    localStorage.setItem(DIR_STORAGE_KEY, isRtl ? "rtl" : "ltr");
  } catch (err) {}
}

if (dirToggleBtn) {
  dirToggleBtn.addEventListener("click", () => {
    const isCurrentlyRtl = document.documentElement.getAttribute("dir") === "rtl";
    setPageDirection(!isCurrentlyRtl);
  });
}

// Restore saved direction
try {
  const savedDir = localStorage.getItem(DIR_STORAGE_KEY);
  if (savedDir === "rtl") {
    setPageDirection(true);
  }
} catch (err) {}

/* State */
let allProducts = [];
let selectedProducts = [];
const STORAGE_KEY = "loreal_selected_routine_products";

/* LocalStorage helpers */
function saveSelectionToStorage() {
  try {
    const ids = selectedProducts.map((p) => p.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.warn("Could not save selection to localStorage:", err);
  }
}

function restoreSelectionFromStorage(products) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const savedIds = JSON.parse(raw);
    if (Array.isArray(savedIds)) {
      selectedProducts = products.filter((p) => savedIds.includes(p.id));
      updateSelectedView();
    }
  } catch (err) {
    console.warn("Could not restore selection from localStorage:", err);
  }
}

/* Fallback products dataset in case fetch fails */
const fallbackProducts = [
  {
    id: 1,
    name: "Revitalift Derm Intensives 1.5% Pure Hyaluronic Acid",
    brand: "L'Oréal Paris",
    category: "moisturizer",
    image: "https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/skin-care/facial-serums/revitalift-derm-intensives-1-5-percent-pure-hyaluronic-acid-serum/oap-revitalift-derm-intensives-15-percent-pure-hyaluronic-acid-serum-071249377484-packshot.png?cx=0.5&cy=0.5&cw=400&ch=400&extension=webp",
    description: "Daily anti-wrinkle serum that plumps skin and deeply hydrates."
  },
  {
    id: 2,
    name: "Revitalift Triple Power Anti-Aging Face Moisturizer",
    brand: "L'Oréal Paris",
    category: "moisturizer",
    image: "https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/skin-care/moisturizers/revitalift-triple-power-fragrance-free-face-moisturizer/071249625905-t1.png?cx=0.5&cy=0.5&cw=400&ch=400&extension=webp",
    description: "Formulated with Pro-Retinol, Vitamin C and Hyaluronic Acid to firm and brighten."
  },
  {
    id: 3,
    name: "Revitalift Derm Intensives 12% Pure Vitamin C",
    brand: "L'Oréal Paris",
    category: "moisturizer",
    image: "https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/skin-care/facial-serums/revitalift-derm-intensives-12-percent-pure-vitamin-c-serum/071249652512-t1.png?cx=0.5&cy=0.5&cw=400&ch=400&extension=webp",
    description: "Visibly evens skin tone and targets pores for radiant glow."
  },
  {
    id: 4,
    name: "Micellar Cleansing Water All-in-1 Waterproof",
    brand: "L'Oréal Paris",
    category: "cleanser",
    image: "https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/skin-care/facial-cleanser/micellar-cleansing-water-waterproof/071249339239-t1.png?cx=0.5&cy=0.5&cw=400&ch=400&extension=webp",
    description: "Gently lifts makeup, dirt, and excess oil without harsh rubbing."
  },
  {
    id: 5,
    name: "Revitalift Radiant Smoothing Cream Cleanser",
    brand: "L'Oréal Paris",
    category: "cleanser",
    image: "https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/skin-care/facial-cleanser/revitalift-radiant-smoothing-cream-cleanser/071249098716-t1.png?cx=0.5&cy=0.5&cw=400&ch=400&extension=webp",
    description: "Formulated with Vitamin C to gently exfoliate and illuminate tired skin."
  },
  {
    id: 6,
    name: "Elvive Hyaluron + Plump Hydrating Shampoo",
    brand: "L'Oréal Paris",
    category: "haircare",
    image: "https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/hair-care/shampoo/elvive-hyaluron-plump-hydrating-shampoo/071249658255-t1.png?cx=0.5&cy=0.5&cw=400&ch=400&extension=webp",
    description: "Infused with Hyaluronic Acid for 72 hours of moisture and bounce."
  },
  {
    id: 7,
    name: "Elvive Total Repair 5 Damage Erasing Balm",
    brand: "L'Oréal Paris",
    category: "haircare",
    image: "https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/hair-care/hair-treatments/elvive-total-repair-5-damage-erasing-balm/071249243765-t1.png?cx=0.5&cy=0.5&cw=400&ch=400&extension=webp",
    description: "Deep conditioner rinse-out treatment that reinforces damaged strands."
  },
  {
    id: 8,
    name: "True Match Super-Blendable Liquid Foundation",
    brand: "L'Oréal Paris",
    category: "makeup",
    image: "https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/makeup/face/foundation-makeup/true-match-super-blendable-foundation/071249673425-t1.png?cx=0.5&cy=0.5&cw=400&ch=400&extension=webp",
    description: "Matches skin tone and texture precisely with up to 47 shades."
  },
  {
    id: 9,
    name: "Voluminous Lash Paradise Mascara",
    brand: "L'Oréal Paris",
    category: "makeup",
    image: "https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/makeup/eye/mascara/voluminous-lash-paradise-washable-mascara/071249343311-t1.png?cx=0.5&cy=0.5&cw=400&ch=400&extension=webp",
    description: "Provides voluptuous volume and intense length without flaking."
  },
  {
    id: 10,
    name: "Excellence Crème Permanent Hair Color",
    brand: "L'Oréal Paris",
    category: "hair color",
    image: "https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/hair-color/permanent-hair-color/excellence-creme/071249253245-t1.png?cx=0.5&cy=0.5&cw=400&ch=400&extension=webp",
    description: "100% gray coverage with Pro-Keratine and Ceramide protective care."
  },
  {
    id: 11,
    name: "Superior Preference Fade-Defying Shine Color",
    brand: "L'Oréal Paris",
    category: "hair color",
    image: "https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/hair-color/permanent-hair-color/superior-preference/071249253450-t1.png?cx=0.5&cy=0.5&cw=400&ch=400&extension=webp",
    description: "Luminous, fade-defying color and high-shine gloss for up to 8 weeks."
  },
  {
    id: 12,
    name: "Elnett Satin Extra Strong Hold Hairspray",
    brand: "L'Oréal Paris",
    category: "hair styling",
    image: "https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/hair-styling/hair-spray/elnett-satin-extra-strong-hold-unscented/071249206777-t1.png?cx=0.5&cy=0.5&cw=400&ch=400&extension=webp",
    description: "Legendary micro-diffused hairspray delivering long-lasting brushable hold."
  },
  {
    id: 13,
    name: "Men Expert Hydra Energetic Daily Moisturizer",
    brand: "L'Oréal Paris",
    category: "men's grooming",
    image: "https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/men/men-expert/hydra-energetic-daily-anti-fatigue-moisturizer/071249150032-t1.png?cx=0.5&cy=0.5&cw=400&ch=400&extension=webp",
    description: "Fights 5 signs of fatigue with Guarana and Vitamin C for 24H hydration."
  },
  {
    id: 14,
    name: "Bright Reveal Daily UV Fluid SPF 50 Invisible",
    brand: "L'Oréal Paris",
    category: "suncare",
    image: "https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/skin-care/sunscreen/bright-reveal-broad-spectrum-spf-50-daily-uv-fluid/071249673944-t1.png?cx=0.5&cy=0.5&cw=400&ch=400&extension=webp",
    description: "Broad spectrum UVA/UVB protection with invisible finish and Vitamin C."
  },
  {
    id: 15,
    name: "Infallible Fresh Wear 24HR Powder Foundation",
    brand: "L'Oréal Paris",
    category: "makeup",
    image: "https://www.lorealparisusa.com/-/media/project/loreal/brand-sites/oap/americas/us/products/makeup/face/powder/infallible-up-to-24h-fresh-wear-foundation-in-a-powder/071249633887-t1.png?cx=0.5&cy=0.5&cw=400&ch=400&extension=webp",
    description: "Weightless matte coverage with up to 24 hours of transfer resistance."
  },
  {
    id: 16,
    name: "L'Oréal Signature Eau de Parfum Rose & Amber",
    brand: "L'Oréal Paris",
    category: "fragrance",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80",
    description: "Sophisticated floral-amber notes crafted for everyday timeless elegance."
  }
];

/* Initial placeholder */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    <i class="fa-solid fa-arrow-up" style="margin-bottom:8px; display:block;"></i>
    Select a category above to view products
  </div>
`;

/* Load products */
async function loadProducts() {
  if (allProducts.length > 0) return allProducts;
  try {
    const response = await fetch("products.json");
    if (!response.ok) throw new Error("Network response not ok");
    const data = await response.json();
    allProducts = data.products || fallbackProducts;
  } catch (err) {
    console.warn("Using fallback products dataset:", err);
    allProducts = fallbackProducts;
  }
  return allProducts;
}

/* Check if product is selected */
function isSelected(productId) {
  return selectedProducts.some((p) => p.id === productId);
}

/* Display products in grid */
function displayProducts(products) {
  if (!products || products.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        No products found in this category.
      </div>
    `;
    return;
  }

  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card ${isSelected(product.id) ? "selected" : ""}" data-id="${product.id}" tabindex="0" role="button" aria-pressed="${isSelected(product.id)}">
      <img src="${product.image}" alt="${product.name}" onerror="this.src='img/loreal-logo.png'">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="product-brand">${product.brand}</p>
        <span class="product-badge">${product.category}</span>
        <div class="add-hint">
          <i class="fa-solid ${isSelected(product.id) ? "fa-circle-check" : "fa-plus-circle"}"></i>
          <span>${isSelected(product.id) ? "Added to Routine" : "Click to Add"}</span>
        </div>
      </div>
      <div class="product-hover-overlay">
        <div class="overlay-badge">About this product</div>
        <p class="overlay-desc">${product.description || "Formulated by L'Oréal Paris experts for optimal beauty care."}</p>
        <span class="overlay-cta">
          <i class="fa-solid ${isSelected(product.id) ? "fa-circle-check" : "fa-plus"}"></i>
          ${isSelected(product.id) ? "Selected in routine" : "Click to select"}
        </span>
      </div>
    </div>
  `
    )
    .join("");

  /* Attach click events to cards */
  document.querySelectorAll(".product-card").forEach((card) => {
    const toggleSelect = () => {
      const id = parseInt(card.getAttribute("data-id"), 10);
      const prod = allProducts.find((p) => p.id === id);
      if (!prod) return;
      toggleProductSelection(prod);
      // re-render current grid cards
      const activeCategory = categoryFilter.value;
      const currentList = allProducts.filter((p) => p.category === activeCategory);
      displayProducts(currentList);
    };

    card.addEventListener("click", toggleSelect);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleSelect();
      }
    });
  });
}

/* Category filter listener */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;
  const filtered = products.filter((p) => p.category === selectedCategory);
  displayProducts(filtered);
});

/* Toggle product in selected routine list */
function toggleProductSelection(product) {
  const index = selectedProducts.findIndex((p) => p.id === product.id);
  if (index >= 0) {
    selectedProducts.splice(index, 1);
  } else {
    selectedProducts.push(product);
  }
  saveSelectionToStorage();
  updateSelectedView();
}

/* Update selected products container */
function updateSelectedView() {
  selectedCount.textContent = selectedProducts.length;
  clearSelectionBtn.style.display = selectedProducts.length > 0 ? "inline-block" : "none";

  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `<p class="empty-selection-msg">Click on any product above to add it to your custom routine.</p>`;
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (p) => `
    <div class="selected-chip">
      <span>${p.name.length > 28 ? p.name.substring(0, 28) + "…" : p.name}</span>
      <button type="button" data-remove-id="${p.id}" title="Remove">&times;</button>
    </div>
  `
    )
    .join("");

  selectedProductsList.querySelectorAll("button[data-remove-id]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute("data-remove-id"), 10);
      selectedProducts = selectedProducts.filter((p) => p.id !== id);
      saveSelectionToStorage();
      updateSelectedView();
      if (categoryFilter.value) {
        const filtered = allProducts.filter((p) => p.category === categoryFilter.value);
        displayProducts(filtered);
      }
    });
  });
}

/* Clear all selections */
clearSelectionBtn.addEventListener("click", () => {
  selectedProducts = [];
  saveSelectionToStorage();
  updateSelectedView();
  if (categoryFilter.value) {
    const filtered = allProducts.filter((p) => p.category === categoryFilter.value);
    displayProducts(filtered);
  }
});

/* Append message to chat */
function appendMessage(sender, text, isHtml = false) {
  const isUser = sender === "user";
  const msgEl = document.createElement("div");
  msgEl.className = `chat-msg ${isUser ? "user" : "bot"}`;

  const avatar = document.createElement("div");
  avatar.className = "chat-avatar";
  avatar.innerHTML = isUser ? `<i class="fa-solid fa-user"></i>` : `<i class="fa-solid fa-sparkles"></i>`;

  const content = document.createElement("div");
  content.className = "chat-content";
  
  const label = document.createElement("strong");
  label.textContent = isUser ? "You" : "L'Oréal Beauty Advisor";
  content.appendChild(label);

  if (isHtml) {
    const body = document.createElement("div");
    body.innerHTML = text;
    content.appendChild(body);
  } else {
    const body = document.createElement("p");
    body.textContent = text;
    content.appendChild(body);
  }

  msgEl.appendChild(avatar);
  msgEl.appendChild(content);

  chatWindow.appendChild(msgEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Generate Routine Button */
generateRoutineBtn.addEventListener("click", () => {
  if (selectedProducts.length === 0) {
    appendMessage(
      "bot",
      "Please select at least 1 or 2 products from the categories above first, then click 'Generate Routine' so I can build your custom regimen!"
    );
    return;
  }

  const orderPriority = {
    cleanser: 1,
    moisturizer: 2,
    suncare: 3,
    makeup: 4,
    haircare: 5,
    "hair color": 6,
    "hair styling": 7,
    "men's grooming": 8,
    fragrance: 9
  };

  const sorted = [...selectedProducts].sort(
    (a, b) => (orderPriority[a.category] || 99) - (orderPriority[b.category] || 99)
  );

  let routineHtml = `
    <p>Here is your personalized application routine based on your selected products:</p>
    <div class="routine-result">
  `;

  sorted.forEach((item, index) => {
    let instruction = "";
    if (item.category === "cleanser") {
      instruction = "Start by cleansing damp skin to remove impurities and prepare for active ingredients.";
    } else if (item.category === "moisturizer") {
      instruction = "Gently pat serum or moisturizer onto face and neck to lock in deep hydration.";
    } else if (item.category === "suncare") {
      instruction = "Apply generously as the final skincare layer every morning before sun exposure.";
    } else if (item.category === "makeup") {
      instruction = "Apply evenly onto primed skin for a flawless, long-lasting finish.";
    } else if (item.category === "haircare") {
      instruction = "Lather into wet hair, rinse thoroughly, and follow with conditioning treatment.";
    } else if (item.category === "hair color") {
      instruction = "Perform allergy alert test 48 hours prior; apply evenly from root to tip.";
    } else if (item.category === "hair styling") {
      instruction = "Spray or work through styled hair for long-lasting hold and shine.";
    } else if (item.category === "fragrance") {
      instruction = "Spritz onto pulse points (wrists, neck) for a lasting luxury scent trail.";
    } else {
      instruction = "Apply daily according to package directions.";
    }

    routineHtml += `
      <div class="routine-step">
        <span class="routine-step-num">Step ${index + 1}: ${item.name}</span>
        <p style="margin-top:2px; font-size:13px; color:#555;">${instruction}</p>
      </div>
    `;
  });

  routineHtml += `</div><p style="font-size:13px; color:#c5a059; font-weight:600; margin-top:8px;">Tip: Consistency is key! Because you're worth it.</p>`;

  appendMessage("bot", routineHtml, true);
});

/* Smart consultation responder for chat messages */
function generateConsultantResponse(query) {
  const q = query.toLowerCase();

  if (q.includes("routine") || q.includes("step")) {
    return "A classic L'Oréal skincare routine follows 3 core steps: <strong>1. Cleanse</strong> (remove oils), <strong>2. Treat</strong> (Hyaluronic Acid or Vitamin C serums), and <strong>3. Protect/Hydrate</strong> (Moisturizer & SPF 50). Try selecting a cleanser and moisturizer above to generate your custom step order!";
  }
  if (q.includes("wrinkle") || q.includes("aging") || q.includes("retinol") || q.includes("fine line")) {
    return "For anti-aging, we recommend pairing our <strong>Revitalift Derm Intensives 1.5% Pure Hyaluronic Acid</strong> for instant plumping with the <strong>Revitalift Triple Power Moisturizer</strong> with Pro-Retinol to firm and reduce wrinkles over time.";
  }
  if (q.includes("dry") || q.includes("hydrate") || q.includes("moisture")) {
    return "For dry skin or dehydrated hair, hyaluronic acid is the gold standard! In skincare, reach for the <strong>Revitalift 1.5% Pure Hyaluronic Acid</strong>. For haircare, explore the <strong>Elvive Hyaluron + Plump</strong> collection for 72 hours of moisture.";
  }
  if (q.includes("sun") || q.includes("spf") || q.includes("dark spot") || q.includes("protect")) {
    return "Daily sun protection is essential. The <strong>Bright Reveal Daily UV Fluid SPF 50</strong> provides weightless, invisible broad-spectrum protection while Vitamin C works to brighten and prevent dark spots.";
  }
  if (q.includes("hair") || q.includes("shampoo") || q.includes("frizz") || q.includes("damage")) {
    return "For damaged or dry strands, we suggest starting with <strong>Elvive Hyaluron + Plump Hydrating Shampoo</strong> followed by the <strong>Elvive Total Repair 5 Damage Erasing Balm</strong>. Finish styling with <strong>Elnett Satin Hairspray</strong>.";
  }
  if (q.includes("foundation") || q.includes("makeup") || q.includes("shade") || q.includes("cover")) {
    return "For natural yet customizable coverage, <strong>True Match Super-Blendable Foundation</strong> offers up to 47 shades matching both undertone and skin depth. For high-performance longwear, pair with <strong>Infallible Fresh Wear</strong>!";
  }
  if (q.includes("men") || q.includes("shave") || q.includes("beard")) {
    return "For men's daily care, check out the <strong>Men Expert Hydra Energetic Daily Moisturizer</strong> with Guarana and Vitamin C to combat dullness, tired skin, and razor burn.";
  }
  return "That's a wonderful question! At L'Oréal, every beauty journey is unique. You can select products from the categories above to see their benefits, or ask me about specific skin concerns (dryness, anti-aging, sun protection), hair treatments, or makeup coverage.";
}

// Cloudflare Worker endpoint configuration
// Enter your deployed Worker URL (e.g. "https://loreal-advisor-worker.yourname.workers.dev")
// or leave as "" to use local origin "/api/chat" if hosted alongside worker
const WORKER_URL = "";

// Conversation history for multi-turn Worker chat
const conversationHistory = [];

/* UI Typing indicator */
function showTypingIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.id = "chatTypingIndicator";
  indicator.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  chatWindow.appendChild(indicator);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return indicator;
}

function removeTypingIndicator() {
  const indicator = document.getElementById("chatTypingIndicator");
  if (indicator) indicator.remove();
}

/* Send request to Worker endpoint with automatic intelligent fallback */
async function sendWorkerChatRequest(promptText) {
  conversationHistory.push({ role: "user", content: promptText });
  showTypingIndicator();

  // Determine endpoint URL
  const endpoint = WORKER_URL ? `${WORKER_URL.replace(/\/$/, "")}/api/chat` : `/api/chat`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`Worker endpoint returned HTTP status ${response.status}`);
    }

    const data = await response.json();
    removeTypingIndicator();

    if (data && data.response) {
      appendMessage("bot", data.response);
      conversationHistory.push({ role: "assistant", content: data.response });
      return;
    } else if (data && data.error) {
      throw new Error(data.error);
    } else {
      throw new Error("Invalid response format from Worker endpoint");
    }
  } catch (err) {
    console.warn("Worker endpoint request failed or not yet deployed:", err.message);
    removeTypingIndicator();

    // Graceful fallback to built-in knowledge consultant
    const fallbackAnswer = generateConsultantResponse(promptText);
    appendMessage("bot", fallbackAnswer, true);
    conversationHistory.push({ role: "assistant", content: fallbackAnswer });
  }
}

/* Chat form submission */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage("user", text);
  userInput.value = "";

  sendWorkerChatRequest(text);
});

// Load products and restore saved selections initially
loadProducts().then((products) => {
  restoreSelectionFromStorage(products);
});
