"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { playOnce, SOUNDS } from "@/lib/sounds";
import { initPoke } from "@/lib/initPoke";

export default function MakeItStick() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    if (!section) return;

    const cleanupFns: (() => void)[] = [];

    // 1. Stick Reveal (shuffled characters)
    const chars = Array.from(section.querySelectorAll<HTMLElement>(".stick-headline .char"));
    if (chars.length) {
      gsap.set(chars, { y: 0 });
      const shuffled = [...chars].sort(() => Math.random() - 0.5);
      const headlineTl = gsap.fromTo(
        shuffled,
        { yPercent: 130, y: 0 },
        {
          yPercent: 0,
          y: 0,
          duration: 0.6,
          stagger: 0.02,
          ease: "power3.out",
          paused: true,
        }
      );

      const stHeadline = ScrollTrigger.create({
        trigger: section,
        start: "top 75%",
        once: true,
        onEnter: () => {
          section.dataset.reveal = "live";
          headlineTl.play();
        },
      });

      cleanupFns.push(() => {
        stHeadline.kill();
        headlineTl.kill();
        gsap.set(chars, { clearProps: "transform" });
      });
    }

    // 2. Body Reveal (.stick-sub .body-rise)
    const subCopy = section.querySelector<HTMLElement>(".stick-sub");
    const subRises = Array.from(section.querySelectorAll<HTMLElement>(".stick-sub .body-rise"));
    if (subCopy && subRises.length) {
      gsap.set(subRises, { yPercent: 110, y: 0 });
      const stBody = ScrollTrigger.create({
        trigger: subCopy,
        start: "top 88%",
        once: true,
        onEnter: () => {
          subCopy.dataset.reveal = "live";
          gsap.to(subRises, {
            yPercent: 0,
            y: 0,
            duration: 0.72,
            stagger: 0.09,
            ease: "power3.out",
          });
        },
      });

      cleanupFns.push(() => {
        stBody.kill();
        gsap.set(subRises, { clearProps: "transform" });
      });
    }

    // 3. Stick Parallax (.stick-shot-img pan)
    const shot = section.querySelector<HTMLElement>(".stick-shot");
    const shotImg = section.querySelector<HTMLElement>(".stick-shot-img");
    if (shot && shotImg) {
      let maxPan = 0;
      let centerY = 0;
      let span = 1;
      let isVisible = true;

      const updateShotBounds = () => {
        const shotH = shot.offsetHeight;
        const imgH = shotImg.offsetHeight;
        maxPan = Math.max((imgH - shotH) / 2, 0);
        let top = 0;
        for (let el: HTMLElement | null = shot; el; el = el.offsetParent as HTMLElement) {
          top += el.offsetTop;
        }
        centerY = top + shotH / 2;
        span = Math.max((window.innerHeight + shotH) / 2, 1);
      };

      const onParallaxTick = () => {
        if (!isVisible || maxPan <= 0) return;
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const progress = (scrollY + window.innerHeight / 2 - centerY) / span;
        const clamped = Math.max(-1, Math.min(1, progress));
        const pan = Math.round(2 * (clamped * maxPan)) / 2;
        if (shotImg.dataset.at !== String(pan)) {
          shotImg.dataset.at = String(pan);
          shotImg.style.setProperty("--stick-pan", `${pan}px`);
        }
      };

      const shotIo = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;
        },
        { rootMargin: "20% 0px" }
      );
      shotIo.observe(shot);

      const shotRo = new ResizeObserver(updateShotBounds);
      shotRo.observe(section);

      updateShotBounds();
      gsap.ticker.add(onParallaxTick);

      cleanupFns.push(() => {
        shotIo.disconnect();
        shotRo.disconnect();
        gsap.ticker.remove(onParallaxTick);
        shotImg.style.removeProperty("--stick-pan");
        delete shotImg.dataset.at;
      });
    }

    // 4. Scroll Peel on stick-tape
    const peel = section.querySelector<HTMLElement>(".stick-tape");
    if (peel) {
      const ease = gsap.parseEase("power1.inOut");
      let fromY = 0;
      let toY = 1;
      let isPeelVisible = false;

      const updatePeelBounds = () => {
        const screenH = window.innerHeight;
        let top = 0;
        for (let el: HTMLElement | null = peel; el; el = el.offsetParent as HTMLElement) {
          top += el.offsetTop;
        }
        const peelIn = parseFloat(peel.dataset.peelIn || "1.08");
        const peelOut = parseFloat(peel.dataset.peelOut || "0.46");
        fromY = top - screenH * peelIn;
        toY = top + peel.offsetHeight / 2 - screenH * peelOut;
        if (toY <= fromY) toY = fromY + 1;
      };

      const onPeelTick = () => {
        if (!isPeelVisible) return;
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const norm = Math.min(Math.max((scrollY - fromY) / (toY - fromY), 0), 1);
        const p = ease(norm);
        peel.style.setProperty("--peel", (Math.round(1000 * p) / 1000).toString());
      };

      const peelIo = new IntersectionObserver(
        ([entry]) => {
          isPeelVisible = entry.isIntersecting;
        },
        { rootMargin: "15% 0px" }
      );
      peelIo.observe(peel);

      const peelRo = new ResizeObserver(updatePeelBounds);
      peelRo.observe(peel);

      updatePeelBounds();
      gsap.ticker.add(onPeelTick);

      cleanupFns.push(() => {
        peelIo.disconnect();
        peelRo.disconnect();
        gsap.ticker.remove(onPeelTick);
        peel.style.removeProperty("--peel");
      });
    }

    // 5. Poke interaction on headline
    const pokeCleanup = initPoke(section, ".stick-headline");
    cleanupFns.push(pokeCleanup);

    return () => {
      cleanupFns.forEach((fn) => fn());
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
