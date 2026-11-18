"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { playOnce, SOUNDS } from "@/lib/sounds";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const DESKTOP_CONFIG = {
  FIRST: 0.08,
  LAST: 0.86,
  EACH: 0.22,
  RISE: 16,
  EASE: "back.out(2.2)",
};

const MOBILE_CONFIG = {
  STAGGER: 0.018,
  POP: 0.6,
  START: "top 80%",
};

function getTextLength(textEl: SVGTextElement): number {
  try {
    return textEl.getSubStringLength(0, (textEl.textContent ?? "").length);
  } catch {
    return textEl.getComputedTextLength?.() || 1400;
  }
}

function findLengthAtX(pathEl: SVGGeometryElement, targetX: number): number {
  let low = 0;
  let high = pathEl.getTotalLength();
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (pathEl.getPointAtLength(mid).x < targetX) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

function whenFontReady(callback: () => void) {
  if (typeof document === "undefined") return;
  let checks = 0;
  const poll = () => {
    if (document.fonts.check('800 250px "futura-pt-condensed"') || checks++ > 120) {
      callback();
    } else {
      requestAnimationFrame(poll);
    }
  };
  document.fonts.ready.then(poll);
}

const WORDS = ["WE", "DIDN’T", "WANT", "TO", "BE", "LOUDER.", "WE", "WANTED", "TO", "BE"];

const BOXES = [
  { id: "clearer", y: 45, src: "/assets/about/wanted/clearer.svg", alt: "CLEARER" },
  { id: "choose", y: 4.5, src: "/assets/about/wanted/choose.svg", alt: "EASY TO CHOOSE" },
  { id: "recognisable", y: 57.5, src: "/assets/about/wanted/recognisable.svg", alt: "RECOGNISABLE" },
  { id: "human", y: 24.5, src: "/assets/about/wanted/human.svg", alt: "MORE HUMAN" },
];

export default function WeWantedSection() {
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

    const stage = section.querySelector<HTMLElement>(".wanted-stage");
    const textEl = section.querySelector<SVGTextElement>(".wanted-text");
    const textPathEl = section.querySelector<SVGTextPathElement>("textPath");
    const pathEl = section.querySelector<SVGGeometryElement>("#wanted-path");
    const boxes = Array.from(section.querySelectorAll<HTMLElement>(".wanted-box"));

    if (!stage || !textEl || !textPathEl || !pathEl || !boxes.length) return;

    section.dataset.reveal = "live";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      whenFontReady(() => {
        const textLen = getTextLength(textEl);
        const x1600 = findLengthAtX(pathEl, 1600);
        const span = x1600 - findLengthAtX(pathEl, 0);
        textPathEl.setAttribute("startOffset", String(x1600 - textLen - 0.25 * span));
      });
      return () => {};
    }

    gsap.registerPlugin(ScrollTrigger);

    const isGrid = Number.parseFloat(getComputedStyle(section).getPropertyValue("--wanted-grid")) > 0;
    if (isGrid) {
      // Mobile layout fallback
      const plainChars = Array.from(section.querySelectorAll<HTMLElement>(".wanted-plain .char"));
      const { RISE, EASE } = DESKTOP_CONFIG;
      const { STAGGER, POP, START } = MOBILE_CONFIG;

      const plainTl = gsap.fromTo(
        plainChars,
        { yPercent: 130 },
        { yPercent: 0, duration: 0.6, ease: "power3.out", stagger: { each: STAGGER, from: "random" }, paused: true }
      );

      const boxTweens = boxes.map((box) =>
        gsap.fromTo(box, { scale: 0, yPercent: RISE }, { scale: 1, yPercent: 0, duration: POP, ease: EASE, paused: true })
      );

      const triggers = [
        ScrollTrigger.create({
          trigger: section.querySelector(".wanted-plain") || section,
          start: START,
          once: true,
          onEnter: () => plainTl.play(),
        }),
        ...boxes.map((box, idx) =>
          ScrollTrigger.create({
            trigger: box,
            start: START,
            once: true,
            onEnter: () => {
              boxTweens[idx].play();
              playOnce(SOUNDS.BOX_POP);
            },
          })
        ),
      ];

      return () => {
        triggers.forEach((t) => t.kill());
        plainTl.kill();
        boxTweens.forEach((t) => t.kill());
        gsap.set([...plainChars, ...boxes], { clearProps: "transform" });
      };
    }

    let isDestroyed = false;
    let animTl: gsap.core.Timeline | null = null;
    let st: ScrollTrigger | null = null;

    whenFontReady(() => {
      if (isDestroyed) return;

      const textLen = getTextLength(textEl);
      const x0 = findLengthAtX(pathEl, 0);
      const x1600 = findLengthAtX(pathEl, 1600);
      const { FIRST, LAST, EACH, RISE, EASE } = DESKTOP_CONFIG;
      const step = boxes.length > 1 ? (LAST - EACH - FIRST) / (boxes.length - 1) : 0;

      animTl = gsap.timeline({ paused: true });

      animTl.fromTo(
        textPathEl,
        { attr: { startOffset: x1600 + 0.77 * textLen - textLen } },
        { attr: { startOffset: x1600 - 0.25 * (x1600 - x0) - textLen }, duration: 1, ease: "none" },
        0
      );

      animTl.fromTo(
        boxes,
        { scale: 0, yPercent: RISE },
        { scale: 1, yPercent: 0, duration: EACH, ease: EASE, stagger: step },
        FIRST
      );

      boxes.forEach((_box, idx) => {
        animTl?.call(
          () => {
            if ((st?.direction ?? 1) > 0) {
              playOnce(SOUNDS.BOX_POP);
            }
          },
          [],
          FIRST + step * idx
        );
      });

      st = ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: () => `+=${Math.round(4 * window.innerHeight)}`,
        pin: stage,
        pinSpacing: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        refreshPriority: 1,
        animation: animTl,
      });

      ScrollTrigger.refresh();
    });

    const cleanup = () => {
      isDestroyed = true;
      st?.kill(true);
      animTl?.kill();
      gsap.set(boxes, { clearProps: "transform" });
    };

    cleanupRef.current = cleanup;
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  return (
    <section ref={sectionRef} className="we-wanted" data-reveal="live">
      <div className="wanted-stage">
        <noscript>
          <style>{`
            .we-wanted .wanted-box, .we-wanted .wanted-plain .char { transform: none }
          `}</style>
        </noscript>
        <h2 className="wanted-band">
          <span className="sr-only">WE DIDN’T WANT TO BE LOUDER. WE WANTED TO BE</span>
          <span className="wanted-plain" aria-hidden="true">
            {WORDS.map((word, wIdx) => (
              <span key={wIdx} className="word">
                {word.split("").map((c, cIdx) => (
                  <span key={cIdx} className="clip" style={{ "--i": cIdx } as React.CSSProperties}>
                    <span className="char">{c}</span>
                  </span>
                ))}
                {wIdx < WORDS.length - 1 ? " " : ""}
              </span>
            ))}
          </span>
          <svg viewBox="0 0 1600 560" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <path
                id="wanted-path"
                d="M -8605,280 Q -8180,160 -7755,280 Q -7330,400 -6905,280 Q -6480,160 -6055,280 Q -5630,400 -5205,280 Q -4780,160 -4355,280 Q -3930,400 -3505,280 Q -3080,160 -2655,280 Q -2230,400 -1805,280 Q -1380,160 -955,280 Q -530,400 -105,280 Q 320,160 745,280 Q 1170,400 1595,280 Q 2020,160 2445,280 Q 2870,400 3295,280 Q 3720,160 4145,280 Q 4570,400 4995,280 Q 5420,160 5845,280 Q 6270,400 6695,280 Q 7120,160 7545,280 Q 7970,400 8395,280 Q 8820,160 9245,280 Q 9670,400 10095,280"
                fill="none"
              />
            </defs>
            <text className="wanted-text" dy="0.35em">
              <textPath href="#wanted-path" startOffset="9321">WE DIDN’T WANT TO BE LOUDER. WE WANTED TO BE</textPath>
            </text>
          </svg>
        </h2>
        <ul className="wanted-boxes">
          {BOXES.map((box, idx) => (
            <li
              key={box.id}
              className="wanted-box"
              data-box={box.id}
              style={{ "--n": idx, "--y": box.y } as React.CSSProperties}
            >
              <img src={box.src} alt={box.alt} width={272} height={271} draggable={false} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
