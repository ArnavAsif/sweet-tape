"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
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

interface SiblingsSectionProps {
  product: ProductData;
}

export default function SiblingsSection({ product }: SiblingsSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [activeIdx, setActiveIdx] = useState<number>(0);

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

    const chars = Array.from(section.querySelectorAll<HTMLElement>(".siblings-title .char"));
    const cards = Array.from(section.querySelectorAll<HTMLElement>(".siblings-card"));

    let animTl: gsap.core.Timeline | null = null;
    let st: ScrollTrigger | null = null;

    if (prefersReduced) {
      section.dataset.reveal = "live";
    } else {
      animTl = gsap.timeline({ paused: true });

      if (chars.length) {
        animTl.fromTo(
          chars,
          { yPercent: 130 },
          {
            yPercent: 0,
            duration: 0.6,
            stagger: 0.03,
            ease: "power3.out",
          },
          0
        );
      }

      if (cards.length) {
        animTl.fromTo(
          cards,
          { autoAlpha: 0, yPercent: 25, scale: 0.9 },
          {
            autoAlpha: 1,
            yPercent: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: "back.out(1.6)",
          },
          0.1
        );
      }

      st = ScrollTrigger.create({
        trigger: section,
        start: "top 75%",
        once: true,
        onEnter: () => {
          section.dataset.reveal = "live";
          animTl?.play();
        },
      });

      if (st.progress > 0) {
        section.dataset.reveal = "live";
        animTl?.play();
      }

      animTl.eventCallback("onComplete", () => {
        section.dataset.reveal = "live";
        gsap.set(chars, { clearProps: "transform" });
      });
    }

    const cleanup = () => {
      st?.kill();
      animTl?.kill();
      delete section.dataset.reveal;
      gsap.set([...chars, ...cards], { clearProps: "all" });
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

  const handleCardHover = (idx: number) => {
    if (idx !== activeIdx) {
      setActiveIdx(idx);
      playOnce(SOUNDS.PICK_HOVER);
    }
  };

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
              const isRaised = idx === activeIdx;

              return (
                <div
                  key={idx}
                  className="siblings-card"
                  data-colours={sib.dots.length > 0 ? "" : undefined}
                  style={{
                    ...cardStyleObj,
                    "--sib-raised": isRaised ? 1 : 0,
                  } as React.CSSProperties}
                  onMouseEnter={() => handleCardHover(idx)}
                  onClick={() => handleCardHover(idx)}
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
