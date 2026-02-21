// ============================================================
// Pastela – AI Fabric Design Studio
// ============================================================

let state = {
  patternType: "solid",
  bgColor: "#F5DDD8",
  patColor: "#FFFFFF",
  patternScale: 90,
  designScale: 100,
  zoom: 75,
  generatedImage: null,
};

const PALETTE = [
  "#F5E6E0",
  "#E8A598",
  "#B8D4C8",
  "#A8C5D8",
  "#F0D9C8",
  "#D4C5B8",
  "#C8D4D8",
  "#E8D8C8",
  "#D8C8D4",
  "#C8D8C8",
  "#FFFFFF",
  "#2D2A26",
];

function buildFabricPrompt(userPrompt) {
  return `${userPrompt}, seamless fabric pattern, textile design, flat lay, repeating motif, high quality, professional textile print, tileable`;
}

function isMobile() {
  return window.innerWidth <= 768;
}

function calcMobileZoom() {
  // canvas 700px geniş; ekran genişliğine (padding çıkarılmış) sığacak şekilde zoom hesapla
  const availableWidth = window.innerWidth - 32; // 16px padding her iki yan
  const zoom = Math.floor((availableWidth / 700) * 100);
  return Math.min(75, Math.max(25, zoom)); // 25-75 arasında sınırla
}

function init() {
  // Mobilse başlangıç zoom'unu ekrana göre ayarla
  if (isMobile()) {
    const mobileZoom = calcMobileZoom();
    state.zoom = mobileZoom;
    const zoomEl = document.getElementById("canvas-zoom");
    zoomEl.value = mobileZoom;
    document.getElementById("zoom-val").textContent = mobileZoom;
  }

  buildSwatches("bg-color-grid", PALETTE, (c) => setBgColor(c), state.bgColor);
  buildSwatches(
    "pat-color-grid",
    PALETTE,
    (c) => setPatColor(c),
    state.patColor,
  );

  updateSliderTrack(document.getElementById("pattern-scale"), 90, 300);
  updateSliderTrack(document.getElementById("canvas-zoom"), state.zoom, 200);

  document.getElementById("pattern-color-section").classList.add("ctrl-hidden");
  document.getElementById("pattern-scale-section").classList.add("ctrl-hidden");

  const textarea = document.getElementById("prompt");
  const btn = document.getElementById("generate-btn");
  textarea.addEventListener("input", () => {
    const hasText = textarea.value.trim().length > 0;
    textarea.classList.toggle("has-text", hasText);
    btn.classList.toggle("active-btn", hasText);
  });

  addCanvasLabels();
  applyZoom();
  drawCanvas();
}

function addCanvasLabels() {
  const wrapper = document.getElementById("canvas-wrapper");

  const top = document.createElement("div");
  top.className = "canvas-label-top";
  top.textContent = "90 cm";
  wrapper.appendChild(top);

  const bottom = document.createElement("div");
  bottom.className = "canvas-label-bottom";
  bottom.textContent = "90 cm";
  wrapper.appendChild(bottom);

  const left = document.createElement("div");
  left.className = "canvas-label-left";
  left.textContent = "110 cm";
  wrapper.appendChild(left);

  const right = document.createElement("div");
  right.className = "canvas-label-right";
  right.innerHTML = `
    <span class="vert-text">110 cm</span>
    <span class="site-text">www.pastela.com.tr</span>
  `;
  wrapper.appendChild(right);
}

function buildSwatches(gridId, colors, onClick, activeColor) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = "";
  colors.forEach((c) => {
    const d = document.createElement("div");
    d.className = "swatch" + (c === activeColor ? " active" : "");
    d.style.background = c;
    if (c === "#FFFFFF") d.style.border = "2px solid #E0DAD4";
    d.title = c;
    d.onclick = () => {
      grid
        .querySelectorAll(".swatch")
        .forEach((s) => s.classList.remove("active"));
      d.classList.add("active");
      onClick(c);
    };
    grid.appendChild(d);
  });
}

function setBgColor(hex) {
  state.bgColor = hex;
  document.getElementById("bg-custom-color").value = hex;
  document.getElementById("bg-custom-hex").textContent = hex.toUpperCase();
  syncSwatchActive("bg-color-grid", hex);
  drawCanvas();
}

function setPatColor(hex) {
  state.patColor = hex;
  document.getElementById("pat-custom-color").value = hex;
  document.getElementById("pat-custom-hex").textContent = hex.toUpperCase();
  syncSwatchActive("pat-color-grid", hex);
  drawCanvas();
}

function syncSwatchActive(gridId, hex) {
  document.querySelectorAll(`#${gridId} .swatch`).forEach((s) => {
    s.classList.toggle("active", s.title.toUpperCase() === hex.toUpperCase());
  });
}

function selectPattern(type, btn) {
  state.patternType = type;
  document
    .querySelectorAll(".pattern-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  const showPatColor =
    type === "circle" || type === "stripe" || type === "layered";
  const showPatScale =
    type === "circle" || type === "stripe" || type === "layered";
  document
    .getElementById("pattern-color-section")
    .classList.toggle("ctrl-hidden", !showPatColor);
  document
    .getElementById("pattern-scale-section")
    .classList.toggle("ctrl-hidden", !showPatScale);

  drawCanvas();
}

function updateSlider(el, valId) {
  const v = parseInt(el.value);
  document.getElementById(valId).textContent = v;
  updateSliderTrack(el, v, parseInt(el.max));
  if (valId === "pattern-scale-val") state.patternScale = v;
  if (valId === "design-scale-val") state.designScale = v;
  drawCanvas();
}

function updateSliderTrack(el, val, max) {
  const min = parseInt(el.min);
  const pct = ((val - min) / (max - min)) * 100;
  el.style.background = `linear-gradient(to right, var(--salmon) ${pct}%, var(--slider-track) ${pct}%)`;
}

function updateZoom(val) {
  state.zoom = parseInt(val);
  document.getElementById("zoom-val").textContent = val;
  updateSliderTrack(document.getElementById("canvas-zoom"), parseInt(val), 200);
  applyZoom();
}

function adjustZoom(delta) {
  const el = document.getElementById("canvas-zoom");
  const newVal = Math.min(200, Math.max(25, state.zoom + delta));
  el.value = newVal;
  updateZoom(newVal);
}

function applyZoom() {
  const scale = state.zoom / 100;
  const wrapper = document.getElementById("canvas-wrapper");
  const canvas = document.getElementById("fabric-canvas");

  if (isMobile()) {
    // Mobilde transform kullanma — layout kayıyor.
    // Canvas CSS display boyutunu direkt değiştir.
    // Pixel çözünürlüğü (700x700) bozulmaz.
    const displaySize = Math.round(700 * scale);
    canvas.style.width = displaySize + "px";
    canvas.style.height = displaySize + "px";
    wrapper.style.width = displaySize + "px";
    wrapper.style.transform = "";
  } else {
    canvas.style.width = "";
    canvas.style.height = "";
    wrapper.style.width = "";
    wrapper.style.transform = `scale(${scale})`;
  }
}

function drawCanvas() {
  const canvas = document.getElementById("fabric-canvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width,
    H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, W, H);

  drawBgPattern(ctx, W, H);

  if (state.generatedImage) {
    const s = state.designScale / 100;
    const dw = W * s;
    const dh = H * s;
    const dx = (W - dw) / 2;
    const dy = (H - dh) / 2;
    ctx.drawImage(state.generatedImage, dx, dy, dw, dh);
  }
}

function drawBgPattern(ctx, W, H) {
  const type = state.patternType;
  const color = state.patColor;
  const scale = state.patternScale / 100;

  ctx.save();
  ctx.globalAlpha = 0.85;

  if (type === "circle") {
    const r = 8 * scale;
    const spacing = 30 * scale;
    ctx.fillStyle = color;
    for (let x = spacing / 2; x < W + spacing; x += spacing) {
      for (let y = spacing / 2; y < H + spacing; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (type === "stripe") {
    const lineW = 8 * scale;
    const gap = 30 * scale;
    ctx.fillStyle = color;
    for (let x = 0; x < W + lineW; x += gap + lineW) {
      ctx.fillRect(x, 0, lineW, H);
    }
  } else if (type === "layered") {
    const s = 40 * scale;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.3;
    for (let x = 0; x < W + s * 2; x += s) {
      for (let y = 0; y < H + s * 2; y += s) {
        ctx.beginPath();
        ctx.moveTo(x, y - s / 2);
        ctx.lineTo(x + s / 2, y);
        ctx.lineTo(x, y + s / 2);
        ctx.lineTo(x - s / 2, y);
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

function downloadCanvas() {
  const canvas = document.getElementById("fabric-canvas");
  const link = document.createElement("a");
  link.download = "pastela-design.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function generatePattern() {
  const userPrompt = document.getElementById("prompt").value.trim();
  if (!userPrompt) {
    document.getElementById("prompt").focus();
    return;
  }

  const btn = document.getElementById("generate-btn");
  const overlay = document.getElementById("loading-overlay");
  if (btn.disabled) return;

  btn.disabled = true;
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;animation:spin 0.8s linear infinite">
      <circle cx="12" cy="12" r="9" stroke-dasharray="40" stroke-dashoffset="10" stroke-linecap="round"/>
    </svg>
    Generating...
  `;
  overlay.classList.add("show");

  const fabricPrompt = buildFabricPrompt(userPrompt);

  try {
    // /api/generate — Vercel serverless function üzerinden HF API'ye istek
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: fabricPrompt }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Error: ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Image could not be loaded."));
      img.src = objectUrl;
    });

    state.generatedImage = img;
    document
      .getElementById("design-scale-section")
      .classList.remove("ctrl-hidden");
    drawCanvas();
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:14px;height:14px">
        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z"/>
      </svg>
      Generate Pattern
    `;
    overlay.classList.remove("show");
  }
}

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generatePattern();
});

init();
