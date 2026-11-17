"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { playOnce, SOUNDS } from "@/lib/sounds";

interface Product {
  id: string;
  name: string;
  word: string;
  ring: string;
  bg: string;
  wordColor: string;
  tagBg: string;
  tagInk: string;
  ink: string;
  card: string;
  model: string;
  roll: string;
  showcase: string[];
  strip: string;
  tags: string[];
  copy: string;
  letters: string[];
}

const PRODUCTS: Product[] = [
  {
    id: "masking",
    name: "Masking tape",
    word: "creative",
    ring: "#fff1a2",
    bg: "#fa8005",
    wordColor: "#fcd805",
    tagBg: "#FFDC13",
    tagInk: "#D7791A",
    ink: "#FFDC13",
    card: "/api/media/file/masking-card.webp",
    model: "/assets/tapes/Masking-Tape.glb",
    roll: "/api/media/file/masking-roll.webp",
    showcase: [
      "/api/media/file/img-masking-tape-2.webp",
      "/api/media/file/img-masking-tape-1.webp",
    ],
    strip: "/assets/masking-tape-x2.png",
    tags: ["LABELING", "PAINT WORK", "BUNDLING"],
    copy: "Always ready for school projects, quick labels, and weekend crafts. Easygoing. Comes off clean. No drama.",
    letters: ["C", "R", "E", "A", "T", "I", "V", "E2"],
  },
  {
    id: "double",
    name: "Double-sided tissue tape",
    word: "trusty",
    ring: "#a8dcf0",
    bg: "#50CBFF",
    wordColor: "#007db2",
    tagBg: "#1b87b8",
    tagInk: "#8bd8f5",
    ink: "#1b87b8",
    card: "/api/media/file/double-card.webp",
    model: "/assets/tapes/Double-Tape.glb",
    roll: "/api/media/file/double-roll.webp",
    showcase: [
      "/api/media/file/img-double-sided-tape-2.webp",
      "/api/media/file/img-double-sided-tape-4.webp",
    ],
    strip: "/assets/double-side-x4.png",
    tags: ["INVISIBLE HOLDING", "SMOOTH MOUNTING", "QUICK PATCHING"],
    copy: "The kind of tape that commits. Strong hold on both sides, easy to use, hard to let go.",
    letters: ["T", "R", "U", "S", "T2", "Y"],
  },
  {
    id: "stationery",
    name: "Stationery tape",
    word: "buddy",
    ring: "#ffd9c2",
    bg: "#FF7B5F",
    wordColor: "#a82712",
    tagBg: "#9e2a12",
    tagInk: "#f2a08c",
    ink: "#9e2a12",
    card: "/api/media/file/stationery-card.svg",
    model: "/assets/tapes/Cello-Tape.glb",
    roll: "/api/media/file/stationery-roll.webp",
    showcase: [
      "/api/media/file/img-stationery-tape-3.webp",
      "/api/media/file/img-stationery-tape-2.webp",
    ],
    strip: "/assets/low-noise-x4-clear.png",
    tags: ["SMALL REPAIRS", "STICK & GO", "DESK DRAWER ESSENTIAL"],
    copy: "From broken corners to last-minute projects. Easy to tear. Easy to use. Weirdly reliable.",
    letters: ["B", "U", "D", "D2", "Y"],
  },
  {
    id: "cloth",
    name: "Cloth tape",
    word: "fixer",
    ring: "#d9d2f7",
    bg: "#2E3EAC",
    wordColor: "#101E83",
    tagBg: "#172795",
    tagInk: "#B0B9FA",
    ink: "#919CFF",
    card: "/api/media/file/cloth-card.webp",
    model: "/assets/tapes/Cloth-Tape.glb",
    roll: "/api/media/file/cloth-roll.webp",
    showcase: [
      "/api/media/file/img-cloth-tape-3.webp",
      "/api/media/file/img-cloth-tape-5.webp",
    ],
    strip: "/assets/black-cloth-tape-x4.png",
    tags: ["QUICK FIX", "STRONG REPAIRS", "BUNDLING"],
    copy: "Doesn’t talk much. Just holds everything together. Rain or shine.",
    letters: ["F", "I", "X", "E", "R"],
  },
  {
    id: "opp",
    name: "OPP tape",
    word: "reliable",
    ring: "#e4f7a8",
    bg: "#b6fe00",
    wordColor: "#52AF16",
    tagBg: "#52AF16",
    tagInk: "#E7FF8F",
    ink: "#52AF16",
    card: "/assets/sibling-opp-normal.webp",
    model: "/assets/tapes/header-brown.glb",
    roll: "/api/media/file/opp-roll.webp",
    showcase: [
      "/api/media/file/opp-tape-shot-1.webp",
      "/api/media/file/opp-shot-2.webp",
    ],
    strip: "/assets/opp-tape-x4.png",
    tags: ["SEALING", "PACKAGING", "WRAPPING"],
    copy: "Moving house? Packing chaos? This one shows up every time.",
    letters: ["R", "E", "L", "I", "A", "B", "L2", "E2"],
  },
  {
    id: "opp-quiet",
    name: "OPP tape, low noise",
    word: "silent",
    ring: "#fff0b0",
    bg: "#F7D000",
    wordColor: "#a88700",
    tagBg: "#a88700",
    tagInk: "#ffeda0",
    ink: "#8a6f00",
    card: "/api/media/file/opp-quiet-card.webp",
    model: "/assets/tapes/Low-Noise-Tape.glb",
    roll: "/api/media/file/opp-quiet-roll.webp",
    showcase: [
      "/api/media/file/img-opp-no-noise-tape-2.webp",
      "/api/media/file/opp-quiet-shot-2.webp",
    ],
    strip: "/assets/low-noise-x4-clear.png",
    tags: ["CHILL BUNDLING", "QUIET LABELING", "SOFT PACKING"],
    copy: "Perfect for calm packers, quiet workers, and people who tape at 2AM. Soft roll. Strong stick.",
    letters: ["S", "I", "L", "E", "N", "T"],
  },
];

export default function TapeSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLElement | null>(null);
  const rotationRef = useRef(180);

  const curProduct = PRODUCTS[activeIndex];

  const goToProduct = (idx: number) => {
    if (idx === activeIndex) return;
    const nextIdx = (idx + PRODUCTS.length) % PRODUCTS.length;
    setActiveIndex(nextIdx);
    playOnce(SOUNDS.SLIDE_CHANGE, 0.7);

    // Rotate rail
    const step = 360 / PRODUCTS.length;
    rotationRef.current -= (nextIdx - activeIndex) * step;
    const track = containerRef.current?.querySelector<HTMLElement>(".rail-track");
    if (track) {
      const buttons = Array.from(track.querySelectorAll<HTMLElement>("button"));
      const r = track.getBoundingClientRect().width / 2 || 220;
      buttons.forEach((btn, i) => {
        const rad = ((i * step + rotationRef.current) * Math.PI) / 180;
        gsap.to(btn, {
          x: Math.cos(rad) * r,
          y: Math.sin(rad) * r,
          duration: 0.6,
          ease: "power2.out",
        });
      });
    }

    // Animate letters and key visual
    const visual = containerRef.current?.querySelector(".key-visual img");
    if (visual) {
      gsap.fromTo(
        visual,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(1.6)" }
      );
    }
  };

  useEffect(() => {
    const track = containerRef.current?.querySelector<HTMLElement>(".rail-track");
    if (!track) return;

    const buttons = Array.from(track.querySelectorAll<HTMLElement>("button"));
    const step = 360 / PRODUCTS.length;
    const r = track.getBoundingClientRect().width / 2 || 220;

    buttons.forEach((btn, i) => {
      const rad = ((i * step + rotationRef.current) * Math.PI) / 180;
      gsap.set(btn, {
        x: Math.cos(rad) * r,
        y: Math.sin(rad) * r,
      });
    });
  }, []);

  return (
    <section
      ref={containerRef}
      className="tape-slider-parent"
      style={
        {
          "--bg": curProduct.bg,
          "--ring": curProduct.ring,
          "--word": curProduct.wordColor,
          "--tag-bg": curProduct.tagBg,
          "--tag-ink": curProduct.tagInk,
          "--ink": curProduct.ink,
        } as React.CSSProperties
      }
    >
      <div className="wrapper">
        <div className="bg-overlay" aria-hidden="true">
          <div
            className="bg-layer bg-layer--base"
            style={{ backgroundColor: curProduct.bg }}
          />
          <div className="bg-layer bg-layer--next arc-cut" />
        </div>

        <h2 className="sr-only">THE {curProduct.word.toUpperCase()}</h2>
        <h6 className="subhead">MEET THE ONE WHO STICKS</h6>

        <div className="roll-parent">
          <button
            type="button"
            className="roll-it"
            aria-hidden="true"
            onClick={() => goToProduct(activeIndex + 1)}
          >
            ROLL IT!
          </button>

          <div className="rail-track">
            {PRODUCTS.map((prod, i) => (
              <button
                key={prod.id}
                type="button"
                data-index={prod.id}
                aria-label={prod.name}
                className={i === activeIndex ? "active" : ""}
                onClick={() => goToProduct(i)}
                style={
                  {
                    "--ring": prod.ring,
                    "--bg": prod.bg,
                    "--word": prod.wordColor,
                    "--tag-bg": prod.tagBg,
                    "--tag-ink": prod.tagInk,
                    "--ink": prod.ink,
                  } as React.CSSProperties
                }
              >
                <span className="roll-ring" aria-hidden="true" />
                <img src={prod.roll} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className="tape-slide">
          <div id={curProduct.word} className="wrapper">
            <div className="left">
              <div className="tags">
                <div className="tag">
                  {curProduct.tags.map((t, ti) => (
                    <h6 key={ti} className="h6">
                      {t}
                    </h6>
                  ))}
                </div>
                <div className="subtext">
                  <h5 className="h5 body-copy" data-reveal="live">
                    {curProduct.copy.split(" ").map((w, wi) => (
                      <span key={wi} className="body-clip">
                        <span className="body-rise">{w}</span>{" "}
                      </span>
                    ))}
                  </h5>
                </div>
              </div>
            </div>

            <div className="middle">
              {curProduct.showcase.map((s, si) => (
                <span key={si} className="showcase">
                  <img src={s} alt="" />
                  <span
                    className="peel showcase-tape"
                    style={
                      {
                        "--peel-w": "129.23px",
                        "--peel-h": "37.12px",
                        "--peel-from":
                          "calc(var(--peel-edge) + 0.6 * var(--peel-span))",
                        "--peel-to":
                          "calc(var(--peel-edge) + 0 * var(--peel-span))",
                        "--peel-dir": "90deg",
                        "--strip-blend": "normal",
                      } as React.CSSProperties
                    }
                    data-peel="manual"
                  >
                    <span className="peel-face">
                      <span className="peel-turn">
                        <img src={curProduct.strip} alt="" draggable="false" />
                      </span>
                    </span>
                    <span className="peel-flap" aria-hidden="true">
                      <span className="peel-turn">
                        <img src={curProduct.strip} alt="" draggable="false" />
                      </span>
                    </span>
                  </span>
                </span>
              ))}

              <div className="top-title">
                <img src="/assets/middle-T.webp" alt="T" />
                <img src="/assets/middle-H.webp" alt="H" />
                <img src="/assets/middle-E.webp" alt="E" />
              </div>

              <a className="explore-button" href={`/products/${curProduct.id}`}>
                <span className="explore-clip">
                  <span className="button-text">EXPLORE</span>
                </span>
                <span className="arrow">
                  <svg
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M1.4 10.6 10.6 1.4M3.6 1.4h7v7"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="square"
                    />
                  </svg>
                </span>
              </a>

              <div className="key-visual">
                <img src={curProduct.card} alt={curProduct.name} />
              </div>

              <div className="bottom-title" data-word={curProduct.word}>
                {curProduct.letters.map((letCode, li) => (
                  <span key={li} className="glyph">
                    <img
                      src={`/assets/words/${curProduct.word}/${letCode}.webp`}
                      alt={letCode}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="tape-nav">
          <button
            type="button"
            data-step="-1"
            aria-label="Previous tape"
            onClick={() => goToProduct(activeIndex - 1)}
          >
            <img
              src="/assets/mobile-slider-prev.webp"
              alt=""
              width="256"
              height="256"
              loading="lazy"
            />
          </button>
          <button
            type="button"
            data-step="1"
            aria-label="Next tape"
            onClick={() => goToProduct(activeIndex + 1)}
          >
            <img
              src="/assets/mobile-slider-next.webp"
              alt=""
              width="256"
              height="256"
              loading="lazy"
            />
          </button>
        </div>
      </div>
    </section>
  );
}
