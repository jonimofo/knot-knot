(async function () {
  const headerEl = document.getElementById("site-header");
  const contentEl = document.getElementById("content");
  const tabsEl = document.getElementById("tabs");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");

  let currentView = "all";
  let data = null;

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  function youtubeId(input) {
    if (!input) return null;
    if (/^[\w-]{11}$/.test(input)) return input;
    try {
      const u = new URL(input);
      if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
      const v = u.searchParams.get("v");
      if (v) return v;
      const m = u.pathname.match(/\/(embed|shorts)\/([\w-]{11})/);
      if (m) return m[2];
    } catch {}
    return null;
  }

  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.hidden = false;
  }
  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = "";
  }
  lightbox.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

  async function loadGallery(folder, mountEl) {
    try {
      const res = await fetch(`images/${folder}/manifest.json`, { cache: "no-cache" });
      if (!res.ok) return;
      const files = await res.json();
      if (!Array.isArray(files) || files.length === 0) return;
      const gallery = el("div", { class: "gallery" });
      for (const f of files) {
        const src = `images/${folder}/${f}`;
        const img = el("img", { src, alt: f, loading: "lazy" });
        img.addEventListener("click", () => openLightbox(src));
        gallery.appendChild(img);
      }
      mountEl.appendChild(gallery);
    } catch (err) {
      console.warn(`gallery load failed for ${folder}:`, err);
    }
  }

  function renderItem(item) {
    const wrap = el("article", { class: "item" });
    const title = el("h4", {}, item.title || "");
    if (item.mustKnow) title.appendChild(el("span", { class: "must-badge" }, "Must-know"));
    wrap.appendChild(title);
    if (item.description) wrap.appendChild(el("p", {}, item.description));

    const ytId = youtubeId(item.youtube);
    if (ytId) {
      const videoWrap = el("div", { class: "video-wrap" });
      videoWrap.appendChild(el("iframe", {
        src: `https://www.youtube.com/embed/${ytId}`,
        title: item.title || "YouTube video",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        allowfullscreen: "",
        loading: "lazy",
        referrerpolicy: "strict-origin-when-cross-origin",
      }));
      wrap.appendChild(videoWrap);
    }

    if (item.imageFolder) loadGallery(item.imageFolder, wrap);

    return wrap;
  }

  function renderCategory(cat, items) {
    const details = el("details", { class: "category" });
    details.open = true;
    details.appendChild(el("summary", {}, cat.name || ""));
    for (const item of items) details.appendChild(renderItem(item));
    return details;
  }

  function render() {
    contentEl.innerHTML = "";
    if (!data) return;
    let total = 0;
    for (const cat of data.categories || []) {
      const items = (cat.items || []).filter((it) => currentView === "all" || it.mustKnow === true);
      if (items.length === 0) continue;
      contentEl.appendChild(renderCategory(cat, items));
      total += items.length;
    }
    if (total === 0) {
      const msg = currentView === "must-know" ? "No must-know items yet." : "No content yet.";
      contentEl.appendChild(el("p", { class: "empty" }, msg));
    }
  }

  tabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    const view = btn.dataset.view;
    if (view === currentView) return;
    currentView = view;
    for (const t of tabsEl.querySelectorAll(".tab")) t.classList.toggle("active", t === btn);
    render();
  });

  try {
    const res = await fetch("knots.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`knots.json HTTP ${res.status}`);
    data = await res.json();

    document.title = data.title || "Knot Knot";
    headerEl.appendChild(el("h1", {}, data.title || "Knot Knot"));
    render();
  } catch (err) {
    headerEl.appendChild(el("h1", {}, "Knot Knot"));
    contentEl.appendChild(el("p", { class: "empty" }, `Failed to load content: ${err.message}`));
    console.error(err);
  }
})();
