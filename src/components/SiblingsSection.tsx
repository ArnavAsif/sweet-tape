"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
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

interface SiblingsSectionProps {
  product: ProductData;
}

export default function SiblingsSection({ product }: SiblingsSectionProps) {
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

    const stage = section.querySelector<HTMLElement>(".siblings-stage");
    const row = section.querySelector<HTMLElement>(".siblings-row");
    const fan = section.querySelector<HTMLElement>(".siblings-fan");
    const chars = Array.from(section.querySelectorAll<HTMLElement>(".siblings-title .char"));
    const cards = Array.from(section.querySelectorAll<HTMLElement>(".siblings-card"));

    if (!chars.length && !cards.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      section.dataset.reveal = "live";
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Mobile layout (< 744px)
    if (window.matchMedia("(max-width: 743px)").matches) {
      const tweens = cards.map((card) => {
        const tilt = parseFloat(getComputedStyle(card).getPropertyValue("--sib-tilt")) || 0;
        return gsap.fromTo(
          card,
          { autoAlpha: 0, y: 0.22 * card.offsetHeight, scale: 0.82, rotation: tilt },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            rotation: tilt,
            duration: 0.8,
            ease: "back.out(1.5)",
            onStart: () => playOnce(SOUNDS.BOX_POP),
            scrollTrigger: { trigger: card, start: "top 88%", once: true },
          }
        );
      });

      cleanupRef.current = () => {
        tweens.forEach((tw) => {
          tw.scrollTrigger?.kill();
          tw.kill();
        });
        gsap.set(cards, { clearProps: "transform,opacity,visibility" });
      };
      return;
    }

    // Desktop fan calculation & timeline
    const getTilt = (card: HTMLElement) =>
      parseFloat(getComputedStyle(card).getPropertyValue("--sib-tilt")) || 0;

    const calcOffsets = () => {
      if (!row || !cards.length) return cards.map(() => 0);
      const halfW = row.clientWidth / 2;
      const offsets = cards.map(
        (_, r) => halfW - (cards[0].offsetLeft + (cards[r].offsetLeft + cards[r].offsetWidth)) / 2
      );
      offsets[offsets.length - 1] = 0;
      return offsets;
    };

    let offsets = calcOffsets();

    const calcGeometry = () => {
      const e = Math.abs(cards.length ? getTilt(cards[0]) : 0);
      const t = Math.abs(offsets[0] ?? 0);
      const maxL = (row?.clientWidth ?? 0) * 4;
      const a = e < 0.5 || !t ? maxL : t / Math.tan((e * Math.PI) / 180);
      return {
        length: a,
        origin: (cards.length ? cards[0].offsetTop + cards[0].offsetHeight / 2 : 0) + a,
      };
    };

    let geom = calcGeometry();

    const getFanRot = (idx: number) =>
      geom.length ? (180 * Math.atan((offsets[idx - 1] ?? 0) / geom.length)) / Math.PI : 0;

    let activeG = 0;

    const animateFan = (idx: number, animate?: boolean) => {
      if (fan) {
        gsap.to(fan, {
          rotation: getFanRot(idx),
          duration: 0.8 * (animate ? 1 : 0),
          ease: "elastic.out(0.6, 0.3)",
          overwrite: "auto",
        });
      }
    };

    const popCard = (idx: number) => {
      const card = cards[idx - 1];
      if (!card) return;
      gsap.set(card, { autoAlpha: 1, rotation: getTilt(card) });
      playOnce(SOUNDS.BOX_POP);
      const rise = 0.45 * card.offsetWidth;
      const scale = geom.length ? 1 - rise / geom.length : 1;
      const o = { rise, scale: Math.max(scale, 0.94) };
      gsap.fromTo(
        card,
        { y: o.rise, scale: o.scale },
        { y: 0, scale: 1, duration: 0.75, ease: "elastic.out(0.6, 0.3)", overwrite: "auto" }
      );
      activeG = idx;
      animateFan(idx, true);
    };

    const tl = gsap.timeline({ paused: true });
    cards.forEach((_, t) => {
      tl.call(popCard, [t + 1], 0.6 * t);
    });

    if (chars.length) {
      tl.fromTo(
        shuffle(chars),
        { yPercent: 130 },
        { yPercent: 0, duration: 0.6, stagger: 0.03, ease: "power3.out" },
        0.6 * cards.length + 0.18
      );
    }

    gsap.set(cards, { autoAlpha: 0 });
    if (fan) {
      gsap.set(fan, {
        transformOrigin: `50% ${Math.round(geom.origin)}px`,
        rotation: getFanRot(1),
      });
    }

    const st = ScrollTrigger.create({
      trigger: stage ?? section,
      start: "top 45%",
      onEnter: () => {
        section.dataset.reveal = "live";
        tl.play();
      },
      onRefresh: () => {
        offsets = calcOffsets();
        geom = calcGeometry();
        if (fan) gsap.set(fan, { transformOrigin: `50% ${Math.round(geom.origin)}px` });
        animateFan(activeG || 1, false);
      },
    });

    // Mobile tap support for color pill
    const abortCtrl = new AbortController();
    if (!window.matchMedia("(hover: hover)").matches) {
      const cardsColours = Array.from(
        section.querySelectorAll<HTMLElement>(".siblings-card[data-colours]")
      );
      section.addEventListener(
        "click",
        (e) => {
          const targetCard = (e.target as HTMLElement).closest<HTMLElement>(
            ".siblings-card[data-colours]"
          );
          for (const c of cardsColours) {
            if (c === targetCard && c.dataset.open === undefined) {
              c.dataset.open = "";
            } else {
              delete c.dataset.open;
            }
          }
        },
        { signal: abortCtrl.signal }
      );
    }

    const cleanup = () => {
      abortCtrl.abort();
      st.kill();
      tl.kill();
      gsap.killTweensOf(cards);
      if (fan) {
        gsap.killTweensOf(fan);
        gsap.set(fan, { clearProps: "transform,transformOrigin" });
      }
      gsap.set(chars, { clearProps: "transform" });
      gsap.set(cards, { clearProps: "transform,opacity,visibility" });
      delete section.dataset.reveal;
    };

    cleanupRef.current = cleanup;
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  if (!product.siblings || product.siblings.length === 0) {
    return null;
  }

  const styleObj = parseStyleString(product.sibStyle);

  return (
    <section ref={sectionRef} className="siblings-section" style={styleObj}>
      <div className="siblings-stage">
        <noscript>
          <style>{`.siblings-section .char { transform: none }\n.siblings-section .siblings-card { opacity: 1; visibility: visible }`}</style>
        </noscript>

        <div className="siblings-row" data-pair={product.siblings.length === 2 ? "true" : undefined}>
          <div className="siblings-fan">
            {product.siblings.map((sib, idx) => {
              const cardStyleObj = parseStyleString(sib.style);

              return (
                <div
                  key={idx}
                  className="siblings-card"
                  data-colours={sib.dots.length > 0 ? "" : undefined}
                  style={cardStyleObj}
                >
                  <img
                    className="siblings-face"
                    src={sib.img}
                    alt={sib.alt}
                    draggable={false}
                  />

                  {sib.dots.length > 0 && (
                    <span className="sib-colours">
                      <span className="sib-colours-chip">COLOURS</span>
                      {sib.dots.map((dot, dIdx) => (
                        <i
                          key={dIdx}
                          className="sib-dot"
                          style={{ background: dot }}
                          aria-hidden="true"
                        />
                      ))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <h2 className="siblings-title" aria-label="THE SIBLINGS">
            <span className="line" aria-hidden="true">
              {"THE\u00A0SIBLINGS".split("").map((c, i) => (
                <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                  <span className="char">{c === " " ? "\u00A0" : c}</span>
                </span>
              ))}
            </span>
          </h2>

          <p className="sib-hint">
            <svg className="sib-hint-arrow" viewBox="0 0 120 72" aria-hidden="true">
              <path
                d="M116 10 C 76 16, 40 26, 10 56 M23 53 10 56 13 43"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="sib-hint-text">
              <span className="sib-hint-hover">hover</span>
              <span className="sib-hint-tap">tap</span> to explore<br />
              the colours.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
