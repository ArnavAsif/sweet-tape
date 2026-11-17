"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function GiantPinning() {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const section = containerRef.current;
    if (!section) return;

    const canvas = section.querySelector<HTMLElement>(".giant-canvas");
    if (!canvas) return;

    const rows = Array.from(section.querySelectorAll<HTMLElement>(".giant-row"));
    if (rows.length < 3) return;

    // Pinning horizontal timeline
    const totalScrollDist = window.innerWidth * 2.8;

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${totalScrollDist}`,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress;
        // Shift canvas horizontally and vertically as you scroll through rows
        const maxShiftX = -(rows[rows.length - 1].offsetLeft - rows[0].offsetLeft);
        const shiftX = p * maxShiftX;
        gsap.set(canvas, { x: shiftX });

        // Rotate rolling tape props based on scroll progress
        const rollingProps = section.querySelectorAll<HTMLElement>(".giant-prop--tape");
        rollingProps.forEach((tape, idx) => {
          const rot = p * 720 * (idx % 2 === 0 ? 1 : -1);
          gsap.set(tape, { rotation: rot });
        });
      },
    });

    return () => {
      st.kill();
    };
  }, []);

  return (
    <section ref={containerRef} className="giant-pinning">
      <span className="giant-brow" aria-hidden="true" />
      <div className="wrapper">
        <div className="giant-canvas">
          {/* Top Title */}
          <div className="top-title">
            <h5 className="subhead">WHY WE EXIST</h5>
            <h2 className="h2" aria-label="WE’RE HERE FOR THE EVERYDAY MOMENTS.">
              <span className="line">
                {"WE’RE HERE".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
              <span className="line">
                {"FOR THE EVERYDAY".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
              <span className="line">
                {"MOMENTS.".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c}</span>
                  </span>
                ))}
              </span>
            </h2>
          </div>

          {/* Row 1: TO CREATE */}
          <div className="giant-row down-to-horizontal">
            <h2 className="giant" aria-label="TO CREATE">
              <img
                className="giant-index"
                src="/assets/index-1.svg"
                alt=""
                aria-hidden="true"
                draggable={false}
              />
              <span className="clip" style={{ "--i": 0 } as React.CSSProperties}>
                <span className="char">T</span>
              </span>
              <span className="clip" style={{ "--i": 1 } as React.CSSProperties}>
                <span className="char">O</span>
              </span>
              <span
                className="giant-slot"
                aria-hidden="true"
                style={
                  {
                    "--giant-tilt": "-2.5deg",
                    "--giant-dy": "-0.26em",
                    "--giant-dx": "0.08em",
                    "--pp": "0.012",
                    "--pe": "power1.inOut",
                  } as React.CSSProperties
                }
              >
                <img className="giant-card" src="/assets/create-masking-first.webp" alt="" />
                <span
                  className="peel giant-tape"
                  style={
                    {
                      "--peel-w": "0.62em",
                      "--peel-h": "0.178em",
                      "--peel-from": "calc(var(--peel-edge) + 0.32 * var(--peel-span))",
                      "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
                      "--peel-dir": "88.4deg",
                      "--peel-back": "url(#peel-back-masking)",
                    } as React.CSSProperties
                  }
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
              </span>
              <span>
                {"CREATE".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c}</span>
                  </span>
                ))}
              </span>
            </h2>

            <span
              className="giant-prop giant-prop--shot"
              aria-hidden="true"
              style={
                {
                  "--px": "38%",
                  "--py": "18%",
                  "--pw": "19vw",
                  "--pr": "4deg",
                  "--pz": "2",
                  "--pp": "0.03",
                  "--pe": "none",
                } as React.CSSProperties
              }
            >
              <img src="/assets/create-double-last.webp" alt="" />
              <span
                className="peel giant-tape"
                style={
                  {
                    "--peel-w": "0.62em",
                    "--peel-h": "0.23em",
                    "--peel-from": "calc(var(--peel-edge) + 0.35 * var(--peel-span))",
                    "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
                    "--peel-dir": "88.4deg",
                    "--peel-back": "url(#peel-back-tissue)",
                  } as React.CSSProperties
                }
                data-peel="manual"
              >
                <span className="peel-face">
                  <span className="peel-turn">
                    <img src="/assets/double-side-x4.png" alt="" draggable={false} />
                  </span>
                </span>
                <span className="peel-flap" aria-hidden="true">
                  <span className="peel-turn">
                    <img src="/assets/double-side-x4.png" alt="" draggable={false} />
                  </span>
                </span>
              </span>
            </span>

            <img
              className="giant-prop giant-prop--tape"
              src="/api/media/file/double-roll.webp"
              alt=""
              aria-hidden="true"
              style={
                {
                  "--px": "82%",
                  "--py": "6%",
                  "--pw": "18vw",
                  "--pz": "4",
                } as React.CSSProperties
              }
            />

            <img
              className="giant-prop giant-prop--tape"
              src="/api/media/file/masking-roll.webp"
              alt=""
              aria-hidden="true"
              style={
                {
                  "--px": "15%",
                  "--py": "68%",
                  "--pw": "22vw",
                  "--pz": "4",
                } as React.CSSProperties
              }
            />

            <div className="giant-note" style={{ "--nx": "42%", "--ny": "72%" } as React.CSSProperties}>
              <span className="hand-line">every masterpiece</span>
              <span className="hand-line">starts with a strip</span>
            </div>

            <svg
              className="giant-arrow"
              viewBox="0 0 100 80"
              style={{ "--ax": "65%", "--ay": "65%", "--aw": "12vw" } as React.CSSProperties}
            >
              <path
                d="M10 20 Q 50 70 85 45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M75 40 L 85 45 L 82 55"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Row 2: TO FIX */}
          <div className="giant-row diagdown-to-horizontal">
            <h2 className="giant" aria-label="TO FIX">
              <img
                className="giant-index"
                src="/assets/index-2.svg"
                alt=""
                aria-hidden="true"
                draggable={false}
              />
              <span className="clip" style={{ "--i": 0 } as React.CSSProperties}>
                <span className="char">T</span>
              </span>
              <span className="clip" style={{ "--i": 1 } as React.CSSProperties}>
                <span className="char">O</span>
              </span>
              <span
                className="giant-slot"
                aria-hidden="true"
                style={
                  {
                    "--giant-tilt": "9.6deg",
                    "--giant-dy": "-0.36em",
                    "--giant-dx": "0.15em",
                    "--pp": "0.01",
                    "--pe": "none",
                  } as React.CSSProperties
                }
              >
                <img className="giant-card" src="/assets/cloth-tapex4.webp" alt="" />
                <span
                  className="peel giant-tape"
                  style={
                    {
                      "--peel-w": "0.62em",
                      "--peel-h": "0.2105em",
                      "--peel-from": "calc(var(--peel-edge) + 0.28 * var(--peel-span))",
                      "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
                      "--peel-dir": "88.4deg",
                      "--peel-back": "url(#peel-back-black)",
                    } as React.CSSProperties
                  }
                  data-peel="manual"
                >
                  <span className="peel-face">
                    <span className="peel-turn">
                      <img src="/assets/black-cloth-tape-x4.png" alt="" draggable={false} />
                    </span>
                  </span>
                  <span className="peel-flap" aria-hidden="true">
                    <span className="peel-turn">
                      <img src="/assets/black-cloth-tape-x4.png" alt="" draggable={false} />
                    </span>
                  </span>
                </span>
              </span>
              <span>
                {"FIX".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c}</span>
                  </span>
                ))}
              </span>
            </h2>

            <span
              className="giant-prop giant-prop--shot"
              aria-hidden="true"
              style={
                {
                  "--px": "32%",
                  "--py": "22%",
                  "--pw": "21vw",
                  "--pr": "-5deg",
                  "--pz": "1",
                  "--pp": "-0.025",
                  "--pe": "power1.inOut",
                } as React.CSSProperties
              }
            >
              <img src="/assets/cloth-tapex4-bottomleft.webp" alt="" />
              <span
                className="peel giant-tape"
                style={
                  {
                    "--peel-w": "0.62em",
                    "--peel-h": "0.2105em",
                    "--peel-from": "calc(var(--peel-edge) + 0.28 * var(--peel-span))",
                    "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
                    "--peel-dir": "88.4deg",
                    "--peel-back": "url(#peel-back-black)",
                  } as React.CSSProperties
                }
                data-peel="manual"
              >
                <span className="peel-face">
                  <span className="peel-turn">
                    <img src="/assets/black-cloth-tape-x4.png" alt="" draggable={false} />
                  </span>
                </span>
                <span className="peel-flap" aria-hidden="true">
                  <span className="peel-turn">
                    <img src="/assets/black-cloth-tape-x4.png" alt="" draggable={false} />
                  </span>
                </span>
              </span>
            </span>

            <img
              className="giant-prop giant-prop--tape"
              src="/api/media/file/cloth-roll.webp"
              alt=""
              aria-hidden="true"
              style={
                {
                  "--px": "12%",
                  "--py": "60%",
                  "--pw": "24vw",
                  "--pz": "3",
                } as React.CSSProperties
              }
            />

            <div className="giant-note" style={{ "--nx": "36%", "--ny": "12%" } as React.CSSProperties}>
              <span className="hand-line">the quick fix</span>
              <span className="hand-line">that outlasts</span>
              <span className="hand-line">the thing it fixed.</span>
            </div>

            <svg
              className="giant-arrow"
              viewBox="0 0 100 80"
              style={{ "--ax": "68%", "--ay": "40%", "--aw": "11vw" } as React.CSSProperties}
            >
              <path
                d="M15 70 Q 55 15 85 25"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M75 20 L 85 25 L 82 35"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Row 3: TO PROTECT */}
          <div className="giant-row diagup-to-horizontal">
            <h2 className="giant" aria-label="TO PROTECT">
              <img
                className="giant-index"
                src="/assets/index-3.svg"
                alt=""
                aria-hidden="true"
                draggable={false}
              />
              <span className="clip" style={{ "--i": 0 } as React.CSSProperties}>
                <span className="char">T</span>
              </span>
              <span className="clip" style={{ "--i": 1 } as React.CSSProperties}>
                <span className="char">O</span>
              </span>
              <span
                className="giant-slot"
                aria-hidden="true"
                style={
                  {
                    "--giant-tilt": "4.8deg",
                    "--giant-dy": "-0.1571em",
                    "--giant-dx": "0.0785em",
                    "--pp": "0.014",
                    "--pe": "sine.inOut",
                  } as React.CSSProperties
                }
              >
                <img className="giant-card" src="/assets/protect-opp-tape-x4-square.webp" alt="" />
                <span
                  className="peel giant-tape"
                  style={
                    {
                      "--peel-w": "0.62em",
                      "--peel-h": "0.1961em",
                      "--peel-from": "calc(var(--peel-edge) + 0.38 * var(--peel-span))",
                      "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
                      "--peel-dir": "88.4deg",
                      "--peel-back": "url(#peel-back-kraft)",
                    } as React.CSSProperties
                  }
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
              <span>
                {"PROTECT".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c}</span>
                  </span>
                ))}
              </span>
            </h2>

            <span
              className="giant-prop giant-prop--shot"
              aria-hidden="true"
              style={
                {
                  "--px": "98%",
                  "--py": "12%",
                  "--pw": "17vw",
                  "--pr": "5deg",
                  "--pz": "3",
                  "--pp": "0.045",
                  "--pe": "none",
                } as React.CSSProperties
              }
            >
              <img src="/assets/opp-tape-last.webp" alt="" />
              <span
                className="peel giant-tape"
                style={
                  {
                    "--peel-w": "0.62em",
                    "--peel-h": "0.1961em",
                    "--peel-from": "calc(var(--peel-edge) + 0.38 * var(--peel-span))",
                    "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
                    "--peel-dir": "88.4deg",
                    "--peel-back": "url(#peel-back-kraft)",
                  } as React.CSSProperties
                }
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

            <img
              className="giant-prop giant-prop--tape"
              src="/api/media/file/opp-roll.webp"
              alt=""
              aria-hidden="true"
              style={
                {
                  "--px": "42%",
                  "--py": "55%",
                  "--pw": "28vw",
                  "--pz": "4",
                } as React.CSSProperties
              }
            />

            <div className="giant-note" style={{ "--nx": "32%", "--ny": "70%" } as React.CSSProperties}>
              <span className="hand-line">from our hands</span>
              <span className="hand-line">to theirs,</span>
              <span className="hand-line">arriving whole.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
