"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initHandNote } from "@/lib/aboutAnimations";
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

interface ProductInnerInfoProps {
  product: ProductData;
}

export default function ProductInnerInfoSection({ product }: ProductInnerInfoProps) {
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

    // 1. Hand note ink drawing
    const cleanupHand = initHandNote(section);

    // 2. Peel press animation
    const peelElements = Array.from(section.querySelectorAll<HTMLElement>(".peel"));
    const peelTweens: gsap.core.Tween[] = [];
    if (!prefersReduced && peelElements.length) {
      peelElements.forEach((peel) => {
        const state = { p: 0 };
        const tw = gsap.to(state, {
          p: 1,
          duration: 0.55,
          ease: "sine.inOut",
          paused: true,
          onUpdate: () => peel.style.setProperty("--peel", String(state.p)),
        });
        peelTweens.push(tw);

        ScrollTrigger.create({
          trigger: peel,
          start: "top 80%",
          once: true,
          onEnter: () => tw.play(),
        });
      });
    }

    // 3. Story chars and Subhead reveal
    const chars = Array.from(section.querySelectorAll<HTMLElement>(".info-story .char"));
    const subhead = section.querySelector<HTMLElement>(".subhead");
    let storyTl: gsap.core.Timeline | null = null;
    let storyST: ScrollTrigger | null = null;

    if (!chars.length && !subhead) {
      section.dataset.reveal = "live";
    } else if (prefersReduced) {
      section.dataset.reveal = "live";
    } else {
      storyTl = gsap.timeline({ paused: true });

      if (chars.length) {
        storyTl.fromTo(
          shuffle(chars),
          { yPercent: 130 },
          {
            yPercent: 0,
            duration: 0.6,
            stagger: 0.008,
            ease: "power3.out",
          },
          0
        );
      }

      if (subhead) {
        storyTl.fromTo(
          subhead,
          {
            autoAlpha: 0,
            rotateY: -100,
            transformPerspective: 420,
            transformOrigin: "50% 50%",
          },
          {
            autoAlpha: 1,
            rotateY: 0,
            duration: 0.85,
            ease: "back.out(1.4)",
          },
          0.1
        );
      }

      storyST = ScrollTrigger.create({
        trigger: section,
        start: "top 70%",
        once: true,
        onEnter: () => storyTl?.play(),
      });

      if (storyST.progress > 0) {
        storyTl?.play();
      }

      storyTl.eventCallback("onComplete", () => {
        gsap.set(chars, { clearProps: "transform" });
      });
    }

    const cleanup = () => {
      cleanupHand();
      peelTweens.forEach((tw) => tw.kill());
      storyST?.kill();
      storyTl?.kill();
      delete section.dataset.reveal;
      gsap.set(chars, { clearProps: "transform" });
      if (subhead) gsap.set(subhead, { clearProps: "transform,opacity,visibility" });
      peelElements.forEach((peel) => peel.style.removeProperty("--peel"));
    };

    cleanupRef.current = cleanup;
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  const styleObj = parseStyleString(product.innerInfoStyle);
  const words = product.story ? product.story.split(" ") : [];

  return (
    <section ref={sectionRef} className="product-inner-info" style={styleObj} data-reveal="live">
      <div className="wrapper">
        <div className="left">
          {/* Photo shot with peel tape */}
          <span className="info-shot">
            <img src={product.shotImg} alt="" draggable={false} />
            <span
              className="peel reverse-peel-tape info-shot-tape"
              style={
                {
                  "--peel-w": "12.049vw",
                  "--peel-h": "4.090vw",
                  "--peel-from": "calc(var(--peel-edge) + 0.34 * var(--peel-span))",
                  "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
                  "--peel-dir": "90deg",
                  "--peel-back": "url(#peel-back-black)",
                  "--strip-blend": "normal",
                } as React.CSSProperties
              }
              data-peel="manual"
              aria-hidden="true"
            >
              <span className="peel-face">
                <span className="peel-turn">
                  <img src={product.peelImg} alt="" draggable={false} />
                </span>
              </span>
              <span className="peel-flap" aria-hidden="true">
                <span className="peel-turn">
                  <img src={product.peelImg} alt="" draggable={false} />
                </span>
              </span>
            </span>
          </span>

          {/* Target 3D Tape Slot */}
          <div className="threed-tape">
            <img src={product.cardImg} alt={product.title} draggable={false} />
          </div>

          {/* Arrow */}
          <span className="info-arrow" aria-hidden="true">
            <svg viewBox="0 0 134 54" fill="none" focusable="false">
              <path
                d="M128 3C100 4 50 22 5 47"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M5 47L27 46.6"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M5 47L17 28.7"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>

          {/* Hand note */}
          <div className="hand-note info-note">
            <span className="sr-only">{product.note.join(" ")}</span>
            <div className="hand-ink" aria-hidden="true">
              <svg className="hand-rule hand-rule--x" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M 0 3 C 30 8 65 8 100 1" />
              </svg>
              <svg className="hand-rule hand-rule--y" viewBox="0 0 10 100" preserveAspectRatio="none">
                <path d="M 6 0 C 2 33 3 70 6 100" />
              </svg>
              {product.note.map((line, idx) => (
                <span key={idx} className="hand-line">
                  {line}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="right">
          <noscript>
            <style>{`.product-inner-info .char { transform: none }\n.product-inner-info .subhead { opacity: 1; visibility: visible }`}</style>
          </noscript>

          <h5 className="subhead">ORIGIN</h5>

          <h3 className="h3 info-story" aria-label={product.story}>
            <span aria-hidden="true">
              {words.slice(0, Math.floor(words.length / 2)).map((word, wIdx) => (
                <React.Fragment key={wIdx}>
                  <span className="word">
                    {word.split("").map((c, cIdx) => (
                      <span key={cIdx} className="clip" style={{ "--i": cIdx } as React.CSSProperties}>
                        <span className="char">{c}</span>
                      </span>
                    ))}
                  </span>{" "}
                </React.Fragment>
              ))}
            </span>

            {/* Peel tape slot embedded in text */}
            <span className="info-tape-slot" aria-hidden="true" style={{ "--strip-blend": "normal" } as React.CSSProperties}>
              <span
                className="peel reverse-peel-tape info-story-tape"
                style={
                  {
                    "--peel-w": "13.984vw",
                    "--peel-h": "4.747vw",
                    "--peel-from": "calc(var(--peel-edge) + 0.34 * var(--peel-span))",
                    "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
                    "--peel-dir": "90deg",
                    "--peel-back": "url(#peel-back-black)",
                  } as React.CSSProperties
                }
                data-peel="manual"
                aria-hidden="true"
              >
                <span className="peel-face">
                  <span className="peel-turn">
                    <img src={product.peelImg} alt="" draggable={false} />
                  </span>
                </span>
                <span className="peel-flap" aria-hidden="true">
                  <span className="peel-turn">
                    <img src={product.peelImg} alt="" draggable={false} />
                  </span>
                </span>
              </span>
            </span>{" "}

            <span aria-hidden="true">
              {words.slice(Math.floor(words.length / 2), -1).map((word, wIdx) => (
                <React.Fragment key={wIdx}>
                  <span className="word">
                    {word.split("").map((c, cIdx) => (
                      <span key={cIdx} className="clip" style={{ "--i": cIdx } as React.CSSProperties}>
                        <span className="char">{c}</span>
                      </span>
                    ))}
                  </span>{" "}
                </React.Fragment>
              ))}
            </span>

            {/* Last word with underline */}
            {words.length > 0 && (
              <span className="word info-last" aria-hidden="true">
                {words[words.length - 1].split("").map((c, cIdx) => (
                  <span key={cIdx} className="clip" style={{ "--i": cIdx } as React.CSSProperties}>
                    <span className="char">{c}</span>
                  </span>
                ))}
                <span className="info-underline">
                  <svg viewBox="0 0 320 22" fill="none" focusable="false" preserveAspectRatio="none">
                    <path d="M4 9C74 3 168 5 314 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <path d="M22 17C96 12 190 14 292 15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  </svg>
                </span>
              </span>
            )}
          </h3>
        </div>
      </div>
    </section>
  );
}
