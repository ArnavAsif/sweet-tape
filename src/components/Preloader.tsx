"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { release, startSweep, isHeld } from "@/lib/loader";

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

export default function Preloader() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    if (!isHeld()) {
      gsap.set(root, { visibility: "hidden" });
      setHidden(true);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      release();
      setHidden(true);
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
    const tl = gsap.timeline({
      onComplete: () => {
        setHidden(true);
      },
    });

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

      const resize = () => {
        if (!markEl) return;
        markWidth = markEl.clientWidth || 320;
        markHeight = (118 * markWidth) / 191;
        colWidth = markWidth / colsCount;
        markEl.style.perspective = `${6.6 * markWidth}px`;
        stickerContainer.style.transformOrigin = "50% 25%";
        const bgSize = `${markWidth}px ${markHeight}px`;

        for (let i = 0; i < colsCount; i++) {
          const bgPos = `${-(i * colWidth)}px 0`;
          const col = cols[i];
          col.style.left = `${i * colWidth}px`;
          col.style.width = `${colWidth + 1.3}px`;
          col.style.height = `${markHeight}px`;

          inks[i].style.backgroundSize = bgSize;
          inks[i].style.backgroundPosition = bgPos;

          sheens[i].style.backgroundSize = bgSize;
          sheens[i].style.webkitMaskSize = bgSize;
          sheens[i].style.maskSize = bgSize;
          sheens[i].style.webkitMaskPosition = bgPos;
          sheens[i].style.maskPosition = bgPos;

          backs[i].style.webkitMaskSize = bgSize;
          backs[i].style.maskSize = bgSize;
          backs[i].style.webkitMaskPosition = bgPos;
          backs[i].style.maskPosition = bgPos;
        }
      };

      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(markEl);

      const pose = {
        scale: N_CONFIG.SCALE,
        rotX: N_CONFIG.TILT,
        y: 0,
        alpha: 0,
        bend: L_CONFIG.BEND,
        fold: L_CONFIG.FOLD,
        wave: L_CONFIG.WAVE,
        phase: 0,
        sheen: 0,
      };

      const angles = new Float64Array(colsCount);
      const posX = new Float64Array(colsCount);
      const posZ = new Float64Array(colsCount);

      const draw = () => {
        if (!markWidth) return;
        stickerContainer.style.opacity = String(pose.alpha);
        stickerContainer.style.transform = `translate3d(0, ${pose.y.toFixed(2)}px, 0) rotateX(${pose.rotX.toFixed(
          2
        )}deg) scale(${pose.scale.toFixed(4)})`;

        let curX = 0;
        let curZ = 0;

        for (let i = 0; i < colsCount; i++) {
          const u = (i + 0.5) / colsCount;
          let foldFactor = (u - (L_CONFIG.FOLD_AT - L_CONFIG.CREASE)) / (2 * L_CONFIG.CREASE);
          foldFactor = foldFactor < 0 ? 0 : foldFactor > 1 ? 1 : foldFactor;
          foldFactor = foldFactor * foldFactor * (3 - 2 * foldFactor);

          const angle =
            pose.bend * (u - 0.5) +
            pose.fold * foldFactor +
            pose.wave * Math.sin(2 * Math.PI * (L_CONFIG.FREQ * u - pose.phase));
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);

          angles[i] = angle;
          posX[i] = curX + (cosA * colWidth) / 2;
          posZ[i] = curZ + (sinA * colWidth) / 2;
          curX += cosA * colWidth;
          curZ += sinA * colWidth;
        }

        const offsetX = (markWidth - curX) / 2;
        const centerZ = posZ[32];

        for (let i = 0; i < colsCount; i++) {
          const tx = posX[i] + offsetX - (i * colWidth + colWidth / 2);
          const tz = posZ[i] - centerZ;
          const deg = (-(180 * angles[i]) / Math.PI).toFixed(2);
          cols[i].style.transform = `translate3d(${tx.toFixed(2)}px, 0, ${tz.toFixed(
            2
          )}px) rotateY(${deg}deg)`;

          const cosVal = Math.cos(angles[i]);
          const brightness = Math.max(0.2, 1 - 0.48 * (1 - cosVal)).toFixed(3);
          inks[i].style.filter = `brightness(${brightness})`;

          const isFront = cosVal >= 0;
          if (frontStates[i] !== isFront) {
            frontStates[i] = isFront;
            inks[i].style.opacity = isFront ? "1" : "0";
            sheens[i].style.opacity = isFront ? "1" : "0";
            backs[i].style.opacity = isFront ? "0" : "1";
          }
          if (!isFront) {
            const backBrightness = Math.max(0.2, 1 - (1 + cosVal)).toFixed(3);
            backs[i].style.filter = `brightness(${backBrightness})`;
          }
          sheens[i].style.backgroundPosition = `${(
            -(i * colWidth) +
            (2 * pose.sheen - 1) * markWidth
          ).toFixed(2)}px 0`;
        }
      };

      gsap.ticker.add(draw);
      removeTickerDraw = () => gsap.ticker.remove(draw);
      destroySticker = () => {
        ro.disconnect();
        stickerContainer.remove();
        markEl.style.removeProperty("perspective");
      };

      const o = P_CONST; // 1.0s delay of solid green screen
      tl.set(markEl, { autoAlpha: 0 }, 0);
      tl.set(markEl, { autoAlpha: 1 }, o);
      tl.set(
        pose,
        {
          scale: N_CONFIG.SCALE,
          rotX: N_CONFIG.TILT,
          y: () => N_CONFIG.RISE * (markEl?.clientWidth || 320),
          alpha: 0,
          bend: L_CONFIG.BEND,
          fold: L_CONFIG.FOLD,
          wave: L_CONFIG.WAVE,
          phase: 0,
          sheen: 0,
        },
        o
      );

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

  if (hidden) return null;

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
          style={{
            zIndex: PALETTE.length + 1,
          }}
        >
          <div className="preloader-mark" data-sticker="/assets/preloader-image.svg" />
        </div>
      </div>
    </>
  );
}
