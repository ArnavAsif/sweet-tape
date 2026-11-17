"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { playOnce, SOUNDS } from "@/lib/sounds";

const CURSORS = {
  arrow: { url: "/assets/new-cursor.svg", w: 48, h: 52, hx: 11.2, hy: 12 },
  pointer: { url: "/assets/cursor-pointer.svg", w: 46.4, h: 49.6, hx: 13.3, hy: 6.3 },
  type: { url: "/assets/cursor-type.svg", w: 25.6, h: 40.8, hx: 12.8, hy: 20.4 },
};

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const el = cursorRef.current;
    if (!el) return;

    document.documentElement.classList.add("has-cursor");

    let mouseX = 0;
    let mouseY = 0;
    let currX = 0;
    let currY = 0;
    let hasMoved = false;
    let isDown = false;
    let hoveredEl: Element | null = null;
    let currentMode: "arrow" | "pointer" | "type" = "arrow";

    const setX = gsap.quickSetter(el, "x", "px");
    const setY = gsap.quickSetter(el, "y", "px");

    const applyCursorStyle = (c: typeof CURSORS.arrow) => {
      el.style.backgroundImage = `url("${c.url}")`;
      el.style.width = `${c.w}px`;
      el.style.height = `${c.h}px`;
      el.style.translate = `${-c.hx}px ${-c.hy}px`;
      el.style.transformOrigin = `${c.hx}px ${c.hy}px`;
    };

    applyCursorStyle(CURSORS.arrow);
    gsap.set(el, { autoAlpha: 0, rotation: 7 });

    const updateAppearance = () => {
      let mode: "arrow" | "pointer" | "type" = "arrow";
      if (hoveredEl) {
        if (hoveredEl.matches("input, textarea, [contenteditable]")) {
          mode = "type";
        } else {
          mode = "pointer";
        }
      }
      const scale = isDown ? 0.86 : hoveredEl ? 1.18 : 1;
      const rotation = 7 + (hoveredEl ? -8 : 0);

      if (mode !== currentMode) {
        currentMode = mode;
        applyCursorStyle(CURSORS[mode]);
      }

      gsap.to(el, {
        scale,
        rotation,
        duration: 0.28,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    const onPointerMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!hasMoved) {
        hasMoved = true;
        currX = mouseX;
        currY = mouseY;
        setX(currX);
        setY(currY);
        gsap.to(el, { autoAlpha: 1, duration: 0.2, overwrite: "auto" });
      }
    };

    const tickerUpdate = () => {
      if (!hasMoved) return;
      currX += (mouseX - currX) * 0.75;
      currY += (mouseY - currY) * 0.75;
      if (Math.abs(mouseX - currX) < 0.1 && Math.abs(mouseY - currY) < 0.1) {
        currX = mouseX;
        currY = mouseY;
      }
      setX(currX);
      setY(currY);
    };

    gsap.ticker.add(tickerUpdate);

    const onPointerOver = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest?.(
        'a[href], button, [role="button"], input, select, textarea, label, summary, [data-cursor]'
      ) ?? null;
      if (target !== hoveredEl) {
        hoveredEl = target;
        updateAppearance();
      }
    };

    const onPointerOut = (e: PointerEvent) => {
      if (!hoveredEl) return;
      const related = e.relatedTarget as Element | null;
      if (!related || !hoveredEl.contains(related)) {
        hoveredEl = null;
        updateAppearance();
      }
    };

    const onPointerDown = () => {
      isDown = true;
      updateAppearance();
    };

    const onPointerUp = () => {
      isDown = false;
      updateAppearance();
    };

    const onPointerLeave = () => {
      gsap.to(el, { autoAlpha: 0, duration: 0.2, overwrite: "auto" });
    };

    const onPointerEnter = () => {
      if (hasMoved) {
        gsap.to(el, { autoAlpha: 1, duration: 0.2, overwrite: "auto" });
      }
    };

    const onClick = (e: MouseEvent) => {
      const path = e.composedPath();
      const isSpecial = path.some(
        (node) => node instanceof Element && node.matches(".menu-tab, .menu-sound, .pl-hit")
      );
      if (!isSpecial) {
        playOnce(SOUNDS.CLICK, 0.6);
      }
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("pointerout", onPointerOut, { passive: true });
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("pointerenter", onPointerEnter);
    document.addEventListener("click", onClick);

    return () => {
      gsap.ticker.remove(tickerUpdate);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("pointerenter", onPointerEnter);
      document.removeEventListener("click", onClick);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return <div ref={cursorRef} className="cursor-arrow" aria-hidden="true" />;
}
