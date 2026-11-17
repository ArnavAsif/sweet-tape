"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { createHeroTape } from "@/lib/createHeroTape";
import { createLoop, playOnce, SOUNDS } from "@/lib/sounds";

export default function HeroTape3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let tapeInstance: any = null;
    let isDisposed = false;
    let isIntersecting = true;
    let topH = 0, rollTop = 0, tapeBottom = 0, cardboardTop = 0, cardboardBottom = 0;
    let state: "scrub" | "finale" | "done" = "scrub";
    let curScrubY = 0, currentM = 0;
    let timeline: gsap.core.Timeline | null = null;
    let driftInstance: any = null;
    const stretchSound = createLoop(SOUNDS.TAPE_STRETCH);
    let lastM = -1;

    const section = container.closest(".hero-section") || document.body;
    const cardboardWrapper = section.querySelector<HTMLElement>(".cardboard-wrapper");

    function getCumulativeOffsetTop(el: HTMLElement | null): number {
      let top = 0;
      for (let cur = el; cur; cur = cur.offsetParent as HTMLElement) {
        top += cur.offsetTop;
      }
      return top;
    }

    function updateBounds() {
      const rollCenter = getCumulativeOffsetTop(container) + container.clientWidth / 2;
      rollTop = rollCenter;
      topH = rollCenter - window.innerHeight / 2 - 200;
      tapeBottom = getCumulativeOffsetTop(container) + container.offsetHeight;
      cardboardTop = cardboardWrapper ? getCumulativeOffsetTop(cardboardWrapper) : tapeBottom;
      cardboardBottom = cardboardWrapper ? cardboardTop + cardboardWrapper.offsetHeight : tapeBottom;

      if (state === "done" && tapeInstance) {
        tapeInstance.pose(35, calcMaxM(), calcCardboardCutOffset(), 1);
      }
    }

    const calcMaxM = () => Math.min(cardboardBottom + 6.25 * (window.innerWidth / 100) - rollTop, tapeBottom - rollTop);
    const calcCardboardCutOffset = () => Math.max(cardboardTop + -4.167 * (window.innerWidth / 100) - rollTop, 0);

    const smoothStep = (x: number) => {
      const clamped = Math.max(0, Math.min(1, x));
      return clamped * clamped * (3 - 2 * clamped);
    };

    const softCap = (val: number, cap: number, span: number) => {
      return val <= cap ? val : cap + span * (1 - Math.exp(-(val - cap) / span));
    };

    function initDrift(tapeEl: HTMLElement, tapeInst: any) {
      let centerX = 0, centerY = 0;
      function measure() {
        const rect = tapeEl.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + window.scrollY + rect.width / 2;
      }
      let mouseX = 0, mouseY = 0, hasMoved = false;
      let rotX = 0, rotY = 0, rotZ = 0, spin = 0;
      const ac = new AbortController();

      if (window.matchMedia("(hover: hover), (max-width: 743px)").matches) {
        window.addEventListener(
          "pointermove",
          (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            hasMoved = true;
          },
          { signal: ac.signal, passive: true }
        );
      }

      const ro = new ResizeObserver(measure);
      ro.observe(tapeEl);
      window.addEventListener("resize", measure, { signal: ac.signal, passive: true });
      measure();

      const TWO_PI = 2 * Math.PI;
      const clampVal = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

      return {
        frame(timeSec: number, dtMs: number) {
          const dt = Math.min(dtMs / 1000, 0.1);
          const normX = hasMoved ? clampVal((mouseX - centerX) / (window.innerWidth / 2), -1, 1) : 0;
          const normY = hasMoved ? clampVal((mouseY - (centerY - window.scrollY)) / (window.innerHeight / 2), -1, 1) : 0;
          const easeFactor = 1 - Math.exp(-3 * dt);

          rotY += (9 * normX - rotY) * easeFactor;
          rotZ += (-2.5 * normX - rotZ) * easeFactor;
          rotX += (4.5 * normY - rotX) * easeFactor;
          spin += (5 * normX - spin) * (1 - Math.exp(-1.4 * dt));

          const waveY = 2.2 * Math.sin((timeSec * TWO_PI) / 7.3);
          const waveX = 1.4 * Math.sin((timeSec * TWO_PI) / 5.1 + 1.7);
          const waveZ = 0.9 * Math.sin((timeSec * TWO_PI) / 9.7 + 0.6);

          tapeInst.drift(waveX + rotX, waveY + rotY, waveZ + rotZ, spin);
        },
        stop() {
          ac.abort();
          ro.disconnect();
          tapeInst.drift(0, 0, 0, 0);
        },
      };
    }

    function onTick(time: number, deltaTime: number) {
      if (!tapeInstance || !isIntersecting || state === "finale") return;

      if (state === "done") {
        driftInstance?.frame(time, deltaTime);
        tapeInstance.draw();
        return;
      }

      if (prefersReducedMotion) {
        tapeInstance.pose(35, 0);
        tapeInstance.draw();
        return;
      }

      const scrollY = window.scrollY;
      curScrubY = Math.max(curScrubY, scrollY - topH, 0);
      const stepVal = smoothStep(curScrubY / 550);
      const angle = 35 + 55 * (stepVal * stepVal * (3 - 2 * stepVal));
      const scrubAccel = Math.max(curScrubY - 420, 0);
      const targetScreenBottom = scrollY + window.innerHeight - rollTop - 160;
      const maxM = calcMaxM();

      currentM = Math.max(
        currentM,
        softCap(
          softCap((4 * scrubAccel * scrubAccel) / (scrubAccel + 250), targetScreenBottom, 250),
          maxM,
          250
        ),
        0
      );

      tapeInstance.pose(angle, currentM);
      tapeInstance.draw();

      const speed = lastM < 0 || deltaTime <= 0 ? 0 : (currentM - lastM) / (deltaTime / 16.66);
      lastM = currentM;
      const speedNorm = smoothStep(speed / 2);
      stretchSound.set(0.8 * speedNorm, 0.85 + 0.4 * speedNorm);

      // When reaching near target cutoff
      if (currentM >= maxM - 4 && maxM > 0) {
        if (!tapeInstance || state !== "scrub") return;
        state = "finale";
        stretchSound.set(0);
        playOnce(SOUNDS.TAPE_CUT, 1);

        const targetCut = maxM;
        const cutOffset = calcCardboardCutOffset();
        const animState = { cut: 0, home: 0 };

        timeline = gsap
          .timeline({
            onUpdate() {
              tapeInstance?.pose(
                90 + -55 * animState.home,
                targetCut,
                animState.cut * cutOffset,
                animState.home
              );
              tapeInstance?.draw();
            },
            onComplete() {
              state = "done";
              timeline = null;
              if (tapeInstance) {
                driftInstance = initDrift(container, tapeInstance);
              }
            },
          })
          .to(animState, { cut: 1, duration: 0.7, ease: "power2.in" }, 0)
          .to(animState, { home: 1, duration: 1, ease: "power3.inOut" }, 0.35);
      }
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        if (!isIntersecting) {
          stretchSound.set(0);
          lastM = -1;
        }
      },
      { rootMargin: "50% 0px" }
    );
    io.observe(container);

    const ro = new ResizeObserver(() => {
      updateBounds();
      tapeInstance?.resize();
    });
    ro.observe(container);

    window.addEventListener("resize", updateBounds, { passive: true });
    updateBounds();

    gsap.ticker.add(onTick);

    // Initial entrance animation matching sweet-tape.com
    gsap.fromTo(
      container,
      { y: "13vw", scale: 0.82 },
      { y: 0, scale: 1, duration: 1.3, ease: "back.out(1.5)", delay: 0.1 }
    );

    createHeroTape(container, "/assets/tapes/Low-Noise-Tape.glb")
      .then((instance: any) => {
        if (isDisposed) {
          instance?.dispose();
          return;
        }
        tapeInstance = instance;
        instance?.resize();
        onTick(gsap.ticker.time, 0);
        container.dataset.tape = "live";
      })
      .catch((err) => {
        console.warn("Hero tape init error:", err);
      });

    return () => {
      isDisposed = true;
      window.removeEventListener("resize", updateBounds);
      io.disconnect();
      ro.disconnect();
      gsap.ticker.remove(onTick);
      timeline?.kill();
      stretchSound.stop();
      driftInstance?.stop();
      tapeInstance?.dispose();
      tapeInstance = null;
      delete container.dataset.tape;
    };
  }, []);

  return <div ref={mountRef} className="hero-tape" aria-hidden="true" />;
}
