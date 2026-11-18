"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initHandNote } from "@/lib/aboutAnimations";

const REVEAL = {
  HIDDEN: 130,
  DURATION: 0.6,
  EASE: "power3.out",
};

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function AboutCtaSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    gsap.registerPlugin(ScrollTrigger);

    // 1. Text & Button Reveal
    const chars = Array.from(section.querySelectorAll<HTMLElement>(".about-cta-title .char"));
    const button = section.querySelector<HTMLElement>(".explore-button");
    const kickerRises = Array.from(section.querySelectorAll<HTMLElement>(".about-cta-kicker .body-rise"));

    let revealTl: gsap.core.Timeline | null = null;
    let revealSt: ScrollTrigger | null = null;

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealTl = gsap.timeline({ paused: true });

      if (kickerRises.length) {
        revealTl.to(kickerRises, { yPercent: 0, duration: 0.5, stagger: 0.04, ease: "power2.out" }, 0);
      }

      if (chars.length) {
        revealTl.fromTo(
          shuffle(chars),
          { yPercent: REVEAL.HIDDEN },
          { yPercent: 0, duration: REVEAL.DURATION, stagger: 0.018, ease: REVEAL.EASE },
          0
        );
      }

      if (button) {
        revealTl.fromTo(
          button,
          { scale: 0.86, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.7, ease: "back.out(1.4)" },
          0.34
        );
      }

      revealSt = ScrollTrigger.create({
        trigger: section,
        start: "top 75%",
        once: true,
        onEnter: () => revealTl?.play(),
      });
    }

    // 2. Background and Foreground Parallax Drift
    const sheet = section.querySelector<HTMLElement>(".about-cta-sheet");
    const bgImg = sheet?.querySelector<HTMLElement>(".about-cta-bg");
    const frontImg = section.querySelector<HTMLElement>(".about-cta-front");
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cleanupParallax: (() => void) | null = null;

    if (sheet && bgImg && !prefersReduced) {
      let maxPan = 0;
      let zoomGain = 0;
      let frontDrift = 0;
      let halfSpan = 1;
      let centerOffset = 0;
      let isIntersecting = true;

      const measure = () => {
        const sheetH = sheet.offsetHeight;
        maxPan = Math.max((bgImg.offsetHeight - sheetH) / 2, 0);

        let top = 0;
        for (let el: HTMLElement | null = sheet; el; el = el.offsetParent as HTMLElement | null) {
          top += el.offsetTop;
        }
        centerOffset = top + sheetH / 2;
        halfSpan = Math.max((window.innerHeight + sheetH) / 2, 1);

        const cs = getComputedStyle(section);
        zoomGain = Math.max(parseFloat(cs.getPropertyValue("--cta-zoom-gain")), 0) || 0;
        frontDrift =
          (Math.max(parseFloat(cs.getPropertyValue("--cta-front-drift")), 0) || 0) * (frontImg?.offsetHeight ?? 0);
      };

      const updateParallax = () => {
        if (!isIntersecting || (maxPan <= 0 && zoomGain <= 0 && frontDrift <= 0)) return;
        const progress = Math.max(-1, Math.min(1, (window.scrollY + window.innerHeight / 2 - centerOffset) / halfSpan));
        const pan = Math.round(progress * maxPan * 2) / 2;
        const zoom = Math.round(10000 * (1 + ((1 - progress) / 2) * zoomGain)) / 10000;
        const key = `${pan}/${zoom}`;

        if (bgImg.dataset.at !== key) {
          bgImg.dataset.at = key;
          bgImg.style.setProperty("--cta-pan", `${pan}px`);
          bgImg.style.setProperty("--cta-zoom", String(zoom));
        }

        if (frontImg && frontDrift > 0) {
          const frontPan = Math.round(-progress * frontDrift * 2) / 2;
          if (frontImg.dataset.at !== String(frontPan)) {
            frontImg.dataset.at = String(frontPan);
            frontImg.style.setProperty("--cta-front-pan", `${frontPan}px`);
          }
        }
      };

      measure();

      const observer = new IntersectionObserver(([entry]) => {
        isIntersecting = entry.isIntersecting;
      }, { rootMargin: "20% 0px" });
      observer.observe(sheet);

      const resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(section);

      window.addEventListener("scroll", updateParallax, { passive: true });
      window.addEventListener("resize", measure, { passive: true });
      bgImg.addEventListener("load", measure);
      frontImg?.addEventListener("load", measure);

      cleanupParallax = () => {
        observer.disconnect();
        resizeObserver.disconnect();
        window.removeEventListener("scroll", updateParallax);
        window.removeEventListener("resize", measure);
        bgImg.removeEventListener("load", measure);
        frontImg?.removeEventListener("load", measure);
      };
    }

    // 3. Handwritten Note Ink Animation
    const cleanupNote = initHandNote(section);

    return () => {
      revealSt?.kill();
      revealTl?.kill();
      cleanupParallax?.();
      cleanupNote?.();
      if (chars.length) gsap.set(chars, { clearProps: "transform" });
      if (button) gsap.set(button, { clearProps: "transform,opacity,visibility" });
    };
  }, []);

  return (
    <section ref={sectionRef} className="about-cta" data-reveal="live">
      <noscript>
        <style>{`
          .about-cta .char, .about-cta .body-rise { transform: none }
          .about-cta .explore-button { opacity: 1; transform: none }
        `}</style>
      </noscript>

      <div className="about-cta-sheet arc-cut">
        <img
          className="about-cta-bg"
          src="/assets/cta-bg.webp"
          alt=""
          loading="lazy"
          decoding="async"
          data-at="-500/1.12"
          style={{ "--cta-pan": "-500px", "--cta-zoom": 1.12 } as React.CSSProperties}
        />
      </div>

      <div className="about-cta-copy">
        <p className="about-cta-kicker body-copy" data-reveal="live">
          {["We", "believe", "the", "world", "is", "better", "with"].map((w, i) => (
            <span key={i} className="body-clip">
              <span className="body-rise">{w}</span>
              {i < 6 ? " " : ""}
            </span>
          ))}
        </p>

        <h2 className="about-cta-title" aria-label="MORE COLOUR, MORE HEART, AND YES — BETTER TAPE.">
          <span className="line" aria-hidden="true" style={{ "--letters": 12 } as React.CSSProperties}>
            {"MORE COLOUR,".split("").map((c, i) => (
              <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                <span className="char">{c === " " ? "\u00A0" : c}</span>
              </span>
            ))}
          </span>
          <span className="line" aria-hidden="true" style={{ "--letters": 15 } as React.CSSProperties}>
            {"MORE HEART, AND".split("").map((c, i) => (
              <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                <span className="char">{c === " " ? "\u00A0" : c}</span>
              </span>
            ))}
          </span>
          <span className="line" aria-hidden="true" style={{ "--letters": 18 } as React.CSSProperties}>
            {"YES — BETTER TAPE.".split("").map((c, i) => (
              <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                <span className="char">{c === " " ? "\u00A0" : c}</span>
              </span>
            ))}
          </span>
        </h2>

        <Link className="explore-button" href="/products">
          <span className="explore-clip">
            <span className="button-text">EXPLORE</span>
          </span>
          <span className="arrow">
            <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false">
              <path d="M1.4 10.6 10.6 1.4M3.6 1.4h7v7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
            </svg>
          </span>
        </Link>
      </div>

      <div className="hand-note cta-note">
        <span className="sr-only">we've believed that even the simplest products deserve thoughtful design.</span>
        <div className="hand-ink" aria-hidden="true">
          <svg className="hand-rule hand-rule--x" viewBox="0 0 100 10" preserveAspectRatio="none">
            <path d="M 0 3 C 30 8 65 8 100 1" />
          </svg>
          <svg className="hand-rule hand-rule--y" viewBox="0 0 10 100" preserveAspectRatio="none">
            <path d="M 6 0 C 2 33 3 70 6 100" />
          </svg>
          <span className="hand-line">we've believed that</span>
          <span className="hand-line">even the simplest</span>
          <span className="hand-line">products deserve</span>
          <span className="hand-line">thoughtful design.</span>
        </div>
      </div>

      <div className="about-cta-sheet about-cta-frontbox arc-cut" aria-hidden="true">
        <img className="about-cta-front" src="/assets/front-cta.webp" alt="" loading="lazy" decoding="async" />
      </div>
    </section>
  );
}
