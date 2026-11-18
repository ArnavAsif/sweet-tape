"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { release, startSweep, isHeld, hold } from "@/lib/loader";

interface PaletteItem {
  id: string;
  bg: string;
}

const PALETTE: PaletteItem[] = [
  { id: "stationery", bg: "#FF7B5F" },
  { id: "masking", bg: "#fa8005" },
  { id: "opp-quiet", bg: "#F7D000" },
  { id: "opp", bg: "#b6fe00" },
  { id: "double", bg: "#50CBFF" },
  { id: "cloth", bg: "#2E3EAC" },
];

const N_CONFIG = {
  DURATION: 0.92,
  SCALE: 0.62,
  TILT: -78,
  RISE: 0.064,
  BACK: 2.8,
  BACK_TILT: 0.8,
  FADE: 0.28,
};

const L_CONFIG = {
  FOLD: 1,
  FOLD_AT: 0.31,
  CREASE: 0.09,
  BEND: 1.85,
  WAVE: 0.35,
  FREQ: 1.95,
  SPIN: 0.3,
  START: 0.26,
  UNROLL: 0.74,
  REBOUND: {
    DEPTH: 0.72,
    DURATION: 0.4,
  },
  SETTLE: 2,
  RUBBER: 0.42,
};

const A_CONST = 0;
const H_CONST = 1.06;
const C_CONST = 30;
const U_CONST = 0.16;
const D_CONST = 118;
const P_CONST = 1;
const M_EASE = "power3.inOut";

function getLayers(root: HTMLElement): HTMLElement[] {
  const sheet = root.querySelector<HTMLElement>(".preloader-sheet");
  const layers = Array.from(root.querySelectorAll<HTMLElement>(".preloader-layer"));
  return [sheet, ...layers].filter((el): el is HTMLElement => el !== null);
}

function calculateLayerTimings(
  layers: HTMLElement[],
  config: { at: number; step: number; spread: number; duration: number; drag: number }
) {
  let currentTime = config.at;
  return layers.map((el, idx) => {
    if (idx > 0) {
      const jitter = (((0.6180339887 * idx) % 1) * 2 - 1) * config.spread;
      currentTime += config.step * (1 + jitter);
    }
    return {
      el,
      at: currentTime,
      duration: config.duration * (1 + idx * config.drag),
    };
  });
}

function getLastTiming(
  timings: Array<{ el: HTMLElement; at: number; duration: number }>,
  fallbackAt: number,
  fallbackDuration: number
) {
  return timings[timings.length - 1] ?? { at: fallbackAt, duration: fallbackDuration };
}

function getInternalUrl(e: MouseEvent): string | null {
  if (
    e.defaultPrevented ||
    e.button !== 0 ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey
  ) {
    return null;
  }
  const anchor = (e.target as HTMLElement)?.closest?.("a");
  if (
    !anchor ||
    !(anchor instanceof HTMLAnchorElement) ||
    anchor.hasAttribute("download") ||
    anchor.dataset.noTransition !== undefined ||
    (anchor.target && anchor.target !== "_self")
  ) {
    return null;
  }
  try {
    const dest = new URL(anchor.href, window.location.href);
    if (
      dest.origin !== window.location.origin ||
      (dest.pathname === window.location.pathname && dest.search === window.location.search)
    ) {
      return null;
    }
    return dest.pathname + dest.search + dest.hash;
  } catch {
    return null;
  }
}

interface TransitionController {
  to: (url: string) => void;
  arrived: () => void;
  destroy: () => void;
}

export default function Preloader() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const transitionRef = useRef<TransitionController | null>(null);
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const pathname = usePathname();

  // 1. Initial Page Load Animation
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    if (!isHeld()) {
      gsap.set(root, { visibility: "hidden" });
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      release();
      gsap.set(root, { visibility: "hidden" });
      return;
    }

    if (!window.location.hash) {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }

    const markEl = root.querySelector<HTMLElement>(".preloader-mark");
    const allLayers = getLayers(root);
    const isStickerMissing = !markEl;
    const perfOffset = Math.max(performance.now() / 1000 - 1.2, 0);
    const sweepAt = isStickerMissing ? 0.3 : Math.max(4.37 - perfOffset, 2.9);

    gsap.ticker.lagSmoothing(250, 120);
    const tl = gsap.timeline();

    let removeTickerDraw: (() => void) | null = null;
    let destroySticker: (() => void) | null = null;

    if (markEl) {
      const stickerImg = markEl.dataset.sticker || "/assets/preloader-image.svg";
      const stickerContainer = document.createElement("div");
      stickerContainer.className = "preloader-sticker";
      stickerContainer.style.opacity = "0";

      const colsCount = 64;
      const cols: HTMLElement[] = [];
      const inks: HTMLElement[] = [];
      const sheens: HTMLElement[] = [];
      const backs: HTMLElement[] = [];
      const frontStates: boolean[] = [];

      for (let i = 0; i < colsCount; i++) {
        const col = document.createElement("div");
        col.className = "preloader-col";

        const ink = document.createElement("div");
        ink.className = "preloader-ink";
        ink.style.backgroundImage = `url(${stickerImg})`;

        const sheen = document.createElement("div");
        sheen.className = "preloader-sheen";
        sheen.style.backgroundImage = `linear-gradient(${D_CONST}deg, rgba(255,255,255,0) ${
          50 - C_CONST
        }%, rgba(255,255,255,${U_CONST}) 50%, rgba(255,255,255,0) ${50 + C_CONST}%)`;
        sheen.style.webkitMaskImage = `url(${stickerImg})`;
        sheen.style.maskImage = `url(${stickerImg})`;

        const back = document.createElement("div");
        back.className = "preloader-back";
        back.style.background = "#60a000";
        back.style.webkitMaskImage = `url(${stickerImg})`;
        back.style.maskImage = `url(${stickerImg})`;

        col.append(ink, sheen, back);
        stickerContainer.append(col);
        cols.push(col);
        inks.push(ink);
        sheens.push(sheen);
        backs.push(back);
        frontStates.push(true);
      }

      markEl.append(stickerContainer);

      let markWidth = 0;
      let markHeight = 0;
      let colWidth = 0;

      const measure = () => {
        const rect = markEl.getBoundingClientRect();
        markWidth = rect.width;
        markHeight = rect.height;
        colWidth = markWidth / colsCount;

        cols.forEach((col, idx) => {
          col.style.width = `${colWidth + 0.5}px`;
          col.style.left = `${idx * colWidth}px`;
        });

        const bgSize = `${markWidth}px ${markHeight}px`;
        inks.forEach((ink, idx) => {
          ink.style.backgroundSize = bgSize;
          ink.style.backgroundPosition = `-${idx * colWidth}px 0px`;
        });
        sheens.forEach((sheen, idx) => {
          sheen.style.webkitMaskSize = bgSize;
          sheen.style.webkitMaskPosition = `-${idx * colWidth}px 0px`;
          sheen.style.maskSize = bgSize;
          sheen.style.maskPosition = `-${idx * colWidth}px 0px`;
        });
        backs.forEach((back, idx) => {
          back.style.webkitMaskSize = bgSize;
          back.style.webkitMaskPosition = `-${idx * colWidth}px 0px`;
          back.style.maskSize = bgSize;
          back.style.maskPosition = `-${idx * colWidth}px 0px`;
        });
      };

      measure();
      window.addEventListener("resize", measure);

      destroySticker = () => {
        window.removeEventListener("resize", measure);
        stickerContainer.remove();
      };

      const pose = {
        alpha: 0,
        scale: N_CONFIG.SCALE,
        rotX: N_CONFIG.TILT,
        y: N_CONFIG.RISE,
        fold: L_CONFIG.FOLD,
        bend: 0,
        wave: 1,
        phase: 0,
        sheen: 0,
      };

      const drawFrame = () => {
        const radX = (pose.rotX * Math.PI) / 180;
        const cosX = Math.cos(radX);
        const sinX = Math.sin(radX);

        const currentWidth = markWidth * pose.scale;
        const currentHeight = markHeight * pose.scale;
        const effectiveColWidth = currentWidth / colsCount;

        const unrollCutoff = (1 - pose.fold) * colsCount;

        for (let i = 0; i < colsCount; i++) {
          const col = cols[i];
          const sheen = sheens[i];
          const u = i / colsCount;

          let bendAngle = 0;
          let waveDisp = 0;

          if (i > unrollCutoff) {
            const rollProg = (i - unrollCutoff) / (colsCount - unrollCutoff || 1);
            bendAngle = rollProg * rollProg * pose.bend;
          }

          if (pose.wave > 0.001) {
            const waveArg = u * Math.PI * 2 * L_CONFIG.FREQ + pose.phase;
            waveDisp = Math.sin(waveArg) * pose.wave * (currentHeight * 0.08);
          }

          const localX = (i - colsCount / 2) * effectiveColWidth;
          const localY = pose.y * currentHeight + waveDisp;

          const projY = localY * cosX;
          const projZ = -localY * sinX;

          const totalTilt = pose.rotX + bendAngle;
          const isFront = Math.cos((totalTilt * Math.PI) / 180) >= 0;

          if (isFront !== frontStates[i]) {
            frontStates[i] = isFront;
            backs[i].style.display = isFront ? "none" : "block";
            inks[i].style.display = isFront ? "block" : "none";
          }

          col.style.transform = `translate3d(${localX}px, ${projY}px, ${projZ}px) rotateX(${totalTilt}deg) scale(${pose.scale})`;

          if (pose.sheen > 0 && pose.sheen < 1) {
            const sheenPos = (pose.sheen * 2 - 1) * markWidth;
            sheen.style.backgroundPosition = `${sheenPos - i * colWidth}px 0px`;
          }
        }

        stickerContainer.style.opacity = String(pose.alpha);
      };

      gsap.ticker.add(drawFrame);
      removeTickerDraw = () => gsap.ticker.remove(drawFrame);

      const o = 0.3;
      tl.call(() => gsap.set(stickerContainer, { opacity: 1 }), undefined, o);
      tl.to(pose, { alpha: 1, duration: N_CONFIG.DURATION * N_CONFIG.FADE, ease: "none" }, o);
      tl.to(pose, { scale: 1, duration: N_CONFIG.DURATION, ease: `back.out(${N_CONFIG.BACK})` }, o);
      tl.to(
        pose,
        {
          rotX: 0,
          duration: N_CONFIG.DURATION,
          ease: `back.out(${N_CONFIG.BACK * N_CONFIG.BACK_TILT})`,
        },
        o
      );
      tl.to(pose, { y: 0, duration: N_CONFIG.DURATION, ease: "power3.out" }, o);

      const mTime = o + N_CONFIG.DURATION * L_CONFIG.START;
      tl.to(pose, { fold: 0, duration: L_CONFIG.UNROLL, ease: "sine.inOut" }, mTime);
      tl.to(
        pose,
        { bend: -L_CONFIG.BEND * L_CONFIG.REBOUND.DEPTH, duration: L_CONFIG.UNROLL, ease: "sine.inOut" },
        mTime
      );
      tl.to(
        pose,
        { bend: 0, duration: L_CONFIG.REBOUND.DURATION, ease: "sine.inOut" },
        mTime + L_CONFIG.UNROLL
      );
      tl.to(
        pose,
        { wave: 0, duration: L_CONFIG.SETTLE, ease: `elastic.out(1, ${L_CONFIG.RUBBER})` },
        o + N_CONFIG.DURATION * L_CONFIG.START
      );
      tl.to(pose, { phase: L_CONFIG.SPIN * L_CONFIG.SETTLE, duration: L_CONFIG.SETTLE, ease: "none" }, o);
      tl.to(pose, { sheen: 1, duration: H_CONST, ease: "power1.inOut" }, o + A_CONST);
      tl.call(
        () => removeTickerDraw?.(),
        undefined,
        mTime + Math.max(L_CONFIG.SETTLE, L_CONFIG.UNROLL + L_CONFIG.REBOUND.DURATION)
      );
    }

    const layerTimings = calculateLayerTimings(allLayers, {
      at: sweepAt,
      step: 0.09,
      spread: 0.4,
      duration: 1.05,
      drag: 0.018,
    });

    for (const item of layerTimings) {
      tl.to(item.el, { yPercent: -100, duration: item.duration, ease: M_EASE }, item.at);
    }

    const lastTiming = getLastTiming(layerTimings, sweepAt, 1.05);
    tl.call(startSweep, undefined, lastTiming.at + 0.33 * lastTiming.duration);
    tl.call(release, undefined, lastTiming.at + 0.55 * lastTiming.duration);

    if (markEl) {
      tl.set(markEl, { autoAlpha: 0 });
    }
    tl.set(root, { visibility: "hidden" });
    tl.call(() => destroySticker?.());

    return () => {
      tl.kill();
      removeTickerDraw?.();
      destroySticker?.();
      gsap.set(root, { clearProps: "visibility" });
      gsap.set([...allLayers, ...(markEl ? [markEl] : [])], {
        clearProps: "transform,opacity,visibility",
      });
    };
  }, []);

  // 2. Inter-Page Navigation Transitions
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.registerPlugin(ScrollTrigger);

    let state: "idle" | "covering" | "covered" | "revealing" = "idle";
    let isCovered = false;
    let hasArrived = false;
    let animTl: gsap.core.Timeline | null = null;
    let checkTimer: gsap.core.Tween | null = null;
    let revealTimer: gsap.core.Tween | null = null;
    let graceTimer: gsap.core.Tween | null = null;

    function to(url: string) {
      if (state !== "idle") return;
      if (prefersReduced) {
        routerRef.current.push(url, { scroll: false });
        return;
      }

      state = "covering";
      isCovered = false;
      hasArrived = false;
      graceTimer?.kill();
      graceTimer = null;

      hold();
      gsap.ticker.lagSmoothing(120, 33);
      gsap.set(root, { visibility: "visible" });

      const layers = getLayers(root).reverse();
      const timings = calculateLayerTimings(layers, {
        at: 0.2,
        step: 0.055,
        spread: 0.4,
        duration: 0.8,
        drag: 0.018,
      });

      animTl = gsap.timeline({
        onComplete: () => {
          state = "covered";
          isCovered = true;
          checkReveal();
        },
      });

      for (const item of timings) {
        animTl.fromTo(
          item.el,
          { yPercent: -100 },
          { yPercent: 0, duration: item.duration, ease: M_EASE },
          item.at
        );
      }

      const firstTiming = timings[0];
      const navAt = firstTiming ? firstTiming.at + firstTiming.duration : 0.8;
      animTl.call(
        () => {
          window.scrollTo(0, 0);
          try {
            routerRef.current.push(url, { scroll: false });
          } catch {
            // fallback if router interrupted
          }
        },
        [],
        navAt
      );

      checkTimer = gsap.delayedCall(6, () => {
        hasArrived = true;
        checkReveal();
      });
    }

    function checkReveal() {
      if (isCovered && hasArrived && state !== "revealing") {
        state = "revealing";
        checkTimer?.kill();
        checkTimer = null;
        revealTimer = gsap.delayedCall(0.1, reveal);
      }
    }

    function reveal() {
      revealTimer = null;
      window.scrollTo(0, 0);
      ScrollTrigger.refresh();
      animTl?.kill();
      animTl = gsap.timeline({
        onComplete: () => {
          state = "idle";
          gsap.set(root, { visibility: "hidden" });
        },
      });

      const layers = getLayers(root);
      const timings = calculateLayerTimings(layers, {
        at: 0,
        step: 0.055,
        spread: 0.4,
        duration: 0.8,
        drag: 0.018,
      });

      for (const item of timings) {
        animTl.to(
          item.el,
          { yPercent: -100, duration: item.duration, ease: M_EASE },
          item.at
        );
      }

      const lastTiming = getLastTiming(timings, 0, 0.8);
      const finishAt = lastTiming.at + lastTiming.duration;
      animTl.call(startSweep, [], lastTiming.at + 0.33 * lastTiming.duration);
      animTl.call(
        () => {
          release();
          graceTimer = gsap.delayedCall(0.35, () => {
            graceTimer = null;
            gsap.ticker.lagSmoothing(0);
          });
        },
        [],
        lastTiming.at + 0.55 * lastTiming.duration
      );
      animTl.set(root, { visibility: "hidden" }, finishAt);
    }

    const ac = new AbortController();
    document.addEventListener(
      "click",
      (e) => {
        const url = getInternalUrl(e);
        if (url) {
          e.preventDefault();
          to(url);
        }
      },
      { capture: true, signal: ac.signal }
    );

    transitionRef.current = {
      to,
      arrived: () => {
        if (state !== "idle" && state !== "revealing") {
          hasArrived = true;
          checkReveal();
        }
      },
      destroy: () => {
        ac.abort();
        checkTimer?.kill();
        revealTimer?.kill();
        graceTimer?.kill();
        animTl?.kill();
        if (state !== "idle") {
          gsap.set(root, { visibility: "hidden" });
          gsap.set(getLayers(root), { yPercent: -100 });
          release();
          gsap.ticker.lagSmoothing(0);
          state = "idle";
        }
      },
    };

    return () => {
      transitionRef.current?.destroy();
      transitionRef.current = null;
    };
  }, []);

  // When pathname changes (route arrived)
  useEffect(() => {
    transitionRef.current?.arrived();
  }, [pathname]);

  return (
    <>
      <noscript>
        <style>{`
          .site-preloader { display: none }
          html[data-loading] { overflow: visible }
          html[data-loading] .menu-tab, html[data-loading] .menu-sound { transform: none }
        `}</style>
      </noscript>
      <div ref={containerRef} className="site-preloader" aria-hidden="true">
        {PALETTE.map(({ id, bg }, s) => (
          <div
            key={id}
            className="preloader-layer arc-cut"
            data-tape={id}
            style={{
              background: bg,
              zIndex: PALETTE.length - s,
            }}
          />
        ))}
        <div
          className="preloader-sheet arc-cut"
          style={{ zIndex: PALETTE.length + 1 }}
        >
          <div
            className="preloader-mark"
            data-sticker="/assets/preloader-image.svg"
          />
        </div>
      </div>
    </>
  );
}
