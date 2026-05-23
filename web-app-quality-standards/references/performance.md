# Performance Standards

## Image Optimization

- [ ] Use modern formats: WebP, AVIF.
- [ ] Implement responsive images (`srcset`, `<picture>`).
- [ ] Lazy load non-critical images (`loading="lazy"`).
- [ ] Set `width` and `height` attributes to prevent layout shifts.

## Asset Loading

- [ ] Minify CSS, JS, and HTML.
- [ ] Use `async` or `defer` for external scripts.
- [ ] Prefetch critical assets (`rel="preload"`).
- [ ] Optimize web fonts: `font-display: swap`.

## Runtime Performance

- [ ] Avoid long-running JavaScript on the main thread.
- [ ] Minimize DOM manipulations.
- [ ] Use CSS transitions/animations over JS-based ones.
- [ ] Implement debouncing/throttling for scroll/resize events.
