// ═══════════════════════════════════════════════
//   WARDAI — APP.JS
//   Fixed: outfit randomization, gender, filters
// ═══════════════════════════════════════════════


// ─── CANVAS PARTICLE BACKGROUND ───
(function initCanvas() {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  function createParticles() {
    particles = [];
    const count = Math.floor((W * H) / 16000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.4 + 0.3,
        alpha: Math.random() * 0.4 + 0.08,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        hue: Math.random() > 0.5 ? 265 : 198
      });
    }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},80%,70%,${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  resize(); createParticles(); draw();
  window.addEventListener("resize", () => { resize(); createParticles(); });
})();


// ─── TOAST ───
function showToast(message, type = "info", duration = 3200) {
  const container = document.getElementById("toastContainer");
  const icons = { success: "✦", error: "✕", info: "·", warn: "!" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || "·"}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px) scale(0.9)";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}


// ─── LOADING ───
const loaderMessages = [
  "Consulting your AI stylist…",
  "Reading the weather…",
  "Mixing &amp; matching your wardrobe…",
  "Finding the perfect look…",
  "Curating a fresh outfit…"
];

function showLoading(show) {
  const el   = document.getElementById("loadingOverlay");
  const text = document.getElementById("loaderText");
  if (show) {
    if (text) text.innerHTML = loaderMessages[Math.floor(Math.random() * loaderMessages.length)];
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}


// ─── IMAGE PREVIEW ───
function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById("imagePreview").src = e.target.result;
    document.getElementById("imagePreview").classList.remove("hidden");
    document.getElementById("uploadPlaceholder").classList.add("hidden");
  };
  reader.readAsDataURL(file);
}


// ─── OCCASION PILL SELECTION ───
function selectOccasion(value, btn) {
  document.querySelectorAll(".occ-pill").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("occasion").value = value;
}


// ─── WARDROBE PANEL ───
function showWardrobe() {
  document.getElementById("wardrobeSection").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  renderWardrobe();
}
function closeWardrobe() {
  document.getElementById("wardrobeSection").classList.add("hidden");
  document.body.style.overflow = "";
}


// ─── FILTER ───
let currentFilter = "all";
function filterWardrobe(type, btn) {
  currentFilter = type;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderWardrobe();
}


// ─── LOCAL STORAGE ───
function saveToLocal(item) {
  const data = JSON.parse(localStorage.getItem("wardrobe")) || [];
  data.push(item);
  localStorage.setItem("wardrobe", JSON.stringify(data));
}
function getLocalData() {
  return JSON.parse(localStorage.getItem("wardrobe")) || [];
}


// ─── ADD CLOTH ───
async function addCloth() {
  const file     = document.getElementById("imageInput").files[0];
  const name     = document.getElementById("type").value.trim();
  const category = document.getElementById("category").value;
  const occasion = document.getElementById("occasion").value;

  if (!file || !name || !category) {
    showToast("Please fill all fields!", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function () {
    const imageData = reader.result;
    const color     = await getDominantColor(imageData);

    const item = {
      id:           Date.now(),
      type:         category,
      originalType: name,
      occasion,
      color,
      image:        imageData
    };

    saveToLocal(item);
    showToast(`"${name}" added to wardrobe! 👗`, "success");

    // Reset form
    document.getElementById("imageInput").value = "";
    document.getElementById("type").value       = "";
    document.getElementById("category").value   = "";
    // reset occasion pills to casual
    document.querySelectorAll(".occ-pill").forEach(p => p.classList.remove("active"));
    document.querySelector('.occ-pill[data-val="casual"]').classList.add("active");
    document.getElementById("occasion").value = "casual";
    document.getElementById("imagePreview").classList.add("hidden");
    document.getElementById("uploadPlaceholder").classList.remove("hidden");

    renderWardrobe();
    updateStats();
  };
  reader.readAsDataURL(file);
}


// ─── DELETE ───
function deleteCloth(id) {
  let data = getLocalData();
  const item = data.find(i => i.id === id);
  data = data.filter(i => i.id !== id);
  localStorage.setItem("wardrobe", JSON.stringify(data));
  if (item) showToast(`"${item.originalType}" removed`, "info");
  renderWardrobe();
  updateStats();
}


// ─── RENDER WARDROBE ───
function renderWardrobe() {
  const container = document.getElementById("wardrobe");
  const countEl   = document.getElementById("itemsCount");
  let items = getLocalData();

  if (currentFilter !== "all") items = items.filter(i => i.type === currentFilter);

  container.innerHTML = "";
  if (countEl) countEl.textContent = getLocalData().length;

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-wardrobe">
      ${currentFilter === "all" ? "No pieces yet — add your first item above ✦" : `No ${currentFilter}s in wardrobe yet`}
    </div>`;
    return;
  }

  const typeLabels = { top: "Top", bottom: "Bottom", shoes: "Footwear" };
  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "wardrobe-card";
    const label = typeLabels[item.type] || item.type;
    card.innerHTML = `
      <img src="${item.image}" alt="${item.originalType}" loading="lazy" />
      <div class="card-info">
        <div class="card-name">${item.originalType}</div>
        <div class="card-type">${label} · ${item.occasion}</div>
      </div>
      <button class="btn-remove" onclick="deleteCloth(${item.id})">Remove</button>
    `;
    container.appendChild(card);
  });
}


// ─── UPDATE STATS ───
function updateStats() {
  const el = document.getElementById("statTotal");
  if (el) el.textContent = getLocalData().length;
}


// ─── WEATHER ───
async function getWeather() {
  try {
    const res  = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=28.6&longitude=77.2&current_weather=true"
    );
    const data = await res.json();
    const temp = data.current_weather.temperature;
    const label = document.getElementById("weatherLabel");
    if (label) label.textContent = `${temp} °C`;
    return temp;
  } catch (e) {
    console.warn("Weather fetch failed:", e);
    return 25;
  }
}


// ═══════════════════════════════════════════════
//   OUTFIT SUGGESTION — fixed ID mapping
// ═══════════════════════════════════════════════

let lastSuggestedCombo = { topId: null, bottomId: null, shoesId: null };
let outfitCount = 0;

// Weather classification — mirrors server logic so client can also pre-filter
const WARM_KEYWORDS_CLIENT = [
  "jacket","blazer","coat","hoodie","sweater","sweatshirt","cardigan",
  "pullover","fleece","windbreaker","puffer","overcoat","trench",
  "leather jacket","denim jacket","bomber","thermal","turtleneck",
  "wool","knit","jumper","anorak"
];

function isWarmItem(name) {
  const l = name.toLowerCase();
  return WARM_KEYWORDS_CLIENT.some(k => l.includes(k));
}

function clientWeatherClass(temp) {
  if (temp >= 30) return "VERY_HOT";
  if (temp >= 22) return "WARM";
  if (temp >= 15) return "MODERATE";
  if (temp >= 8)  return "COOL";
  return "COLD";
}

async function getSuggestion(forceNew = false) {
  const allItems = getLocalData();

  if (allItems.length === 0) {
    showToast("Add clothes to your wardrobe first!", "error");
    return;
  }

  const tops    = allItems.filter(i => i.type === "top");
  const bottoms = allItems.filter(i => i.type === "bottom");
  const shoes   = allItems.filter(i => i.type === "shoes");

  if (!tops.length || !bottoms.length || !shoes.length) {
    showToast("Please add at least 1 Top, 1 Bottom, and 1 pair of Shoes!", "warn");
    return;
  }

  showLoading(true);
  const temp = await getWeather();
  const wClass = clientWeatherClass(temp);

  // ── Client-side pre-filter tops by weather (mirrors server) ──
  let filteredTops = tops;
  if (wClass === "VERY_HOT" || wClass === "WARM") {
    const light = tops.filter(i => !isWarmItem(i.originalType));
    if (light.length > 0) filteredTops = light;
  }

  // ── Build the wardrobe payload — IDs must be NUMBERS, names must be exact ──
  // Do NOT shuffle here: shuffling does not affect AI picking but DOES confuse
  // debugging. The randomisation seed in the server prompt handles variety.
  const structuredWardrobe = {
    tops:    filteredTops.map(i => ({ id: Number(i.id), name: i.originalType, occasion: i.occasion })),
    bottoms: bottoms     .map(i => ({ id: Number(i.id), name: i.originalType, occasion: i.occasion })),
    shoes:   shoes       .map(i => ({ id: Number(i.id), name: i.originalType, occasion: i.occasion }))
  };

  const exclusionNote = (forceNew && lastSuggestedCombo.topId)
    ? `Do NOT repeat this exact combo: topId=${lastSuggestedCombo.topId}, bottomId=${lastSuggestedCombo.bottomId}, shoesId=${lastSuggestedCombo.shoesId}.`
    : "";

  const profile = getUserProfile();
  const profileNote = profile.gender
    ? `User: ${profile.name ? profile.name + ", " : ""}${profile.gender}.`
    : "";

  try {
    const res = await fetch("/api/ai/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weather: temp, wardrobe: structuredWardrobe, exclusionNote, profileNote })
    });

    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data = await res.json();

    if (!data.topId || !data.bottomId || !data.shoesId) {
      throw new Error("Invalid AI response — missing IDs");
    }

    // ── CRITICAL: convert returned IDs to Number for strict matching ──
    let topId    = Number(data.topId);
    let bottomId = Number(data.bottomId);
    let shoesId  = Number(data.shoesId);

    console.log("AI returned IDs →", { topId, bottomId, shoesId });
    console.log("Available top IDs →", filteredTops.map(i => Number(i.id)));
    console.log("Available bottom IDs →", bottoms.map(i => Number(i.id)));
    console.log("Available shoe IDs →", shoes.map(i => Number(i.id)));

    // ── Lookup by strict Number comparison — THE mapping fix ──
    let top    = filteredTops.find(i => Number(i.id) === topId);
    let bottom = bottoms     .find(i => Number(i.id) === bottomId);
    let shoe   = shoes       .find(i => Number(i.id) === shoesId);

    // ── Fallback: if AI returned an ID not in filtered list (e.g. a jacket
    //    that was filtered out), pick the first available item in that slot ──
    if (!top) {
      console.warn(`Top ID ${topId} not found in filtered tops — using first available`);
      top = filteredTops[0];
    }
    if (!bottom) {
      console.warn(`Bottom ID ${bottomId} not found — using first available`);
      bottom = bottoms[0];
    }
    if (!shoe) {
      console.warn(`Shoe ID ${shoesId} not found — using first available`);
      shoe = shoes[0];
    }

    // ── Randomise on "Suggest Another" if same combo returned ──
    if (
      forceNew &&
      Number(top.id)    === lastSuggestedCombo.topId &&
      Number(bottom.id) === lastSuggestedCombo.bottomId &&
      Number(shoe.id)   === lastSuggestedCombo.shoesId
    ) {
      const tIdx = filteredTops.indexOf(top);
      const bIdx = bottoms.indexOf(bottom);
      const sIdx = shoes.indexOf(shoe);
      top    = filteredTops[(tIdx + 1) % filteredTops.length];
      bottom = bottoms[(bIdx + 1) % bottoms.length];
      shoe   = shoes[(sIdx + 1) % shoes.length];
      showToast("Mixed it up for you! ✦", "info");
    }

    lastSuggestedCombo = { topId: Number(top.id), bottomId: Number(bottom.id), shoesId: Number(shoe.id) };

    outfitCount++;
    const statEl = document.getElementById("statOutfits");
    if (statEl) statEl.textContent = outfitCount;

    renderOutfit(
      [
        { ...top,    slot: "Top"      },
        { ...bottom, slot: "Bottom"   },
        { ...shoe,   slot: "Footwear" }
      ],
      data.summary,
      temp
    );

    saveToOutfitHistory([top, bottom, shoe]);

  } catch (err) {
    console.error("Suggestion error:", err);
    showToast("Could not get suggestion. Try again.", "error");
  } finally {
    showLoading(false);
  }
}


// ─── RENDER OUTFIT ───
function renderOutfit(pieces, summary, temp) {
  const outfitSection = document.getElementById("outfitSection");
  const outfitEl      = document.getElementById("outfit");
  const summaryEl     = document.getElementById("summary");
  const metaEl        = document.getElementById("outfitMeta");

  outfitEl.innerHTML = "";

  const badgeClass = { top: "badge-top", bottom: "badge-bottom", shoes: "badge-shoes" };

  pieces.forEach(item => {
    if (!item || !item.image) return;

    // Use the explicit slot label passed from getSuggestion (Top / Bottom / Footwear)
    const slotLabel  = item.slot || item.type;
    const badgeCls   = badgeClass[item.type] || "badge-top";
    const cleanName  = item.originalType || item.type || "Item";

    const div = document.createElement("div");
    div.className = "outfit-item";
    div.innerHTML = `
      <img src="${item.image}" alt="${cleanName}" />
      <div class="outfit-item-info">
        <div class="outfit-item-name">${cleanName}</div>
        <div class="outfit-item-type">${slotLabel} · ${item.occasion || ""}</div>
        <span class="outfit-item-badge ${badgeCls}">${slotLabel}</span>
      </div>
    `;
    outfitEl.appendChild(div);
  });

  if (summaryEl) summaryEl.textContent = summary || "";

  if (metaEl && temp !== undefined) {
    const profile = getUserProfile();
    const wLabel  = temp >= 30 ? "🌡 Hot" : temp >= 22 ? "☀️ Warm" : temp >= 15 ? "🌤 Moderate" : temp >= 8 ? "🧥 Cool" : "❄️ Cold";
    const nLabel  = profile.name ? `For ${profile.name}` : "";
    metaEl.textContent = [wLabel + ` · ${temp}°C`, nLabel].filter(Boolean).join(" · ");
  }

  outfitSection.classList.remove("hidden");
  outfitSection.scrollIntoView({ behavior: "smooth", block: "start" });
  showToast("Outfit ready — looking good! ✦", "success");
}


// ─── OUTFIT HISTORY ───
const outfitHistoryLog = []; // stores arrays of outfit pieces

function saveToOutfitHistory(pieces) {
  outfitHistoryLog.unshift(pieces.filter(Boolean));
  if (outfitHistoryLog.length > 6) outfitHistoryLog.pop();
  renderOutfitHistory();
}

function renderOutfitHistory() {
  const wrap = document.getElementById("outfitHistoryWrap");
  const container = document.getElementById("outfitHistory");
  if (!wrap || !container) return;

  if (outfitHistoryLog.length <= 1) {
    wrap.classList.add("hidden");
    return;
  }

  wrap.classList.remove("hidden");
  container.innerHTML = "";

  // Show all except the current (first)
  outfitHistoryLog.slice(1).forEach((combo, idx) => {
    const thumb = document.createElement("div");
    thumb.className = "history-thumb";
    thumb.title = `Previous outfit ${idx + 1}`;
    combo.forEach(item => {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.originalType;
      thumb.appendChild(img);
    });
    container.appendChild(thumb);
  });
}


// ─── DOMINANT COLOR ───
function getDominantColor(imageDataUrl) {
  const img = new Image();
  img.src = imageDataUrl;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  return new Promise(resolve => {
    img.onload = function () {
      canvas.width = img.width; canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i+1]; b += data[i+2]; count++;
      }
      resolve(`rgb(${Math.floor(r/count)},${Math.floor(g/count)},${Math.floor(b/count)})`);
    };
  });
}


// ═══════════════════════════════════════════════
//   GENDER / PROFILE SYSTEM
// ═══════════════════════════════════════════════

let selectedGender = null;

function selectGender(gender) {
  selectedGender = gender;
  document.querySelectorAll(".gender-btn").forEach(b => b.classList.remove("selected"));
  const btn = document.querySelector(`.gender-btn[data-gender="${gender}"]`);
  if (btn) btn.classList.add("selected");

  // Enable save button
  document.getElementById("profileSaveBtn").disabled = false;
}

function saveProfile() {
  if (!selectedGender) {
    showToast("Please select a gender to continue", "warn");
    return;
  }

  const name = document.getElementById("profileName").value.trim();
  const profile = { gender: selectedGender, name };
  localStorage.setItem("wardai_profile", JSON.stringify(profile));

  document.getElementById("profileModal").classList.add("hidden");
  document.body.style.overflow = "";

  updateHeaderGenderBadge(profile);
  showToast(`Welcome${name ? ", " + name : ""}! Your style profile is set 🎉`, "success");
}

function skipProfile() {
  localStorage.setItem("wardai_profile", JSON.stringify({ gender: null, name: "" }));
  document.getElementById("profileModal").classList.add("hidden");
  document.body.style.overflow = "";
}

function getUserProfile() {
  try {
    return JSON.parse(localStorage.getItem("wardai_profile")) || {};
  } catch { return {}; }
}

function updateHeaderGenderBadge(profile) {
  const badge = document.getElementById("headerGenderBadge");
  if (!badge) return;

  if (!profile || !profile.gender) {
    badge.classList.add("hidden");
    return;
  }

  const icons = { male: "👨", female: "👩", nonbinary: "🧑" };
  const labels = { male: "Male", female: "Female", nonbinary: "Non-binary" };
  badge.innerHTML = `${icons[profile.gender] || "🧑"} ${profile.name || labels[profile.gender]}`;
  badge.classList.remove("hidden");
}


// ═══════════════════════════════════════════════
//   STYLEBOT — CHATBOT
// ═══════════════════════════════════════════════

let chatHistory = [];
let chatOpen    = false;
let chatTyping  = false;

function toggleChat() {
  chatOpen = !chatOpen;
  const win      = document.getElementById("chatWindow");
  const fabIcon  = document.getElementById("chatFabIcon");
  const fabClose = document.getElementById("chatFabClose");

  if (chatOpen) {
    win.classList.remove("hidden");
    fabIcon.classList.add("hidden");
    fabClose.classList.remove("hidden");
    document.getElementById("chatInput").focus();
    scrollChatToBottom();
  } else {
    win.classList.add("hidden");
    fabIcon.classList.remove("hidden");
    fabClose.classList.add("hidden");
  }
}

function scrollChatToBottom() {
  const msgs = document.getElementById("chatMessages");
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

function getTimeStr() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function appendMessage(role, content) {
  const msgs = document.getElementById("chatMessages");
  const div  = document.createElement("div");
  div.className = `chat-msg ${role}`;
  div.innerHTML = `
    <div class="msg-bubble">${content}</div>
    <div class="msg-time">${getTimeStr()}</div>
  `;
  msgs.appendChild(div);
  scrollChatToBottom();
}

function showTypingIndicator() {
  const msgs = document.getElementById("chatMessages");
  const div  = document.createElement("div");
  div.className = "chat-msg bot";
  div.id = "typingIndicator";
  div.innerHTML = `<div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  msgs.appendChild(div);
  scrollChatToBottom();
}

function removeTypingIndicator() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

function hideSuggestions() {
  const el = document.getElementById("chatSuggestions");
  if (el) el.style.display = "none";
}

async function sendMessage() {
  const input = document.getElementById("chatInput");
  const text  = input.value.trim();
  if (!text || chatTyping) return;

  input.value = "";
  hideSuggestions();
  appendMessage("user", escapeHtml(text));
  chatHistory.push({ role: "user", content: text });

  chatTyping = true;
  document.getElementById("chatSendBtn").disabled = true;
  showTypingIndicator();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory })
    });
    const data = await res.json();
    removeTypingIndicator();
    const reply = data.reply || "Sorry, I couldn't respond. Try again!";
    appendMessage("bot", formatBotReply(reply));
    chatHistory.push({ role: "assistant", content: reply });
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
  } catch (err) {
    removeTypingIndicator();
    appendMessage("bot", "⚠️ Connection issue. Please try again.");
  } finally {
    chatTyping = false;
    document.getElementById("chatSendBtn").disabled = false;
    document.getElementById("chatInput").focus();
  }
}

function sendSuggestion(text) {
  document.getElementById("chatInput").value = text;
  sendMessage();
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatBotReply(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}


// ═══════════════════════════════════════════════
//   INIT
// ═══════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  renderWardrobe();
  updateStats();
  getWeather();

  // Check if profile already set
  const profile = getUserProfile();
  if (!profile.gender && profile.gender !== null) {
    // First visit — show profile modal
    document.getElementById("profileModal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  } else {
    updateHeaderGenderBadge(profile);
  }
});