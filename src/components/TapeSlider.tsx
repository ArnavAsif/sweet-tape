"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { createTapeViewer } from "@/lib/createTapeViewer";
import { playOnce, SOUNDS } from "@/lib/sounds";

interface StripData {
  src: string;
  back: string;
  w: string;
  h: string;
  blend: string;
}

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
  stripData: StripData;
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
    strip: "/assets/masking-tape-x2.png|peel-back-masking|129.23px|37.12px|normal",
    stripData: {
      src: "/assets/masking-tape-x2.png",
      back: "peel-back-masking",
      w: "129.23px",
      h: "37.12px",
      blend: "normal",
    },
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
    strip: "/assets/double-side-x4.png|peel-back-tissue|138.77px|51.54px|normal",
    stripData: {
      src: "/assets/double-side-x4.png",
      back: "peel-back-tissue",
      w: "138.77px",
      h: "51.54px",
      blend: "normal",
    },
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
    strip: "/assets/low-noise-x4-clear.png|peel-back-clear|147.71px|96.64px|normal",
    stripData: {
      src: "/assets/low-noise-x4-clear.png",
      back: "peel-back-clear",
      w: "147.71px",
      h: "96.64px",
      blend: "normal",
    },
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
    strip: "/assets/black-cloth-tape-x4.png|peel-back-black|155.56px|52.81px|normal",
    stripData: {
      src: "/assets/black-cloth-tape-x4.png",
      back: "peel-back-black",
      w: "155.56px",
      h: "52.81px",
      blend: "normal",
    },
    tags: ["QUICK FIX", "STRONG REPAIRS", "BUNDLING"],
    copy: "Doesn’t talk much. Just holds everything together. Rain or shine.",
    letters: ["F", "I", "X", "E", "R"],
  },
  {
    id: "opp",
    name: "OPP packaging tape",
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
    strip: "/assets/opp-tape-x4.png|peel-back-masking|128.83px|40.74px|normal",
    stripData: {
      src: "/assets/opp-tape-x4.png",
      back: "peel-back-masking",
      w: "128.83px",
      h: "40.74px",
      blend: "normal",
    },
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
    strip: "/assets/low-noise-x4-clear.png|peel-back-clear|147.71px|96.64px|normal",
    stripData: {
      src: "/assets/low-noise-x4-clear.png",
      back: "peel-back-clear",
      w: "147.71px",
      h: "96.64px",
      blend: "normal",
    },
    tags: ["CHILL BUNDLING", "QUIET LABELING", "SOFT PACKING"],
    copy: "Perfect for calm packers, quiet workers, and people who tape at 2AM. Soft roll. Strong stick.",
    letters: ["S", "I", "L", "E", "N", "T"],
  },
];

export default function TapeSlider() {
  const containerRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const curProduct = PRODUCTS[activeIndex];

  const viewerRef = useRef<any>(null);
  const rotationRef = useRef(180);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    const section = containerRef.current;
    if (!section) return;

    const keyVisual = section.querySelector<HTMLElement>(".key-visual");
    const track = section.querySelector<HTMLElement>(".rail-track");
    if (!track) return;

    const buttons = Array.from(track.querySelectorAll<HTMLButtonElement>("button"));
    const numButtons = buttons.length;
    const stepAngle = 360 / numButtons;

    function layoutRail() {
      if (!track) return;
      const radius = track.clientWidth / 2 || 120;
      buttons.forEach((btn, i) => {
        const rad = ((i * stepAngle + rotationRef.current) * Math.PI) / 180;
        gsap.set(btn, {
          x: Math.cos(rad) * radius,
          y: Math.sin(rad) * radius,
        });
      });
    }

    layoutRail();
    track.classList.add("is-ready");

    const ro = new ResizeObserver(layoutRail);
    ro.observe(track);

    // Initial 3D Viewer setup
    if (keyVisual) {
      createTapeViewer(
        keyVisual,
        PRODUCTS.map((p) => p.model),
        { key: 0, ambient: 0.97, fill: 0, env: 0.14 },
        { "Face Brown": { metalness: 0.05 } },
        {
          clarity: { double: 0.04, stationery: 0.11, opp: 0.09, "opp-quiet": 0.1 },
          knobs: {
            AMOUNT: 0.6,
            GLOSS: 0.42,
            MOTTLE: 0.22,
            SMUDGE: 1.2,
            TOOTH: 0.41,
            GLAZE: 0.18,
            GLAZE_ROUGH: 0.36,
            FACE_GLOSS: 0.41,
            GRAIN: 4,
            ANISO: 0.11,
          },
          glass: { AMOUNT: 0.41, EDGE: 3.8, SHEEN: 0.155 },
        }
      )
        .then((viewer: any) => {
          viewerRef.current = viewer;
          viewer.show(PRODUCTS[0].model);
          viewer.spin(0);
        })
        .catch((e) => {
          console.warn("TapeViewer error", e);
        });

      // Pointer move reaction for 3D tape tilt
      const onPointerMove = (e: MouseEvent) => {
        if (!viewerRef.current || !keyVisual) return;
        const rect = keyVisual.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const nx = (e.clientX - cx) / (window.innerWidth / 3);
        const ny = (e.clientY - cy) / (window.innerHeight / 3);
        viewerRef.current.point(nx, ny);
      };

      window.addEventListener("pointermove", onPointerMove, { passive: true });

      return () => {
        ro.disconnect();
        window.removeEventListener("pointermove", onPointerMove);
        viewerRef.current?.dispose();
      };
    }

    return () => {
      ro.disconnect();
    };
  }, []);

  const goToProduct = (nextIndex: number) => {
    if (nextIndex === activeIndex || isTransitioningRef.current) return;
    const section = containerRef.current;
    if (!section) return;

    isTransitioningRef.current = true;
    playOnce(SOUNDS.SLIDE_CHANGE, 0.7);

    const prevProduct = PRODUCTS[activeIndex];
    const nextProduct = PRODUCTS[nextIndex];
    const track = section.querySelector<HTMLElement>(".rail-track");
    const numButtons = PRODUCTS.length;
    const stepAngle = 360 / numButtons;

    // 1. Rail track circular rotation
    const diffAngle = ((180 - nextIndex * stepAngle - rotationRef.current) % 360 + 540) % 360 - 180;
    const targetAngle = rotationRef.current + diffAngle;
    rotationRef.current = targetAngle;

    if (track) {
      const radius = track.clientWidth / 2 || 120;
      const buttons = Array.from(track.querySelectorAll<HTMLButtonElement>("button"));
      const rotObj = { r: targetAngle - diffAngle };

      gsap.to(rotObj, {
        r: targetAngle,
        duration: 0.85,
        ease: "sine.inOut",
        onUpdate: () => {
          buttons.forEach((btn, i) => {
            const rad = ((i * stepAngle + rotObj.r) * Math.PI) / 180;
            gsap.set(btn, {
              x: Math.cos(rad) * radius,
              y: Math.sin(rad) * radius,
            });
          });
        },
      });
    }

    // 2. Sweep background layer transition
    const bgOverlay = section.querySelector<HTMLElement>(".bg-overlay");
    const bgBase = bgOverlay?.querySelector<HTMLElement>(".bg-layer--base");
    const bgNext = bgOverlay?.querySelector<HTMLElement>(".bg-layer--next");

    if (bgNext && bgBase && bgOverlay) {
      const bounds = bgOverlay.getBoundingClientRect();
      const arcH = bounds.width * (150.5 / 1456);
      const totalH = bounds.height + arcH + 2;

      bgNext.style.height = `${totalH}px`;
      bgNext.style.background = nextProduct.bg;
      bgNext.style.setProperty("--arc-h", `${arcH}px`);

      gsap.fromTo(
        bgNext,
        { y: -totalH },
        {
          y: 0,
          duration: 0.85,
          ease: "power2.out",
          onComplete: () => {
            bgBase.style.background = nextProduct.bg;
            gsap.set(bgNext, { y: "-100%" });
          },
        }
      );
    }

    // 3. 3D Model Spin Transition
    if (viewerRef.current) {
      const spinObj = { deg: 0 };
      gsap.to(spinObj, {
        deg: 90,
        duration: 0.45,
        ease: "power2.in",
        onUpdate: () => viewerRef.current?.spin(spinObj.deg),
        onComplete: () => {
          viewerRef.current?.show(nextProduct.model);
          viewerRef.current?.spin(-90);
          gsap.to(spinObj, {
            deg: 0,
            duration: 0.45,
            ease: "power2.out",
            onUpdate: () => viewerRef.current?.spin(spinObj.deg),
          });
        },
      });
    }

    // 4. Showcase photos 3D flip
    const showcases = Array.from(section.querySelectorAll<HTMLElement>(".middle .showcase"));
    showcases.forEach((sc, idx) => {
      gsap.to(sc, {
        rotationY: 90,
        z: -55,
        duration: 0.35,
        delay: idx * 0.1,
        ease: "power2.in",
        onComplete: () => {
          const img = sc.querySelector<HTMLImageElement>("img");
          if (img && nextProduct.showcase[idx]) {
            img.src = nextProduct.showcase[idx];
          }
          gsap.fromTo(
            sc,
            { rotationY: -90, z: -55 },
            { rotationY: 0, z: 0, duration: 0.35, ease: "power2.out" }
          );
        },
      });
    });

    // 5. Letter cutouts dip and rise
    const topImgs = Array.from(section.querySelectorAll<HTMLElement>(".top-title img"));
    topImgs.forEach((img, idx) => {
      gsap.to(img, {
        y: 60,
        opacity: 0,
        duration: 0.25,
        delay: idx * 0.04,
        ease: "power2.in",
        onComplete: () => {
          gsap.fromTo(
            img,
            { y: -60, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.35, ease: "back.out(1.4)" }
          );
        },
      });
    });

    const bottomGlyphs = Array.from(
      section.querySelectorAll<HTMLElement>(".bottom-title .glyph img")
    );
    bottomGlyphs.forEach((glyph, idx) => {
      gsap.to(glyph, {
        y: 80,
        opacity: 0,
        duration: 0.25,
        delay: idx * 0.03,
        ease: "power2.in",
      });
    });

    // 6. Tags and text slide
    const tagsWrapper = section.querySelector<HTMLElement>(".left .tags");
    if (tagsWrapper) {
      gsap.to(tagsWrapper, {
        x: -250,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setActiveIndex(nextIndex);
          gsap.fromTo(
            tagsWrapper,
            { x: -250, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.45,
              ease: "power3.out",
              onComplete: () => {
                isTransitioningRef.current = false;
              },
            }
          );
        },
      });
    } else {
      setActiveIndex(nextIndex);
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 500);
    }
  };

  return (
    <section
      ref={containerRef}
      className="tape-slider-parent"
      style={
        {
          "--word-colour": curProduct.wordColor,
          "--slide-lift": "0px",
        } as React.CSSProperties
      }
    >
      <div className="wrapper">
        <div className="bg-overlay" aria-hidden="true">
          <div
            className="bg-layer bg-layer--base"
            style={{ background: curProduct.bg }}
          />
          <div className="bg-layer bg-layer--next arc-cut" />
        </div>

        <h2 className="sr-only">THE {curProduct.word.toUpperCase()}</h2>

        <h6
          className="subhead"
          style={
            {
              "--tag-bg": curProduct.tagBg,
              "--tag-ink": curProduct.tagInk,
            } as React.CSSProperties
          }
        >
          MEET THE ONE WHO STICKS
        </h6>

        <div className="sweep-paint arc-cut" aria-hidden="true">
          <div className="sweep-inner">
            <h6 className="subhead subhead--next">MEET THE ONE WHO STICKS</h6>
          </div>
        </div>

        <div className="roll-parent">
          <span
            className="roll-it"
            aria-hidden="true"
            style={{ "--ink": curProduct.ink } as React.CSSProperties}
          >
            ROLL IT!
          </span>

          <div className="rail-track">
            {PRODUCTS.map((prod, i) => (
              <button
                key={prod.id}
                type="button"
                data-index={prod.id}
                aria-label={prod.name}
                aria-pressed={i === activeIndex ? "true" : "false"}
                className={i === activeIndex ? "is-active" : ""}
                onClick={() => goToProduct(i)}
                style={
                  {
                    "--ring": prod.ring,
                    "--bg": prod.bg,
                    "--word": prod.wordColor,
                    "--tag-bg": prod.tagBg,
                    "--tag-ink": prod.tagInk,
                    "--ink": prod.ink,
                    zIndex: i === activeIndex ? 2 : 1,
                  } as React.CSSProperties
                }
              >
                <span
                  className="roll-ring"
                  aria-hidden="true"
                  style={
                    {
                      transform: i === activeIndex ? "scale(1, 1)" : "scale(0, 0)",
                      opacity: i === activeIndex ? 1 : 0,
                    } as React.CSSProperties
                  }
                />
                <img src={prod.roll} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className="tape-slide">
          <div id={curProduct.word} className="wrapper">
            <div
              className="left"
              style={
                {
                  "--tag-bg": curProduct.tagBg,
                  "--tag-ink": curProduct.tagInk,
                  "--ink": curProduct.ink,
                } as React.CSSProperties
              }
            >
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
                    {curProduct.copy
                      .trim()
                      .split(/\s+/)
                      .map((w, wi) => (
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
                        "--peel-w": curProduct.stripData.w,
                        "--peel-h": curProduct.stripData.h,
                        "--peel-from":
                          "calc(var(--peel-edge) + 0.6 * var(--peel-span))",
                        "--peel-to":
                          "calc(var(--peel-edge) + 0 * var(--peel-span))",
                        "--peel-dir": "90deg",
                        "--peel-back": `url(#${curProduct.stripData.back})`,
                        "--strip-blend": curProduct.stripData.blend,
                        "--peel": "1",
                      } as React.CSSProperties
                    }
                    data-peel="manual"
                  >
                    <span className="peel-face">
                      <span className="peel-turn">
                        <img
                          src={curProduct.stripData.src}
                          alt=""
                          draggable="false"
                        />
                      </span>
                    </span>
                    <span className="peel-flap" aria-hidden="true">
                      <span className="peel-turn">
                        <img
                          src={curProduct.stripData.src}
                          alt=""
                          draggable="false"
                        />
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
                <img
                  src={curProduct.card}
                  alt=""
                  style={{ visibility: "hidden" }}
                />
              </div>

              <div className="bottom-title" data-word={curProduct.word}>
                {curProduct.letters.map((letter, li) => (
                  <span key={li} className="glyph">
                    <img
                      src={`/assets/words/${curProduct.word}/${letter}.webp`}
                      alt=""
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="tape-nav"
          style={
            {
              "--nav-face": curProduct.ring,
              "--nav-ink": curProduct.wordColor,
            } as React.CSSProperties
          }
        >
          <button
            type="button"
            data-step="-1"
            aria-label="Previous tape"
            onClick={() =>
              goToProduct(
                (activeIndex - 1 + PRODUCTS.length) % PRODUCTS.length
              )
            }
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
            onClick={() => goToProduct((activeIndex + 1) % PRODUCTS.length)}
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
