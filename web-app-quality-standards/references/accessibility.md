# Accessibility (A11y) Standards

## Semantic HTML

- [ ] Use header tags (`<h1>` to `<h6>`) in logical order.
- [ ] Use landmark elements: `<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`, `<article>`.
- [ ] Use native controls (`<button>`, `<input>`, `<a>`) whenever possible.

## Interactive Elements

- [ ] All interactive elements must be keyboard-accessible (`tabindex`).
- [ ] Ensure focus indicators are clearly visible (`:focus-visible`).
- [ ] Use `aria-label` or `aria-labelledby` for controls without text.
- [ ] Provide descriptive text for links (avoid "click here").

## Content & Design

- [ ] Maintain a minimum contrast ratio of 4.5:1 for normal text.
- [ ] Ensure all images have meaningful `alt` text or `alt=""` for decorative ones.
- [ ] Avoid using color alone to convey information.
- [ ] Support text resizing up to 200% without loss of content.
