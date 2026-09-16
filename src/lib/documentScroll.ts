export type DocumentScrollTarget = Window | HTMLElement;

export function getDocumentScrollTarget(editorElement?: Element | null): DocumentScrollTarget {
  const editorScroll = editorElement?.closest<HTMLElement>('[data-editor-scroll]')
    ?? document.querySelector<HTMLElement>('[data-editor-scroll]');

  if (editorScroll) {
    return editorScroll;
  }

  return window;
}

export function getDocumentScrollTop(target = getDocumentScrollTarget()): number {
  return target === window ? window.scrollY : (target as HTMLElement).scrollTop;
}

export function scrollDocumentTo(
  top: number,
  target = getDocumentScrollTarget(),
): void {
  target.scrollTo({ top, left: 0, behavior: 'instant' });
}

export function getDocumentViewport(target = getDocumentScrollTarget()): {
  height: number;
  top: number;
} {
  if (target === window) {
    return { height: window.innerHeight, top: 0 };
  }

  const element = target as HTMLElement;
  return {
    height: element.clientHeight,
    top: element.getBoundingClientRect().top,
  };
}
