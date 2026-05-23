# LabGrid - Premium Schedule Builder 📅

**LabGrid** is a high-contrast, mobile-first schedule companion designed for high performance and custom lock-screen wallpaper generation. It features a refined design system, a robust mobile drag-and-drop engine, an AI-powered image scanner, and persistent storage for seamless academic or professional tracking.

## ✨ Premium Features

### 🤖 AI-Powered Schedule Scanning
* **Computer Vision to Grid:** Upload a photo of any physical or digital schedule. The integrated Node.js backend uses LLMs to parse the image, calculate grid coordinates, and automatically populate your workspace.
* **Smart Auto-Trimming:** Dynamically adjusts between 5-day and 7-day grids based on whether the AI detects weekend classes.

### ☀️ Dynamic Theme System
* **Solar Flare (Classic White):** A clean, high-visibility layout with professional blue and red accents.
* **Deep Charcoal (Dark Mode):** A high-performance aesthetic designed to reduce eye strain during late-night study sessions.
* **Neon Cyber:** A vibrant theme featuring glowing cyan and pink borders for a high-energy workspace.
* **Seamless Transitions:** Smooth color-morphing across the header, footer, and grid cells during theme switching.

### ⠿ Pro-Grade Drag & Drop
* **Touch-Optimized Polyfill:** Built-in support for mobile browsers using a custom long-press "claim" system (300ms).
* **Secure Handshake Logic:** A global state-tracking system (`draggedIndex`) that prevents "snap-back" errors by securing cell IDs during the move.
* **Visual Target Feedback:** Purple dashed borders and "ghost" cell effects that provide real-time confirmation of your drop target.

### 🧠 Intelligent Workspace Logic
* **Contextual Edit Modals:** Smart panels that adapt their inputs based on whether you are editing a header or a subject cell.
* **Interactive Star Toggle:** A dedicated "Importance" marker (★) that can be added to any cell with a single tap.
* **Auto-Scaling Preview:** A responsive scaling engine that perfectly fits the wallpaper workspace to any device screen size.

### 📊 High-Resolution Export
* **3x PNG Rendering:** Utilizes `html2canvas` to capture wallpapers at triple-scale for crystal-clear quality on high-density displays.
* **Smart UI Masking:** Automatically hides drag handles and editing icons during the export process for a clean final look.
* **Mobile-Optimized Engine:** Utilizes tabular numbers, grid-centering logic, and transition-overrides to prevent shifting or cut-off text on mobile browsers.

## 🛠️ Tech Stack
* **Frontend:** HTML5, CSS3 (Variables, Glassmorphism), Vanilla JavaScript, `localStorage` for state management, `html2canvas`.
* **Backend:** Node.js, Express.js.
* **AI & Data:** `multer` (memory storage for images), OpenAI SDK (OpenRouter/Gemini), CORS.

---

## 🚀 Local Development Guide

Because LabGrid features an AI backend, running the project locally requires starting both the server environment and the frontend interface.

### Prerequisites
* Ensure you have [Node.js](https://nodejs.org/) installed.
* Ensure you have the **Live Server** extension installed in VS Code.

### Step 1: Environment Setup
1. Clone the repository to your local machine.
2. Open the terminal in your project directory and install the required backend dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your API key:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```

### Step 2: Start the Backend Server
The backend handles the AI image parsing and requires its own terminal instance.

1. Open a terminal in the project directory.
2. Run the following command:
   ```bash
   node server.js
   ```
3. You should see: `🚀 Final Stable Server: http://localhost:3000`. Leave this terminal open.

### Step 3: Start the Frontend UI
The frontend uses an auto-detect URL script to seamlessly switch between local and production APIs.

1. Open the project in VS Code.
2. Right-click on `index.html` and select "Open with Live Server".
3. Your browser will automatically launch the app at `http://127.0.0.1:5500`.