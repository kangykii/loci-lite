const EASE_OUT_X1 = 0.32;
const EASE_OUT_Y1 = 0;
const EASE_OUT_X2 = 0.16;
const EASE_OUT_Y2 = 1;

let scrollAnimationId: number | null = null;

function readTimeVar(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (raw.endsWith('ms')) return parseFloat(raw);
  if (raw.endsWith('s')) return parseFloat(raw) * 1000;

  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readRatioVar(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function easeOutBezier(progress: number): number {
  const cx = 3 * EASE_OUT_X1;
  const bx = 3 * (EASE_OUT_X2 - EASE_OUT_X1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * EASE_OUT_Y1;
  const by = 3 * (EASE_OUT_Y2 - EASE_OUT_Y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;

  let low = 0;
  let high = 1;
  for (let i = 0; i < 8; i += 1) {
    const mid = (low + high) / 2;
    if (sampleX(mid) < progress) low = mid;
    else high = mid;
  }

  return sampleY((low + high) / 2);
}

function cancelScrollAnimation(): void {
  if (scrollAnimationId !== null) {
    cancelAnimationFrame(scrollAnimationId);
    scrollAnimationId = null;
  }
}

function animateWindowScrollTo(targetTop: number): void {
  cancelScrollAnimation();

  const startTop = window.scrollY;
  const delta = targetTop - startTop;
  if (Math.abs(delta) < 1) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({ top: targetTop, behavior: 'instant' });
    return;
  }

  const duration = readTimeVar('--dur-editor-scroll', 280);
  const startTime = performance.now();

  const step = (now: number) => {
    const linear = Math.min((now - startTime) / duration, 1);
    const eased = easeOutBezier(linear);
    window.scrollTo({ top: startTop + delta * eased, behavior: 'instant' });

    if (linear < 1) {
      scrollAnimationId = requestAnimationFrame(step);
    } else {
      scrollAnimationId = null;
    }
  };

  scrollAnimationId = requestAnimationFrame(step);
}

function scrollRectIntoEditorView(rect: DOMRect): void {
  if (rect.width === 0 && rect.height === 0) return;

  const viewportH = window.innerHeight;
  const ratio = readRatioVar('--editor-scroll-target-ratio', 0.4);
  const targetTop = Math.max(0, window.scrollY + rect.top - viewportH * ratio);

  animateWindowScrollTo(targetTop);
}

export function scrollElementIntoEditorView(element: HTMLElement): void {
  scrollRectIntoEditorView(element.getBoundingClientRect());
}

export function scrollRangeIntoEditorView(range: Range): void {
  scrollRectIntoEditorView(range.getBoundingClientRect());
}
