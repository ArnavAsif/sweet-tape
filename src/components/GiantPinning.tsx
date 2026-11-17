"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

function shuffle<T>(arr: T[]): T[] {
  const t = [...arr];
  for (let i = t.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    [t[i], t[r]] = [t[r], t[i]];
  }
  return t;
}

function parkArrow(pathEl: SVGPathElement) {
  const len = pathEl.getTotalLength();
  gsap.set(pathEl, {
    strokeDasharray: `${len} ${len + 2}`,
    strokeDashoffset: len + 1,
  });
  return len;
}

function interpolateBezier(
  rawStops: { x: number; y: number }[],
  rawEnds: boolean[],
  rawOpens: number[]
) {
  const curvedStops: { x: number; y: number }[] = [];
  const curvedEnds: boolean[] = [];
  const indexMap: number[] = [];

  for (let r = 0; r < rawStops.length; r++) {
    const curr = rawStops[r];
    const prev = rawStops[r - 1];
    const next = rawStops[r + 1];

    const addPoint = () => {
      indexMap[r] = curvedStops.length;
      curvedStops.push(curr);
      curvedEnds.push(rawEnds[r]);
    };

    if (!prev || !next) {
      addPoint();
      continue;
    }

    const f = curr.x - prev.x;
    const d = curr.y - prev.y;
    const c = next.x - curr.x;
    const h = next.y - curr.y;
    const p = Math.hypot(f, d);
    const g = Math.hypot(c, h);

    if (
      p < 1 ||
      g < 1 ||
      (180 * Math.acos(Math.min(1, Math.max(-1, (f * c + d * h) / (p * g))))) /
        Math.PI <
        70
    ) {
      addPoint();
      continue;
    }

    const A = 0.13 * Math.min(p, g);
    const y = curr.x - (f / p) * A;
    const E = curr.y - (d / p) * A;
    const m = curr.x + (c / g) * A;
    const R = curr.y + (h / g) * A;

    indexMap[r] = curvedStops.length;
    const T = 4;
    for (let e = 0; e <= T; e++) {
      const n = e / T;
      const o = 1 - n;
      curvedStops.push({
        x: o * o * y + 2 * o * n * curr.x + n * n * m,
        y: o * o * E + 2 * o * n * curr.y + n * n * R,
      });
      curvedEnds.push(e === T && rawEnds[r]);
    }
  }

  return {
    stops: curvedStops,
    ends: curvedEnds,
    opens: rawOpens.map((e) => indexMap[e] ?? e),
  };
}

function computePath(
  container: HTMLElement,
  rows: HTMLElement[],
  topTitle: HTMLElement | null
) {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const insetProp = parseFloat(
    getComputedStyle(container).getPropertyValue("--giant-inset")
  );
  const inset =
    screenWidth * (Number.isFinite(insetProp) ? insetProp : 0.045);

  const stops: { x: number; y: number }[] = [];
  const ends: boolean[] = [];
  const opens: number[] = [];

  for (const row of rows) {
    opens.push(stops.length);
    const left = row.offsetLeft;
    const width = row.offsetWidth;
    const rectLeft = row.getBoundingClientRect().left;
    let maxRight = width;

    for (const prop of row.querySelectorAll<HTMLElement>(".giant-prop")) {
      maxRight = Math.max(
        maxRight,
        prop.getBoundingClientRect().right - rectLeft
      );
    }

    const targetY = screenHeight / 2 - (row.offsetTop + row.offsetHeight / 2);

    if (maxRight <= screenWidth - 2 * inset) {
      stops.push({ x: screenWidth / 2 - (left + width / 2), y: targetY });
      ends.push(true);
    } else {
      stops.push({ x: inset - left, y: targetY });
      ends.push(false);
      const pad = maxRight > width ? 2 * inset : inset;
      stops.push({ x: screenWidth - pad - (left + maxRight), y: targetY });
      ends.push(true);
    }
  }

  if (topTitle) {
    const openAtProp = parseFloat(
      getComputedStyle(container).getPropertyValue("--giant-open-at")
    );
    const openAt = Number.isFinite(openAtProp) ? openAtProp : 0.5;
    stops.unshift({
      x: stops[0]?.x ?? 0,
      y:
        screenHeight * openAt -
        (topTitle.offsetTop + topTitle.offsetHeight / 2),
    });
    ends.unshift(true);
    for (let i = 0; i < opens.length; i++) {
      opens[i] += 1;
    }
  }

  return interpolateBezier(stops, ends, opens);
}

function initGiantParallax(container: HTMLElement) {
  const canvas = container.querySelector<HTMLElement>(".giant-canvas");
  if (!canvas)
    return { measure: () => {}, update: (_: number) => {}, destroy: () => {} };

  const layers = gsap.utils.toArray<HTMLElement>(
    ".giant-prop, .giant-slot",
    container
  );
  if (!layers.length)
    return { measure: () => {}, update: (_: number) => {}, destroy: () => {} };

  const getCenter = (el: HTMLElement) => {
    let x = el.offsetWidth / 2;
    let cur: HTMLElement | null = el;
    while (cur && cur !== canvas) {
      x += cur.offsetLeft;
      cur = cur.offsetParent as HTMLElement | null;
    }
    return x;
  };

  const defaultEase = "power2.inOut";
  const parseEase = (e: string) =>
    gsap.parseEase(e) ?? gsap.parseEase(defaultEase);
  const c = parseEase(defaultEase);

  const items = layers.map((el) => ({
    el,
    set: gsap.quickSetter(el, "--pdx"),
    rot: el.matches(".giant-prop--tag") ? gsap.quickSetter(el, "--prot") : null,
    home: 0,
    drift: 0.03,
    easeName: defaultEase,
    ease: c,
  }));

  const measure = () => {
    for (const item of items) {
      item.home = getCenter(item.el);
      const style = getComputedStyle(item.el);
      const n = parseFloat(style.getPropertyValue("--pp"));
      item.drift = Number.isFinite(n) ? n : 0.03;
      item.easeName = style.getPropertyValue("--pe").trim() || defaultEase;
      item.ease = parseEase(item.easeName);
    }
  };

  measure();

  return {
    measure,
    update: (canvasX: number) => {
      const winW = window.innerWidth;
      const mid = winW / 2;
      const span = 0.65 * winW;
      for (const item of items) {
        const a = parseFloat(item.el.style.getPropertyValue("--pp"));
        const drift = Number.isFinite(a) ? a : item.drift;
        const pe = item.el.style.getPropertyValue("--pe").trim();
        if (pe && pe !== item.easeName) {
          item.easeName = pe;
          item.ease = parseEase(pe);
        }
        const norm = Math.max(-1, Math.min(1, (canvasX + item.home - mid) / span));
        const factor = Math.sign(norm) * item.ease(Math.abs(norm));
        item.set(`${-drift * winW * factor}px`);
        if (item.rot) {
          item.rot(`${-8 * factor}deg`);
        }
      }
    },
    destroy: () => {
      for (const item of items) {
        item.el.style.removeProperty("--pdx");
        item.el.style.removeProperty("--prot");
      }
    },
  };
}

function initHandNotes(container: HTMLElement) {
  const notes = Array.from(
    container.querySelectorAll<HTMLElement>(".hand-note")
  );
  const cleanups = notes.map((note) => {
    const ink = note.querySelector<HTMLElement>(".hand-ink");
    const rx = note.querySelector<SVGElement>(".hand-rule--x");
    const ry = note.querySelector<SVGElement>(".hand-rule--y");
    if (!ink || !rx || !ry) return () => {};

    const style = getComputedStyle(note);
    const speed = parseFloat(style.getPropertyValue("--hand-draw")) || 1;
    const delay = parseFloat(style.getPropertyValue("--hand-delay")) || 0;

    const p = gsap.timeline({ paused: true });
    p.fromTo(
      rx,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.3 * speed, ease: "none" },
      0
    );
    p.fromTo(
      ry,
      { scaleY: 0 },
      { scaleY: 1, duration: 0.3 * speed, ease: "none" },
      0
    );

    const lines = Array.from(ink.querySelectorAll<HTMLElement>(".hand-line"));
    let charTime = 0.35 * speed;
    lines.forEach((line) => {
      const text = line.textContent || "";
      line.innerHTML = "";
      for (const ch of text) {
        const span = document.createElement("span");
        span.textContent = ch === " " ? "\u00A0" : ch;
        span.style.visibility = "hidden";
        line.appendChild(span);
        p.set(span, { visibility: "visible" }, charTime);
        charTime += 0.02 * speed;
      }
      charTime += 0.08 * speed;
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            gsap.delayedCall(delay, () => p.play());
          } else {
            p.play();
          }
        } else {
          p.pause(0);
        }
      },
      { rootMargin: "0px 0px -20% 0px" }
    );

    io.observe(note);

    return () => {
      io.disconnect();
      p.kill();
    };
  });

  return () => cleanups.forEach((c) => c());
}

export default function GiantPinning() {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const section = containerRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      section.dataset.reveal = "live";
      return;
    }

    const canvas = section.querySelector<HTMLElement>(".giant-canvas");
    const rows = gsap.utils.toArray<HTMLElement>(".giant-row", section);
    const wrapper = section.querySelector<HTMLElement>(".wrapper");
    const topTitle = section.querySelector<HTMLElement>(
      ".giant-canvas > .top-title"
    );

    if (!canvas || rows.length < 2) return;

    section.dataset.reveal = "live";

    // 1. Prepare elements for reveal
    const rowChars = rows.map((r) => {
      const chars = gsap.utils.toArray<HTMLElement>(".char", r);
      if (chars.length) gsap.set(chars, { yPercent: 130 });
      return chars;
    });

    const indices = gsap.utils.toArray<HTMLElement>(".giant-index", section);
    if (indices.length) gsap.set(indices, { autoAlpha: 0 });

    const allTapes = rows.map((r) =>
      gsap.utils.toArray<HTMLElement>(".giant-tape", r)
    );
    allTapes.flat().forEach((t) => t.style.setProperty("--peel", "0"));

    // Arrow paths setup
    const arrowContainers = gsap.utils.toArray<HTMLElement>(
      ".diag-down-arrow, .diag-up-arrow",
      section
    );
    const arrows = arrowContainers.map((el) => {
      const line = el.querySelector<SVGPathElement>(".arrow-line");
      const head = el.querySelector<SVGPathElement>(".arrow-head");
      if (line) parkArrow(line);
      if (head) parkArrow(head);
      return { line, head };
    });

    // Reveal functions
    const revealedChars = new Set<HTMLElement>();
    const activeTweens: gsap.core.Tween[] = [];
    const activeArrowTls: gsap.core.Timeline[] = [];

    const revealChars = (charsToReveal: HTMLElement[]) => {
      const fresh = charsToReveal.filter((c) => !revealedChars.has(c));
      if (!fresh.length) return;
      fresh.forEach((c) => revealedChars.add(c));

      for (const ch of fresh) {
        const row = ch.closest(".giant");
        if (row?.querySelector(".char") === ch) {
          const idxEl = row.querySelector(".giant-index");
          if (idxEl) {
            activeTweens.push(
              gsap.to(idxEl, { autoAlpha: 1, duration: 0.6, ease: "power1.out" })
            );
          }
        }
      }

      activeTweens.push(
        gsap.to(shuffle(fresh), {
          yPercent: 0,
          duration: 0.6,
          stagger: 0.055,
          ease: "power3.out",
        })
      );
    };

    let batchQueue: HTMLElement[] = [];
    let batchTimer: gsap.core.Tween | null = null;
    const processBatch = () => {
      batchTimer?.kill();
      batchTimer = null;
      const b = batchQueue;
      batchQueue = [];
      if (b.length) revealChars(b);
    };

    const queueCharReveal = (ch: HTMLElement) => {
      batchQueue.push(ch);
      if (batchQueue.length >= 5) {
        processBatch();
      } else {
        if (!batchTimer) {
          batchTimer = gsap.delayedCall(0.28, processBatch);
        }
      }
    };

    const tapeParents = new Map<HTMLElement, HTMLElement>();
    allTapes.flat().forEach((t) => {
      if (t.parentElement) tapeParents.set(t.parentElement, t);
    });

    const peeledTapes = new Set<HTMLElement>();
    const peelTape = (tapeEl: HTMLElement) => {
      if (peeledTapes.has(tapeEl)) return;
      peeledTapes.add(tapeEl);
      const obj = { p: 0 };
      activeTweens.push(
        gsap.to(obj, {
          p: 1,
          duration: 0.75,
          delay: 0.3,
          ease: "power2.inOut",
          onUpdate: () => tapeEl.style.setProperty("--peel", String(obj.p)),
        })
      );
    };

    const revealedArrows = new Set<number>();
    const revealArrow = (arrowIdx: number) => {
      if (revealedArrows.has(arrowIdx)) return;
      revealedArrows.add(arrowIdx);
      const arr = arrows[arrowIdx];
      if (!arr) return;
      const atl = gsap.timeline();
      if (arr.line) {
        atl.to(arr.line, {
          strokeDashoffset: 0,
          duration: 0.9,
          ease: "power2.inOut",
        });
      }
      if (arr.head) {
        atl.to(
          arr.head,
          {
            strokeDashoffset: 0,
            duration: 0.3,
            ease: "power2.inOut",
          },
          0.9
        );
      }
      activeArrowTls.push(atl);
    };

    // IntersectionObserver for element reveals
    const clipToCharMap = new Map<HTMLElement, HTMLElement>();
    const charClips = rowChars.map((chars) =>
      chars.map((ch) => {
        const clip = (ch.closest(".clip") as HTMLElement) ?? ch;
        clipToCharMap.set(clip, ch);
        return clip;
      })
    );

    const arrowIdxMap = new Map<HTMLElement, number>();
    arrowContainers.forEach((el, idx) => arrowIdxMap.set(el, idx));

    const revealIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          revealIO.unobserve(target);

          const ch = clipToCharMap.get(target);
          if (ch) {
            queueCharReveal(ch);
            continue;
          }

          const tape = tapeParents.get(target);
          if (tape) {
            peelTape(tape);
            continue;
          }

          const aIdx = arrowIdxMap.get(target);
          if (aIdx !== undefined) {
            revealArrow(aIdx);
          }
        }
      },
      { rootMargin: "20% 20% 20% 20%", threshold: 0 }
    );

    charClips.flat().forEach((c) => revealIO.observe(c));
    tapeParents.forEach((_, parent) => revealIO.observe(parent));
    arrowContainers.forEach((a) => revealIO.observe(a));

    // Top Title reveal animation
    const topChars = topTitle
      ? gsap.utils.toArray<HTMLElement>(".char", topTitle)
      : [];
    const subhead = topTitle?.querySelector<HTMLElement>(".subhead") ?? null;
    let topST: ScrollTrigger | null = null;

    if (topTitle && (topChars.length || subhead)) {
      if (topChars.length) gsap.set(topChars, { yPercent: 130 });
      if (subhead) gsap.set(subhead, { autoAlpha: 0 });

      topST = ScrollTrigger.create({
        trigger: topTitle,
        start: "top 75%",
        once: true,
        onEnter: () => {
          if (topChars.length) {
            activeTweens.push(
              gsap.to(shuffle(topChars), {
                yPercent: 0,
                duration: 0.6,
                stagger: 0.014,
                ease: "power3.out",
              })
            );
          }
          if (subhead) {
            activeTweens.push(
              gsap.to(subhead, {
                autoAlpha: 1,
                rotateY: 0,
                startAt: {
                  rotateY: -100,
                  transformPerspective: 420,
                  transformOrigin: "50% 50%",
                },
                duration: 0.85,
                ease: "back.out(1.4)",
                delay: 0.15,
              })
            );
          }
        },
      });
    }

    // Flush guarantees for stops
    const flushRow = (rowIdx: number) => {
      processBatch();
      const chars = rowChars[rowIdx];
      if (chars?.length) {
        charClips[rowIdx]?.forEach((c) => revealIO.unobserve(c));
        revealChars(chars);
      }
      allTapes[rowIdx]?.forEach((t) => {
        if (t.parentElement) revealIO.unobserve(t.parentElement);
        peelTape(t);
      });
    };

    const flushArrow = (arrowIdx: number) => {
      const arr = arrowContainers[arrowIdx];
      if (arr) revealIO.unobserve(arr);
      revealArrow(arrowIdx);
    };

    // 2. Camera Path & GSAP Timeline
    const dists = (pts: { x: number; y: number }[]) =>
      pts.slice(1).map((t, r) => Math.hypot(t.x - pts[r].x, t.y - pts[r].y));

    const pathData = computePath(section, rows, topTitle);
    const numStops = pathData.stops.length;
    const segmentDists = dists(pathData.stops);
    const totalDist = segmentDists.reduce((e, t) => e + t, 0) || 1;

    gsap.set(canvas, {
      x: pathData.stops[0]?.x ?? 0,
      y: pathData.stops[0]?.y ?? 0,
    });

    const parallax = initGiantParallax(section);
    const onUpdateParallax = () =>
      parallax.update(Number(gsap.getProperty(canvas, "x")));
    onUpdateParallax();

    const masterTl = gsap.timeline({ onUpdate: onUpdateParallax });
    const stopTimes = [masterTl.duration()];

    for (let i = 1; i < numStops; i++) {
      masterTl.to(canvas, {
        x: () => {
          const currentPath = computePath(section, rows, topTitle).stops;
          return currentPath[Math.min(i, currentPath.length - 1)].x;
        },
        y: () => {
          const currentPath = computePath(section, rows, topTitle).stops;
          return currentPath[Math.min(i, currentPath.length - 1)].y;
        },
        duration: (segmentDists[i - 1] / totalDist) * (numStops - 1),
        ease: "none",
      });
      stopTimes[i] = masterTl.duration();
    }

    const timePerStop = masterTl.duration() / (numStops - 1 || 1);

    // Call flushes at milestones
    pathData.opens.forEach((stopIdx, rowIdx) => {
      const nextOpen = pathData.opens[rowIdx + 1] ?? numStops;
      const targetTime = Math.max(
        0,
        (stopTimes[nextOpen - 1] ?? masterTl.duration()) - 0.001
      );
      masterTl.call(() => flushRow(rowIdx), undefined, targetTime);
      if (rowIdx > 0) {
        const arrowTime = Math.max(0, (stopTimes[stopIdx] ?? 0) - 0.001);
        masterTl.call(() => flushArrow(rowIdx - 1), undefined, arrowTime);
      }
    });

    // 3. ScrollTrigger Pinning
    const scrollEndDist = Math.round(
      dists(computePath(section, rows, topTitle).stops).reduce(
        (e, t) => e + t,
        0
      ) * timePerStop
    );

    const pinST = ScrollTrigger.create({
      trigger: wrapper ?? section,
      start: "top top",
      end: () => `+=${scrollEndDist}`,
      pin: wrapper ?? true,
      pinSpacing: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onRefresh: () => {
        parallax.measure();
        onUpdateParallax();
      },
      animation: masterTl,
    });

    // 4. Handwritten notes
    const cleanupHandNotes = initHandNotes(section);

    return () => {
      pinST.kill();
      masterTl.kill();
      topST?.kill();
      batchTimer?.kill();
      revealIO.disconnect();
      cleanupHandNotes();
      parallax.destroy();
      activeTweens.forEach((tw) => tw.kill());
      activeArrowTls.forEach((atl) => atl.kill());
      gsap.set(canvas, { clearProps: "transform" });
    };
  }, []);

  return (
    <section ref={containerRef} className="giant-pinning" data-reveal="live">
      <span className="giant-brow" aria-hidden="true" />
      <div className="wrapper">
        <div className="giant-canvas">
          {/* Top Title: WHY WE EXIST / WE'RE HERE FOR THE EVERYDAY MOMENTS. */}
          <div className="top-title">
            <h5 className="subhead">WHY WE EXIST</h5>
            <h2 className="h2" aria-label="WE’RE HERE FOR THE EVERYDAY MOMENTS.">
              <span className="line">
                {"WE’RE HERE".split("").map((c, i) => (
                  <span
                    key={i}
                    className="clip"
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
              <span className="line">
                {"FOR THE EVERYDAY".split("").map((c, i) => (
                  <span
                    key={i}
                    className="clip"
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
              <span className="line">
                {"MOMENTS.".split("").map((c, i) => (
                  <span
                    key={i}
                    className="clip"
                    style={{ "--i": i } as React.CSSProperties}
                  >
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
                    "--giant-tilt": "3.19deg",
                    "--giant-dy": "-0.118em",
                    "--giant-dx": "0em",
                    "--pp": "0.012",
                    "--pe": "sine.inOut",
                  } as React.CSSProperties
                }
              >
                <img
                  className="giant-card"
                  src="/assets/create-masking-first.webp"
                  alt=""
                />
                <span
                  className="peel giant-tape"
                  style={
                    {
                      "--peel-w": "0.62em",
                      "--peel-h": "0.1961em",
                      "--peel-from":
                        "calc(var(--peel-edge) + 0.34 * var(--peel-span))",
                      "--peel-to":
                        "calc(var(--peel-edge) + 0 * var(--peel-span))",
                      "--peel-dir": "88.4deg",
                      "--peel-back": "url(#peel-back-kraft)",
                      "--peel": "0",
                    } as React.CSSProperties
                  }
                  data-peel="manual"
                >
                  <span className="peel-face">
                    <span className="peel-turn">
                      <img src="/assets/opp-tape-x4.png" alt="" />
                    </span>
                  </span>
                  <span className="peel-flap" aria-hidden="true">
                    <span className="peel-turn">
                      <img src="/assets/opp-tape-x4.png" alt="" />
                    </span>
                  </span>
                </span>
              </span>
              <span>
                {"CREATE".split("").map((c, i) => (
                  <span
                    key={i}
                    className="clip"
                    style={{ "--i": i } as React.CSSProperties}
                  >
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
                  "--py": "-15%",
                  "--pw": "15vw",
                  "--pr": "-8deg",
                  "--pz": "2",
                  "--pp": "-0.03",
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
                    "--peel-h": "0.1961em",
                    "--peel-from":
                      "calc(var(--peel-edge) + 0.34 * var(--peel-span))",
                    "--peel-to":
                      "calc(var(--peel-edge) + 0 * var(--peel-span))",
                    "--peel-dir": "88.4deg",
                    "--peel-back": "url(#peel-back-kraft)",
                    "--peel": "0",
                  } as React.CSSProperties
                }
                data-peel="manual"
              >
                <span className="peel-face">
                  <span className="peel-turn">
                    <img src="/assets/opp-tape-x4.png" alt="" />
                  </span>
                </span>
                <span className="peel-flap" aria-hidden="true">
                  <span className="peel-turn">
                    <img src="/assets/opp-tape-x4.png" alt="" />
                  </span>
                </span>
              </span>
            </span>

            {/* Floating Orbital Tag Props */}
            <img
              className="giant-prop giant-prop--tag"
              src="/assets/slider/double/card.webp"
              alt=""
              aria-hidden="true"
              style={
                {
                  "--px": "69%",
                  "--py": "-24%",
                  "--pw": "22.71vw",
                  "--pr": "-6deg",
                  "--pz": "1",
                  "--pp": "0.03",
                  "--pe": "sine.inOut",
                } as React.CSSProperties
              }
            />
            <img
              className="giant-prop giant-prop--tag"
              src="/assets/slider/masking/card.webp"
              alt=""
              aria-hidden="true"
              style={
                {
                  "--px": "53%",
                  "--py": "50%",
                  "--pw": "22.71vw",
                  "--pr": "5deg",
                  "--pz": "1",
                  "--pp": "0.03",
                  "--pe": "power1.inOut",
                } as React.CSSProperties
              }
            />
            <img
              className="giant-prop giant-prop--tag"
              src="/assets/slider/opp-quiet/card.webp"
              alt=""
              aria-hidden="true"
              style={
                {
                  "--px": "94%",
                  "--py": "46%",
                  "--pw": "22.71vw",
                  "--pr": "-14deg",
                  "--pz": "1",
                  "--pp": "-0.02",
                  "--pe": "power2.inOut",
                } as React.CSSProperties
              }
            />

            {/* Hand-drawn note */}
            <div
              className="hand-note giant-note"
              style={{ "--px": "26%", "--py": "78%" } as React.CSSProperties}
              aria-hidden="true"
            >
              <div className="hand-ink" aria-hidden="true">
                <svg className="hand-rule hand-rule--x" viewBox="0 0 100 10">
                  <path d="M 0 3 C 30 8 65 8 100 1" />
                </svg>
                <svg
                  className="hand-rule hand-rule--y"
                  viewBox="0 0 10 100"
                  style={{ transform: "rotate(3deg)" }}
                >
                  <path d="M 6 0 C 2 33 3 70 6 100" />
                </svg>
                <span className="hand-line">every masterpiece</span>
                <span className="hand-line">starts held</span>
                <span className="hand-line">in place.</span>
              </div>
            </div>
          </div>

          {/* Diagonal Down Arrow: linking TO CREATE to TO FIX */}
          <div className="diag-down-arrow" aria-hidden="true">
            <svg viewBox="0 0 150 100" aria-hidden="true">
              <path
                className="arrow-line"
                d="M4 8 C 46 14 100 42 132 84"
              />
              <path
                className="arrow-head"
                d="M111 80 L132 84 L123 65"
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
                <img
                  className="giant-card"
                  src="/assets/cloth-tapex4.webp"
                  alt=""
                />
                <span
                  className="peel giant-tape"
                  style={
                    {
                      "--peel-w": "0.62em",
                      "--peel-h": "0.2105em",
                      "--peel-from":
                        "calc(var(--peel-edge) + 0.28 * var(--peel-span))",
                      "--peel-to":
                        "calc(var(--peel-edge) + 0 * var(--peel-span))",
                      "--peel-dir": "88.4deg",
                      "--peel-back": "url(#peel-back-black)",
                      "--peel": "0",
                    } as React.CSSProperties
                  }
                  data-peel="manual"
                >
                  <span className="peel-face">
                    <span className="peel-turn">
                      <img src="/assets/black-cloth-tape-x4.png" alt="" />
                    </span>
                  </span>
                  <span className="peel-flap" aria-hidden="true">
                    <span className="peel-turn">
                      <img src="/assets/black-cloth-tape-x4.png" alt="" />
                    </span>
                  </span>
                </span>
              </span>
              <span>
                {"FIX".split("").map((c, i) => (
                  <span
                    key={i}
                    className="clip"
                    style={{ "--i": i } as React.CSSProperties}
                  >
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
                    "--peel-from":
                      "calc(var(--peel-edge) + 0.28 * var(--peel-span))",
                    "--peel-to":
                      "calc(var(--peel-edge) + 0 * var(--peel-span))",
                    "--peel-dir": "88.4deg",
                    "--peel-back": "url(#peel-back-black)",
                    "--peel": "0",
                  } as React.CSSProperties
                }
                data-peel="manual"
              >
                <span className="peel-face">
                  <span className="peel-turn">
                    <img src="/assets/black-cloth-tape-x4.png" alt="" />
                  </span>
                </span>
                <span className="peel-flap" aria-hidden="true">
                  <span className="peel-turn">
                    <img src="/assets/black-cloth-tape-x4.png" alt="" />
                  </span>
                </span>
              </span>
            </span>

            {/* Floating Tag */}
            <img
              className="giant-prop giant-prop--tag"
              src="/assets/slider/cloth/card.webp"
              alt=""
              aria-hidden="true"
              style={
                {
                  "--px": "-5%",
                  "--py": "47%",
                  "--pw": "22.71vw",
                  "--pr": "12deg",
                  "--pz": "1",
                  "--pp": "0.04",
                  "--pe": "sine.inOut",
                } as React.CSSProperties
              }
            />

            {/* Hand-drawn note */}
            <div
              className="hand-note giant-note"
              style={{ "--px": "19%", "--py": "-24%" } as React.CSSProperties}
              aria-hidden="true"
            >
              <div className="hand-ink" aria-hidden="true">
                <svg className="hand-rule hand-rule--x" viewBox="0 0 100 10">
                  <path d="M 0 3 C 30 8 65 8 100 1" />
                </svg>
                <svg
                  className="hand-rule hand-rule--y"
                  viewBox="0 0 10 100"
                  style={{ transform: "rotate(3deg)" }}
                >
                  <path d="M 6 0 C 2 33 3 70 6 100" />
                </svg>
                <span className="hand-line">the quick fix</span>
                <span className="hand-line">that outlasts</span>
                <span className="hand-line">the thing it fixed.</span>
              </div>
            </div>
          </div>

          {/* Diagonal Up Arrow: linking TO FIX to TO PROTECT */}
          <div className="diag-up-arrow" aria-hidden="true">
            <svg viewBox="0 0 150 100" aria-hidden="true">
              <path
                className="arrow-line"
                d="M4 92 C 46 86 100 58 132 16"
              />
              <path
                className="arrow-head"
                d="M111 20 L132 16 L123 35"
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
                <img
                  className="giant-card"
                  src="/assets/protect-opp-tape-x4-square.webp"
                  alt=""
                />
                <span
                  className="peel giant-tape"
                  style={
                    {
                      "--peel-w": "0.62em",
                      "--peel-h": "0.1961em",
                      "--peel-from":
                        "calc(var(--peel-edge) + 0.38 * var(--peel-span))",
                      "--peel-to":
                        "calc(var(--peel-edge) + 0 * var(--peel-span))",
                      "--peel-dir": "88.4deg",
                      "--peel-back": "url(#peel-back-kraft)",
                      "--peel": "0",
                    } as React.CSSProperties
                  }
                  data-peel="manual"
                >
                  <span className="peel-face">
                    <span className="peel-turn">
                      <img src="/assets/opp-tape-x4.png" alt="" />
                    </span>
                  </span>
                  <span className="peel-flap" aria-hidden="true">
                    <span className="peel-turn">
                      <img src="/assets/opp-tape-x4.png" alt="" />
                    </span>
                  </span>
                </span>
              </span>
              <span>
                {"PROTECT".split("").map((c, i) => (
                  <span
                    key={i}
                    className="clip"
                    style={{ "--i": i } as React.CSSProperties}
                  >
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
                    "--peel-from":
                      "calc(var(--peel-edge) + 0.38 * var(--peel-span))",
                    "--peel-to":
                      "calc(var(--peel-edge) + 0 * var(--peel-span))",
                    "--peel-dir": "88.4deg",
                    "--peel-back": "url(#peel-back-kraft)",
                    "--peel": "0",
                  } as React.CSSProperties
                }
                data-peel="manual"
              >
                <span className="peel-face">
                  <span className="peel-turn">
                    <img src="/assets/opp-tape-x4.png" alt="" />
                  </span>
                </span>
                <span className="peel-flap" aria-hidden="true">
                  <span className="peel-turn">
                    <img src="/assets/opp-tape-x4.png" alt="" />
                  </span>
                </span>
              </span>
            </span>

            {/* Floating Tags */}
            <img
              className="giant-prop giant-prop--tag"
              src="/assets/sibling-opp-normal.webp"
              alt=""
              aria-hidden="true"
              style={
                {
                  "--px": "61%",
                  "--py": "-32%",
                  "--pw": "22.71vw",
                  "--pr": "6deg",
                  "--pz": "1",
                  "--pp": "-0.02",
                  "--pe": "power2.inOut",
                } as React.CSSProperties
              }
            />
            <img
              className="giant-prop giant-prop--tag"
              src="/assets/sibling-opp-normal.webp"
              alt=""
              aria-hidden="true"
              style={
                {
                  "--px": "43%",
                  "--py": "49%",
                  "--pw": "22.71vw",
                  "--pr": "9deg",
                  "--pz": "1",
                  "--pp": "0.032",
                  "--pe": "power1.inOut",
                } as React.CSSProperties
              }
            />

            {/* Hand-drawn note */}
            <div
              className="hand-note giant-note"
              style={{ "--px": "25%", "--py": "75%" } as React.CSSProperties}
              aria-hidden="true"
            >
              <div className="hand-ink" aria-hidden="true">
                <svg className="hand-rule hand-rule--x" viewBox="0 0 100 10">
                  <path d="M 0 3 C 30 8 65 8 100 1" />
                </svg>
                <svg
                  className="hand-rule hand-rule--y"
                  viewBox="0 0 10 100"
                  style={{ transform: "rotate(3deg)" }}
                >
                  <path d="M 6 0 C 2 33 3 70 6 100" />
                </svg>
                <span className="hand-line">from our hands</span>
                <span className="hand-line">to theirs,</span>
                <span className="hand-line">arriving whole.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
