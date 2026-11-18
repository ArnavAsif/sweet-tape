"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { playOnce, SOUNDS } from "@/lib/sounds";
import type { ProductData } from "@/data/products";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const NEXT_CONFIG = {
  START: "top 75%",
  PANEL_RISE: "7vw",
  PANEL_DURATION: 0.9,
  PANEL_EASE: "power3.out",
  TEXT_AT: 0.18,
  STAGGER: 0.03,
  CHIP_GAP: 0.28,
  ROLL_AT: 0.42,
  ROLL_TRAVEL: 0.4767,
  HOVER_SCALE: 1.15,
  HOVER_TILT: -5,
  HOVER_DURATION: 0.45,
  HOVER_EASE: "power3.out",
};

interface NextUpProps {
  product: ProductData;
}

export default function NextUpSection({ product }: NextUpProps) {
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

    const wrapper = section.querySelector<HTMLElement>(".wrapper");
    const chars = Array.from(section.querySelectorAll<HTMLElement>(".char"));
    const subhead = section.querySelector<HTMLElement>(".subhead");
    const bottomRoll = section.querySelector<HTMLElement>(".bottom-roll");

    if (!wrapper && !chars.length && !subhead && !bottomRoll) return;

    if (prefersReduced) {
      section.dataset.reveal = "live";
      return;
    }

    const animTl = gsap.timeline({ paused: true });

    if (wrapper) {
      animTl.fromTo(
        wrapper,
        { y: NEXT_CONFIG.PANEL_RISE },
        { y: 0, duration: NEXT_CONFIG.PANEL_DURATION, ease: NEXT_CONFIG.PANEL_EASE },
        0
      );
    }

    if (chars.length) {
      animTl.fromTo(
        shuffle(chars),
        { yPercent: 130 },
        { yPercent: 0, duration: 0.6, stagger: NEXT_CONFIG.STAGGER, ease: "power3.out" },
        NEXT_CONFIG.TEXT_AT
      );
    }

    if (subhead) {
      animTl.fromTo(
        subhead,
        {
          autoAlpha: 0,
          rotateY: -100,
          transformPerspective: 420,
          transformOrigin: "50% 50%",
        },
        { autoAlpha: 1, rotateY: 0, duration: 0.85, ease: "back.out(1.4)" },
        NEXT_CONFIG.TEXT_AT + NEXT_CONFIG.CHIP_GAP
      );
    }

    if (bottomRoll) {
      animTl.fromTo(
        bottomRoll,
        { y: () => bottomRoll.offsetWidth * NEXT_CONFIG.ROLL_TRAVEL, scale: 0.82 },
        { y: 0, scale: 1, duration: 1.3, ease: "back.out(1.5)" },
        NEXT_CONFIG.ROLL_AT
      );
    }

    const canHover = window.matchMedia("(hover: hover)").matches;
    const isTabletTouch = !canHover && window.matchMedia("(min-width: 744px)").matches;
    const canTilt = wrapper && bottomRoll && (canHover || isTabletTouch);

    let baseRot = 0;
    const tiltTween = canTilt
      ? (scale: number, rot: number) =>
          gsap.to(bottomRoll, {
            scale,
            rotation: rot,
            duration: NEXT_CONFIG.HOVER_DURATION,
            ease: NEXT_CONFIG.HOVER_EASE,
            overwrite: "auto",
          })
      : null;

    const onEnterTilt = () => tiltTween?.(NEXT_CONFIG.HOVER_SCALE, baseRot + NEXT_CONFIG.HOVER_TILT);
    const onLeaveTilt = () => tiltTween?.(1, baseRot);

    const onSoundHover = () => playOnce(SOUNDS.NEXT_HOVER);

    if (canTilt) {
      animTl.eventCallback("onComplete", () => {
        baseRot = Number(gsap.getProperty(bottomRoll, "rotation")) || 0;
        if (isTabletTouch) {
          wrapper.addEventListener("pointerdown", onEnterTilt);
          wrapper.addEventListener("pointerup", onLeaveTilt);
          wrapper.addEventListener("pointercancel", onLeaveTilt);
          return;
        }
        wrapper.addEventListener("pointerenter", onEnterTilt);
        wrapper.addEventListener("pointerleave", onLeaveTilt);
        if (wrapper.matches(":hover")) onEnterTilt();
      });
    }

    wrapper?.addEventListener("mouseenter", onSoundHover);

    const st = ScrollTrigger.create({
      trigger: section,
      start: NEXT_CONFIG.START,
      once: true,
      onEnter: () => {
        section.dataset.reveal = "live";
        animTl.play();
      },
    });

    if (st.progress > 0) {
      section.dataset.reveal = "live";
      animTl.play();
    }

    animTl.eventCallback("onComplete", () => {
      section.dataset.reveal = "live";
      gsap.set(chars, { clearProps: "transform" });
    });

    const cleanup = () => {
      st.kill();
      animTl.kill();
      if (canTilt) {
        wrapper.removeEventListener("pointerenter", onEnterTilt);
        wrapper.removeEventListener("pointerleave", onLeaveTilt);
        wrapper.removeEventListener("pointerdown", onEnterTilt);
        wrapper.removeEventListener("pointerup", onLeaveTilt);
        wrapper.removeEventListener("pointercancel", onLeaveTilt);
        gsap.killTweensOf(bottomRoll);
      }
      wrapper?.removeEventListener("mouseenter", onSoundHover);
      delete section.dataset.reveal;
      if (wrapper) gsap.set(wrapper, { clearProps: "transform" });
      if (chars.length) gsap.set(chars, { clearProps: "transform" });
      if (subhead) gsap.set(subhead, { clearProps: "transform,opacity,visibility" });
      if (bottomRoll) gsap.set(bottomRoll, { clearProps: "transform,opacity,visibility" });
    };

    cleanupRef.current = cleanup;
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  if (!product.nextHref) return null;

  const styleObj = parseStyleString(product.nextStyle);
  const nextRollImg = product.nextRollImg || "/assets/sibling-opp-normal.webp";

  return (
    <section ref={sectionRef} className="next-up" style={styleObj}>
      <noscript>
        <style>{`.next-up .char { transform: none }\n.next-up .subhead { opacity: 1; visibility: visible }`}</style>
      </noscript>

      <Link
        className="wrapper"
        aria-label={`Next up: ${product.nextLabel || "Next"}`}
        href={product.nextHref}
      >
        <div className="top">
          <h5 className="subhead">MEET THE NEXT FAMILY</h5>
          <h2 className="h1-v2" aria-hidden="true">
            <span className="line">
              {"NEXT\u00A0UP".split("").map((c, i) => (
                <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                  <span className="char">{c === " " ? "\u00A0" : c}</span>
                </span>
              ))}
            </span>
          </h2>
        </div>
        <img className="bottom-roll" src={nextRollImg} alt="" draggable={false} />
      </Link>
    </section>
  );
}
