'use client';

import { useEffect, useState } from 'react';

/**
 * Floating «▲ ОГЛАВЛЕНИЕ» console — docked to the bottom edge per the HUD
 * convention (not a floating pill mid-screen). The single way back to the
 * index on an 86-screen page.
 *
 * Why a scroll listener and NOT IntersectionObserver: on an instant jump
 * (permalink load, «Читать с начала», browser back) the TOC flies from below
 * the viewport to above it without ever intersecting — ratio 0 → 0,
 * isIntersecting false → false, so an IO callback never fires and the
 * console would stay hidden until the next gradual scroll.
 */
export function BackToToc() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const toc = document.getElementById('history-toc');
    if (!toc) return;

    let raf = 0;
    const check = () => {
      raf = 0;
      // Visible once the whole TOC block is above the viewport.
      setShow(toc.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };

    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  if (!show) return null;

  const scrollToToc = () => {
    const toc = document.getElementById('history-toc');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    toc?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)] pointer-events-none animate-fade-in-up"
    >
      <div className="max-w-4xl mx-auto px-4 pointer-events-auto">
        <button
          type="button"
          onClick={scrollToToc}
          data-testid="back-to-toc"
          className="w-full h-11 flex items-center justify-center gap-2 font-ibm-mono text-[11px] uppercase tracking-[0.3em] text-military-amber bg-military-charcoal/95 backdrop-blur-sm border border-b-0 border-military-rust/40 rounded-t-lg shadow-[0_-8px_24px_rgba(0,0,0,0.5)]"
        >
          <span aria-hidden>▲</span> ОГЛАВЛЕНИЕ
        </button>
      </div>
    </div>
  );
}
