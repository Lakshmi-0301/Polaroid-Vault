// Sound effects (simulated with Web Audio API)
const playSound = (type) => {
  console.log(`Sound effect: ${type}`);
};

// Albums data
let albums = [];
let currentAlbum = null;
let currentPage = 0;
let selectedPolaroidFrame = "classic";
let selectedCaptionFont = "caption-handwritten";

/* ---------- Safe save helper (persistence) ---------- */
function saveAlbums() {
  try {
    localStorage.setItem("polaroidAlbums", JSON.stringify(albums));
  } catch (e) {
    console.error("Could not save albums to localStorage:", e);
    alert(
      "Your browser storage seems full. Some very large images may not be saved.\n" +
      "Try using smaller images or clearing site data if this keeps happening."
    );
  }
}

/* ---------- Drop helper (for stickers onto page) ---------- */
function enableDropOnPage(pageEl) {
  if (!pageEl) return;

  pageEl.ondragover = (e) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  };

  pageEl.ondrop = (e) => {
    e.preventDefault();
    if (!e.dataTransfer) return;
    const type = e.dataTransfer.getData("sticker-type");
    if (!type || !currentAlbum) return;

    const rect = pageEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addStickerToPage(type, x, y, pageEl.id);
  };
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const stored = localStorage.getItem("polaroidAlbums");
  if (stored) {
    try {
      albums = JSON.parse(stored);
    } catch {
      albums = [];
    }
  }
  if (!albums || !albums.length) {
    createSampleAlbums();
  }

  renderAlbums();
  setupEventListeners();
});

/* ---------- Sample data ---------- */
function createSampleAlbums() {
  albums = [
    {
      id: 1,
      name: "Summer Memories",
      description: "Best summer ever!",
      cover:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
      pages: [
        {
          background: "clean",
          polaroids: [
            {
              id: 1,
              image:
                "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80",
              caption: "Beach day!",
              frame: "classic",
              font: "caption-handwritten",
              color: "black",
              tilt: "tilt-left",
              x: 50,
              y: 30,
              width: 200,
              height: 250
            },
            {
              id: 2,
              image:
                "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
              caption: "Sunset views",
              frame: "vintage",
              font: "caption-typewriter",
              color: "sepia",
              tilt: "tilt-right",
              x: 300,
              y: 100,
              width: 200,
              height: 250
            }
          ],
          stickers: [
            {
              id: 101,
              type: "sun",
              x: 400,
              y: 40,
              size: 40,
              color: "#FFD700",
              rotation: 0
            }
          ]
        }
      ]
    }
  ];
  saveAlbums();
}

/* ---------- Shelf (albums list) ---------- */
function renderAlbums() {
  const container = document.getElementById("booksContainer");
  container.innerHTML = "";

  albums.forEach((album) => {
    const albumElement = document.createElement("div");
    albumElement.className = "album-book floating";
    albumElement.dataset.id = album.id;

    albumElement.innerHTML = `
      <div class="album-cover" style="background-image: url('${album.cover}')"></div>
      <div class="album-spine"></div>
      <div class="album-title">${album.name}</div>
      <button class="album-delete-btn" title="Delete album">
        <i class="fas fa-trash"></i>
      </button>
    `;

    // Open album when clicking the book (but not the delete button)
    albumElement.addEventListener("click", () => openAlbum(album.id));

    // Delete button
    const deleteBtn = albumElement.querySelector(".album-delete-btn");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // don't trigger openAlbum
      deleteAlbum(album.id);
    });

    container.appendChild(albumElement);
  });

  // Re-add the "Create New Album" button at the end
  const createBtn = document.createElement("div");
  createBtn.className = "create-album-btn";
  createBtn.id = "createAlbumBtn";
  createBtn.innerHTML = `
    <i class="fas fa-plus-circle"></i>
    <span>Create New Album</span>
  `;
  createBtn.addEventListener("click", () => {
    document.getElementById("createAlbumModal").classList.add("active");
  });
  container.appendChild(createBtn);
}


/* ---------- Global UI event wires ---------- */
function setupEventListeners() {
  // Modal
  document.getElementById("createAlbumBtn").addEventListener("click", () => {
    document.getElementById("createAlbumModal").classList.add("active");
  });

  document.getElementById("cancelAlbumBtn").addEventListener("click", () => {
    document.getElementById("createAlbumModal").classList.remove("active");
    resetAlbumForm();
  });

  document.getElementById("coverUploadArea").addEventListener("click", () => {
    document.getElementById("coverFileInput").click();
  });

  document
    .getElementById("coverFileInput")
    .addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e2) {
          document.getElementById("coverUploadArea").innerHTML = `
            <img src="${e2.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 5px;">
            <p>Cover image selected</p>
          `;
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });

  document.getElementById("saveAlbumBtn").addEventListener("click", createNewAlbum);

  // Album viewer
  document.getElementById("closeAlbumBtn").addEventListener("click", closeAlbum);

  // Add photo
  document.getElementById("addPhotoBtn").addEventListener("click", () => {
    document.getElementById("photoFileInput").click();
  });

  // Photo upload with client-side resize (for persistence + quota)
  document
    .getElementById("photoFileInput")
    .addEventListener("change", function (e) {
      if (e.target.files && e.target.files.length > 0) {
        Array.from(e.target.files).forEach((file) => {
          const reader = new FileReader();
          reader.onload = function (ev) {
            const originalDataUrl = ev.target.result;
            resizeImageDataUrl(originalDataUrl, 1000, 0.8).then((smallDataUrl) => {
              addPolaroidToCurrentPage(smallDataUrl);
            });
          };
          reader.readAsDataURL(file);
        });
        this.value = "";
      }
    });

  // Page navigation
  document.getElementById("prevPageBtn").addEventListener("click", goToPrevPage);
  document.getElementById("nextPageBtn").addEventListener("click", goToNextPage);

  // Background buttons
  document.querySelectorAll("[data-bg]").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll("[data-bg]")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      changePageBackground(this.dataset.bg);
    });
  });

  // Sticker drag start
  document.querySelectorAll(".sticker-item").forEach((item) => {
    item.addEventListener("dragstart", (e) => {
      if (!e.dataTransfer) return;
      e.dataTransfer.setData("sticker-type", item.dataset.sticker);
      e.dataTransfer.effectAllowed = "copy";
    });
  });
}

/* ---------- Create album modal ---------- */
function createNewAlbum() {
  const name = document.getElementById("albumName").value.trim();
  const description = document.getElementById("albumDescription").value.trim();
  const fileInput = document.getElementById("coverFileInput");

  if (!name) {
    alert("Please enter an album name");
    return;
  }

  if (!fileInput.files || !fileInput.files[0]) {
    alert("Please select a cover photo");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const newAlbum = {
      id: Date.now(),
      name,
      description,
      cover: e.target.result,
      pages: [
        {
          background: "clean",
          polaroids: [],
          stickers: []
        }
      ]
    };

    albums.push(newAlbum);
    saveAlbums();

    document.getElementById("createAlbumModal").classList.remove("active");
    resetAlbumForm();
    renderAlbums();
    playSound("snap");
  };

  reader.readAsDataURL(fileInput.files[0]);
}

function resetAlbumForm() {
  document.getElementById("albumName").value = "";
  document.getElementById("albumDescription").value = "";
  document.getElementById("coverFileInput").value = "";
  document.getElementById("coverUploadArea").innerHTML = `
    <i class="fas fa-cloud-upload-alt"></i>
    <p>Click to upload or drag & drop</p>
    <p>Recommended: 400x560px or larger</p>
  `;
}

/* ---------- Open / close album ---------- */
function openAlbum(albumId) {
  playSound("pageflip");
  currentAlbum = albums.find((a) => a.id === albumId);
  currentPage = 0;

  const viewer = document.getElementById("albumViewer");
  viewer.classList.add("active");

  createBook3D();
  renderPage(currentPage);
}

function closeAlbum() {
  playSound("thump");
  document.getElementById("albumViewer").classList.remove("active");
  renderAlbums();
}

/* ---------- Book / pages ---------- */
function createBook3D() {
  const bookContainer = document.getElementById("book3d");
  bookContainer.innerHTML = "";

  const leftPage = document.createElement("div");
  leftPage.className = "page left-page";
  leftPage.id = "leftPage";

  const rightPage = document.createElement("div");
  rightPage.className = "page right-page";
  rightPage.id = "rightPage";

  bookContainer.appendChild(leftPage);
  bookContainer.appendChild(rightPage);

  // enable drop right away (renderPage will re-enable too)
  enableDropOnPage(leftPage);
  enableDropOnPage(rightPage);
}

function renderPage(pageIndex) {
  if (!currentAlbum || !currentAlbum.pages[pageIndex]) return;
  const page = currentAlbum.pages[pageIndex];

  const leftPage = document.getElementById("leftPage");
  const rightPage = document.getElementById("rightPage");
  if (!leftPage || !rightPage) return;

  leftPage.innerHTML = "";
  rightPage.innerHTML = "";

  leftPage.className = `page left-page ${page.background}-bg`;
  rightPage.className = `page right-page ${page.background}-bg`;

  const leftBg = document.createElement("div");
  leftBg.className = "page-background";
  leftPage.appendChild(leftBg);

  const rightBg = document.createElement("div");
  rightBg.className = "page-background";
  rightPage.appendChild(rightBg);

  // polaroids
  page.polaroids.forEach((p) => {
    leftPage.appendChild(createPolaroidElement(p));
  });

  // stickers
  page.stickers.forEach((s) => {
    leftPage.appendChild(createStickerElement(s));
  });

  // left page text
  const leftContent = document.createElement("div");
  leftContent.style.padding = "30px";
  leftContent.innerHTML = `
    <h2 style="font-family: 'Dancing Script', cursive; margin-bottom: 20px;">${currentAlbum.name}</h2>
    <p style="color: #666; margin-bottom: 20px;">${currentAlbum.description || "No description"}</p>
    <p style="font-size: 14px; color: #888;">Page ${pageIndex + 1} of ${currentAlbum.pages.length}</p>
  `;
  leftPage.appendChild(leftContent);

  enableDropOnPage(rightPage);
  enableDropOnPage(leftPage);
}

/* ---------- Polaroid creation (draggable + resizable) ---------- */
function createPolaroidElement(polaroidData) {
  const container = document.createElement("div");
  container.className = `polaroid-container ${polaroidData.tilt || ""}`;
  container.style.position = "absolute";
  container.style.left = `${polaroidData.x || 50}px`;
  container.style.top = `${polaroidData.y || 50}px`;
  container.dataset.id = polaroidData.id;
  const initialRotation =
  typeof polaroidData.rotation === "number"
    ? polaroidData.rotation
    : 0;

container.style.transform = `rotate(${initialRotation}deg)`;
  const polaroid = document.createElement("div");
  polaroid.className = `polaroid ${polaroidData.frame || "classic"} ${
    polaroidData.taped ? "taped" : ""
  }`;

  // size (resizable)
  const width = polaroidData.width || 200;
  const height = polaroidData.height || 250;
  polaroid.style.width = width + "px";
  polaroid.style.height = height + "px";

  const image = document.createElement("div");
  image.className = "polaroid-image";
  image.style.backgroundImage = `url('${polaroidData.image}')`;

  const caption = document.createElement("textarea");
  caption.className = `polaroid-caption ${
    polaroidData.font || "caption-handwritten"
  } ${polaroidData.color ? "caption-" + polaroidData.color : ""}`;
  caption.value = polaroidData.caption || "";
  caption.placeholder = "Add a caption...";

  caption.addEventListener("input", () => {
    updatePolaroidCaption(polaroidData.id, caption.value);
  });

  // resize handle
  const resizeHandle = document.createElement("div");
  resizeHandle.className = "resize-handle";
  attachResizeBehavior(resizeHandle, polaroid, polaroidData.id);

    polaroid.appendChild(image);
    polaroid.appendChild(caption);

    //controls (rotate + delete)
    const controls = document.createElement("div");
    controls.className = "polaroid-controls";
    controls.innerHTML = `
    <button class="polaroid-btn polaroid-rotate" title="Rotate">
        <i class="fas fa-undo"></i>
    </button>
    <button class="polaroid-btn polaroid-delete" title="Delete photo">
        <i class="fas fa-trash"></i>
    </button>
    `;
    polaroid.appendChild(controls);

polaroid.appendChild(resizeHandle);
container.appendChild(polaroid);


  makeDraggable(container, polaroidData.id, "polaroid");

  container.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showPolaroidMenu(e, polaroidData.id, container);
  });
  // Rotate button
    const rotateBtn = controls.querySelector(".polaroid-rotate");
    attachRotationBehavior(rotateBtn, container, polaroidData.id);

    // Delete button
    const deleteBtn = controls.querySelector(".polaroid-delete");
    deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    deletePolaroid(polaroidData.id);
    });


  return container;
}

/* ---------- Sticker element ---------- */
function createStickerElement(stickerData) {
  const sticker = document.createElement("div");
  sticker.className = "sticker";
  sticker.innerHTML = `
    <i class="fas fa-${stickerData.type}"></i>
    <div class="delete-btn"><i class="fas fa-times"></i></div>
  `;

  sticker.style.position = "absolute";
  sticker.style.left = `${stickerData.x}px`;
  sticker.style.top = `${stickerData.y}px`;
  sticker.style.fontSize = `${stickerData.size}px`;
  sticker.style.color = stickerData.color;
  sticker.style.transform = `rotate(${stickerData.rotation || 0}deg)`;
  sticker.dataset.id = stickerData.id;

  makeDraggable(sticker, stickerData.id, "sticker");

  sticker.querySelector(".delete-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    deleteSticker(stickerData.id);
  });

  return sticker;
}

/* ---------- Draggable behaviour (photos & stickers) ---------- */
function makeDraggable(element, id, type) {
  let isDragging = false;
  let startX, startY, initialX, initialY;

  element.addEventListener("mousedown", startDrag);
  element.addEventListener("touchstart", startDragTouch, { passive: false });

  function startDrag(e) {
    if (e.target.classList.contains("polaroid-caption")) return;
    if (e.target.classList.contains("delete-btn")) return;
    if (e.target.classList.contains("resize-handle")) return;
    if (e.target.closest(".polaroid-controls")) return;  


    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialX = element.offsetLeft;
    initialY = element.offsetTop;

    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", stopDrag);
    e.preventDefault();
  }

  function startDragTouch(e) {
    if (e.target.classList.contains("polaroid-caption")) return;
    if (e.target.classList.contains("delete-btn")) return;
    if (e.target.classList.contains("resize-handle")) return;

    const touch = e.touches[0];
    isDragging = true;
    startX = touch.clientX;
    startY = touch.clientY;
    initialX = parseInt(element.style.left) || 0;
    initialY = parseInt(element.style.top) || 0;

    document.addEventListener("touchmove", dragTouch, { passive: false });
    document.addEventListener("touchend", stopDrag);
    e.preventDefault();
  }

  function drag(e) {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newX = initialX + dx;
    const newY = initialY + dy;

    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;

    if (type === "polaroid") updatePolaroidPosition(id, newX, newY);
    else if (type === "sticker") updateStickerPosition(id, newX, newY);
  }

  function dragTouch(e) {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const newX = initialX + dx;
    const newY = initialY + dy;

    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;

    if (type === "polaroid") updatePolaroidPosition(id, newX, newY);
    else if (type === "sticker") updateStickerPosition(id, newX, newY);
  }

  function stopDrag() {
    isDragging = false;
    document.removeEventListener("mousemove", drag);
    document.removeEventListener("touchmove", dragTouch);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchend", stopDrag);
  }
}

/* ---------- Resize behaviour (polaroids) ---------- */
function attachResizeBehavior(handle, polaroidEl, polaroidId) {

  let isResizing = false;
  let startX, startY, startW, startH;

  handle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startW = polaroidEl.offsetWidth;
    startH = polaroidEl.offsetHeight;
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
  });

  handle.addEventListener("touchstart", (e) => {
    e.stopPropagation();
    const t = e.touches[0];
    isResizing = true;
    startX = t.clientX;
    startY = t.clientY;
    startW = polaroidEl.offsetWidth;
    startH = polaroidEl.offsetHeight;
    document.addEventListener("touchmove", resizeTouch, { passive: false });
    document.addEventListener("touchend", stopResize);
  });

  function resize(e) {
    if (!isResizing) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newW = Math.max(120, startW + dx);
    const newH = Math.max(140, startH + dy);
    polaroidEl.style.width = newW + "px";
    polaroidEl.style.height = newH + "px";
    updatePolaroidSize(polaroidId, newW, newH);
  }

  function resizeTouch(e) {
    if (!isResizing) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    const newW = Math.max(120, startW + dx);
    const newH = Math.max(140, startH + dy);
    polaroidEl.style.width = newW + "px";
    polaroidEl.style.height = newH + "px";
    updatePolaroidSize(polaroidId, newW, newH);
  }

  function stopResize() {
    isResizing = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("touchmove", resizeTouch);
    document.removeEventListener("mouseup", stopResize);
    document.removeEventListener("touchend", stopResize);
  }
}
function attachRotationBehavior(handle, container, polaroidId) {
  let rotating = false;
  let startAngle = 0;
  let baseRotation = 0;

  function getAngle(event) {
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const point = event.touches ? event.touches[0] : event;
    const x = point.clientX - cx;
    const y = point.clientY - cy;

    return (Math.atan2(y, x) * 180) / Math.PI;
  }

  function startRotate(e) {
    e.preventDefault();
    e.stopPropagation();
    rotating = true;

    // current stored rotation
    const p = currentAlbum?.pages[currentPage]?.polaroids.find(
      (x) => x.id === polaroidId
    );
    baseRotation = p && typeof p.rotation === "number" ? p.rotation : 0;
    startAngle = getAngle(e);

    document.addEventListener("mousemove", rotateMove);
    document.addEventListener("mouseup", stopRotate);
    document.addEventListener("touchmove", rotateMove, { passive: false });
    document.addEventListener("touchend", stopRotate);
  }

  function rotateMove(e) {
    if (!rotating) return;
    e.preventDefault();

    const currentAngle = getAngle(e);
    const newRotation = baseRotation + (currentAngle - startAngle);

    container.style.transform = `rotate(${newRotation}deg)`;
    updatePolaroidRotation(polaroidId, newRotation);
  }

  function stopRotate() {
    if (!rotating) return;
    rotating = false;

    document.removeEventListener("mousemove", rotateMove);
    document.removeEventListener("mouseup", stopRotate);
    document.removeEventListener("touchmove", rotateMove);
    document.removeEventListener("touchend", stopRotate);
  }

  handle.addEventListener("mousedown", startRotate);
  handle.addEventListener("touchstart", startRotate, { passive: false });
}


/* ---------- Add photo (centered & persistent) ---------- */
function addPolaroidToCurrentPage(imageSrc) {
  if (!currentAlbum) return;
  const page = currentAlbum.pages[currentPage];

  const rightPage = document.getElementById("leftPage");
  let x = 80;
  let y = 80;

  if (rightPage) {
    const rect = rightPage.getBoundingClientRect();
    x = rect.width / 2 - 100 + page.polaroids.length * 20;
    y = rect.height / 2 - 120 + page.polaroids.length * 20;
  }

  const polaroidData = {
    id: Date.now(),
    image: imageSrc,
    caption: "",
    frame: selectedPolaroidFrame,
    font: selectedCaptionFont,
    color: "black",
    x,
    y,
    width: 200,
    height: 250,
    rotation: 0
  };

  page.polaroids.push(polaroidData);
  saveAlbums();          // persistence
  renderPage(currentPage); // guarantees it appears

  playSound("snap");
}

/* ---------- Add sticker ---------- */
function addStickerToPage(type, x, y, targetPageId = "leftPage") {
  if (!currentAlbum) return;

  const colors = {
    plane: "#4682B4",
    map: "#8B4513",
    camera: "#333",
    heart: "#FF4757",
    star: "#FFD700",
    cloud: "#87CEEB",
    sun: "#FFA500",
    coffee: "#8B4513",
    book: "#2E8B57",
    music: "#9B30FF",
    flag: "#FF6347",
    gift: "#20B2AA"
  };

  const stickerData = {
    id: Date.now(),
    type,
    x,
    y,
    size: 40,
    color: colors[type] || "#333",
    rotation: Math.random() * 30 - 15
  };

  currentAlbum.pages[currentPage].stickers.push(stickerData);
  saveAlbums();

  const pageEl =
    document.getElementById(targetPageId) ||
    document.getElementById("rightPage");
  if (pageEl) {
    pageEl.appendChild(createStickerElement(stickerData));
  }

  playSound("pageflip");
}

/* ---------- Update helpers (persistent) ---------- */
function updatePolaroidCaption(id, caption) {
  const p = currentAlbum?.pages[currentPage]?.polaroids.find((x) => x.id === id);
  if (!p) return;
  p.caption = caption;
  saveAlbums();
}

function updatePolaroidPosition(id, x, y) {
  const p = currentAlbum?.pages[currentPage]?.polaroids.find((x) => x.id === id);
  if (!p) return;
  p.x = x;
  p.y = y;
  saveAlbums();
}

function updatePolaroidSize(id, w, h) {
  const p = currentAlbum?.pages[currentPage]?.polaroids.find((x) => x.id === id);
  if (!p) return;
  p.width = w;
  p.height = h;
  saveAlbums();
}
function updatePolaroidRotation(id, rotation) {
  const p = currentAlbum?.pages[currentPage]?.polaroids.find((x) => x.id === id);
  if (!p) return;
  p.rotation = rotation;
  saveAlbums();
}

function deletePolaroid(id) {
  const page = currentAlbum?.pages[currentPage];
  if (!page) return;

  page.polaroids = page.polaroids.filter((p) => p.id !== id);
  saveAlbums();

  const el = document.querySelector(`.polaroid-container[data-id="${id}"]`);
  if (el) el.remove();
}
function deleteAlbum(albumId) {
  const album = albums.find((a) => a.id === albumId);
  const name = album ? album.name : "this album";

  const ok = confirm(
    `Are you sure you want to delete "${name}"?\nThis cannot be undone.`
  );
  if (!ok) return;

  // Remove from the albums array
  albums = albums.filter((a) => a.id !== albumId);

  // If we were currently viewing this album, close the viewer
  if (currentAlbum && currentAlbum.id === albumId) {
    currentAlbum = null;
    const viewer = document.getElementById("albumViewer");
    if (viewer) viewer.classList.remove("active");
  }

  // Persist change
  saveAlbums();

  // Re-render shelf
  renderAlbums();
}



function updateStickerPosition(id, x, y) {
  const s = currentAlbum?.pages[currentPage]?.stickers.find((x) => x.id === id);
  if (!s) return;
  s.x = x;
  s.y = y;
  saveAlbums();
}

function deleteSticker(id) {
  const page = currentAlbum?.pages[currentPage];
  if (!page) return;
  page.stickers = page.stickers.filter((s) => s.id !== id);
  saveAlbums();
  const el = document.querySelector(`.sticker[data-id="${id}"]`);
  if (el) el.remove();
}

/* ---------- Polaroid frame cycle ---------- */
function showPolaroidMenu(e, polaroidId, element) {
  const frames = [
    "classic",
    "vintage",
    "warm",
    "pastel-blue",
    "pastel-pink",
    "pastel-green",
    "minimalist"
  ];
  const currentFrame = element.querySelector(".polaroid").classList[1];
  const nextFrame =
    frames[(frames.indexOf(currentFrame) + 1) % frames.length];

  element.querySelector(".polaroid").className = `polaroid ${nextFrame}`;

  const p = currentAlbum?.pages[currentPage]?.polaroids.find(
    (x) => x.id === polaroidId
  );
  if (p) {
    p.frame = nextFrame;
    saveAlbums();
  }

  playSound("pageflip");
}

/* ---------- Background / pages nav ---------- */
function changePageBackground(bgType) {
  if (!currentAlbum) return;
  currentAlbum.pages[currentPage].background = bgType;
  saveAlbums();
  renderPage(currentPage);
}

function goToPrevPage() {
  if (currentPage > 0) {
    currentPage--;
    playSound("pageflip");
    renderPage(currentPage);
  }
}

function goToNextPage() {
  if (!currentAlbum) return;
  if (currentPage < currentAlbum.pages.length - 1) {
    currentPage++;
  } else {
    currentAlbum.pages.push({
      background: "clean",
      polaroids: [],
      stickers: []
    });
    currentPage = currentAlbum.pages.length - 1;
  }
  saveAlbums();
  playSound("pageflip");
  renderPage(currentPage);
}

/* Image resize helper */
function resizeImageDataUrl(dataUrl, maxSize, quality = 0.9) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const maxSide = Math.max(width, height);
      if (maxSide > maxSize) {
        const scale = maxSize / maxSide;
        width = width * scale;
        height = height * scale;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const resized = canvas.toDataURL("image/jpeg", quality);
      resolve(resized);
    };
    img.src = dataUrl;
  });
}
