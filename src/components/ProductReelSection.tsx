"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initHandNote } from "@/lib/aboutAnimations";
import { initGiantParallax } from "@/lib/giantParallax";
import productSectionsData from "@/data/productSections.json";

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

interface ProductReelSectionProps {
  slug: string;
}

export default function ProductReelSection({ slug }: ProductReelSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const sectionData = (productSectionsData as any)[slug]?.productReel;

  useIsomorphicLayoutEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !sectionData) return;

    gsap.registerPlugin(ScrollTrigger);

    const canvas = section.querySelector<HTMLElement>(".reel-canvas");
    const wrapper = section.querySelector<HTMLElement>(".wrapper");
    if (!canvas || !wrapper) return;

    section.dataset.reveal = "live";

    const cleanupHand = initHandNote(section);

    // Auto-crop badge into ellipse
    const badge = canvas.querySelector<HTMLImageElement>(".reel-badge");
    const cropBadge = () => {
      if (!badge || !badge.complete || !badge.naturalWidth) return;
      try {
        const c = document.createElement("canvas");
        c.width = c.height = 128;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(badge, 0, 0, 128, 128);
        const { data } = ctx.getImageData(0, 0, 128, 128);
        let minX = 128,
          maxX = -1,
          minY = 128,
          maxY = -1;
        for (let y = 0; y < 128; y++) {
          for (let x = 0; x < 128; x++) {
            if (data[(128 * y + x) * 4 + 3] > 200) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX >= 0) {
          const pct = (val: number) => `${((val / 128) * 100).toFixed(2)}%`;
          badge.style.clipPath = `ellipse(${pct((maxX - minX + 1) / 2)} ${pct(
            (maxY - minY + 1) / 2
          )} at ${pct((minX + maxX + 1) / 2)} ${pct((minY + maxY + 1) / 2)})`;
        }
      } catch {}
    };

    if (badge) {
      if (badge.complete && badge.naturalWidth) cropBadge();
      else badge.addEventListener("load", cropBadge, { once: true });
    }

    const cueTargets = Array.from(section.querySelectorAll<HTMLElement>("[data-reel-cue]"));
    const playedCues = new Set<HTMLElement>();
    const cueTimelines: gsap.core.Timeline[] = [];

    const playCue = (el: HTMLElement) => {
      if (playedCues.has(el)) return;
      playedCues.add(el);

      const tl = gsap.timeline();
      cueTimelines.push(tl);

      if (el.classList.contains("reel-claim")) {
        const chars = Array.from(el.querySelectorAll<HTMLElement>(".char"));
        if (chars.length) {
          tl.fromTo(
            shuffle(chars),
            { yPercent: 130 },
            { yPercent: 0, duration: 0.6, stagger: 0.008, ease: "power3.out" }
          );
        }
      } else if (el.classList.contains("reel-kraft")) {
        const peels = Array.from(el.querySelectorAll<HTMLElement>(".peel"));
        peels.forEach((peel, pIdx) => {
          const state = { p: 0 };
          tl.to(
            state,
            {
              p: 1,
              duration: 0.55,
              ease: "sine.inOut",
              onUpdate: () => peel.style.setProperty("--peel", String(state.p)),
            },
            pIdx * 0.1
          );
        });
      } else if (el.classList.contains("reel-badge")) {
        tl.fromTo(
          el,
          { autoAlpha: 0, scale: 0.8, rotation: -15 },
          { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.5)" }
        );
      }
    };

    // Initialize cue elements
    cueTargets.forEach((el) => {
      if (el.classList.contains("reel-claim")) {
        const chars = Array.from(el.querySelectorAll<HTMLElement>(".char"));
        gsap.set(chars, { yPercent: 130 });
      } else if (el.classList.contains("reel-kraft")) {
        const peels = Array.from(el.querySelectorAll<HTMLElement>(".peel"));
        peels.forEach((p) => p.style.setProperty("--peel", "0"));
      } else {
        gsap.set(el, { autoAlpha: 0 });
      }
    });

    const isMobile = window.matchMedia("(max-width: 743px)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      cueTargets.forEach((el) => playCue(el));
      return () => {
        cleanupHand();
      };
    }

    if (isMobile) {
      const mobTriggers = cueTargets
        .filter((el) => el.offsetParent !== null)
        .map((el) =>
          ScrollTrigger.create({
            trigger: el,
            start: "top 82%",
            once: true,
            onEnter: () => playCue(el),
          })
        );
      return () => {
        cleanupHand();
        mobTriggers.forEach((st) => st.kill(true));
        cueTimelines.forEach((tl) => tl.kill());
      };
    }

    const canvasChildren = Array.from(canvas.querySelectorAll<HTMLElement>(".reel-canvas > *"));
    const getTravel = () => {
      let minLeft = Infinity;
      let maxRight = 0;
      for (const el of canvasChildren) {
        minLeft = Math.min(minLeft, el.offsetLeft);
        maxRight = Math.max(maxRight, el.offsetLeft + el.offsetWidth);
      }
      return Number.isFinite(minLeft) ? Math.max(0, maxRight + minLeft - window.innerWidth) : 0;
    };

    const parallax = initGiantParallax(section, {
      canvas: ".reel-canvas",
      layers: ".reel-shot, .reel-badge, .reel-kraft",
      turn: ".reel-badge, .reel-kraft",
    });

    const onUpdateParallax = () => {
      parallax.update(Number(gsap.getProperty(canvas, "x")) || 0);
    };

    const reelTl = gsap.timeline();
    reelTl.to(canvas, {
      x: () => -getTravel(),
      duration: 1,
      ease: "none",
    });

    const travelDist = getTravel();
    const getElementOffset = (el: HTMLElement) => {
      let off = 0;
      let curr: HTMLElement | null = el;
      while (curr && curr !== canvas) {
        off += curr.offsetLeft;
        curr = curr.offsetParent as HTMLElement | null;
      }
      return off;
    };

    const initialCues: HTMLElement[] = [];
    cueTargets.forEach((el) => {
      const cueRatio = travelDist > 0 ? (getElementOffset(el) - 0.86 * window.innerWidth) / travelDist : 0;
      if (cueRatio <= 0) {
        initialCues.push(el);
      } else {
        reelTl.call(() => playCue(el), undefined, Math.min(cueRatio, 0.999));
      }
    });

    const mainTrigger = ScrollTrigger.create({
      trigger: wrapper,
      start: "top top",
      end: () => `+=${Math.round(getTravel())}`,
      pin: wrapper,
      pinSpacing: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      animation: reelTl,
      onUpdate: onUpdateParallax,
      onRefresh: () => {
        parallax.measure();
        onUpdateParallax();
      },
    });

    const initTrigger = initialCues.length
      ? ScrollTrigger.create({
          trigger: section,
          start: "top 70%",
          once: true,
          onEnter: () => initialCues.forEach((el) => playCue(el)),
        })
      : null;

    const cleanup = () => {
      cleanupHand();
      mainTrigger.kill(true);
      initTrigger?.kill(true);
      reelTl.kill();
      cueTimelines.forEach((tl) => tl.kill());
      parallax.destroy();
      gsap.set(canvas, { clearProps: "transform" });
      cueTargets.forEach((el) => {
        if (el.classList.contains("reel-claim")) {
          const chars = Array.from(el.querySelectorAll<HTMLElement>(".char"));
          gsap.set(chars, { clearProps: "transform" });
        } else if (el.classList.contains("reel-kraft")) {
          const peels = Array.from(el.querySelectorAll<HTMLElement>(".peel"));
          peels.forEach((p) => p.style.removeProperty("--peel"));
        } else {
          gsap.set(el, { clearProps: "opacity,visibility,transform" });
        }
      });
    };

    cleanupRef.current = cleanup;
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [sectionData]);

  if (!sectionData || !sectionData.shots?.length) return null;

  const styleObj = parseStyleString(sectionData.style);

  return (
    <section ref={sectionRef} className="product-reel" style={styleObj}>
      <noscript>
        <style>{`.product-reel .char { transform: none }\n.product-reel .reel-badge { opacity: 1; visibility: visible }`}</style>
      </noscript>

      <div className="wrapper">
        <div className="reel-canvas">
          {/* 1. Open shot */}
          <div className="reel-shot reel-shot--open">
            <img className="reel-shot-img" src={sectionData.shots[0]} alt="" draggable={false} />
          </div>

          {/* 2. Badge with data-reel-cue */}
          <img
            className="reel-badge"
            src={sectionData.badgeImg}
            alt=""
            data-reel-cue="true"
            draggable={false}
          />

          {/* 3. Hand note */}
          <div className="hand-note reel-note">
            <span className="sr-only">{sectionData.noteLines?.join(" ")}</span>
            <div className="hand-ink" aria-hidden="true">
              <svg className="hand-rule hand-rule--x" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M 0 3 C 30 8 65 8 100 1" />
              </svg>
              <svg className="hand-rule hand-rule--y" viewBox="0 0 10 100" preserveAspectRatio="none">
                <path d="M 6 0 C 2 33 3 70 6 100" />
              </svg>
              {sectionData.noteLines?.map((line: string, idx: number) => (
                <span key={idx} className="hand-line">
                  {line}
                </span>
              ))}
            </div>
          </div>

          {/* 4. Claim with data-reel-cue */}
          <h2 className="reel-claim" aria-label={sectionData.claim} data-reel-cue="true">
            {sectionData.claimLines?.map((line: string, lIdx: number) => (
              <span key={lIdx} className="reel-line" aria-hidden="true">
                {line.split("").map((c: string, cIdx: number) => (
                  <span key={cIdx} className="clip" style={{ "--i": cIdx } as React.CSSProperties}>
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
            ))}
          </h2>

          {/* 5. Kraft peel tape strips with data-reel-cue */}
          <div
            className="reel-kraft"
            aria-hidden="true"
            data-reel-cue="true"
            style={{ "--strip-blend": "normal" } as React.CSSProperties}
          >
            <span className="reel-kraft-strip reel-kraft-strip--1">
              <span
                className="peel reel-kraft-tape"
                style={
                  {
                    "--peel-w": "var(--reel-tape-w)",
                    "--peel-h": "var(--reel-tape-h)",
                    "--peel-from": "calc(var(--peel-edge) + 0.5 * var(--peel-span))",
                    "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
                    "--peel-dir": "0deg",
                    "--peel-back": "url(#peel-back-black)",
                  } as React.CSSProperties
                }
                data-peel="manual"
              >
                <span className="peel-face">
                  <span className="peel-turn">
                    <img src={sectionData.tapeImg} alt="" draggable={false} />
                  </span>
                </span>
                <span className="peel-flap" aria-hidden="true">
                  <span className="peel-turn">
                    <img src={sectionData.tapeImg} alt="" draggable={false} />
                  </span>
                </span>
              </span>
            </span>

            <span className="reel-kraft-strip reel-kraft-strip--2">
              <span
                className="peel reel-kraft-tape"
                style={
                  {
                    "--peel-w": "var(--reel-tape-w)",
                    "--peel-h": "var(--reel-tape-h)",
                    "--peel-from": "calc(var(--peel-edge) + 0.5 * var(--peel-span))",
                    "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
                    "--peel-dir": "0deg",
                    "--peel-back": "url(#peel-back-black)",
                  } as React.CSSProperties
                }
                data-peel="manual"
              >
                <span className="peel-face">
                  <span className="peel-turn">
                    <img src={sectionData.tapeImg} alt="" draggable={false} />
                  </span>
                </span>
                <span className="peel-flap" aria-hidden="true">
                  <span className="peel-turn">
                    <img src={sectionData.tapeImg} alt="" draggable={false} />
                  </span>
                </span>
              </span>
            </span>
          </div>

          {/* 6. Remaining shots (1, 2, 3) */}
          {sectionData.shots.slice(1).map((shot: string, sIdx: number) => (
            <div key={sIdx} className={`reel-shot reel-shot--${sIdx + 1}`}>
              <img className="reel-shot-img" src={shot} alt="" draggable={false} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
