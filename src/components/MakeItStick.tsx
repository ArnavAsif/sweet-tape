"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { playOnce, SOUNDS } from "@/lib/sounds";

export default function MakeItStick() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    if (!section) return;

    const chars = section.querySelectorAll(".char");
    const subText = section.querySelectorAll(".body-rise");
    const shotImg = section.querySelector(".stick-shot-img");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 75%",
      },
    });

    if (shotImg) {
      tl.fromTo(
        shotImg,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: "power2.out" },
        0
      );
    }

    if (chars.length) {
      tl.fromTo(
        chars,
        { y: "100%", opacity: 0 },
        { y: "0%", opacity: 1, duration: 0.5, stagger: 0.02, ease: "back.out(1.5)" },
        0.1
      );
    }

    if (subText.length) {
      tl.fromTo(
        subText,
        { y: "100%", opacity: 0 },
        { y: "0%", opacity: 1, duration: 0.4, stagger: 0.04, ease: "power2.out" },
        0.3
      );
    }

    // Scroll peel on stick-tape
    const peel = section.querySelector<HTMLElement>(".stick-tape");
    if (peel) {
      ScrollTrigger.create({
        trigger: section,
        start: "top 80%",
        end: "bottom 30%",
        scrub: true,
        onUpdate: (self) => {
          peel.style.setProperty("--peel", (1 - self.progress).toFixed(3));
        },
      });
    }

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="make-it-stick">
      <div className="stick-row">
        <div className="stick-shot">
          <img
            className="stick-shot-img"
            src="/assets/make-it-stick-2.webp"
            alt="Six rolls of SweetTape held in someone’s arms — stationery, OPP, cloth, masking and double-sided tissue tape."
          />
        </div>

        <div className="stick-card">
          <h2 className="stick-headline" aria-label="LET’S MAKE IT STICK!">
            <span className="line" aria-hidden="true">
              {"LET’S".split("").map((c, i) => (
                <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                  <span className="char">{c}</span>
                </span>
              ))}
            </span>
            <span className="line" aria-hidden="true">
              {"MAKE IT".split("").map((c, i) => (
                <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                  <span className="char">{c === " " ? "\u00A0" : c}</span>
                </span>
              ))}
            </span>
            <span className="line" aria-hidden="true">
              {"STICK!".split("").map((c, i) => (
                <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                  <span className="char">{c}</span>
                </span>
              ))}
            </span>
          </h2>

          <p className="stick-sub body-copy">
            <span className="sr-only">For everything that matters.</span>
            <span aria-hidden="true">
              {["For", "everything", "that", "matters."].map((w, i) => (
                <span key={i} className="body-clip">
                  <span className="body-rise">{w}</span>{" "}
                </span>
              ))}
            </span>
          </p>
        </div>

        <span
          className="peel stick-tape"
          style={
            {
              "--peel-w": "22.222vw",
              "--peel-h": "7.028vw",
              "--peel-from": "calc(var(--peel-edge) + 0.55 * var(--peel-span))",
              "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
              "--peel-dir": "90deg",
              "--peel-back": "url(#peel-back-kraft)",
            } as React.CSSProperties
          }
          data-peel="scroll"
          data-peel-in="1.08"
          onClick={() => playOnce(SOUNDS.TAPE_PRESS, 0.7)}
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
      </div>
    </section>
  );
}
