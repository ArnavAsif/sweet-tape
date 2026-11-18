"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const TAPE_CONFIG = { LAG: 0, DURATION: 0.55, EASE: "sine.inOut", FROM: 1 };
const PROP_START = 0.2;
const PROP_STEP = 0.08;
const PROP_TAPE = { DURATION: 0.42, EASE: "sine.inOut", FROM: 1 };
const POP_CONFIG = { DURATION: 0.62, EASE: "back.out(1.9)", RISE: 9, SCALE: 0.86, FADE: 0.2 };

function applyPeelTween(
  tl: gsap.core.Timeline,
  element: HTMLElement,
  at: number,
  config: { FROM: number; DURATION: number; EASE: string }
) {
  const state = { v: config.FROM };
  const update = () => element.style.setProperty("--peel", String(state.v));
  update();
  gsap.set(element, { autoAlpha: 0 });
  tl.set(element, { autoAlpha: 1 }, at);
  tl.to(state, { v: 0, duration: config.DURATION, ease: config.EASE, onUpdate: update }, at);
}

export default function ReimagineSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => {};
    }

    gsap.registerPlugin(ScrollTrigger);

    const tape = section.querySelector<HTMLElement>(".reimagine-tape");
    const tl = gsap.timeline({ paused: true });

    if (tape) {
      applyPeelTween(tl, tape, 0.67 + TAPE_CONFIG.LAG, TAPE_CONFIG);
    }

    const props = Array.from(section.querySelectorAll<HTMLElement>(".reimagine-prop"));
    props.forEach((prop, idx) => {
      const at = PROP_START + idx * PROP_STEP;
      if (prop.classList.contains("reimagine-prop-tape")) {
        applyPeelTween(tl, prop, at, PROP_TAPE);
        return;
      }
      const pop = prop.querySelector<HTMLElement>(".reimagine-pop");
      if (!pop) return;
      const { DURATION, EASE, RISE, SCALE, FADE } = POP_CONFIG;
      tl.fromTo(pop, { autoAlpha: 0 }, { autoAlpha: 1, duration: FADE, ease: "none" }, at);
      tl.fromTo(pop, { yPercent: RISE, scale: SCALE }, { yPercent: 0, scale: 1, duration: DURATION, ease: EASE }, at);
    });

    const stage = section.querySelector<HTMLElement>(".reimagine-stage") ?? section;
    const st = ScrollTrigger.create({
      trigger: stage,
      start: "top 60%",
      once: true,
      onEnter: () => tl.play(),
    });

    return () => {
      st.kill();
      tl.kill();
      if (tape) {
        tape.style.removeProperty("--peel");
        gsap.set(tape, { clearProps: "opacity,visibility" });
      }
      props.forEach((p) => {
        p.style.removeProperty("--peel");
        gsap.set(p, { clearProps: "opacity,visibility" });
      });
      gsap.set(section.querySelectorAll(".reimagine-pop"), {
        clearProps: "transform,opacity,visibility",
      });
    };
  }, []);

  return (
    <section ref={sectionRef} className="reimagine">
      <div className="reimagine-stage">
        <div className="reimagine-sheet">
          <img
            className="reimagine-paper"
            src="/assets/uncrumpled-paper/paper-1.webp"
            alt="A sheet of graph paper, opened out"
            width={1378}
            height={950}
            decoding="async"
          />
          <h2
            className="reimagine-copy"
            aria-label="TO REIMAGINE AN EVERYDAY ESSENTIAL AS SOMETHING MORE THOUGHTFUL, EXPRESSIVE AND FULL OF HEART."
          >
            <span className="line" aria-hidden="true">
              <span className="reimagine-word">
                <span className="clip" style={{ "--i": 0 } as React.CSSProperties}><span className="char">T</span></span>
                <span className="clip" style={{ "--i": 1 } as React.CSSProperties}><span className="char">O</span></span>
                <span className="clip" style={{ "--i": 2 } as React.CSSProperties}><span className="char">&nbsp;</span></span>
              </span>
              <span className="reimagine-word">
                {"REIMAGINE\u00A0".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
              <span className="reimagine-turn" aria-hidden="true" />
              <span className="reimagine-word">
                <span className="clip" style={{ "--i": 0 } as React.CSSProperties}><span className="char">A</span></span>
                <span className="clip" style={{ "--i": 1 } as React.CSSProperties}><span className="char">N</span></span>
                <span className="clip" style={{ "--i": 2 } as React.CSSProperties}><span className="char">&nbsp;</span></span>
              </span>
            </span>

            <span className="line" aria-hidden="true">
              <span className="reimagine-word">
                {"EVERYDAY\u00A0".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
              <span className="reimagine-turn" aria-hidden="true" />
              <span className="reimagine-word">
                {"ESSENTIAL\u00A0".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
              <span className="reimagine-word">
                <span className="clip" style={{ "--i": 0 } as React.CSSProperties}><span className="char">A</span></span>
                <span className="clip" style={{ "--i": 1 } as React.CSSProperties}><span className="char">S</span></span>
                <span className="clip" style={{ "--i": 2 } as React.CSSProperties}><span className="char">&nbsp;</span></span>
              </span>
              <span className="reimagine-turn" aria-hidden="true" />
            </span>

            <span className="line" aria-hidden="true">
              <span className="reimagine-word">
                {"SOMETHING\u00A0".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
              <span className="reimagine-word">
                <span className="reimagine-gap">
                  <span
                    className="peel reimagine-tape"
                    style={{
                      "--peel-w": "1.545em",
                      "--peel-h": "0.489em",
                      "--peel-from": "calc(var(--peel-edge) + 0 * var(--peel-span))",
                      "--peel-to": "calc(var(--peel-edge) + 1 * var(--peel-span))",
                      "--peel-dir": "90deg",
                      "--peel-back": "url(#peel-back-kraft)",
                      "--peel": 1,
                      opacity: 0,
                      visibility: "hidden",
                    } as React.CSSProperties}
                    data-peel="manual"
                  >
                    <span className="peel-face">
                      <span className="peel-turn">
                        <img src="/assets/opp-tape-x4.png" alt="" draggable={false} />
                      </span>
                    </span>
                    <span className="peel-flap" aria-hidden="true">
                      <span className="peel-turn">
                        <img src="/assets/opp-tape-x4.png" alt="" draggable={false} />
                      </span>
                    </span>
                  </span>
                </span>
                <span className="clip" style={{ "--i": 0 } as React.CSSProperties}>
                  <span className="char">&nbsp;</span>
                </span>
              </span>
              <span className="reimagine-turn" aria-hidden="true" />
              <span className="reimagine-word">
                {"MORE\u00A0".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
              <span className="reimagine-turn" aria-hidden="true" />
            </span>

            <span className="line" aria-hidden="true">
              <span className="reimagine-word">
                {"THOUGHTFUL,\u00A0".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
              <span className="reimagine-turn" aria-hidden="true" />
              <span className="reimagine-word">
                {"EXPRESSIVE\u00A0".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
            </span>

            <span className="line" aria-hidden="true">
              <span className="reimagine-word">
                {"AND\u00A0".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
              <span className="reimagine-turn" aria-hidden="true" />
              <span className="reimagine-word">
                {"FULL\u00A0".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
              <span className="reimagine-word">
                <span className="clip" style={{ "--i": 0 } as React.CSSProperties}><span className="char">O</span></span>
                <span className="clip" style={{ "--i": 1 } as React.CSSProperties}><span className="char">F</span></span>
                <span className="clip" style={{ "--i": 2 } as React.CSSProperties}><span className="char">&nbsp;</span></span>
              </span>
              <span className="reimagine-word">
                {"HEART.\u00A0".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
            </span>
          </h2>
        </div>

        {/* Props collage */}
        <div className="reimagine-props">
          <span
            className="peel reimagine-prop reimagine-prop-tape reimagine-prop-masking rei-mask-a"
            style={{
              "--peel-w": "calc(var(--pw)*var(--prop-u))",
              "--peel-h": "calc(var(--ph)*var(--prop-u))",
              "--peel-from": "calc(var(--peel-edge) + 0 * var(--peel-span))",
              "--peel-to": "calc(var(--peel-edge) + 1 * var(--peel-span))",
              "--peel-dir": "90deg",
              "--peel-back": "url(#peel-back-masking)",
              "--peel": 1,
              opacity: 0,
              visibility: "hidden",
            } as React.CSSProperties}
            data-peel="manual"
          >
            <span className="peel-face">
              <span className="peel-turn">
                <img src="/assets/masking-tape-x2.png" alt="" draggable={false} />
              </span>
            </span>
            <span className="peel-flap" aria-hidden="true">
              <span className="peel-turn">
                <img src="/assets/masking-tape-x2.png" alt="" draggable={false} />
              </span>
            </span>
          </span>

          <span
            className="peel reimagine-prop reimagine-prop-tape reimagine-prop-masking rei-mask-b"
            style={{
              "--peel-w": "calc(var(--pw)*var(--prop-u))",
              "--peel-h": "calc(var(--ph)*var(--prop-u))",
              "--peel-from": "calc(var(--peel-edge) + 0 * var(--peel-span))",
              "--peel-to": "calc(var(--peel-edge) + 1 * var(--peel-span))",
              "--peel-dir": "90deg",
              "--peel-back": "url(#peel-back-masking)",
              "--peel": 1,
              opacity: 0,
              visibility: "hidden",
            } as React.CSSProperties}
            data-peel="manual"
          >
            <span className="peel-face">
              <span className="peel-turn">
                <img src="/assets/masking-tape-x2.png" alt="" draggable={false} />
              </span>
            </span>
            <span className="peel-flap" aria-hidden="true">
              <span className="peel-turn">
                <img src="/assets/masking-tape-x2.png" alt="" draggable={false} />
              </span>
            </span>
          </span>

          <div className="reimagine-prop reimagine-shot rei-shot-a">
            <div className="reimagine-pop" style={{ opacity: 0, visibility: "hidden" }}>
              <img
                className="reimagine-shot-img"
                src="/assets/masking-x4-reimagine.webp"
                alt="A roll of SweetTape masking tape on a watercolour painting in progress"
                width={204}
                height={210}
                loading="eager"
                decoding="async"
              />
            </div>
          </div>

          <div className="reimagine-prop reimagine-shot rei-shot-b">
            <div className="reimagine-pop" style={{ opacity: 0, visibility: "hidden" }}>
              <img
                className="reimagine-shot-img"
                src="/assets/double-x4-reimagine.webp"
                alt="A roll of SweetTape double-sided tissue tape on a checkerboard cutout"
                width={204}
                height={210}
                loading="eager"
                decoding="async"
              />
            </div>
          </div>

          <div className="reimagine-prop reimagine-shot rei-mark-a">
            <div className="reimagine-pop" style={{ opacity: 0, visibility: "hidden" }}>
              <img className="reimagine-mark" src="/assets/doodle-heart.webp" alt="" loading="eager" />
            </div>
          </div>

          <div className="reimagine-prop reimagine-shot rei-mark-c">
            <div className="reimagine-pop" style={{ opacity: 0, visibility: "hidden" }}>
              <img className="reimagine-mark" src="/assets/full-of-heart-underline.svg" alt="" loading="eager" />
            </div>
          </div>

          <div className="reimagine-prop reimagine-shot rei-mark-b">
            <div className="reimagine-pop" style={{ opacity: 0, visibility: "hidden" }}>
              <img className="reimagine-mark" src="/assets/doodle-leftof-bottom-image.webp" alt="" loading="eager" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
