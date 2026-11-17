"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { playOnce, SOUNDS } from "@/lib/sounds";

interface PreloaderProps {
  onComplete?: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Set loading attribute on document
    document.documentElement.dataset.loading = "";

    const markEl = el.querySelector<HTMLElement>(".preloader-mark");
    const stickerImg = markEl?.dataset.sticker || "/assets/preloader-image.svg";

    const layers = [
      el.querySelector<HTMLElement>(".preloader-sheet"),
      ...Array.from(el.querySelectorAll<HTMLElement>(".preloader-layer")),
    ].filter(Boolean) as HTMLElement[];

    // Build the 64-column sticker peel mesh
    const colsCount = 64;
    const stickerContainer = document.createElement("div");
    stickerContainer.className = "preloader-sticker";
    stickerContainer.style.opacity = "0";

    const cols: HTMLElement[] = [];
    const inks: HTMLElement[] = [];
    const sheens: HTMLElement[] = [];
    const backs: HTMLElement[] = [];
    const frontStates: boolean[] = [];

    const gradientAngle = 118;
    const gradientCenter = 30;
    const sheenAlpha = 0.16;

    for (let i = 0; i < colsCount; i++) {
      const col = document.createElement("div");
      col.className = "preloader-col";

      const ink = document.createElement("div");
      ink.className = "preloader-ink";
      ink.style.backgroundImage = `url("${stickerImg}")`;

      const sheen = document.createElement("div");
      sheen.className = "preloader-sheen";
      sheen.style.backgroundImage = `linear-gradient(${gradientAngle}deg, rgba(255,255,255,0) ${50 - gradientCenter}%, rgba(255,255,255,${sheenAlpha}) 50%, rgba(255,255,255,0) ${50 + gradientCenter}%)`;
      sheen.style.webkitMaskImage = `url("${stickerImg}")`;
      sheen.style.maskImage = `url("${stickerImg}")`;

      const back = document.createElement("div");
      back.className = "preloader-back";
      back.style.background = "#60a000";
      back.style.webkitMaskImage = `url("${stickerImg}")`;
      back.style.maskImage = `url("${stickerImg}")`;

      col.append(ink, sheen, back);
      stickerContainer.append(col);
      cols.push(col);
      inks.push(ink);
      sheens.push(sheen);
      backs.push(back);
      frontStates.push(true);
    }

    if (markEl) {
      markEl.append(stickerContainer);
    }

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
    if (markEl) ro.observe(markEl);

    const pose = {
      scale: 0.62,
      rotX: -78,
      y: 0,
      alpha: 0,
      bend: 1.85,
      fold: 1,
      wave: 0.35,
      phase: 0,
      sheen: 0,
    };

    const angles = new Float64Array(colsCount);
    const posX = new Float64Array(colsCount);
    const posZ = new Float64Array(colsCount);

    const draw = () => {
      if (!markWidth) return;
      stickerContainer.style.opacity = String(pose.alpha);
      stickerContainer.style.transform = `translate3d(0, ${pose.y.toFixed(2)}px, 0) rotateX(${pose.rotX.toFixed(2)}deg) scale(${pose.scale.toFixed(4)})`;

      let curX = 0;
      let curZ = 0;
      const foldAt = 0.31;
      const crease = 0.09;
      const freq = 1.95;

      for (let i = 0; i < colsCount; i++) {
        const u = (i + 0.5) / colsCount;
        let foldFactor = (u - (foldAt - crease)) / (2 * crease);
        foldFactor = foldFactor < 0 ? 0 : foldFactor > 1 ? 1 : foldFactor;
        foldFactor = foldFactor * foldFactor * (3 - 2 * foldFactor);

        const angle =
          pose.bend * (u - 0.5) +
          pose.fold * foldFactor +
          pose.wave * Math.sin(2 * Math.PI * (freq * u - pose.phase));
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
        cols[i].style.transform = `translate3d(${tx.toFixed(2)}px, 0, ${tz.toFixed(2)}px) rotateY(${deg}deg)`;

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
        sheens[i].style.backgroundPosition = `${(-(i * colWidth) + (2 * pose.sheen - 1) * markWidth).toFixed(2)}px 0`;
      }
    };

    gsap.ticker.add(draw);

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.ticker.remove(draw);
        ro.disconnect();
        stickerContainer.remove();
        delete document.documentElement.dataset.loading;
        window.dispatchEvent(new Event("sweettape:revealed"));
        setHidden(true);
        onComplete?.();
      },
    });

    // Sticker animation sequence
    const duration = 0.92;
    tl.to(pose, { alpha: 1, duration: duration * 0.28, ease: "none" }, 0.2);
    tl.to(pose, { scale: 1, duration, ease: "back.out(2.8)" }, 0.2);
    tl.to(pose, { rotX: 0, duration, ease: "back.out(2.24)" }, 0.2);
    tl.to(pose, { y: 0, duration, ease: "power3.out" }, 0.2);

    const unrollStart = 0.2 + duration * 0.26;
    tl.to(pose, { fold: 0, duration: 0.74, ease: "sine.inOut" }, unrollStart);
    tl.to(pose, { bend: -1.85 * 0.72, duration: 0.74, ease: "sine.inOut" }, unrollStart);
    tl.to(pose, { bend: 0, duration: 0.4, ease: "sine.inOut" }, unrollStart + 0.74);
    tl.to(pose, { wave: 0, duration: 2, ease: "elastic.out(1, 0.42)" }, unrollStart);
    tl.to(pose, { phase: 0.3 * 2, duration: 2, ease: "none" }, 0.2);
    tl.to(pose, { sheen: 1, duration: 1.06, ease: "power1.inOut" }, 0.2);

    // Audio cue
    tl.call(() => playOnce(SOUNDS.LOGO_ZOOM, 0.7), undefined, 0.3);

    // Curtain layer pull-up reveal
    const sweepStart = 2.4;
    tl.call(() => {
      window.dispatchEvent(new Event("sweettape:sweeping"));
      playOnce(SOUNDS.TAPE_STRETCH, 0.8);
    }, undefined, sweepStart);

    layers.forEach((layer, idx) => {
      const delay = sweepStart + idx * 0.09;
      tl.to(
        layer,
        {
          yPercent: -100,
          duration: 1.05 + idx * 0.02,
          ease: "power3.inOut",
        },
        delay
      );
    });

    if (markEl) {
      tl.to(markEl, { autoAlpha: 0, duration: 0.4 }, sweepStart + 0.2);
    }

    return () => {
      tl.kill();
      gsap.ticker.remove(draw);
      ro.disconnect();
      delete document.documentElement.dataset.loading;
    };
  }, [onComplete]);

  if (hidden) return null;

  return (
    <div ref={containerRef} className="site-preloader" aria-hidden="true">
      <div
        className="preloader-layer arc-cut"
        data-tape="stationery"
        style={{ background: "#FF7B5F", zIndex: 6 }}
      />
      <div
        className="preloader-layer arc-cut"
        data-tape="masking"
        style={{ background: "#fa8005", zIndex: 5 }}
      />
      <div
        className="preloader-layer arc-cut"
        data-tape="opp-quiet"
        style={{ background: "#F7D000", zIndex: 4 }}
      />
      <div
        className="preloader-layer arc-cut"
        data-tape="opp"
        style={{ background: "#b6fe00", zIndex: 3 }}
      />
      <div
        className="preloader-layer arc-cut"
        data-tape="double"
        style={{ background: "#50CBFF", zIndex: 2 }}
      />
      <div
        className="preloader-layer arc-cut"
        data-tape="cloth"
        style={{ background: "#2E3EAC", zIndex: 1 }}
      />
      <div className="preloader-sheet arc-cut" style={{ zIndex: 7 }}>
        <div className="preloader-mark" data-sticker="/assets/preloader-image.svg" />
      </div>
    </div>
  );
}
