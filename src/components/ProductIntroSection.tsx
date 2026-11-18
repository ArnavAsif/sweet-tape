"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createTapeViewer } from "@/lib/createTapeViewer";
import { whenRevealed, whenSweeping } from "@/lib/loader";
import type { ProductData } from "@/data/products";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const FINISH = {
  "Face Brown": { metalness: 0.05, roughness: 2 },
  Tape: { metalness: 0, roughness: 0 },
  "Tape Inner": { metalness: 0, roughness: 0.86 },
  "Material.001": { metalness: 0, roughness: 0.63 },
};

const STAGE_LIGHT = {
  key: 0.11,
  ambient: 0.6,
  fill: 0.67,
  env: 0.22,
};

const STAGE_FILM = {
  knobs: {
    AMOUNT: 0.6,
    GLOSS: 0.42,
    MOTTLE: 0.22,
    SMUDGE: 1.2,
    TOOTH: 0.41,
    GLAZE: 0.06,
    FACE_GLOSS: 0.4,
    GRAIN: 4,
    ANISO: 0.11,
  },
  glass: {
    AMOUNT: 0.48,
    EDGE: 4.2,
    SHEEN: 0.155,
  },
};

const ROLL_CONFIG = {
  DELAY: 0,
  FROM_Y: "14.6vw",
  FROM_SCALE: 0.82,
  DURATION: 1.3,
  EASE: "back.out(1.5)",
};

const WORD_CONFIG = {
  UP: 0.42,
  EASE_UP: "power3.out",
  STAGGER: 0.08,
  BOTTOM_STAGGER: 0.05,
};

const TAG_CONFIG = {
  FROM: -100,
  PERSPECTIVE: 420,
  ORIGIN: "50% 50%",
  DURATION: 0.85,
  EASE: "back.out(1.4)",
};

function parseStyleString(str: string): React.CSSProperties {
  const style: Record<string, string> = {};
  if (!str) return style;
  str.split(";").forEach((pair) => {
    const colonIdx = pair.indexOf(":");
    if (colonIdx !== -1) {
      const key = pair.substring(0, colonIdx).trim();
      const val = pair.substring(colonIdx + 1).trim();
      if (key && val) style[key] = val;
    }
  });
  return style as React.CSSProperties;
}

interface ProductIntroProps {
  product: ProductData;
}

export default function ProductIntroSection({ product }: ProductIntroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useIsomorphicLayoutEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    gsap.registerPlugin(ScrollTrigger);
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 1. Text entrance animations
    const topImgs = Array.from(section.querySelectorAll<HTMLElement>(".top-title img"));
    const bottomImgs = Array.from(section.querySelectorAll<HTMLElement>(".bottom-title .glyph img"));
    const piRoll = section.querySelector<HTMLElement>(".pi-roll");
    const piRollIn = section.querySelector<HTMLElement>(".pi-roll-in");
    const fallbackImg = piRollIn?.querySelector<HTMLImageElement>("img") ?? null;
    const piBack = section.querySelector<HTMLElement>(".pi-back");

    let textTl: gsap.core.Timeline | null = null;
    let rollPopTween: gsap.core.Tween | null = null;
    let rollPopTimer: gsap.core.Tween | null = null;
    let backTrigger: ScrollTrigger | null = null;
    let backTween: gsap.core.Tween | null = null;
    let unsubSweeping: (() => void) | null = null;
    let unsubRevealed: (() => void) | null = null;

    if (!prefersReduced) {
      const dipTo = (el: HTMLElement) => (el.offsetHeight || el.getBoundingClientRect().height || 1) + 2;
      const maskDip = (el: HTMLElement, y: number) => {
        const val = `0px ${y}px`;
        el.style.setProperty("mask-position", val);
        el.style.setProperty("-webkit-mask-position", val);
      };
      const shiftDip = (el: HTMLElement, y: number) => {
        gsap.set(el, { y });
      };

      topImgs.forEach((img) => maskDip(img, dipTo(img)));
      bottomImgs.forEach((img) => shiftDip(img, dipTo(img)));

      if (piRollIn) {
        rollPopTween = gsap.fromTo(
          piRollIn,
          { y: ROLL_CONFIG.FROM_Y, scale: ROLL_CONFIG.FROM_SCALE },
          {
            y: 0,
            scale: 1,
            duration: ROLL_CONFIG.DURATION,
            ease: ROLL_CONFIG.EASE,
            paused: true,
          }
        );
      }

      unsubSweeping = whenSweeping(() => {
        if (rollPopTween) {
          rollPopTimer = gsap.delayedCall(ROLL_CONFIG.DELAY, () => rollPopTween?.play());
        }
      });

      unsubRevealed = whenRevealed(() => {
        textTl = gsap.timeline();
        if (topImgs.length) {
          const topSub = gsap.timeline();
          topImgs.forEach((img, idx) => {
            const state = { y: dipTo(img) };
            topSub.to(
              state,
              {
                y: 0,
                duration: WORD_CONFIG.UP,
                ease: WORD_CONFIG.EASE_UP,
                onUpdate: () => maskDip(img, state.y),
              },
              idx * WORD_CONFIG.STAGGER
            );
          });
          textTl.add(topSub, 0.1);
        }

        if (bottomImgs.length) {
          const bottomSub = gsap.timeline();
          bottomImgs.forEach((img, idx) => {
            const state = { y: dipTo(img) };
            bottomSub.to(
              state,
              {
                y: 0,
                duration: WORD_CONFIG.UP,
                ease: WORD_CONFIG.EASE_UP,
                onUpdate: () => shiftDip(img, state.y),
              },
              idx * WORD_CONFIG.BOTTOM_STAGGER
            );
          });
          textTl.add(bottomSub, 0.26);
        }
      });

      if (piBack) {
        backTween = gsap.fromTo(
          piBack,
          {
            autoAlpha: 0,
            rotateY: TAG_CONFIG.FROM,
            transformPerspective: TAG_CONFIG.PERSPECTIVE,
            transformOrigin: TAG_CONFIG.ORIGIN,
          },
          {
            autoAlpha: 1,
            rotateY: 0,
            duration: TAG_CONFIG.DURATION,
            ease: TAG_CONFIG.EASE,
            paused: true,
            onComplete: () => gsap.set(piBack, { clearProps: "transform,transformOrigin" }),
          }
        );

        backTrigger = ScrollTrigger.create({
          trigger: piBack,
          start: "top 88%",
          once: true,
          onEnter: () => {
            whenRevealed(() => backTween?.play());
          },
        });
      }
    }

    // 2. 3D Tape Viewer & Scroll Spin Controller
    let viewerInstance: any = null;
    let isDisposed = false;
    let scrollST: ScrollTrigger | null = null;
    const abortCtrl = new AbortController();

    if (piRoll && piRollIn && product.model) {
      const innerInfoSection = document.querySelector<HTMLElement>(".product-inner-info");
      const targetSlot = innerInfoSection?.querySelector<HTMLElement>(".threed-tape") ?? null;
      const targetFallbackImg = targetSlot?.querySelector<HTMLImageElement>("img") ?? null;

      if (fallbackImg) fallbackImg.style.visibility = "hidden";
      if (targetFallbackImg && !prefersReduced) targetFallbackImg.style.visibility = "hidden";

      let deltaX = 0;
      let deltaY = 0;

      const updateRollPosition = (progress: number) => {
        gsap.set(piRoll, { x: deltaX * progress, y: deltaY * progress });
        if (viewerInstance) viewerInstance.spin(360 * progress);
      };

      if (targetSlot && !prefersReduced) {
        scrollST = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          endTrigger: innerInfoSection,
          end: "top top",
          onUpdate: (self) => updateRollPosition(self.progress),
          onToggle: (self) => updateRollPosition(self.progress),
          onRefresh: () => {
            if (!targetSlot) return;
            const currentX = gsap.getProperty(piRoll, "x");
            const currentY = gsap.getProperty(piRoll, "y");
            gsap.set(piRoll, { x: 0, y: 0 });
            const startRect = piRoll.getBoundingClientRect();
            const targetRect = targetSlot.getBoundingClientRect();
            deltaX = targetRect.left - startRect.left;
            deltaY = targetRect.top - startRect.top;
            gsap.set(piRoll, { x: currentX, y: currentY });
            updateRollPosition(scrollST ? scrollST.progress : 0);
          },
        });
      }

      // Pointer interactive tilt
      if (!prefersReduced && window.matchMedia("(hover: hover)").matches) {
        let centerX = 0;
        let centerY = 0;
        let isPointerTracking = true;
        let isVisible = true;

        const updateCenter = () => {
          isPointerTracking = true;
        };

        const onPointerMove = (e: MouseEvent) => {
          if (!viewerInstance || !isVisible) return;
          if (isPointerTracking) {
            const rect = piRoll.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;
            isPointerTracking = false;
          }
          const radius = 0.5 * Math.min(window.innerWidth, window.innerHeight) * 0.42;
          viewerInstance.point((e.clientX - centerX) / radius, (e.clientY - centerY) / radius);
        };

        const resetPoint = () => viewerInstance?.point(1, 0);

        window.addEventListener("pointermove", onPointerMove, {
          signal: abortCtrl.signal,
          passive: true,
        });
        document.addEventListener("pointerleave", resetPoint, { signal: abortCtrl.signal });
        window.addEventListener("blur", resetPoint, { signal: abortCtrl.signal });
        window.addEventListener("scroll", updateCenter, { signal: abortCtrl.signal, passive: true });
        window.addEventListener("resize", updateCenter, { signal: abortCtrl.signal, passive: true });

        const io = new IntersectionObserver(([entry]) => {
          isVisible = entry.isIntersecting;
          if (!isVisible) resetPoint();
        });
        io.observe(piRoll);
      }

      createTapeViewer(
        piRollIn,
        [product.model],
        STAGE_LIGHT,
        FINISH,
        { clarity: product.clarity || 0, ...STAGE_FILM }
      )
        .then((viewer: any) => {
          if (isDisposed) {
            viewer.dispose();
            return;
          }
          viewerInstance = viewer;
          viewer.show(product.model);
          viewer.spin(0);
          viewer.home(1);
          viewer.point(1, 0);
          updateRollPosition(scrollST ? scrollST.progress : 0);
          scrollST?.refresh();
        })
        .catch(() => {
          if (fallbackImg) fallbackImg.style.visibility = "visible";
          if (targetFallbackImg) targetFallbackImg.style.visibility = "visible";
        });
    }

    const cleanup = () => {
      isDisposed = true;
      abortCtrl.abort();
      unsubSweeping?.();
      unsubRevealed?.();
      rollPopTimer?.kill();
      rollPopTween?.kill();
      textTl?.kill();
      backTrigger?.kill();
      backTween?.kill();
      scrollST?.kill(true);
      viewerInstance?.dispose();
      viewerInstance = null;
      if (fallbackImg) fallbackImg.style.visibility = "";
      if (piRoll) gsap.set(piRoll, { clearProps: "transform" });
      if (piRollIn) gsap.set(piRollIn, { clearProps: "transform" });
      topImgs.forEach((img) => img.style.removeProperty("mask-position"));
      bottomImgs.forEach((img) => gsap.set(img, { clearProps: "transform" }));
      if (piBack) gsap.set(piBack, { clearProps: "transform,transformOrigin,opacity,visibility" });
    };

    cleanupRef.current = cleanup;
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [product.model, product.clarity]);

  const styleObj = parseStyleString(product.introStyleStr);

  return (
    <section
      ref={sectionRef}
      className="product-intro"
      data-model={product.model}
      data-clarity={product.clarity}
      style={styleObj}
    >
      <div className="pi-sheet">
        <div className="arc-foot" data-paper="true" aria-hidden="true" />
        <h1 className="sr-only">{product.title}</h1>
        <Link className="subhead pi-back" href="/products">
          OUR FAMILY
        </Link>

        {/* Top title ("THE") */}
        <div className="top-title">
          <img src="/assets/middle-T.webp" alt="" draggable={false} />
          <img src="/assets/middle-H.webp" alt="" draggable={false} />
          <img src="/assets/middle-E.webp" alt="" draggable={false} />
        </div>

        {/* 3D Tape Roll Stage */}
        <div className="pi-roll">
          <div className="pi-roll-in">
            <img
              src={product.cardImg}
              alt={product.productName || product.title}
              draggable={false}
            />
          </div>
        </div>

        {/* Bottom title glyphs ("FIXER", "CREATIVE", etc.) */}
        <div className="bottom-title" data-word={product.word}>
          {product.glyphs.map((src, i) => (
            <span key={i} className="glyph">
              <img src={src} alt="" draggable={false} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
