"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import HeroTape3D from "./HeroTape3D";
import StickyNote3D from "./StickyNote3D";
import { playOnce, SOUNDS } from "@/lib/sounds";
import { initPoke } from "@/lib/initPoke";
import { whenRevealed } from "@/lib/loader";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Shuffle helper for organic letter drop
    function shuffle<T>(arr: T[]): T[] {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    // 1. Initial Reveal for title chars & hero-mark
    const titleChars = Array.from(section.querySelectorAll<HTMLElement>(".title .char"));
    const heroMark = section.querySelector<HTMLElement>(".hero-mark");
    const cornerPerf = section.querySelector<HTMLElement>(".corner-perf");
    const cornerChars = Array.from(section.querySelectorAll<HTMLElement>(".corner-mark .char"));
    const allChars = Array.from(section.querySelectorAll<HTMLElement>(".char"));

    gsap.set(allChars, { y: 0, yPercent: 130 });
    section.dataset.reveal = "live";

    let unsubsRevealed: (() => void) | null = null;
    let revealTimer: gsap.core.Tween | null = null;
    let markTimer: gsap.core.Tween | null = null;
    let cornerTimer: gsap.core.Tween | null = null;
    let titleTl: gsap.core.Tween | null = null;
    let markTl: gsap.core.Tween | null = null;
    let cornerTl: gsap.core.Timeline | null = null;

    if (prefersReducedMotion) {
      gsap.set(allChars, { clearProps: "transform" });
    } else {
      titleTl = gsap.fromTo(
        shuffle(titleChars),
        { y: 0, yPercent: 130 },
        { yPercent: 0, duration: 0.6, stagger: 0.025, ease: "power3.out", paused: true }
      );

      if (heroMark) {
        const isMobile = window.matchMedia("(max-width: 743px)").matches;
        markTl = gsap.fromTo(
          heroMark,
          isMobile ? { scale: 0 } : { yPercent: -170 },
          { ...(isMobile ? { scale: 1 } : { yPercent: 0 }), duration: 0.85, ease: "back.out(1.6)", paused: true }
        );
      }

      if (cornerPerf || cornerChars.length) {
        cornerTl = gsap.timeline({ paused: true });
        if (cornerPerf) {
          cornerTl.fromTo(
            cornerPerf,
            { clipPath: "inset(0% 0% 100% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power2.out" },
            0
          );
        }
        if (cornerChars.length) {
          cornerTl.fromTo(
            shuffle(cornerChars),
            { y: 0, yPercent: 130 },
            { yPercent: 0, duration: 0.6, stagger: 0.012, ease: "power3.out" },
            0.12
          );
        }
      }

      unsubsRevealed = whenRevealed(() => {
        revealTimer = gsap.delayedCall(0.3, () => titleTl?.play());
        if (markTl) {
          markTimer = gsap.delayedCall(0.45, () => markTl?.play());
        }
        if (cornerTl) {
          cornerTimer = gsap.delayedCall(0.55, () => cornerTl?.play());
        }
      });
    }

    // 2. Cardboard text copy scroll reveal
    const cardboardChars = Array.from(
      section.querySelectorAll<HTMLElement>(".cardboard-wrapper .h2 .char")
    );
    let copyProgress = 0;
    const copyTl = gsap.timeline({ paused: true });

    if (cardboardChars.length && !prefersReducedMotion) {
      const topPositions = cardboardChars.map(
        (c) => (c.parentElement || c).getBoundingClientRect().top
      );
      const minTop = Math.min(...topPositions);
      const spanTop = Math.max(Math.max(...topPositions) - minTop, 1);

      cardboardChars.forEach((c, idx) => {
        copyTl.fromTo(
          c,
          { yPercent: 130, y: 0 },
          { yPercent: 0, y: 0, duration: 0.6, ease: "power3.out" },
          ((topPositions[idx] - minTop) / spanTop) * 1 + 0.35 * Math.random()
        );
      });
    }

    // 3. Parallax elements ([data-parallax])
    const parallaxEls = Array.from(
      section.querySelectorAll<HTMLElement>("[data-parallax]")
    ).map((el) => ({
      el,
      factor: parseFloat(el.dataset.parallax || "0") || 0,
      ease: parseFloat(el.dataset.parallaxEase || "6") || 6,
      currentY: 0,
    }));

    // 4. Elastic rubber poke interaction on headline .h1
    const pokeCleanup = initPoke(section, ".title .h1");

    // Main animation loop
    let reqId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      reqId = requestAnimationFrame(loop);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const scrollY = window.scrollY;
      const viewportH = window.innerHeight;

      // Parallax update
      parallaxEls.forEach((item) => {
        const rect = item.el.getBoundingClientRect();
        const center = rect.top + scrollY + rect.height / 2;
        const targetOffset = (scrollY + viewportH / 2 - center) * item.factor;
        item.currentY += (targetOffset - item.currentY) * (1 - Math.exp(-item.ease * dt));
        const rounded = Math.round(item.currentY * 2) / 2;
        item.el.style.transform = `translate3d(0, ${rounded}px, 0)`;
      });

      // Cardboard text reveal on scroll
      const cardboardWrapper = section.querySelector<HTMLElement>(".cardboard-wrapper");
      if (cardboardWrapper && cardboardChars.length) {
        const rect = cardboardWrapper.getBoundingClientRect();
        const start = window.innerHeight * 0.95;
        const total = cardboardWrapper.offsetHeight + window.innerHeight * 0.4;
        const rawProgress = (start - rect.top) / total;
        const targetProgress = Math.max(0, Math.min(1, rawProgress));
        if (targetProgress > copyProgress) {
          copyProgress = targetProgress;
          copyTl.progress(copyProgress);
        }
      }

      // Interactive peel on scroll
      const peels = section.querySelectorAll<HTMLElement>('[data-peel="scroll"]');
      peels.forEach((peel) => {
        const rect = peel.getBoundingClientRect();
        const progress = Math.max(
          0,
          Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight * 0.85))
        );
        peel.style.setProperty("--peel", (1 - progress * 0.6).toFixed(3));
      });
    };

    reqId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(reqId);
      copyTl.kill();
      pokeCleanup();
      unsubsRevealed?.();
      revealTimer?.kill();
      markTimer?.kill();
      cornerTimer?.kill();
      titleTl?.kill();
      markTl?.kill();
      cornerTl?.kill();
      gsap.set(allChars, { clearProps: "transform" });
      if (heroMark) gsap.set(heroMark, { clearProps: "transform,opacity" });
    };
  }, []);

  const handleTapePress = (e: React.MouseEvent) => {
    e.stopPropagation();
    playOnce(SOUNDS.TAPE_PRESS, 0.7);
  };

  return (
    <section ref={sectionRef} className="hero-section" data-reveal="live">
      <div className="hero-wrapper">
        <div className="top">
          <div className="arc-foot" data-paper="true" aria-hidden="true" />

          <p className="corner-mark">
            <span className="sr-only">STICK WITH YOU THROUGH THREE GENERATIONS</span>
            <span className="corner-perf" aria-hidden="true" />
            <span className="line" aria-hidden="true">
              {"STICK WITH YOU THROUGH".split("").map((c, i) => (
                <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                  <span className="char">{c === " " ? "\u00A0" : c}</span>
                </span>
              ))}
            </span>
            <span className="line" aria-hidden="true">
              {"THREE GENERATIONS".split("").map((c, i) => (
                <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                  <span className="char">{c === " " ? "\u00A0" : c}</span>
                </span>
              ))}
            </span>
          </p>

          <div className="title">
            <p className="h4">
              <span className="sr-only">WE'RE HERE TO</span>
              <span className="half" aria-hidden="true">
                {"WE'RE".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c}</span>
                  </span>
                ))}
              </span>
              <span className="hero-mark-slot" aria-hidden="true">
                <img
                  className="hero-mark"
                  src="/assets/preloader-image.svg"
                  alt="SWEET TAPE"
                  draggable="false"
                  onClick={handleTapePress}
                />
              </span>
              <span className="half" aria-hidden="true">
                {"HERE TO".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
            </p>

            <div className="warped-text">
              <h1 className="h1" aria-label="STICK BY YOU">
                <span className="line" style={{ "--letters": 5 } as React.CSSProperties}>
                  {"STICK".split("").map((c, i) => (
                    <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                      <span className="char">{c}</span>
                    </span>
                  ))}
                </span>
                <span className="line" style={{ "--letters": 6 } as React.CSSProperties}>
                  {"BY YOU".split("").map((c, i) => (
                    <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                      <span className="char">{c === " " ? "\u00A0" : c}</span>
                    </span>
                  ))}
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* 3D Interactive Center Tape */}
        <HeroTape3D />

        {/* Bottom Part with Lemon, Gift Box & Cardboard Note */}
        <div className="bottom-part">
          <img src="/assets/lemon painting 1.webp" alt="" id="lemon" />
          <img
            id="gift"
            src="/assets/gift 1.webp"
            alt=""
            data-parallax="-0.12"
            data-parallax-ease="9"
          />

          <div className="cardboard-wrapper">
            <h2
              className="h2"
              aria-label="DIY FAIL, MOVING DAY CHAOS, SCHOOL PROJECT EMERGENCY, LAST-MINUTES FIXES. WE ALWAYS STICK BY YOU."
            >
              <span aria-hidden="true">
                {[
                  "DIY",
                  "FAIL,",
                  "MOVING",
                  "DAY",
                  "CHAOS,",
                  "SCHOOL",
                  "PROJECT",
                  "EMERGENCY,",
                  "LAST-MINUTES",
                  "FIXES.",
                  "WE",
                  "ALWAYS",
                  "STICK",
                  "BY",
                  "YOU.",
                ].map((word, widx) => (
                  <span key={widx} className="word">
                    {word.split("").map((c, cidx) => (
                      <span key={cidx} className="clip" style={{ "--i": cidx } as React.CSSProperties}>
                        <span className="char">{c}</span>
                      </span>
                    ))}{" "}
                  </span>
                ))}
              </span>
            </h2>

            <img src="/assets/cardboard.webp" alt="" id="cardboard" />
          </div>

          <span
            className="peel"
            style={{
              "--peel-w": "var(--tape-w)",
              "--peel-h": "var(--tape-h)",
              "--peel-from": "calc(var(--peel-edge) + 0.55 * var(--peel-span))",
              "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
              "--peel-dir": "90deg",
              "--peel-back": "url(#peel-back-masking)",
            } as React.CSSProperties}
            data-peel="scroll"
            id="tape-on-note"
            onClick={handleTapePress}
          >
            <span className="peel-face">
              <span className="peel-turn">
                <img src="/assets/masking-tape-x2.png" alt="" draggable="false" />
              </span>
            </span>
            <span className="peel-flap" aria-hidden="true">
              <span className="peel-turn">
                <img src="/assets/masking-tape-x2.png" alt="" draggable="false" />
              </span>
            </span>
          </span>

          <span
            className="peel"
            style={{
              "--peel-w": "var(--tape-w)",
              "--peel-h": "var(--tape-h)",
              "--peel-from": "calc(var(--peel-edge) + 0.55 * var(--peel-span))",
              "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
              "--peel-dir": "106.952deg",
              "--peel-back": "url(#peel-back-masking)",
            } as React.CSSProperties}
            data-peel="scroll"
            id="tape-on-lemon"
            onClick={handleTapePress}
          >
            <span className="peel-face">
              <span className="peel-turn">
                <img src="/assets/tape-on-lemon.webp" alt="" draggable="false" />
              </span>
            </span>
            <span className="peel-flap" aria-hidden="true">
              <span className="peel-turn">
                <img src="/assets/tape-on-lemon.webp" alt="" draggable="false" />
              </span>
            </span>
          </span>

          <div className="hand-note">
            <span className="sr-only">we built for everyday moments. not industrial—just real life.</span>
            <div className="hand-ink" aria-hidden="true">
              <svg className="hand-rule hand-rule--x" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M 0 3 C 30 8 65 8 100 1" />
              </svg>
              <svg className="hand-rule hand-rule--y" viewBox="0 0 10 100" preserveAspectRatio="none">
                <path d="M 6 0 C 2 33 3 70 6 100" />
              </svg>
              <span className="hand-line">we built for</span>
              <span className="hand-line">everyday moments.</span>
              <span className="hand-line">not industrial—just real life.</span>
            </div>
          </div>

          <StickyNote3D />

          <img id="paperclip" src="/assets/paper-clip-1.webp" alt="" />
          <img src="/assets/opp-tape-x4.png" alt="" id="tape-top" />
        </div>
      </div>
    </section>
  );
}
