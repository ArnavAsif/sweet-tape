"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function WaveBand() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const headText = section.dataset.head ?? "WHEN LIFE GETS MESSY,";
    const tailText = section.dataset.tail ?? "SOMETHING HAS TO HOLD";
    const gapSpaces = "\u00A0".repeat(6);
    const unitText = headText + gapSpaces + tailText + "\u00A0\u00A0\u00A0";
    const slotAt = headText.length;
    const slotLen = gapSpaces.length;

    const textEl = section.querySelector<SVGTextElement>("text");
    const textPath = section.querySelector<SVGTextPathElement>("textPath");
    const path = section.querySelector<SVGPathElement>("#wave-band-path");
    const badges = Array.from(section.querySelectorAll<SVGImageElement>(".band-badge"));

    if (!textEl || !textPath || !path) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let tween: gsap.core.Tween | null = null;
    let tickerFn: (() => void) | null = null;
    let io: IntersectionObserver | null = null;
    let isDisposed = false;
    let isIntersecting = true;

    // --- Performance Optimization: Pre-sampled Path LUT ---
    // Instead of calling path.getPointAtLength 18 times on every frame (which forces synchronous layout),
    // we pre-sample the static Bezier path once into a Look-Up Table (LUT).
    // Runtime badge positioning is then an instant O(1) array access.
    const totalLen = path.getTotalLength();
    const LUT_SAMPLES = 2500;
    const lut: { x: number; y: number; angle: number }[] = new Array(LUT_SAMPLES + 1);

    for (let i = 0; i <= LUT_SAMPLES; i++) {
      const dist = (i / LUT_SAMPLES) * totalLen;
      const pt = path.getPointAtLength(dist);
      const ptBefore = path.getPointAtLength(Math.max(dist - 8, 0));
      const ptAfter = path.getPointAtLength(Math.min(dist + 8, totalLen));
      const angle = (180 * Math.atan2(ptAfter.y - ptBefore.y, ptAfter.x - ptBefore.x)) / Math.PI;
      lut[i] = {
        x: Math.round(pt.x * 10) / 10,
        y: Math.round(pt.y * 10) / 10,
        angle: Math.round(angle * 10) / 10,
      };
    }

    function positionBadges(startOffset: number, unitLen: number, badgeCenterOffset: number) {
      badges.forEach((badge, idx) => {
        const dist = startOffset + idx * unitLen + badgeCenterOffset;
        if (dist < 0 || dist > totalLen) {
          badge.style.visibility = "hidden";
          return;
        }
        const lutIdx = Math.min(
          LUT_SAMPLES,
          Math.max(0, Math.round((dist / totalLen) * LUT_SAMPLES))
        );
        const sample = lut[lutIdx];
        badge.setAttribute("transform", `translate(${sample.x} ${sample.y}) rotate(${sample.angle})`);
        badge.style.visibility = "visible";
      });
    }

    document.fonts.ready.then(() => {
      if (isDisposed) return;

      let unitLen = 1400;
      try {
        unitLen = textEl.getSubStringLength(0, unitText.length);
      } catch {
        unitLen = 1400;
      }

      // Calculate path entrance start offset
      let initialStartOffset = 40;
      if (path) {
        let left = 0;
        let right = totalLen;
        for (let i = 0; i < 40; i++) {
          const mid = (left + right) / 2;
          const idx = Math.min(
            LUT_SAMPLES,
            Math.max(0, Math.round((mid / totalLen) * LUT_SAMPLES))
          );
          if (lut[idx].x < 0) {
            left = mid;
          } else {
            right = mid;
          }
        }
        initialStartOffset = (left + right) / 2 + 40;
      }

      let badgeCenterOffset = 450;
      try {
        badgeCenterOffset =
          textEl.getSubStringLength(0, slotAt) + textEl.getSubStringLength(slotAt, slotLen) / 2;
      } catch {
        badgeCenterOffset = 450;
      }

      if (prefersReducedMotion) {
        textPath.setAttribute("startOffset", String(initialStartOffset));
        positionBadges(initialStartOffset, unitLen, badgeCenterOffset);
        return;
      }

      const animTarget = { offset: initialStartOffset };

      tween = gsap.to(animTarget, {
        offset: initialStartOffset - unitLen,
        duration: unitLen / 120,
        ease: "none",
        repeat: -1,
        paused: true,
        onUpdate() {
          textPath.setAttribute("startOffset", animTarget.offset.toFixed(1));
          positionBadges(animTarget.offset, unitLen, badgeCenterOffset);
        },
      });

      positionBadges(initialStartOffset, unitLen, badgeCenterOffset);

      let lastScrollY = window.scrollY;
      let currentScale = 0.9;
      tween.timeScale(currentScale);
      const clampSpeed = gsap.utils.clamp(-4, 5);

      tickerFn = () => {
        if (!isIntersecting) return;
        const curY = window.scrollY;
        const delta = curY - lastScrollY;
        lastScrollY = curY;

        const targetSpeed = clampSpeed(0.9 + 0.4 * delta);
        const lerpFactor = Math.abs(targetSpeed - 0.9) > Math.abs(currentScale - 0.9) ? 0.1 : 0.03;
        currentScale += (targetSpeed - currentScale) * lerpFactor;
        tween?.timeScale(currentScale);
      };

      gsap.ticker.add(tickerFn);

      io = new IntersectionObserver(
        ([entry]) => {
          isIntersecting = entry.isIntersecting;
          if (isIntersecting) {
            tween?.play();
          } else {
            tween?.pause();
          }
        },
        { rootMargin: "300px 0px" }
      );
      io.observe(section);
    });

    return () => {
      isDisposed = true;
      if (tickerFn) gsap.ticker.remove(tickerFn);
      tween?.kill();
      io?.disconnect();
    };
  }, []);

  const repeatCount = 6;
  const singleUnit = "WHEN LIFE GETS MESSY,\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0SOMETHING HAS TO HOLD\u00A0\u00A0\u00A0";
  const repeatedText = Array(repeatCount).fill(singleUnit).join("");

  return (
    <section
      ref={sectionRef}
      className="wave-band"
      aria-hidden="true"
      data-head="WHEN LIFE GETS MESSY,"
      data-tail="SOMETHING HAS TO HOLD"
    >
      <svg
        viewBox="-80 60 1760 540"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <path
            id="wave-band-path"
            d="M -3200,330 Q -2800,460 -2400,330 Q -2000,200 -1600,330 Q -1200,460 -800,330 Q -400,200 0,330 Q 400,460 800,330 Q 1200,200 1600,330 Q 2000,460 2400,330 Q 2800,200 3200,330 Q 3600,460 4000,330 Q 4400,200 4800,330 Q 5200,460 5600,330 Q 6000,200 6400,330 Q 6800,460 7200,330 Q 7600,200 8000,330"
            fill="none"
          />
          <pattern
            id="wave-band-grain"
            patternUnits="userSpaceOnUse"
            x="0"
            y="60"
            width="1600"
            height="897"
          >
            <image href="/assets/paper-overlay.webp" width="1600" height="897" />
          </pattern>
        </defs>

        <use href="#wave-band-path" className="band-tape" />
        <text className="band-text" dy="0.35em">
          <textPath href="#wave-band-path" startOffset="3295">
            {repeatedText}
          </textPath>
        </text>

        {[0, 1, 2, 3, 4, 5].map((i) => (
          <image
            key={i}
            className="band-badge"
            href="/assets/sibling-opp-normal.webp"
            x="-75"
            y="-75"
            width="150"
            height="150"
            style={{ visibility: "hidden" }}
          />
        ))}

        <use href="#wave-band-path" className="band-tape-grain" />
      </svg>
    </section>
  );
}
