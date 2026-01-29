## LabGrid - Premium Schedule Builder 📅

**LabGrid** is a high-contrast, mobile-first schedule companion designed for high performance and custom lock-screen wallpaper generation. It features a refined design system, a robust mobile drag-and-drop engine, and persistent storage for seamless academic or professional tracking.

### ✨ Premium Features

#### ☀️ Dynamic Theme System
* **Solar Flare (Classic White):** A clean, high-visibility layout with professional blue and red accents.
* **Deep Charcoal (Dark Mode):** A high-performance aesthetic designed to reduce eye strain during late-night study sessions.
* **Neon Cyber:** A vibrant theme featuring glowing cyan and pink borders for a high-energy workspace.
* **Seamless Transitions:** Smooth color-morphing across the header, footer, and grid cells during theme switching.

#### ⠿ Pro-Grade Drag & Drop
* **Touch-Optimized Polyfill:** Built-in support for mobile browsers using a custom long-press "claim" system (300ms).
* **Secure Handshake Logic:** A global state-tracking system (`draggedIndex`) that prevents "snap-back" errors by securing cell IDs during the move.
* **Visual Target Feedback:** Purple dashed borders and "ghost" cell effects that provide real-time confirmation of your drop target.
* **Pointer-Passthrough:** Advanced CSS logic (`pointer-events: none`) that allows touch events to "see through" the dragging cell to the target beneath.



### 🧠 Intelligent Workspace Logic
* **Contextual Edit Modals:** Smart panels that adapt their inputs based on whether you are editing a header or a subject cell.
* **Interactive Star Toggle:** A dedicated "Importance" marker (★) that can be added to any cell with a single tap.
* **Auto-Scaling Preview:** A responsive scaling engine that perfectly fits the wallpaper workspace to any device screen size.

### 📊 High-Resolution Export
* **3x PNG Rendering:** Utilizes `html2canvas` to capture wallpapers at triple-scale for crystal-clear quality on high-density displays.
* **Smart UI Masking:** Automatically hides drag handles and editing icons during the export process for a clean final look.
* **Instant Download:** Direct-to-device file generation with unique timestamps for every version of your schedule.

## 🛠️ Tech Stack
* **HTML5:** Semantic architecture for a clean, accessible mobile application feel.
* **CSS3:** Custom properties (CSS Variables), backdrop-blur filters for glassmorphism, and hardware-accelerated animations.
* **Vanilla JavaScript:** Lightweight, high-speed logic with `localStorage` for persistent data tracking and grid state management.

## 🚀 Getting Started
1. Clone the repository to your local machine.
2. Open `index.html` in any mobile or desktop browser.
3. **For the Best Experience:** Follow the "Add to Home Screen" prompts on your iOS or Android device to remove the browser address bar for a native app feel.
