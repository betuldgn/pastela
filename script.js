// Pastela – AI Fabric Design Studio
let state = {
  patternType: "solid",
  bgColor: "#F5DDD8",
  patColor: "#FFFFFF",
  patternScale: 90,
  designScale: 100,
  zoom: 75,
  generatedImage: null,
};

const PALETTE = ["#F5E6E0","#E8A598","#B8D4C8","#A8C5D8","#F0D9C8","#D4C5B8","#C8D4D8","#E8D8C8","#D8C8D4","#C8D8C8","#FFFFFF","#2D2A26"];

function buildFabricPrompt(userPrompt) {
  return `${userPrompt}, seamless fabric pattern, textile design, flat lay, repeating motif, high quality, professional textile print, tileable`;
}

function init() {
  buildSwatches("bg-color-grid", PALETTE, (c) => setBgColor(c), state.bgColor);
  buildSwatches("pat-color-grid", PALETTE, (c) => setPatColor(c), state.patColor);

  updateSliderTrack(document.getElementById("pattern-scale"), 90, 300);
  updateSliderTrack(document.getElementById("canvas-zoom"), 75, 200);

  // MOBİL DOKUNUŞ: Ekran küçükse zoom'u otomatik ayarla
  if (window.innerWidth < 768) {
    state.zoom = 30; 
    document.getElementById("canvas-zoom").value = 30;
    document.getElementById("zoom-val").textContent = 30;
  }

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

function applyZoom() {
  const wrapper = document.getElementById("canvas-wrapper");
  const scale = state.zoom / 100;
  wrapper.style.transformOrigin = "top center";
  wrapper.style.transform = `scale(${scale})`;

  // Mobilde butonların üst üste binmemesi için dinamik yükseklik
  if (window.innerWidth < 768) {
    const originalHeight = 1100;
    wrapper.parentElement.style.height = (originalHeight * scale + 80) + "px";
  }
}

// ... (Burada buildSwatches, setBgColor, setPatColor, syncSwatchActive, selectPattern, updateSlider, updateSliderTrack, updateZoom, adjustZoom fonksiyonları mevcut haldeki gibi kalabilir) ...

function addCanvasLabels() {
  const wrapper = document.getElementById("canvas-wrapper");
  wrapper.querySelectorAll('.canvas-label-top, .canvas-label-bottom, .canvas-label-left, .canvas-label-right').forEach(el => el.remove());

  const top = document.createElement("div"); top.className = "canvas-label-top"; top.textContent = "90 cm"; wrapper.appendChild(top);
  const bottom = document.createElement("div"); bottom.className = "canvas-label-bottom"; bottom.textContent = "90 cm"; wrapper.appendChild(bottom);
  const left = document.createElement("div"); left.className = "canvas-label-left"; left.textContent = "110 cm"; wrapper.appendChild(left);
  const right = document.createElement("div"); right.className = "canvas-label-right";
  right.innerHTML = `<span class="vert-text">110 cm</span><span class="site-text">www.pastela.com.tr</span>`;
  wrapper.appendChild(right);
}

function drawCanvas() {
  const canvas = document.getElementById("fabric-canvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, W, H);
  drawBgPattern(ctx, W, H);
  if (state.generatedImage) {
    const s = state.designScale / 100;
    const dw = W * s, dh = H * s;
    const dx = (W - dw) / 2, dy = (H - dh) / 2;
    ctx.drawImage(state.generatedImage, dx, dy, dw, dh);
  }
}

function drawBgPattern(ctx, W, H) {
  const type = state.patternType; const color = state.patColor; const scale = state.patternScale / 100;
  ctx.save(); ctx.globalAlpha = 0.85;
  if (type === "circle") {
    const r = 8 * scale; const spacing = 30 * scale; ctx.fillStyle = color;
    for (let x = spacing / 2; x < W + spacing; x += spacing) {
      for (let y = spacing / 2; y < H + spacing; y += spacing) {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (type === "stripe") {
    const lineW = 8 * scale; const gap = 30 * scale; ctx.fillStyle = color;
    for (let x = 0; x < W + lineW; x += gap + lineW) { ctx.fillRect(x, 0, lineW, H); }
  } else if (type === "layered") {
    const s = 40 * scale; ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.3;
    for (let x = 0; x < W + s * 2; x += s) {
      for (let y = 0; y < H + s * 2; y += s) {
        ctx.beginPath(); ctx.moveTo(x, y - s / 2); ctx.lineTo(x + s / 2, y); ctx.lineTo(x, y + s / 2); ctx.lineTo(x - s / 2, y); ctx.closePath(); ctx.stroke();
      }
    }
  }
  ctx.restore();
}

async function generatePattern() {
  const userPrompt = document.getElementById("prompt").value.trim();
  if (!userPrompt) return;
  const btn = document.getElementById("generate-btn");
  const overlay = document.getElementById("loading-overlay");
  btn.disabled = true;
  btn.innerHTML = `Generating...`;
  overlay.classList.add("show");
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: buildFabricPrompt(userPrompt) }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Error: ${response.status}`);
    }
    const blob = await response.blob();
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    await img.decode();
    state.generatedImage = img;
    drawCanvas();
  } catch (err) {
    alert("Hata: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `Generate Pattern`;
    overlay.classList.remove("show");
  }
}

function downloadCanvas() {
  const canvas = document.getElementById("fabric-canvas");
  const link = document.createElement("a");
  link.download = "pastela-design.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generatePattern();
});

init();
