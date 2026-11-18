"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { whenRevealed } from "@/lib/loader";

const REVEAL = {
  HIDDEN: 130,
  DURATION: 0.6,
  STAGGER: 0.025,
  DELAY: 0.3,
  EASE: "power3.out",
};

const CORNER = {
  DELAY: 0.55,
  PERF_DURATION: 0.5,
  PERF_EASE: "power2.out",
  TEXT_AT: 0.12,
  STAGGER: 0.012,
};

const LINES = ["STICK WITH YOU THROUGH", "THREE GENERATIONS"];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function TopBand() {
  const bandRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const band = bandRef.current;
    if (!band) return;

    const topMark = band.querySelector<HTMLElement>(".top-mark");
    const topPerf = band.querySelector<HTMLElement>(".top-perf");
    const chars = Array.from(band.querySelectorAll<HTMLElement>(".char"));

    if (chars.length) {
      gsap.set(chars, { y: 0, yPercent: REVEAL.HIDDEN });
    }
    band.dataset.reveal = "live";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (chars.length) gsap.set(chars, { clearProps: "transform" });
      return () => {};
    }

    const tl = gsap.timeline({ paused: true });

    if (topPerf) {
      tl.fromTo(
        topPerf,
        { clipPath: "inset(0% 0% 100% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: CORNER.PERF_DURATION, ease: CORNER.PERF_EASE },
        0
      );
    }

    if (chars.length) {
      tl.fromTo(
        shuffle(chars),
        { y: 0, yPercent: REVEAL.HIDDEN },
        { yPercent: 0, duration: REVEAL.DURATION, stagger: CORNER.STAGGER, ease: REVEAL.EASE },
        CORNER.TEXT_AT
      );
    }

    if (topMark) {
      gsap.set(topMark, { y: 0, yPercent: -260 });
    }

    let markTween: gsap.core.Tween | null = null;
    let delayedCall: gsap.core.Tween | null = null;

    const unsubRevealed = whenRevealed(() => {
      if (topMark) {
        markTween = gsap.fromTo(
          topMark,
          { y: 0, yPercent: -260 },
          { yPercent: 0, duration: 0.85, delay: 0.45, ease: "back.out(1.4)" }
        );
      }
      delayedCall = gsap.delayedCall(CORNER.DELAY, () => tl.play());
    });

    return () => {
      unsubRevealed();
      delayedCall?.kill();
      markTween?.kill();
      tl.kill();
      gsap.set(chars, { clearProps: "transform" });
      if (topMark) gsap.set(topMark, { clearProps: "transform" });
      if (topPerf) gsap.set(topPerf, { clipPath: "inset(0% 0% 0% 0%)" });
    };
  }, [pathname]);

  if (pathname === "/") return null;

  return (
    <div className="top-band" role="banner" ref={bandRef}>
      <noscript>
        <style>{`.top-band .char { transform: none }\n.top-band .top-perf { clip-path: none }`}</style>
      </noscript>
      <p className="top-note">
        <span className="sr-only">{LINES.join(" ")}</span>
        <span className="top-perf" aria-hidden="true" />
        {LINES.map((line) => (
          <span key={line} className="line" aria-hidden="true">
            {line.split("").map((c, i) => (
              <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                <span className="char">{c === " " ? "\u00A0" : c}</span>
              </span>
            ))}
          </span>
        ))}
      </p>
      <a className="top-mark" href="/" aria-label="SweetTape — home">
        <img src="/assets/preloader-image.svg" alt="" draggable={false} />
      </a>
    </div>
  );
}
