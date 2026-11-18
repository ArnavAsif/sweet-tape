import gsap from "gsap";
import { whenRevealed } from "./loader";

const DRAW_CONSTANTS = {
  RULE: 0.75,
  LIFT: 0.14,
  CHAR: 0.06,
  BREAK: 0.18,
};

function typeset(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(".hand-line")).map((line) => {
    const text = line.textContent ?? "";
    line.textContent = "";
    return Array.from(text, (char) => {
      const span = document.createElement("span");
      span.textContent = char;
      line.appendChild(span);
      return span;
    });
  });
}

function typeChars(tl: gsap.core.Timeline, lines: HTMLElement[][], startTime: number, speed: number) {
  let at = startTime;
  lines.forEach((chars, lineIdx) => {
    if (lineIdx > 0) {
      at += DRAW_CONSTANTS.BREAK * speed;
    }
    for (const charSpan of chars) {
      tl.set(charSpan, { visibility: "visible" }, at);
      at += DRAW_CONSTANTS.CHAR * speed;
    }
  });
  gsap.set(lines.flat(), { visibility: "hidden" });
  return at;
}

export function initHandNote(container: HTMLElement) {
  const notes = Array.from(container.querySelectorAll<HTMLElement>(".hand-note"));
  const cleanups = notes.map((note) => {
    const ink = note.querySelector<HTMLElement>(".hand-ink");
    const ruleX = note.querySelector<SVGElement>(".hand-rule--x");
    const ruleY = note.querySelector<SVGElement>(".hand-rule--y");

    if (!ink || !ruleX || !ruleY || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => {};
    }

    const cs = getComputedStyle(note);
    const drawMultiplier = parseFloat(cs.getPropertyValue("--hand-draw")) || 1;
    const delay = parseFloat(cs.getPropertyValue("--hand-delay")) || 0;
    const lines = typeset(ink);

    const tl = gsap.timeline({ paused: true });
    const w = ruleX.getBoundingClientRect().width;
    const h = ruleY.getBoundingClientRect().height;
    const ruleDuration = DRAW_CONSTANTS.RULE * drawMultiplier;

    tl.fromTo(ruleX, { scaleX: 0 }, { scaleX: 1, duration: (ruleDuration * w) / (w + h || 1), ease: "none" }, 0);
    tl.fromTo(ruleY, { scaleY: 0 }, { scaleY: 1, duration: (ruleDuration * h) / (w + h || 1), ease: "none" }, 0);

    typeChars(tl, lines, tl.duration() + DRAW_CONSTANTS.LIFT * drawMultiplier, drawMultiplier);

    let destroyed = false;
    let delayTimer: gsap.core.Tween | null = null;
    let observer: IntersectionObserver | null = null;

    const unsubRevealed = whenRevealed(() => {
      if (destroyed) return;
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              delayTimer = gsap.delayedCall(delay, () => tl.play());
            } else {
              tl.play();
            }
          } else {
            delayTimer?.kill();
            delayTimer = null;
            tl.pause(0);
          }
        },
        { rootMargin: "0px 0px -22% 0px" }
      );
      observer.observe(note);
    });

    return () => {
      destroyed = true;
      unsubRevealed();
      observer?.disconnect();
      delayTimer?.kill();
      tl.kill();
      gsap.set([ruleX, ruleY], { clearProps: "transform" });
      ink.querySelectorAll<HTMLElement>(".hand-line").forEach((l) => {
        l.textContent = l.textContent;
      });
    };
  });

  return () => {
    cleanups.forEach((c) => c());
  };
}

const PRESS_CONSTANTS = {
  MARGIN: "0px 0px -35% 0px",
  TIME: 0.62,
  EASE: "power2.out",
  LAG: 0.22,
};

const DEFAULT_SELECTORS = [".info-shot-tape", ".info-story-tape"];

export function initPress(container: HTMLElement, selectors: string[] = DEFAULT_SELECTORS) {
  const tapes = selectors.flatMap((sel) => Array.from(container.querySelectorAll<HTMLElement>(sel)));
  if (!tapes.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  tapes.forEach((tape) => tape.style.setProperty("--peel", "0"));

  let tl: gsap.core.Timeline | null = null;
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        tl = gsap.timeline();
        tapes.forEach((tape, idx) => {
          const state = { p: 0 };
          tl!.to(
            state,
            {
              p: 1,
              duration: PRESS_CONSTANTS.TIME,
              ease: PRESS_CONSTANTS.EASE,
              onUpdate: () => {
                tape.style.setProperty("--peel", String(state.p));
              },
            },
            idx * PRESS_CONSTANTS.LAG
          );
        });
      }
    },
    { rootMargin: PRESS_CONSTANTS.MARGIN }
  );

  observer.observe(container);

  return () => {
    observer.disconnect();
    tl?.kill();
    tapes.forEach((tape) => tape.style.removeProperty("--peel"));
  };
}
