/**
 * Adds `.is-visible` to elements carrying `.reveal` once they scroll into view.
 *
 * This runs from the persistent layout, which mounts once and then survives every
 * page navigation. A one-shot scan on mount is therefore not enough: each new page
 * brings brand-new `.reveal` nodes that were never observed, and because the hidden
 * state is pure CSS they stay at `opacity: 0` forever — the page renders blank.
 * A MutationObserver picks up whatever gets inserted, whenever it is inserted, so
 * this holds for route changes, async data resolving and conditional sections alike.
 */
export const useScrollReveal = () => {
  const observed = new WeakSet<Element>();
  let viewport: IntersectionObserver | null = null;
  let inserts: MutationObserver | null = null;
  let queued = 0;

  const reveal = (el: Element) => {
    el.classList.add('is-visible');
    viewport?.unobserve(el);
  };

  const scan = () => {
    for (const el of document.querySelectorAll('.reveal:not(.is-visible)')) {
      if (observed.has(el)) continue;
      observed.add(el);

      // No observer (unsupported, or torn down mid-flight): show, never hide.
      if (!viewport) {
        reveal(el);
        continue;
      }

      viewport.observe(el);
    }
  };

  /** Coalesces a burst of DOM mutations into a single scan per frame. */
  const scheduleScan = () => {
    if (queued) return;
    queued = requestAnimationFrame(() => {
      queued = 0;
      scan();
    });
  };

  onMounted(() => {
    if (typeof IntersectionObserver !== 'undefined') {
      viewport = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) reveal(entry.target);
          }
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
      );
    }

    scan();

    if (typeof MutationObserver !== 'undefined') {
      inserts = new MutationObserver(scheduleScan);
      inserts.observe(document.body, { childList: true, subtree: true });
    }
  });

  onBeforeUnmount(() => {
    if (queued) cancelAnimationFrame(queued);
    queued = 0;
    inserts?.disconnect();
    inserts = null;
    viewport?.disconnect();
    viewport = null;
  });

  return { scan };
};
