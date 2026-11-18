"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { playOnce, SOUNDS } from "@/lib/sounds";
import { whenRevealed } from "@/lib/loader";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface PlayerRoll {
  id: string;
  href: string;
  label: string;
  faceImg: string;
  side: "left" | "right";
  ring: string;
  bg: string;
  word: string;
  tagBg: string;
  tagInk: string;
  ink: string;
}

const ROLLS: PlayerRoll[] = [
  {
    id: "cloth",
    href: "/products/cloth",
    label: "Cloth tape",
    faceImg: "/api/media/file/cloth-card.webp",
    side: "right",
    ring: "#d9d2f7",
    bg: "#2E3EAC",
    word: "#919CFF",
    tagBg: "#172795",
    tagInk: "#919CFF",
    ink: "#919CFF",
  },
  {
    id: "masking",
    href: "/products/masking",
    label: "Masking tape",
    faceImg: "/api/media/file/masking-card.webp",
    side: "left",
    ring: "#fff1a2",
    bg: "#fa8005",
    word: "#fcd805",
    tagBg: "#EB7100",
    tagInk: "#FCD805",
    ink: "#FFDC13",
  },
  {
    id: "opp",
    href: "/products/opp",
    label: "OPP tape",
    faceImg: "/assets/sibling-opp-normal.webp",
    side: "left",
    ring: "#e4f7a8",
    bg: "#b6fe00",
    word: "#52AF16",
    tagBg: "#013900",
    tagInk: "#b6fe00",
    ink: "#013900",
  },
  {
    id: "opp-quiet",
    href: "/products/opp-quiet",
    label: "OPP tape, low noise",
    faceImg: "/api/media/file/opp-quiet-card.webp",
    side: "right",
    ring: "#fff0b0",
    bg: "#F7D000",
    word: "#a88700",
    tagBg: "#a88700",
    tagInk: "#ffeda0",
    ink: "#8a6f00",
  },
  {
    id: "stationery",
    href: "/products/stationery",
    label: "Stationery tape",
    faceImg: "/api/media/file/stationery-card.svg",
    side: "right",
    ring: "#ffd9c2",
    bg: "#FF7B5F",
    word: "#a82712",
    tagBg: "#9e2a12",
    tagInk: "#f2a08c",
    ink: "#9e2a12",
  },
  {
    id: "double",
    href: "/products/double",
    label: "Double-sided tissue tape",
    faceImg: "/api/media/file/double-card.webp",
    side: "left",
    ring: "#a8dcf0",
    bg: "#50CBFF",
    word: "#007db2",
    tagBg: "#1b87b8",
    tagInk: "#8bd8f5",
    ink: "#1b87b8",
  },
];

const ELASTIC_EASE = "elastic.out(1, 0.75)";
const SHEET_CONFIG = {
  SHEET: 0.55,
  SHEET_EASE: "power2.out",
  ARC_RATIO: 150.5 / 1456,
  SHEET_AT: 0.1,
  SETTLE: 0.15,
};
const DRAW_CONFIG = {
  RULE: 0.75,
  LIFT: 0.14,
  CHAR: 0.06,
  BREAK: 0.18,
};
const REVEAL_CONFIG = {
  HIDDEN: 130,
  DURATION: 0.6,
  STAGGER: 0.035,
  DELAY: 0.3,
  EASE: "power3.out",
};

function getRandomTilt() {
  return {
    xPercent: (Math.random() - 0.5) * 7,
    yPercent: (Math.random() - 0.5) * 9,
    rotation: (Math.random() - 0.5) * 11,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function typesetLines(el: HTMLElement) {
  return Array.from(el.querySelectorAll<HTMLElement>(".hand-line")).map((line) => {
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

function typeText(tl: gsap.core.Timeline, lines: HTMLElement[][], startAt: number, speedMultiplier: number) {
  let at = startAt;
  lines.forEach((chars, lineIdx) => {
    if (lineIdx > 0) at += DRAW_CONFIG.BREAK * speedMultiplier;
    for (const charSpan of chars) {
      tl.set(charSpan, { visibility: "visible" }, at);
      at += DRAW_CONFIG.CHAR * speedMultiplier;
    }
  });
  gsap.set(lines.flat(), { visibility: "hidden" });
  return at;
}

function parkPath(pathEl: SVGPathElement) {
  const len = pathEl.getTotalLength();
  pathEl.style.strokeDasharray = `${len} ${len + 2}`;
  pathEl.style.strokeDashoffset = `${len + 1}`;
}

function writePaths(tl: gsap.core.Timeline, paths: SVGPathElement[], startAt: number, totalDuration: number) {
  const totalLen = paths.reduce((acc, p) => acc + p.getTotalLength(), 0) || 1;
  let at = startAt;
  for (const path of paths) {
    const dur = (path.getTotalLength() / totalLen) * totalDuration;
    tl.to(path, { strokeDashoffset: 0, duration: dur, ease: "none" }, at);
    at += dur;
  }
  return at;
}

export default function PickPlayerSection() {
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

    // 1. Title letter reveal
    const initTitle = () => {
      const chars = Array.from(section.querySelectorAll<HTMLElement>(".pick-title .char"));
      if (!chars.length) return () => {};

      gsap.set(chars, { y: 0, yPercent: REVEAL_CONFIG.HIDDEN });
      section.dataset.reveal = "live";
      section.dataset.arrived = "";

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(chars, { clearProps: "transform" });
        return () => {};
      }

      delete section.dataset.arrived;

      const titleTl = gsap.fromTo(
        shuffle(chars),
        { y: 0, yPercent: REVEAL_CONFIG.HIDDEN },
        {
          yPercent: 0,
          duration: REVEAL_CONFIG.DURATION,
          stagger: REVEAL_CONFIG.STAGGER,
          ease: REVEAL_CONFIG.EASE,
          paused: true,
          onComplete: () => {
            section.dataset.arrived = "";
          },
        }
      );

      let delayedCall: gsap.core.Tween | null = null;
      const unsub = whenRevealed(() => {
        delayedCall = gsap.delayedCall(REVEAL_CONFIG.DELAY, () => titleTl.play());
      });

      return () => {
        unsub();
        delayedCall?.kill();
        titleTl.kill();
        gsap.set(chars, { clearProps: "transform" });
        section.dataset.arrived = "";
      };
    };

    // 2. Color Wash Background animation
    const initWash = () => {
      const baseWash = section.querySelector<HTMLElement>(".pick-wash-base");
      const nextWash = section.querySelector<HTMLElement>(".pick-wash-next");
      const washContainer = section.querySelector<HTMLElement>(".pick-wash");
      const riseEl = section.querySelector<HTMLElement>(".pick-rise");
      const nextRise = section.querySelector<HTMLElement>(".pick-rise-next");
      const titleChars = Array.from(section.querySelectorAll<HTMLElement>(".pick-title .char"));

      if (!baseWash || !nextWash || !washContainer || !riseEl || !nextRise) {
        return {
          paint: () => {},
          stop: () => {},
        };
      }

      const getStyleVal = (el: HTMLElement, prop: string) =>
        getComputedStyle(el).getPropertyValue(prop).trim();

      const defaultTheme = {
        bg: getStyleVal(section, "--pick-bg") || "#b6fe00",
        rise: getStyleVal(section, "--pick-rise-colour") || "#0d470c",
        word: getStyleVal(section, "--pick-ink") || "#013900",
        ink: getStyleVal(section, "--pick-ink") || "#013900",
        guide: getStyleVal(section, "--pick-guide-colour") || "#2e3eac",
      };

      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let washTween: gsap.core.Tween | null = null;
      let textTween: gsap.core.Tween | null = null;
      let settleTimer: gsap.core.Tween | null = null;
      let currentActiveBg = defaultTheme.bg;
      let currentTargetBg = defaultTheme.bg;

      const setTopInk = (color: string) => {
        document.documentElement.style.setProperty("--top-ink", color);
      };

      return {
        paint: (rollEl: HTMLElement | null) => {
          const targetTheme = rollEl
            ? {
                bg: getStyleVal(rollEl, "--bg"),
                rise: getStyleVal(rollEl, "--pick-roll-rise"),
                word: getStyleVal(rollEl, "--word"),
                ink: getStyleVal(rollEl, "--ink"),
                guide: getStyleVal(rollEl, "--ink"),
              }
            : defaultTheme;

          if (targetTheme.bg !== currentTargetBg) {
            currentTargetBg = targetTheme.bg;
            settleTimer?.kill();
            settleTimer = null;

            if (targetTheme.bg !== currentActiveBg) {
              if (prefersReduced) {
                settleTimer = gsap.delayedCall(SHEET_CONFIG.SETTLE, () => {
                  settleTimer = null;
                  currentActiveBg = targetTheme.bg;
                  baseWash.style.background = targetTheme.bg;
                  nextWash.style.transform = "translateY(-100%)";
                  riseEl.style.background = targetTheme.rise;
                  nextRise.style.transform = "translateY(-100%)";
                  for (const c of titleChars) c.style.color = targetTheme.word;
                  setTopInk(targetTheme.word);
                });
                return;
              }

              settleTimer = gsap.delayedCall(SHEET_CONFIG.SETTLE, () => {
                settleTimer = null;
                currentActiveBg = targetTheme.bg;

                if (washTween?.isActive()) washTween.progress(1);
                textTween?.kill();

                const washRect = washContainer.getBoundingClientRect();
                const arcHeight = washRect.width * SHEET_CONFIG.ARC_RATIO;
                const totalHeight = washRect.height + arcHeight + 2;
                const arcStr = `${arcHeight}px`;
                const riseTopOffset = riseEl.getBoundingClientRect().top - washRect.top;

                nextWash.style.height = `${totalHeight}px`;
                nextWash.style.background = targetTheme.bg;
                nextWash.style.setProperty("--arc-h", arcStr);
                nextWash.style.transform = `translateY(${-totalHeight}px)`;

                nextRise.style.width = `${washRect.width}px`;
                nextRise.style.marginLeft = `${-washRect.width / 2}px`;
                nextRise.style.height = `${totalHeight}px`;
                nextRise.style.background = targetTheme.rise;
                nextRise.style.setProperty("--arc-h", arcStr);
                nextRise.style.transform = `translateY(${-totalHeight - riseTopOffset}px)`;

                const progressState = { p: 0 };
                washTween = gsap.to(progressState, {
                  p: 1,
                  duration: SHEET_CONFIG.SHEET,
                  delay: SHEET_CONFIG.SHEET_AT,
                  ease: SHEET_CONFIG.SHEET_EASE,
                  onUpdate() {
                    const offset = (progressState.p - 1) * totalHeight;
                    nextWash.style.transform = `translateY(${offset}px)`;
                    nextRise.style.transform = `translateY(${offset - riseTopOffset}px)`;
                  },
                  onComplete() {
                    baseWash.style.background = targetTheme.bg;
                    riseEl.style.background = targetTheme.rise;
                    nextWash.style.transform = "translateY(-100%)";
                    nextRise.style.transform = "translateY(-100%)";
                  },
                });

                setTopInk(targetTheme.word);
                textTween = gsap.to(titleChars, {
                  color: targetTheme.word,
                  duration: SHEET_CONFIG.SHEET,
                  delay: SHEET_CONFIG.SHEET_AT,
                  ease: SHEET_CONFIG.SHEET_EASE,
                });
              });
            }
          }
        },
        stop() {
          settleTimer?.kill();
          washTween?.kill();
          textTween?.kill();
          gsap.killTweensOf(titleChars);
          gsap.set(titleChars, { clearProps: "transform" });
          for (const c of titleChars) c.style.removeProperty("color");
          baseWash.style.removeProperty("background");
          riseEl.style.removeProperty("background");
          nextWash.style.transform = "translateY(-100%)";
          nextRise.style.transform = "translateY(-100%)";
          document.documentElement.style.removeProperty("--top-ink");
        },
      };
    };

    // 3. Hand-drawn scribble cues
    const initCues = () => {
      if (!window.matchMedia("(hover: hover), (min-width: 744px)").matches) {
        return { show: () => {}, stop: () => {} };
      }

      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const cuesMap = new Map<
        HTMLElement,
        { el: HTMLElement; tl: gsap.core.Timeline | null; held: gsap.core.Tween | null }
      >();

      const rollElements = Array.from(section.querySelectorAll<HTMLElement>(".pick-roll"));
      for (const roll of rollElements) {
        const cue = roll.querySelector<HTMLElement>(".pick-cue");
        if (cue) {
          cuesMap.set(roll, { el: cue, tl: null, held: null });
        }
      }

      let activeCue: { el: HTMLElement; tl: gsap.core.Timeline | null; held: gsap.core.Tween | null } | null =
        null;

      for (const cueData of cuesMap.values()) {
        const inkEl = cueData.el.querySelector<HTMLElement>(".pick-cue-ink");
        const strokePaths = Array.from(
          cueData.el.querySelectorAll<SVGPathElement>(".pick-cue-stroke")
        );
        if (!inkEl || !strokePaths.length || prefersReduced) continue;

        strokePaths.forEach(parkPath);
        cueData.tl = gsap.timeline({ paused: true });
        const writeDuration = writePaths(cueData.tl, strokePaths, 0, 0.5 * DRAW_CONFIG.RULE);
        typeText(cueData.tl, typesetLines(inkEl), writeDuration + 0.5 * DRAW_CONFIG.LIFT, 0.5);
      }

      return {
        show(rollEl: HTMLElement | null) {
          const targetCue = rollEl ? cuesMap.get(rollEl) ?? null : null;
          if (targetCue !== activeCue) {
            if (activeCue) {
              const old = activeCue;
              gsap.killTweensOf(old.el);
              old.held?.kill();
              old.held = null;
              if (prefersReduced) {
                gsap.set(old.el, { autoAlpha: 0 });
              } else {
                gsap.to(old.el, {
                  autoAlpha: 0,
                  duration: 0.16,
                  ease: "none",
                  onComplete: () => old.tl?.pause(0),
                });
              }
            }

            activeCue = targetCue;
            if (targetCue) {
              gsap.killTweensOf(targetCue.el);
              targetCue.held?.kill();
              targetCue.held = null;

              if (prefersReduced) {
                gsap.set(targetCue.el, { autoAlpha: 1 });
              } else if (targetCue.tl) {
                targetCue.tl.pause(0);
                gsap.set(targetCue.el, { autoAlpha: 0 });
                targetCue.held = gsap.delayedCall(0.42, () => {
                  targetCue.held = null;
                  gsap.to(targetCue.el, { autoAlpha: 1, duration: 0.12, ease: "none" });
                  targetCue.tl?.play(0);
                });
              }
            }
          }
        },
        stop() {
          activeCue = null;
          for (const cueData of cuesMap.values()) {
            gsap.killTweensOf(cueData.el);
            cueData.held?.kill();
            cueData.tl?.kill();
            gsap.set(cueData.el, { clearProps: "opacity,visibility" });
            cueData.el.querySelectorAll(".hand-line").forEach((l) => (l.textContent = l.textContent));
          }
        },
      };
    };

    // 4. Tape Roll Fan Interaction
    const initFan = (onHoverChange: (roll: HTMLElement | null) => void) => {
      const fanEl = section.querySelector<HTMLElement>(".pick-fan");
      if (!fanEl) return () => {};

      const rollCards = Array.from(section.querySelectorAll<HTMLElement>(".pick-roll"));
      const items = rollCards
        .map((card) => ({
          card,
          tilt: card.querySelector<HTMLElement>(".pick-roll-tilt"),
          face: card.querySelector<HTMLElement>(".pick-roll-face"),
        }))
        .filter((item): item is { card: HTMLElement; tilt: HTMLElement; face: HTMLElement } =>
          Boolean(item.tilt && item.face)
        );

      if (!items.length || items.length !== rollCards.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return () => {};
      }

      const count = items.length;
      let activeIndex = 0;
      const topZIndex = count + 2;

      const enterRoll = (idx: number) => {
        if (!hasEntered) gsap.killTweensOf(items[idx].tilt);
        items[idx].card.style.zIndex = String(topZIndex);
        onHoverChange(items[idx].card);
        playOnce(SOUNDS.PICK_HOVER);

        gsap.to(items[idx].tilt, {
          xPercent: 0,
          yPercent: -7,
          rotation: 0,
          scale: 1.18,
          duration: 0.8,
          ease: ELASTIC_EASE,
        });

        items.forEach(({ face }, i) => {
          gsap.to(face, {
            xPercent: i === idx ? 0 : 30 / (i - idx),
            duration: 0.8,
            ease: ELASTIC_EASE,
          });
        });
      };

      const leaveRoll = (idx: number) => {
        items[idx].card.style.zIndex = "";
        gsap.to(items[idx].tilt, {
          ...getRandomTilt(),
          scale: 1,
          duration: 0.8,
          ease: ELASTIC_EASE,
        });
      };

      const onMouseMove = (e: MouseEvent) => {
        const rect = fanEl.getBoundingClientRect();
        if (rect.width <= 0) return;
        const rollIdx = Math.ceil(((e.clientX - rect.left) / rect.width) * count);
        if (rollIdx === activeIndex || rollIdx < 1 || rollIdx > count) return;

        if (activeIndex !== 0) leaveRoll(activeIndex - 1);
        activeIndex = rollIdx;
        enterRoll(activeIndex - 1);
      };

      const onMouseLeave = () => {
        if (activeIndex !== 0) leaveRoll(activeIndex - 1);
        activeIndex = 0;
        onHoverChange(null);
        gsap.to(
          items.map((it) => it.face),
          { xPercent: 0, duration: 0.8, ease: ELASTIC_EASE }
        );
      };

      const tiltElements = items.map((it) => it.tilt);
      const initialTilts = items.map(() => getRandomTilt());

      items.forEach(({ tilt }, idx) => {
        gsap.set(tilt, {
          ...initialTilts[idx],
          yPercent: initialTilts[idx].yPercent - 34,
          scale: 0,
        });
      });

      let hasEntered = false;
      const enterTimeline = gsap.timeline({
        paused: true,
        onComplete: () => {
          hasEntered = true;
        },
      });

      items.forEach(({ tilt }, idx) => {
        const at = 0.06 * idx;
        enterTimeline.call(() => playOnce(SOUNDS.BOX_POP), [], at);
        enterTimeline
          .to(tilt, { scale: 1, duration: 0.42, ease: "back.out(2.2)" }, at)
          .to(tilt, { yPercent: initialTilts[idx].yPercent, duration: 0.95, ease: "bounce.out" }, at + 0.08);
      });

      const abortCtrl = new AbortController();
      const isHoverCapable = window.matchMedia("(hover: hover)").matches;
      const isTabletTouch = !isHoverCapable && window.matchMedia("(min-width: 744px)").matches;
      let startDelayedCall: gsap.core.Tween | null = null;

      const unsubRevealed = whenRevealed(() => {
        startDelayedCall = gsap.delayedCall(0.15, () => {
          enterTimeline.play();
          if (isTabletTouch) {
            fanEl.addEventListener(
              "click",
              (e: MouseEvent) => {
                const targetCard = (e.target as HTMLElement).closest?.(".pick-roll");
                const cardIdx = targetCard ? items.findIndex((it) => it.card === targetCard) : -1;
                if (cardIdx < 0 || activeIndex === cardIdx + 1) return;
                e.preventDefault();
                if (activeIndex !== 0) leaveRoll(activeIndex - 1);
                activeIndex = cardIdx + 1;
                enterRoll(cardIdx);
              },
              { signal: abortCtrl.signal, capture: true }
            );
          } else if (isHoverCapable) {
            fanEl.addEventListener("mousemove", onMouseMove, {
              signal: abortCtrl.signal,
              passive: true,
            });
            fanEl.addEventListener("mouseleave", onMouseLeave, {
              signal: abortCtrl.signal,
            });
          }
        });
      });

      return () => {
        unsubRevealed();
        startDelayedCall?.kill();
        enterTimeline.kill();
        abortCtrl.abort();
        gsap.killTweensOf(tiltElements);
        gsap.killTweensOf(items.map((it) => it.face));
        gsap.set(tiltElements, { clearProps: "transform" });
        gsap.set(items.map((it) => it.face), { clearProps: "transform" });
        items.forEach(({ card }) => {
          card.style.zIndex = "";
        });
      };
    };

    const cleanupTitle = initTitle();
    const wash = initWash();
    const cues = initCues();
    const cleanupFan = initFan((roll) => {
      wash.paint(roll);
      cues.show(roll);
    });

    const cleanup = () => {
      cleanupTitle();
      cleanupFan();
      wash.stop();
      cues.stop();
    };

    cleanupRef.current = cleanup;
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  return (
    <section ref={sectionRef} className="pick-player">
      <noscript>
        <style>{`.pick-player .char, .pick-player .body-rise { transform: none }`}</style>
      </noscript>

      {/* Color wash background layers */}
      <div className="pick-wash" aria-hidden="true">
        <div className="pick-wash-layer pick-wash-base" />
        <div className="pick-wash-layer pick-wash-next arc-cut" />
      </div>

      {/* Title */}
      <h1 className="pick-title" aria-label="PICK YOUR PLAYER">
        <span className="line" aria-hidden="true">
          {"PICK\u00A0YOUR".split("").map((c, i) => (
            <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
              <span className="char">{c === " " ? "\u00A0" : c}</span>
            </span>
          ))}
        </span>
        <span className="line" aria-hidden="true">
          {"PLAYER".split("").map((c, i) => (
            <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
              <span className="char">{c}</span>
            </span>
          ))}
        </span>
      </h1>

      {/* Stage with arc rise hill and the fan of rolls */}
      <div className="pick-stage">
        <div className="pick-rise" aria-hidden="true">
          <div className="pick-rise-next arc-cut" />
        </div>

        <ul className="pick-fan">
          {ROLLS.map((roll, idx) => (
            <li
              key={roll.id}
              className="pick-roll"
              style={
                {
                  "--i": idx,
                  "--ring": roll.ring,
                  "--bg": roll.bg,
                  "--word": roll.word,
                  "--tag-bg": roll.tagBg,
                  "--tag-ink": roll.tagInk,
                  "--ink": roll.ink,
                } as React.CSSProperties
              }
            >
              <Link
                className="pick-roll-tilt"
                href={roll.href}
                aria-label={roll.label}
              >
                <img
                  className="pick-roll-face"
                  src={roll.faceImg}
                  alt=""
                  draggable={false}
                />
              </Link>

              <div className="pick-cue" data-side={roll.side} aria-hidden="true">
                <svg
                  className="pick-cue-arrow"
                  viewBox="0 0 200 184"
                  fill="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    className="pick-cue-stroke"
                    d="M 28 88 C 50 124 88 144 158 152"
                  />
                  <path
                    className="pick-cue-stroke"
                    d="M 162 153 C 151 147 140 138 130 128"
                  />
                  <path
                    className="pick-cue-stroke"
                    d="M 162 153 C 151 158 140 165 122 169"
                  />
                </svg>
                <div className="pick-cue-ink">
                  <span className="hand-line">click</span>
                  <span className="hand-line">me!</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
