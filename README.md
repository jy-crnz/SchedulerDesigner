📅 Glassmorphism Schedule Generator
A sleek, high-performance schedule builder designed specifically to create custom mobile wallpapers. This tool provides a premium, interactive experience whether you're managing university labs or tracking complex daily tasks.

✨ Features
Glassmorphism UI: Utilizes modern CSS backdrop-filters and neon color palettes to create a futuristic, translucent aesthetic.

Mobile-Native Drag & Drop: A robust implementation powered by the mobile-drag-drop polyfill, enabling seamless cell swapping on touch devices.

Secure Handshake Logic: Features an integrated draggedIndex global state to ensure drop reliability even when mobile browsers lose dataTransfer packets.

High-Res Wallpaper Export: Generates 3x scale PNG images via html2canvas, optimized for high-density smartphone lock screens.

Persistent Memory: All schedule data and theme preferences are saved to localStorage, so your work is preserved even after a browser refresh.

Smart Scaling: Real-time preview scaling ensures the workspace remains usable across all screen dimensions.

📲 How to Add to Home Screen
For the best experience, add this app to your home screen to use it like a native mobile application without the browser address bar.

On iOS (Safari)
Open the app URL in Safari.

Tap the Share button (the square with an upward arrow) at the bottom of the screen.

Scroll down the list of options and tap Add to Home Screen.

Name the app and tap Add in the top-right corner.

On Android (Chrome)
Open the app URL in Chrome.

Tap the Three Dots (menu icon) in the top-right corner.

Tap Add to Home screen.

Follow the prompts to name the shortcut and confirm by tapping Add.

🛠️ Built With
HTML5 / CSS3: Custom grid layout with -webkit specific mobile optimizations to prevent accidental scrolling.

Vanilla JavaScript: State management and custom event listeners for refined drag/drop interactions.

html2canvas: Used for capturing the wallpaper container as a clean, high-resolution image.

mobile-drag-drop: Essential polyfill for bridging the gap between desktop and mobile browser functionality.

📱 Mobile Interaction Guide
Pro Tip: To move a cell, use a Long-Press (300ms) on the handle icon (⠿) to activate the drag state.

Visual Feedback: A purple dashed border will appear to confirm your target cell as you hover.

The Passthrough: The app uses pointer-events: none during the drag to allow touch events to "hit" cells hidden behind your finger.
