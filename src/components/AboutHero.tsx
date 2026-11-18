"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { whenRevealed } from "@/lib/loader";
import { playOnce, SOUNDS } from "@/lib/sounds";
import { initHandNote, initPress } from "@/lib/aboutAnimations";

const F = 22.222;
const D = -14;
const P = -12;
const H = { DELAY: 1.1, RISE: 1, FALL: 0.25 };
const EASE_SUBTITLE = "power1.inOut";

function vwToPx(vw: number): number {
  return (window.innerWidth * vw) / 100;
}

function getSpaceRun(el: HTMLElement): number {
  const val = Number.parseFloat(getComputedStyle(el).getPropertyValue("--space-run"));
  return Number.isFinite(val) ? Math.max(0, val) : 0.38;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function AboutHero() {
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = heroRef.current;
    if (!section) return;

    // 1. Title Character Tumble Reveal
    const initTitle = (container: HTMLElement) => {
      const chars = Array.from(container.querySelectorAll<HTMLElement>(".title .char"));
      if (!chars.length) return () => {};

      gsap.set(chars, { y: 0, yPercent: 130 });
      container.dataset.reveal = "live";

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(chars, { clearProps: "transform" });
        return () => {};
      }

      const tl = gsap.fromTo(
        shuffle(chars),
        { y: 0, yPercent: 130 },
        { yPercent: 0, duration: 0.85, stagger: 0.045, ease: "power3.out", paused: true }
      );

      let delayedCall: gsap.core.Tween | null = null;
      const unsub = whenRevealed(() => {
        delayedCall = gsap.delayedCall(0.3, () => tl.play());
      });

      return () => {
        unsub();
        delayedCall?.kill();
        tl.kill();
        gsap.set(chars, { clearProps: "transform" });
      };
    };

    // 2. Hand & Subtitle (ONE SHARED BELIEF + Jack in Box Hand)
    const initHandAndSubtitle = (container: HTMLElement) => {
      const halves = Array.from(container.querySelectorAll<HTMLElement>(".h4 .half"));
      const hand = container.querySelector<HTMLElement>("#hand");
      if (halves.length !== 2 || !hand) return () => {};

      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Desktop scrub
      function setupDesktopScrub() {
        let centerX = 0;
        let halfEdges = [0, 0];

        function measure() {
          gsap.set(halves, { x: 0 });
          const rect = container.getBoundingClientRect();
          centerX = rect.left + rect.width / 2;
          halfEdges = [
            halves[0].getBoundingClientRect().right,
            halves[1].getBoundingClientRect().left,
          ];
        }

        const calcTargetX = (idx: number) => {
          const rawGap = Number.parseFloat(getComputedStyle(container).getPropertyValue("--space-gap"));
          const gapVw = Number.isFinite(rawGap) ? rawGap : 25.069;
          const halfGap = vwToPx(gapVw) / 2;
          return centerX + (idx === 0 ? -halfGap : halfGap) - halfEdges[idx];
        };

        measure();

        if (prefersReduced) {
          gsap.set(halves[0], { x: calcTargetX(0) });
          gsap.set(halves[1], { x: calcTargetX(1) });
          gsap.set(hand, { xPercent: -50, x: 0, y: () => vwToPx(P) });
          return () => {
            gsap.set([...halves, hand], { clearProps: "transform" });
          };
        }

        gsap.registerPlugin(ScrollTrigger);

        const tl = gsap.timeline({ paused: true });
        tl.fromTo(halves[0], { x: 0 }, { x: () => calcTargetX(0), duration: 0.85, ease: EASE_SUBTITLE }, 0);
        tl.fromTo(halves[1], { x: 0 }, { x: () => calcTargetX(1), duration: 0.85, ease: EASE_SUBTITLE }, 0);
        tl.fromTo(hand, { xPercent: -50, x: 0, y: () => vwToPx(F) }, { y: () => vwToPx(D), duration: 0.8, ease: "power2.out" }, 0);
        tl.to(hand, { y: () => vwToPx(P), duration: 0.2, ease: "power1.inOut" }, 0.8);
        tl.call(() => {
          if (st.direction > 0) {
            playOnce(SOUNDS.HAND_OUT);
          }
        }, [], 0.05);

        const st = ScrollTrigger.create({
          trigger: container,
          start: "top top",
          end: () => "+=" + Math.round(window.innerHeight * getSpaceRun(container)),
          scrub: 1.3,
          onRefreshInit: measure,
          invalidateOnRefresh: true,
          animation: tl,
        });

        return () => {
          st.kill();
          tl.kill();
          gsap.set([...halves, hand], { clearProps: "transform" });
        };
      }

      // Mobile reveal
      function setupMobileReveal() {
        if (prefersReduced) {
          gsap.set(hand, { xPercent: -50, x: 0, y: () => vwToPx(P) });
          return () => {
            gsap.set(hand, { clearProps: "transform" });
          };
        }

        const { DELAY, RISE, FALL } = H;
        const tl = gsap.timeline({ paused: true });
        tl.fromTo(hand, { xPercent: -50, x: 0, y: () => vwToPx(F) }, { y: () => vwToPx(D), duration: RISE, ease: "power2.out" }, DELAY);
        tl.to(hand, { y: () => vwToPx(P), duration: FALL, ease: "power1.inOut" }, DELAY + RISE);
        tl.call(() => playOnce(SOUNDS.HAND_OUT), [], DELAY);

        const unsub = whenRevealed(() => tl.play(0));

        return () => {
          unsub();
          tl.kill();
          gsap.set(hand, { clearProps: "transform" });
        };
      }

      let isDesktop = getSpaceRun(container) > 0;
      let activeCleanup = isDesktop ? setupDesktopScrub() : setupMobileReveal();

      const handleResize = () => {
        const nextIsDesktop = getSpaceRun(container) > 0;
        if (nextIsDesktop !== isDesktop) {
          isDesktop = nextIsDesktop;
          activeCleanup();
          activeCleanup = isDesktop ? setupDesktopScrub() : setupMobileReveal();
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        activeCleanup();
      };
    };

    const cleanupTitle = initTitle(section);
    const cleanupHand = initHandAndSubtitle(section);

    let cleanupPress: (() => void) | null = null;
    const unsubPress = whenRevealed(() => {
      cleanupPress = initPress(section, [".about-tape"]);
    });

    let cleanupNote: (() => void) | null = null;
    const unsubNote = whenRevealed(() => {
      cleanupNote = initHandNote(section);
      section.dataset.note = "live";
    });

    return () => {
      unsubNote();
      cleanupNote?.();
      cleanupTitle();
      cleanupHand();
      unsubPress();
      cleanupPress?.();
    };
  }, []);

  return (
    <section ref={heroRef} className="about-open about-hero">
      <noscript>
        <style>{`.about-hero .char { transform: none }`}</style>
      </noscript>
      <div className="arc-foot" aria-hidden="true" />
      <div className="title">
        <div className="warped-text">
          <h1 className="h1" aria-label="THREE GENERATION">
            <span className="line" data-line="three" style={{ "--letters": 5 } as React.CSSProperties}>
              {"THREE".split("").map((c, i) => (
                <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                  <span className="char">{c}</span>
                </span>
              ))}
            </span>
            <span className="line" data-line="generation" style={{ "--letters": 10 } as React.CSSProperties}>
              {"GENERATION".split("").map((c, i) => (
                <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                  <span className="char">{c}</span>
                </span>
              ))}
            </span>
          </h1>
        </div>
        <h2 className="h4 space-out" aria-label="ONE SHARED BELIEF">
          <span className="half" aria-hidden="true">
            {"ONE\u00A0SHARED".split("").map((c, i) => (
              <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                <span className="char">{c === " " ? "\u00A0" : c}</span>
              </span>
            ))}
          </span>
          <span className="half" aria-hidden="true">
            {"BELIEF".split("").map((c, i) => (
              <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                <span className="char">{c}</span>
              </span>
            ))}
          </span>
        </h2>
      </div>
      <div className="hand-note about-note">
        <span className="sr-only">
          we’ve believed that even the simplest products deserve thoughtful design.
        </span>
        <div className="hand-ink" aria-hidden="true">
          <svg className="hand-rule hand-rule--x" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M 0 3 C 30 8 65 8 100 1" />
          </svg>
          <svg className="hand-rule hand-rule--y" viewBox="0 0 10 100" preserveAspectRatio="none">
            <path d="M 6 0 C 2 33 3 70 6 100" />
          </svg>
          <span className="hand-line">we’ve believed that</span>
          <span className="hand-line">even the simplest</span>
          <span className="hand-line">products deserve</span>
          <span className="hand-line">thoughtful design.</span>
        </div>
      </div>
      <div className="about-art about-logo">
        <img src="/api/media/file/about-logo.webp" alt="" draggable={false} />
        <span
          className="peel about-tape"
          style={
            {
              "--peel-w": "8.8vw",
              "--peel-h": "4.167vw",
              "--peel-from": "calc(var(--peel-edge) + 0.34 * var(--peel-span))",
              "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
              "--peel-dir": "90deg",
              "--peel-back": "url(#peel-back-masking)",
              "--peel": 1,
            } as React.CSSProperties
          }
          data-peel="manual"
          data-tape="logo"
        >
          <span className="peel-face">
            <span className="peel-turn">
              <img src="/assets/tape-on-lemon.webp" alt="" draggable={false} />
            </span>
          </span>
          <span className="peel-flap" aria-hidden="true">
            <span className="peel-turn">
              <img src="/assets/tape-on-lemon.webp" alt="" draggable={false} />
            </span>
          </span>
        </span>
      </div>
      <div className="about-art about-clipping">
        <img src="/api/media/file/newspaper.webp" alt="" draggable={false} />
        <span
          className="peel about-tape"
          style={
            {
              "--peel-w": "11vw",
              "--peel-h": "5.208vw",
              "--peel-from": "calc(var(--peel-edge) + 0.34 * var(--peel-span))",
              "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
              "--peel-dir": "90deg",
              "--peel-back": "url(#peel-back-masking)",
              "--peel": 1,
            } as React.CSSProperties
          }
          data-peel="manual"
          data-tape="side"
        >
          <span className="peel-face">
            <span className="peel-turn">
              <img src="/assets/tape-on-lemon.webp" alt="" draggable={false} />
            </span>
          </span>
          <span className="peel-flap" aria-hidden="true">
            <span className="peel-turn">
              <img src="/assets/tape-on-lemon.webp" alt="" draggable={false} />
            </span>
          </span>
        </span>
        <span
          className="peel about-tape"
          style={
            {
              "--peel-w": "11vw",
              "--peel-h": "5.208vw",
              "--peel-from": "calc(var(--peel-edge) + 0.34 * var(--peel-span))",
              "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
              "--peel-dir": "90deg",
              "--peel-back": "url(#peel-back-masking)",
              "--peel": 1,
            } as React.CSSProperties
          }
          data-peel="manual"
          data-tape="foot"
        >
          <span className="peel-face">
            <span className="peel-turn">
              <img src="/assets/tape-on-lemon.webp" alt="" draggable={false} />
            </span>
          </span>
          <span className="peel-flap" aria-hidden="true">
            <span className="peel-turn">
              <img src="/assets/tape-on-lemon.webp" alt="" draggable={false} />
            </span>
          </span>
        </span>
      </div>
      <div className="about-art about-shop">
        <img src="/api/media/file/shophouse.webp" alt="" draggable={false} />
      </div>
      <span
        className="peel about-art about-tape about-tape-clear"
        style={
          {
            "--peel-w": "12.3vw",
            "--peel-h": "8.047vw",
            "--peel-from": "calc(var(--peel-edge) + 0.34 * var(--peel-span))",
            "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
            "--peel-dir": "90deg",
            "--peel-back": "url(#peel-back-clear)",
            "--peel": 1,
          } as React.CSSProperties
        }
        data-peel="manual"
        data-tape="shop"
      >
        <span className="peel-face">
          <span className="peel-turn">
            <img src="/assets/low-noise-x4-clear.png" alt="" draggable={false} />
          </span>
        </span>
        <span className="peel-flap" aria-hidden="true">
          <span className="peel-turn">
            <img src="/assets/low-noise-x4-clear.png" alt="" draggable={false} />
          </span>
        </span>
      </span>
      <img className="about-art about-strip" src="/api/media/file/mask.webp" alt="" draggable={false} />
      <div className="jack-in-box">
        <div className="wrapper">
          <img id="behind" src="/assets/box-behind.png" alt="" />
          <img id="hand" src="/assets/hand-4x-export.webp" alt="" />
          <img id="front" src="/assets/box-front.png" alt="" />
        </div>
      </div>
    </section>
  );
}
