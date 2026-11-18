"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createTapeViewer } from "@/lib/createTapeViewer";

const MODEL = "/assets/tapes/Header-Brown-Inner.glb";
const FINISH = {
  "Face Brown": { metalness: 0.05, roughness: 2 },
  Tape: { roughness: 0.4 },
};
const FILM = { clarity: 0.09 };
const LAMP = { x: 1.75, y: 0.1, z: -0.4, power: 1.4 };

const REVEAL_DURATION = 0.6;
const REVEAL_EASE = "power3.out";
const CHAR_STAGGER = 0.025;

const TAG = {
  FROM: -100,
  PERSPECTIVE: 420,
  ORIGIN: "50% 50%",
  DURATION: 0.85,
  EASE: "back.out(1.4)",
};

const BODY = {
  HIDDEN: 135,
  LAG: 0.05,
  DURATION: 0.72,
  STAGGER: 0.09,
  EASE: "power3.out",
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function ReasonSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const rollIn = section.querySelector<HTMLElement>(".reason-roll-in");
    const fallbackImg = rollIn?.querySelector<HTMLImageElement>("img") ?? null;
    const kicker = section.querySelector<HTMLElement>(".reason-kicker");
    const chars = Array.from(section.querySelectorAll<HTMLElement>(".char"));
    const bodyRises = Array.from(section.querySelectorAll<HTMLElement>(".body-rise"));
    const mark = section.querySelector<HTMLElement>(".reason-mark");

    // 1. Mount 3D Tape Roll
    let disposeViewer: (() => void) | null = null;
    if (rollIn) {
      if (fallbackImg) fallbackImg.style.visibility = "hidden";
      const abortCtrl = new AbortController();
      let isAborted = false;

      createTapeViewer(
        rollIn,
        [MODEL],
        { key: 0.26, ambient: 0.58, fill: 0.12, env: 0.16, lamp: LAMP },
        FINISH,
        FILM
      )
        .then((viewer: any) => {
          if (isAborted) {
            viewer.dispose();
            return;
          }
          viewer.show(MODEL);
          viewer.spin(25);
          viewer.point(-0.25, -0.3);

          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
          }

          let centerX = 0;
          let centerY = 0;
          let isIntersecting = false;

          const updateCenter = () => {
            if (!isIntersecting) return;
            const rect = rollIn.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;
          };

          const observer = new IntersectionObserver(([entry]) => {
            isIntersecting = entry.isIntersecting;
            if (isIntersecting) {
              updateCenter();
            } else {
              viewer.point(-0.25, -0.3);
            }
          });
          observer.observe(rollIn);

          window.addEventListener("scroll", updateCenter, { signal: abortCtrl.signal, passive: true });
          window.addEventListener("resize", updateCenter, { signal: abortCtrl.signal, passive: true });

          if (window.matchMedia("(hover: hover), (max-width: 743px)").matches) {
            window.addEventListener(
              "pointermove",
              (e) => {
                if (!isIntersecting) return;
                const radius = 0.5 * Math.min(window.innerWidth, window.innerHeight) * 0.42;
                viewer.point(-0.25 + (e.clientX - centerX) / radius, -0.3 + (e.clientY - centerY) / radius);
              },
              { signal: abortCtrl.signal, passive: true }
            );
          }

          disposeViewer = () => {
            observer.disconnect();
            viewer.dispose();
          };
        })
        .catch(() => {
          if (fallbackImg) fallbackImg.style.visibility = "visible";
        });

      disposeViewer = () => {
        isAborted = true;
        abortCtrl.abort();
      };
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => {
        disposeViewer?.();
      };
    }

    gsap.registerPlugin(ScrollTrigger);

    const fallState = { v: 0 };
    const spaceState = { v: 0 };
    const openState = { v: 0 };

    const updateFall = () => section.style.setProperty("--reason-fall", String(fallState.v));
    const updateSpace = () => section.style.setProperty("--reason-space", String(spaceState.v));
    const updateOpen = () => mark?.style.setProperty("--reason-open", String(openState.v));

    updateFall();
    updateSpace();
    updateOpen();
    section.dataset.reveal = "live";

    // Fall scrub timeline
    const fallTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=100%",
        scrub: 0.5,
        refreshPriority: 2,
      },
    });
    fallTl.fromTo(fallState, { v: 0 }, { v: 1, duration: 1, ease: "power2.inOut", onUpdate: updateFall });

    // Entrance timeline
    const enterTl = gsap.timeline({ paused: true });

    if (kicker) {
      enterTl.fromTo(
        kicker,
        {
          autoAlpha: 0,
          rotateY: TAG.FROM,
          transformPerspective: TAG.PERSPECTIVE,
          transformOrigin: TAG.ORIGIN,
        },
        { autoAlpha: 1, rotateY: 0, duration: TAG.DURATION, ease: TAG.EASE },
        0
      );
    }

    if (chars.length) {
      enterTl.fromTo(
        shuffle(chars),
        { yPercent: 155 },
        { yPercent: 0, duration: REVEAL_DURATION, stagger: CHAR_STAGGER, ease: REVEAL_EASE },
        0
      );
    }

    const spaceDelay = (chars.length ? REVEAL_DURATION + CHAR_STAGGER * (chars.length - 1) : 0) + 0.15;
    enterTl.fromTo(
      spaceState,
      { v: 0 },
      { v: 1, duration: 0.55, ease: "power2.inOut", onUpdate: updateSpace },
      spaceDelay
    );

    const markDelay = spaceDelay + 0.55 - 0.28;
    if (mark) {
      enterTl.fromTo(
        openState,
        { v: 0 },
        { v: 1, duration: 0.7, ease: "back.out(1.9)", onUpdate: updateOpen },
        markDelay
      );
    }

    if (bodyRises.length) {
      enterTl.fromTo(
        bodyRises,
        { yPercent: BODY.HIDDEN },
        { yPercent: 0, duration: BODY.DURATION, stagger: BODY.STAGGER, ease: BODY.EASE },
        markDelay + 0.7 + BODY.LAG
      );
    }

    if (rollIn) {
      enterTl.fromTo(
        rollIn,
        { yPercent: 26, scale: 0.72 },
        { yPercent: 0, scale: 1, duration: 1.4, ease: "back.out(1.4)" },
        0
      );
      enterTl.fromTo(rollIn, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: "none" }, 0);
    }

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: () => `top top-=${Math.round(0.82 * window.innerHeight)}`,
      refreshPriority: 2,
      onEnter: () => {
        enterTl.timeScale(1);
        enterTl.play();
      },
      onLeaveBack: () => {
        enterTl.timeScale(1.6);
        enterTl.reverse();
      },
    });

    return () => {
      disposeViewer?.();
      trigger.kill();
      enterTl.kill();
      fallTl.scrollTrigger?.kill();
      fallTl.kill();
      delete section.dataset.reveal;
      if (kicker) gsap.set(kicker, { clearProps: "all" });
      if (rollIn) gsap.set(rollIn, { clearProps: "all" });
      gsap.set([...chars, ...bodyRises], { clearProps: "transform" });
      section.style.removeProperty("--reason-fall");
      section.style.removeProperty("--reason-space");
      mark?.style.removeProperty("--reason-open");
    };
  }, []);

  return (
    <section ref={sectionRef} className="reason" style={{ "--reason-fall": 0, "--reason-space": 0 } as React.CSSProperties}>
      <noscript />
      <div className="reason-stage">
        <div className="reason-sheet arc-cut" aria-hidden="true">
          <div className="reason-wrapper">
            <p className="subhead reason-kicker">MADE FOR A REASON</p>
            <h2 className="reason-title" aria-label="THAT'S WHY SWEET TAPE EXISTS.">
              <span className="line" aria-hidden="true">
                <span className="reason-word">
                  {"THAT'S\u00A0".split("").map((c, i) => (
                    <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                      <span className="char">{c === " " ? "\u00A0" : c}</span>
                    </span>
                  ))}
                </span>
                <span className="reason-word">
                  {"WHY".split("").map((c, i) => (
                    <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                      <span className="char">{c}</span>
                    </span>
                  ))}
                </span>
              </span>

              <span className="line" aria-hidden="true">
                <span className="reason-word">
                  {"SWEET".split("").map((c, i) => (
                    <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                      <span className="char">{c}</span>
                    </span>
                  ))}
                </span>
                <span className="reason-word">
                  <span className="reason-gap">
                    <span className="reason-mark" style={{ "--reason-open": 0 } as React.CSSProperties}>
                      <svg
                        className="reason-blob"
                        viewBox="0 0 187 124"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          d="M82.0264 3.11535C110.022 -2.29367 136.744 2.96497 154.485 15.531C155.993 16.5957 157.859 17.0117 159.653 16.663L159.654 16.6629L169.639 14.7346C172.902 14.1048 175.794 16.8184 175.484 20.0647L175.444 20.3809L172.66 37.9492L172.66 37.9502L172.003 42.0818C171.542 44.996 172.117 47.9865 173.629 50.523L175.77 54.1118L175.771 54.1117L184.869 69.3808C186.625 72.3272 184.937 76.1333 181.572 76.7832L171.589 78.7104C169.792 79.0598 168.218 80.137 167.213 81.6911C155.398 99.9705 132.544 114.81 104.548 120.219C76.5469 125.629 49.8297 120.37 32.0885 107.804L31.8021 107.611C30.3479 106.689 28.6033 106.345 26.9213 106.672L26.9204 106.672L16.9362 108.6C13.5682 109.25 10.5941 106.337 11.13 102.954L13.9141 85.3853L13.914 85.3843L14.5711 81.2537L14.6458 80.7061C14.9572 77.9667 14.3631 75.1897 12.9454 72.8115L12.9453 72.8106L10.8041 69.2228L1.70631 53.9537C-0.0495127 51.0072 1.63715 47.2012 5.0024 46.5513L14.9856 44.6231L15.3194 44.5498C16.9766 44.1381 18.42 43.1005 19.3627 41.6434C31.177 23.3642 54.0302 8.5246 82.0264 3.11535Z"
                          fill="currentColor"
                          stroke="var(--reason-sheet)"
                          strokeWidth="2"
                        />
                      </svg>
                      <span className="reason-mark-copy" aria-hidden="true">
                        <span className="body-clip">
                          <span className="body-rise">GOOD</span>
                        </span>
                        <span className="body-clip">
                          <span className="body-rise">THINGS</span>
                        </span>
                        <span className="body-clip">
                          <span className="body-rise">STICK</span>
                        </span>
                      </span>
                    </span>
                  </span>
                  {"TAPE".split("").map((c, i) => (
                    <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                      <span className="char">{c}</span>
                    </span>
                  ))}
                </span>
              </span>

              <span className="line" aria-hidden="true">
                <span className="reason-word">
                  {"EXISTS.".split("").map((c, i) => (
                    <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                      <span className="char">{c}</span>
                    </span>
                  ))}
                </span>
              </span>
            </h2>

            <div className="reason-roll">
              <div className="reason-roll-in">
                <img
                  alt="A roll of SweetTape"
                  draggable={false}
                  src="/assets/opp-tape-inner-product.webp"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
