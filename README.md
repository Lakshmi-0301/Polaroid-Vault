Here is a **clean, aesthetic, professional README** for your Polaroid-memory-garden scrapbook app.
You can paste this directly into your GitHub README.md 🌿📸✨

---

# \*\*Polaroid Vault

**Polaroid Vault** is a whimsical, aesthetic digital scrapbook where users can create a personal album filled with photos, polaroids and stickers

---

## **Features**

### **Polaroid Photo Creation**

- Upload images directly into your album.
- Photos appear on the editable page as draggable, resizable polaroids.
- Each polaroid supports:

  - Custom captions
  - Free-hand rotation (click & twist)
  - Frame styles (classic, pastel, vintage…)
  - Deletion

- Create unlimited albums with custom cover images and descriptions.
- Each album behaves like a **digital scrapbook book** with:

  - Multiple pages
  - Customizable backgrounds
  - Persistent saving of all edits

### **Stickers & Decorations**

- Drag-and-drop aesthetic stickers (flowers, hearts, stars, travel icons, etc.).
- Stickers can be moved, resized, rotated, and deleted.
- Fully saved across sessions.

### **Persistent Storage**

Everything — photos, positions, sizes, stickers, captions, rotation — is stored in **localStorage**, making your scrapbook persist even after refresh.

### **Album Management**

- Delete albums directly from the main shelf page
- Confirmation prompts prevent accidental loss

---

## **Tech Stack**

- **HTML5** → Structure & layout
- **CSS3** → Aesthetic pastel theme + animations
- **JavaScript (Vanilla)** →

  - Drag and drop
  - Freehand rotation logic
  - Resize handles
  - LocalStorage persistence
  - Dynamic DOM rendering

- **FontAwesome** → Icons
- **Google Fonts** → Handwritten & aesthetic fonts

---

## **Core UI / UX Highlights**

- Soft, pastel scrapbook aesthetic
- Polaroid-style cards with shadows
- Smooth interactions (drag, rotate, resize)
- Minimalistic album shelf with floating animations
- Intuitive toolbar for adding photos, stickers, pages, and backgrounds

---

## **How to Use**

### 1. **Open the Project**

Just open the HTML file in your browser — no backend needed.

### 2. **Create a New Album**

- Click **“Create Album”**
- Add a name, description, and cover photo

### 3. **Add Content**

Inside the album:

- Upload photos → they appear as polaroids
- Drag stickers into your page
- Resize or rotate elements freely
- Add captions and decorate pages

### 4. **Navigate Pages**

Use the arrows to move between scrapbook pages.

### 5. **Save Automatically**

Everything automatically saves in your browser.

### 6. **Delete Albums**

Use the little trash icon on the album shelf.

---

## **Project Structure**

```
📂 Polaroid-Vault/
│── polaroid.html          # Main UI
│── polaroid.css           # Aesthetic styles + scrapbook UI
│── polaroid.js         # All logic (drag/resize/rotate/save/render)
│── README.md           # Project documentation
```
