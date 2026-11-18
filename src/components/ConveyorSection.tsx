"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { playOnce, SOUNDS } from "@/lib/sounds";
import { initHandNote } from "@/lib/aboutAnimations";

function getStride(track: HTMLElement): number {
  const repeat = Number(track.dataset.repeat) || 1;
  const vw = window.innerWidth / 100;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  return (track.getBoundingClientRect().width + gap) / repeat / vw;
}

function computeShift(track: HTMLElement, stride: number, to: number): number {
  const mark = track.querySelector<HTMLElement>(".conveyor-mark");
  if (!mark) return 0;
  const vw = window.innerWidth / 100;
  const oldX = track.style.getPropertyValue("--x");
  track.style.setProperty("--x", "0vw");
  const markRect = mark.getBoundingClientRect();
  const trackRect = track.getBoundingClientRect();
  if (oldX) {
    track.style.setProperty("--x", oldX);
  } else {
    track.style.removeProperty("--x");
  }

  const markCenter = (markRect.left + markRect.width / 2 - trackRect.left) / vw;
  const repeat = Number(track.dataset.repeat) || 1;
  let bestShift = 0;
  for (let i = 0; i < repeat; i++) {
    const target = 50 - markCenter - i * stride;
    if (i === 0 || Math.abs(target - to) < Math.abs(bestShift)) {
      bestShift = target - to;
    }
  }
  return bestShift;
}

export default function ConveyorSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => {};
    }

    gsap.registerPlugin(ScrollTrigger);

    const tracks = Array.from(section.querySelectorAll<HTMLElement>(".conveyor-track"));
    if (!tracks.length) return () => {};

    const trackData = tracks.map((el) => ({
      el,
      from: Number(el.dataset.xFrom),
      to: Number(el.dataset.xTo),
      stride: getStride(el),
      shift: 0,
    }));

    if (trackData.some((t) => Number.isNaN(t.from) || Number.isNaN(t.to))) {
      return () => {};
    }

    const updateShifts = () => {
      for (const t of trackData) {
        t.shift = computeShift(t.el, t.stride, t.to);
      }
    };
    updateShifts();

    const prog = { p: 0 };
    let ambientTime = 0;

    const updatePositions = () => {
      for (const t of trackData) {
        const baseX = t.shift + t.from + (t.to - t.from) * prog.p;
        const dir = Math.sign(t.to - t.from);
        const drift = (1.2 * ambientTime) % t.stride;
        t.el.style.setProperty("--x", `${baseX + dir * drift * (1 - prog.p)}vw`);
      }
    };
    updatePositions();

    const onResize = () => {
      for (const t of trackData) {
        t.stride = getStride(t.el);
      }
      updateShifts();
      updatePositions();
    };
    window.addEventListener("resize", onResize);

    const mark = section.querySelector<HTMLElement>(".conveyor-mark");
    const scaleState = { s: 1 };
    const updateScale = () => section.style.setProperty("--mark-scale", String(scaleState.s));

    const scrubTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "bottom bottom",
        end: "+=350%",
        pin: true,
        anticipatePin: 1,
        scrub: 0.8,
        refreshPriority: 3,
      },
    });

    scrubTl.to(prog, { p: 1, duration: 0.44, ease: "power1.inOut", onUpdate: updatePositions });

    if (mark) {
      scrubTl
        .to(scaleState, { s: 0.72, duration: 0.064, ease: "power2.out", onUpdate: updateScale })
        .to(scaleState, { s: 8, duration: 0.2, ease: "power2.out", onUpdate: updateScale })
        .to({}, { duration: 0.296 });

      scrubTl.call(
        () => {
          if ((scrubTl.scrollTrigger?.direction ?? 1) > 0) {
            playOnce(SOUNDS.LOGO_ZOOM);
          }
        },
        [],
        0.44
      );
    }

    let isVisible = false;
    const visibilityTrigger = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => {
        isVisible = self.isActive;
      },
    });

    const onTicker = (_time: number, deltaTime: number) => {
      if (isVisible && !(prog.p > 0)) {
        ambientTime += deltaTime / 1000;
        updatePositions();
      }
    };
    gsap.ticker.add(onTicker);

    const riseElements = Array.from(section.querySelectorAll<HTMLElement>(".conveyor-rise"));
    const repeatCount = Number(tracks[0]?.dataset.repeat) || 1;
    const chunkSize = Math.max(1, Math.round(riseElements.length / repeatCount));

    if (riseElements.length) {
      section.dataset.reveal = "live";
    }

    const riseTween = riseElements.length
      ? gsap.fromTo(
          riseElements,
          { yPercent: 130 },
          {
            yPercent: 0,
            duration: 0.6,
            ease: "power3.out",
            stagger: (idx) => (idx % chunkSize) * 0.09,
            scrollTrigger: {
              trigger: section,
              start: "top 75%",
              once: true,
            },
          }
        )
      : null;

    const cleanupHandNote = initHandNote(section);

    return () => {
      window.removeEventListener("resize", onResize);
      gsap.ticker.remove(onTicker);
      visibilityTrigger.kill();
      delete section.dataset.reveal;
      riseTween?.scrollTrigger?.kill();
      riseTween?.kill();
      scrubTl.scrollTrigger?.kill();
      scrubTl.kill();
      section.style.removeProperty("--mark-scale");
      cleanupHandNote();
      for (const t of trackData) {
        t.el.style.setProperty("--x", `${t.from}vw`);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="conveyor">
      <noscript />
      <div className="conveyor-belt">
        {/* Track 0 */}
        <div
          className="conveyor-track"
          data-x-from="-87.1"
          data-x-to="-163.1"
          data-repeat="3"
          style={{ "--x": "-87.1vw" } as React.CSSProperties}
        >
          {[0, 1, 2].map((loopIdx) => {
            const isHidden = loopIdx > 0;
            return (
              <div key={loopIdx} style={{ display: "contents" }} aria-hidden={isHidden || undefined}>
                <div className="conveyor-train is-xl is-full">
                  <img alt="" loading="lazy" decoding="async" src="/api/media/file/pill-1-1.webp" />
                </div>
                <div className="conveyor-train is-med is-inset">
                  <img alt="" loading="lazy" decoding="async" src="/api/media/file/Basket of tapes 1.webp" />
                </div>
                <div className="conveyor-train is-sm is-inset">
                  <img alt="" loading="lazy" decoding="async" src="/api/media/file/red cloth tape.webp" />
                </div>
                <div className="conveyor-train is-med has-text">
                  <div className="conveyor-claim">
                    <span className="conveyor-clip">
                      <span className="conveyor-rise">
                        <span className="conveyor-index" aria-hidden="true">
                          01
                        </span>
                      </span>
                    </span>
                    <h2 className="h2">
                      <span className="conveyor-clip">
                        <span className="conveyor-rise">ROWS OF</span>
                      </span>
                      <span className="conveyor-clip">
                        <span className="conveyor-rise">PRODUCTS.</span>
                      </span>
                    </h2>
                  </div>
                </div>
                <div className="conveyor-train is-xl is-full">
                  <img alt="" loading="lazy" decoding="async" src="/api/media/file/pill-1-full.webp" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Track 1 */}
        <div
          className="conveyor-track"
          data-x-from="-402.3"
          data-x-to="-284.8"
          data-repeat="3"
          style={{ "--x": "-402.3vw" } as React.CSSProperties}
        >
          {[0, 1, 2].map((loopIdx) => {
            const isHidden = loopIdx > 0;
            return (
              <div key={loopIdx} style={{ display: "contents" }} aria-hidden={isHidden || undefined}>
                <div className="conveyor-train is-sm is-full">
                  <img alt="" loading="lazy" decoding="async" src="/api/media/file/masking-circle.webp" />
                </div>
                <div className="conveyor-train is-xxl has-text">
                  <div className="conveyor-claim">
                    <span className="conveyor-clip">
                      <span className="conveyor-rise">
                        <span className="conveyor-index" aria-hidden="true">
                          02
                        </span>
                      </span>
                    </span>
                    <h2 className="h2">
                      <span className="conveyor-clip">
                        <span className="conveyor-rise">ENDLESS CHOICES THAT</span>
                      </span>
                      <span className="conveyor-clip">
                        <span className="conveyor-rise">SOMEHOW ALL BLUR TOGETHER.</span>
                      </span>
                    </h2>
                  </div>
                </div>
                <div className="conveyor-train is-med is-full">
                  <img alt="" loading="lazy" decoding="async" src="/api/media/file/pill-2-full.webp" />
                </div>
                <svg
                  className="conveyor-mark"
                  viewBox="0 0 346 226"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M322.945 92.7338C319.858 87.5561 318.685 81.4523 319.627 75.5039L320.87 67.6905L326.135 34.4657C326.946 29.3459 322.448 24.9631 317.382 25.9413L298.5 29.5875C294.587 30.3481 290.537 29.4378 287.276 27.1354C254.224 3.72249 204.237 -6.18497 151.695 3.9665C99.1544 14.118 56.4285 41.9426 34.417 76.0002C32.242 79.3618 28.8256 81.7036 24.9125 82.4642L6.03069 86.1104C0.965064 87.0887 -1.59253 92.8282 1.06313 97.2848L18.2684 126.16L22.3188 132.946C25.4055 138.124 26.5786 144.228 25.6369 150.176L24.3937 157.99L19.1282 191.214C18.3174 196.334 22.816 200.717 27.8816 199.739L46.7635 196.093C50.6765 195.332 54.7261 196.242 57.9872 198.545C91.0397 221.958 141.017 231.866 193.568 221.714C246.109 211.562 288.835 183.737 310.847 149.68C313.022 146.318 316.438 143.976 320.351 143.216L339.233 139.57C344.298 138.591 346.856 132.852 344.2 128.395L326.995 99.5198L322.945 92.7338Z"
                    fill="currentColor"
                  />
                </svg>
                <div className="conveyor-train is-xl is-roll">
                  <div className="hand-note conveyor-hand">
                    <span className="sr-only">same material. same roll. same routine.</span>
                    <div className="hand-ink" aria-hidden="true">
                      <svg className="hand-rule hand-rule--x" viewBox="0 0 100 10" preserveAspectRatio="none">
                        <path d="M 0 3 C 30 8 65 8 100 1" />
                      </svg>
                      <svg className="hand-rule hand-rule--y" viewBox="0 0 10 100" preserveAspectRatio="none">
                        <path d="M 6 0 C 2 33 3 70 6 100" />
                      </svg>
                      <span className="hand-line">same material.</span>
                      <span className="hand-line">same roll.</span>
                      <span className="hand-line">same routine.</span>
                    </div>
                  </div>
                  <img
                    className="conveyor-roll"
                    alt="A roll of masking tape with a length of it pulled out flat."
                    loading="lazy"
                    decoding="async"
                    src="/assets/masking tape rolling 1.png"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Track 2 */}
        <div
          className="conveyor-track"
          data-x-from="-80.1"
          data-x-to="-155.1"
          data-repeat="3"
          style={{ "--x": "-80.1vw" } as React.CSSProperties}
        >
          {[0, 1, 2].map((loopIdx) => {
            const isHidden = loopIdx > 0;
            return (
              <div key={loopIdx} style={{ display: "contents" }} aria-hidden={isHidden || undefined}>
                <div className="conveyor-train is-xl is-full">
                  <img alt="" loading="lazy" decoding="async" src="/api/media/file/pill-3-full.webp" />
                </div>
                <div className="conveyor-train is-med has-text">
                  <p className="conveyor-note">
                    <span className="conveyor-clip">
                      <span className="conveyor-rise">Very few stood out.</span>
                    </span>
                    <span className="conveyor-clip">
                      <span className="conveyor-rise">Even fewer felt memorable.</span>
                    </span>
                  </p>
                </div>
                <div className="conveyor-train is-med is-full">
                  <img alt="" loading="lazy" decoding="async" src="/api/media/file/pill-4-full.webp" />
                </div>
                <div className="conveyor-train is-sm is-inset">
                  <img alt="" loading="lazy" decoding="async" src="/api/media/file/Cloth tape black.webp" />
                </div>
                <div className="conveyor-train is-med has-text">
                  <div className="conveyor-claim">
                    <span className="conveyor-clip">
                      <span className="conveyor-rise">
                        <span className="conveyor-index" aria-hidden="true">
                          03
                        </span>
                      </span>
                    </span>
                    <h2 className="h2">
                      <span className="conveyor-clip">
                        <span className="conveyor-rise">SAME PLAIN</span>
                      </span>
                      <span className="conveyor-clip">
                        <span className="conveyor-rise">PACKAGING.</span>
                      </span>
                    </h2>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
