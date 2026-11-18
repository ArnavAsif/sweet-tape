"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createTapeViewer } from "@/lib/createTapeViewer";
import { playOnce, SOUNDS } from "@/lib/sounds";
import { whenRevealed } from "@/lib/loader";

gsap.registerPlugin(ScrollTrigger);

interface ProductDef {
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
}

const PRODUCTS: ProductDef[] = [
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
    tags: ["LABELING", "PAINT WORK", "BUNDLING"],
    copy: "Always ready for school projects, quick labels, and weekend crafts. Easygoing. Comes off clean. No drama.",
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
    tags: ["INVISIBLE HOLDING", "SMOOTH MOUNTING", "QUICK PATCHING"],
    copy: "The kind of tape that commits. Strong hold on both sides, easy to use, hard to let go.",
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
    tags: ["SMALL REPAIRS", "STICK & GO", "DESK DRAWER ESSENTIAL"],
    copy: "From broken corners to last-minute projects. Easy to tear. Easy to use. Weirdly reliable.",
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
    tags: ["QUICK FIX", "STRONG REPAIRS", "BUNDLING"],
    copy: "Doesn’t talk much. Just holds everything together. Rain or shine.",
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
    strip: "/assets/opp-tape-x4.png|peel-back-masking|128.83px|40.74px|normal",
    tags: ["SEALING", "PACKAGING", "WRAPPING"],
    copy: "Moving house? Packing chaos? This one shows up every time.",
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
    tags: ["CHILL BUNDLING", "QUIET LABELING", "SOFT PACKING"],
    copy: "Perfect for calm packers, quiet workers, and people who tape at 2AM. Soft roll. Strong stick.",
  },
];

const ARC_RATIO = 150.5 / 1456;

function dipTo(e: HTMLElement): number {
  return (e.offsetHeight || e.getBoundingClientRect().height || 1) + 2;
}

function maskAt(e: HTMLElement): number {
  const match = /([-\d.]+)px\s+([-\d.]+)px/.exec(e.style.getPropertyValue("mask-position"));
  return match ? parseFloat(match[2]) : 0;
}

function maskDip(e: HTMLElement, t: number): void {
  const pos = `0px ${t}px`;
  e.style.setProperty("mask-position", pos);
  e.style.setProperty("-webkit-mask-position", pos);
}

function shiftAt(e: HTMLElement): number {
  return (gsap.getProperty(e, "y") as number) || 0;
}

function shiftDip(e: HTMLElement, y: number): void {
  gsap.set(e, { y });
}

function getBodyLines(elements: HTMLElement[]): HTMLElement[][] {
  if (!elements.length) return [];
  const items = elements
    .map((el) => ({
      rise: el,
      top: (el.parentElement ?? el).offsetTop,
    }))
    .sort((a, b) => a.top - b.top);

  const baseEl = elements[0];
  const threshold = Math.max(4, (((baseEl.parentElement ?? baseEl).offsetHeight || 16) / 2));
  const lines: HTMLElement[][] = [];
  let curLine: HTMLElement[] = [];
  let curTop = -Infinity;

  for (const { rise, top } of items) {
    if (top - curTop > threshold) {
      curLine = [];
      lines.push(curLine);
      curTop = top;
    }
    curLine.push(rise);
  }
  return lines;
}

export default function TapeSlider() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const queryAll = <T extends HTMLElement>(sel: string): T[] =>
      Array.from(section.querySelectorAll<T>(sel));

    const rollParent = section.querySelector<HTMLElement>(".roll-parent");
    const rollIt = rollParent?.querySelector<HTMLElement>(".roll-it") ?? null;
    const track = rollParent?.querySelector<HTMLElement>(".rail-track");
    if (!track) return;

    const buttons = Array.from(track.querySelectorAll<HTMLButtonElement>("button"));
    if (!buttons.length) return;

    const rings = buttons.map((b) => b.querySelector<HTMLElement>(".roll-ring")).filter(Boolean) as HTMLElement[];
    const topImgs = queryAll<HTMLElement>(".top-title img");
    const bottomImgs = queryAll<HTMLElement>(".bottom-title .glyph img");
    const topTitle = section.querySelector<HTMLElement>(".top-title");
    const exploreBtn = section.querySelector<HTMLAnchorElement>(".explore-button");
    const exploreText = exploreBtn?.querySelector<HTMLElement>(".button-text") ?? null;
    const bottomTitle = section.querySelector<HTMLElement>(".bottom-title");
    const srOnlyTitle = section.querySelector<HTMLElement>("h2.sr-only");
    const keyVisual = section.querySelector<HTMLElement>(".key-visual");
    const keyVisualImg = keyVisual?.querySelector<HTMLImageElement>(":scope > img") ?? null;
    const showcases = queryAll<HTMLElement>(".middle .showcase");
    const showcaseImgs = showcases.map((s) => s.querySelector<HTMLImageElement>(":scope > img")).filter(Boolean) as HTMLImageElement[];
    const peels = showcases.map((s) => s.querySelector<HTMLElement>(".showcase-tape")).filter(Boolean) as HTMLElement[];
    const leftEl = section.querySelector<HTMLElement>(".left");
    const tagContainer = leftEl?.querySelector<HTMLElement>(".tag") ?? null;
    const bodyCopyEl = leftEl?.querySelector<HTMLElement>(".subtext .h5") ?? null;
    const tagElements: HTMLElement[] = [];
    const tapeNav = section.querySelector<HTMLElement>(".tape-nav");
    const navButtons = tapeNav ? Array.from(tapeNav.querySelectorAll<HTMLButtonElement>("button[data-step]")) : [];
    const subhead = section.querySelector<HTMLElement>(".subhead:not(.subhead--next)");
    const sweepPaint = section.querySelector<HTMLElement>(".sweep-paint");
    const sweepInner = section.querySelector<HTMLElement>(".sweep-inner");
    const subheadNext = sweepPaint?.querySelector<HTMLElement>(".subhead--next") ?? null;
    const bgOverlay = section.querySelector<HTMLElement>(".bg-overlay");
    const bgBase = bgOverlay?.querySelector<HTMLElement>(".bg-layer--base") ?? null;
    const bgNext = bgOverlay?.querySelector<HTMLElement>(".bg-layer--next") ?? null;
    const hasOverlay = Boolean(bgOverlay && bgBase && bgNext);

    const numButtons = buttons.length;
    const stepAngle = 360 / numButtons;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const currentRot = { rot: 180 };
    let activeIdx = 0;
    let trackRadius = 0;

    let mainTl: gsap.core.Timeline | null = null;
    let entryTl: gsap.core.Timeline | null = null;
    let sweepTl: gsap.core.Animation | null = null;
    let spinTl: gsap.core.Timeline | null = null;
    let showcaseTl: gsap.core.Timeline | null = null;
    let tagTl: gsap.core.Timeline | null = null;
    let peelTl: gsap.core.Timeline | null = null;
    let isDisposed = false;
    let viewerInstance: any = null;

    function measureTrackRadius() {
      trackRadius = track ? track.getBoundingClientRect().width / 2 : 120;
    }

    let visualCenterX = 0;
    let visualCenterY = 0;
    let isVisualVisible = true;

    function measureVisualCenter() {
      if (!keyVisual) return;
      const rect = keyVisual.getBoundingClientRect();
      visualCenterX = rect.left + rect.width / 2;
      visualCenterY = rect.top + rect.height / 2 + window.scrollY;
    }

    function resetVisualPoint() {
      viewerInstance?.point(0, 0);
    }

    function updateRailPositions() {
      for (let i = 0; i < numButtons; i++) {
        const rad = ((i * stepAngle + currentRot.rot) * Math.PI) / 180;
        gsap.set(buttons[i], {
          x: Math.cos(rad) * trackRadius,
          y: Math.sin(rad) * trackRadius,
        });
      }
    }

    function popRing(ring: HTMLElement, delay = 0) {
      gsap.to(ring, {
        scale: 1,
        opacity: 1,
        duration: 0.55 * (!prefersReducedMotion ? 1 : 0),
        delay: prefersReducedMotion ? 0 : delay,
        ease: "back.out(1.6)",
        overwrite: "auto",
      });
    }

    function calcElementEv(el: HTMLElement | null, mult = 1): number {
      if (!hasOverlay || !el || !bgOverlay) return 0;
      const overlayBounds = bgOverlay.getBoundingClientRect();
      const arcH = overlayBounds.width * ARC_RATIO;
      const totalH = overlayBounds.height + arcH + 2;
      const fraction = (el.getBoundingClientRect().bottom - overlayBounds.top + arcH * mult) / totalH;
      const easeFn = gsap.parseEase("power2.out");
      for (let i = 0; i <= 100; i++) {
        if (easeFn(i / 100) >= fraction) return (i / 100) * 0.85;
      }
      return 0.85;
    }

    function getCssProp(el: HTMLElement, name: string): string {
      return getComputedStyle(el).getPropertyValue(name).trim();
    }

    function applyTagColors(target: HTMLElement | null, source: HTMLElement) {
      if (!target) return;
      const style = getComputedStyle(source);
      target.style.setProperty("--tag-bg", style.getPropertyValue("--tag-bg").trim());
      target.style.setProperty("--tag-ink", style.getPropertyValue("--tag-ink").trim());
    }

    function applyNavColors(source: HTMLElement) {
      if (!tapeNav) return;
      const style = getComputedStyle(source);
      tapeNav.style.setProperty("--nav-face", style.getPropertyValue("--ring").trim());
      tapeNav.style.setProperty("--nav-ink", style.getPropertyValue("--word").trim());
    }

    function applyRollItColor(source: HTMLElement) {
      if (!rollIt) return;
      const color = getComputedStyle(source).getPropertyValue("--ink").trim();
      rollIt.style.setProperty("--ink", color);
    }

    function updateWord(idx: number) {
      const word = buttons[idx].dataset.word || "";
      if (word && bottomTitle) {
        bottomTitle.dataset.word = word;
        if (srOnlyTitle) {
          srOnlyTitle.textContent = `THE ${word.toUpperCase()}`;
        }
      }
    }

    function parseStripData(btn: HTMLButtonElement) {
      const parts = (btn.dataset.strip || "").split("|");
      if (parts.length >= 4) {
        return {
          src: parts[0],
          back: parts[1],
          w: parts[2],
          h: parts[3],
          blend: parts[4] || "normal",
        };
      }
      return null;
    }

    function updateShowcaseStrip(btnIdx: number, showcaseIdx?: number) {
      const stripData = parseStripData(buttons[btnIdx]);
      if (!stripData) return;
      peels.forEach((p, idx) => {
        if (p && (showcaseIdx === undefined || idx === showcaseIdx)) {
          p.style.setProperty("--peel-w", stripData.w);
          p.style.setProperty("--peel-h", stripData.h);
          p.style.setProperty("--peel-back", `url(#${stripData.back})`);
          p.style.setProperty("--strip-blend", stripData.blend);
          p.querySelectorAll("img").forEach((img) => {
            img.src = stripData.src;
          });
        }
      });
    }

    function updateShowcasesContent(idx: number) {
      const list = (buttons[idx].dataset.showcase || "").split("|").filter(Boolean);
      showcases.forEach((sc, i) => {
        const img = showcaseImgs[i];
        if (list[i] && img) {
          img.src = list[i];
        }
        const rot = parseFloat(getComputedStyle(sc).getPropertyValue("--rot")) || 0;
        gsap.set(sc, { rotation: rot });
      });
      updateShowcaseStrip(idx);
    }

    function getBodyRiseElements(): HTMLElement[] {
      return bodyCopyEl ? Array.from(bodyCopyEl.querySelectorAll<HTMLElement>(".body-rise")) : [];
    }

    function updateLeftContent(idx: number) {
      if (!leftEl) return;
      const btn = buttons[idx];
      const style = getComputedStyle(btn);
      ["--tag-bg", "--tag-ink", "--ink"].forEach((p) => {
        leftEl.style.setProperty(p, style.getPropertyValue(p).trim());
      });

      const tagsList = (btn.dataset.tags || "").split("|").filter(Boolean);
      tagElements.forEach((el, tIdx) => {
        const exists = tIdx < tagsList.length;
        el.textContent = exists ? tagsList[tIdx] : "";
        el.style.display = exists ? "" : "none";
        const rot = parseFloat(getComputedStyle(el).getPropertyValue("--rot")) || 0;
        gsap.set(el, { rotation: rot });
      });

      if (bodyCopyEl) {
        const words = (btn.dataset.copy || "").trim().split(/\s+/).filter(Boolean);
        bodyCopyEl.replaceChildren(
          ...words.flatMap((word, wIdx) => {
            const clip = document.createElement("span");
            clip.className = "body-clip";
            const rise = document.createElement("span");
            rise.className = "body-rise";
            rise.textContent = word;
            clip.appendChild(rise);
            return wIdx > 0 ? [" ", clip] : [clip];
          })
        );
        gsap.set(getBodyRiseElements(), {
          yPercent: prefersReducedMotion ? 0 : 110,
        });
      }
    }

    function updateActiveButtons() {
      buttons.forEach((btn, i) => {
        const isActive = i === activeIdx;
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
        btn.classList.toggle("is-active", isActive);
        gsap.set(btn, { zIndex: isActive ? 2 : 1 });
      });
    }

    function dispatchRollChange(idx: number) {
      track?.dispatchEvent(
        new CustomEvent("roll:change", {
          bubbles: true,
          detail: {
            index: idx,
            id: buttons[idx].dataset.index,
          },
        })
      );
    }

    function animateWordLetters(
      tl: gsap.core.Timeline,
      elements: HTMLElement[],
      color: string,
      startTime: number,
      stagger: number,
      dipSetter: (el: HTMLElement, y: number) => void,
      atGetter: (el: HTMLElement) => number,
      triggerTime?: number,
      onMidpoint?: (f: () => void) => void
    ) {
      const subTl = gsap.timeline();
      const stateList: Array<{ el: HTMLElement; st: { y: number } }> = [];
      const resetDips = () => {
        for (const item of stateList) {
          item.st.y = dipTo(item.el);
          dipSetter(item.el, item.st.y);
        }
      };
      const durationUp = 0.42;
      const easeUp = "power3.out";
      const riseDelay = Math.max((elements.length - 1) * stagger + 0.32 + 0.07, (triggerTime || 0) - startTime);

      elements.forEach((el, idx) => {
        const st = { y: atGetter(el) };
        stateList.push({ el, st });
        const updateCb = () => dipSetter(el, st.y);
        const stepDelay = idx * stagger;

        subTl.to(
          st,
          {
            y: dipTo(el),
            duration: 0.32,
            ease: "power2.in",
            onUpdate: updateCb,
            onComplete() {
              el.style.setProperty("--word-colour", color);
              if (idx === elements.length - 1 && onMidpoint) {
                onMidpoint(resetDips);
              }
            },
          },
          stepDelay
        );

        subTl.to(
          st,
          {
            y: 0,
            duration: durationUp,
            ease: easeUp,
            onUpdate: updateCb,
          },
          riseDelay + stepDelay
        );
      });

      tl.add(subTl, startTime);
      return subTl;
    }

    function animateSweepWave(timeline: gsap.core.Timeline, nextIdx: number) {
      const pObj = { p: 0 };
      let bounds: DOMRect | null = null;
      let arcH = 0;
      let totalH = 0;
      const nextBg = getCssProp(buttons[nextIdx], "--bg");

      function initSweep() {
        if (!bgOverlay) return;
        bounds = bgOverlay.getBoundingClientRect();
        arcH = bounds.width * ARC_RATIO;
        totalH = bounds.height + arcH + 2;
        if (bgNext) {
          bgNext.style.height = `${totalH}px`;
          bgNext.style.background = nextBg;
          bgNext.style.setProperty("--arc-h", `${arcH}px`);
          bgNext.style.transform = `translateY(${-totalH}px)`;
        }
        if (sweepPaint && sweepInner) {
          sweepPaint.style.height = `${totalH}px`;
          sweepPaint.style.setProperty("--arc-h", `${arcH}px`);
          sweepPaint.style.transform = `translateY(${-totalH}px)`;
          sweepInner.style.height = `${bounds.height}px`;
          sweepInner.style.transform = `translateY(${totalH}px)`;
          applyTagColors(subheadNext, buttons[nextIdx]);
        }
      }

      return timeline.to(
        pObj,
        {
          p: 1,
          duration: 0.85,
          ease: "power2.out",
          onStart: initSweep,
          onUpdate() {
            if (!bounds) initSweep();
            const y = (pObj.p - 1) * totalH;
            if (bgNext) bgNext.style.transform = `translateY(${y}px)`;
            if (sweepPaint && sweepInner) {
              sweepPaint.style.transform = `translateY(${y}px)`;
              sweepInner.style.transform = `translateY(${-y}px)`;
            }
          },
          onComplete() {
            if (bgBase) bgBase.style.background = nextBg;
            if (bgNext) bgNext.style.transform = "translateY(-100%)";
            applyTagColors(subhead, buttons[nextIdx]);
            applyNavColors(buttons[nextIdx]);
            if (sweepPaint) sweepPaint.style.transform = "translateY(-100%)";
          },
        },
        0.75
      );
    }

    function animateTapeModel(tl: gsap.core.Timeline, nextIdx: number) {
      const subTl = gsap.timeline();
      const model = buttons[nextIdx].dataset.model || "";

      if (viewerInstance && model && viewerInstance.ready(model)) {
        if (keyVisualImg) keyVisualImg.style.visibility = "hidden";
        const spinObj = { deg: 0 };
        subTl.to(
          spinObj,
          {
            deg: 90,
            duration: 0.45,
            ease: "power2.in",
            onUpdate: () => viewerInstance?.spin(spinObj.deg),
          },
          0
        );

        const spinBackObj = { deg: -90 };
        subTl.call(
          () => {
            viewerInstance?.show(model);
            viewerInstance?.spin(spinBackObj.deg);
          },
          undefined,
          0.45
        );

        subTl.to(
          spinBackObj,
          {
            deg: 0,
            duration: 0.45,
            ease: "power2.out",
            onUpdate: () => viewerInstance?.spin(spinBackObj.deg),
          },
          0.45
        );
      } else {
        const card = keyVisualImg && (buttons[nextIdx].dataset.card || "");
        if (keyVisualImg && card) {
          subTl.call(
            () => {
              keyVisualImg.src = card;
              keyVisualImg.style.visibility = "visible";
            },
            undefined,
            0.45
          );
        }
      }

      tl.add(subTl, 0.1);
      return subTl;
    }

    function animateShowcases(tl: gsap.core.Timeline, nextIdx: number) {
      const showcaseList = (buttons[nextIdx].dataset.showcase || "").split("|").filter(Boolean);
      if (!showcases.length || !showcaseList.length) return null;
      const subTl = gsap.timeline();

      showcases.forEach((sc, idx) => {
        const stepTime = 0.26 * idx;
        subTl.to(
          sc,
          {
            rotationY: 90,
            z: -55,
            duration: 0.39,
            ease: "power2.in",
          },
          stepTime
        );

        subTl.call(
          () => {
            const img = showcaseImgs[idx];
            if (showcaseList[idx] && img) {
              img.src = showcaseList[idx];
            }
            updateShowcaseStrip(nextIdx, idx);
            gsap.set(sc, { rotationY: -90 });
          },
          undefined,
          stepTime + 0.39
        );

        subTl.to(
          sc,
          {
            rotationY: 0,
            z: 0,
            duration: 0.39,
            ease: "power2.out",
            immediateRender: false,
          },
          stepTime + 0.39
        );
      });

      tl.add(subTl, 0.18);
      return subTl;
    }

    function animateLeftTags(tl: gsap.core.Timeline, nextIdx: number, overlayDelay: number) {
      if (!leftEl || !tagElements.length) return null;
      const subTl = gsap.timeline();
      const exitX = -(leftEl.getBoundingClientRect().right + 40);

      tagElements.forEach((tag, idx) => {
        subTl.to(tag, { x: exitX, duration: 0.34, ease: "power2.in" }, 0.07 * idx);
      });

      let linesCount = 0;
      const bodyLinesList = bodyCopyEl ? getBodyLines(getBodyRiseElements()) : [];
      linesCount = bodyLinesList.length;

      if (bodyCopyEl && linesCount > 0) {
        bodyLinesList.forEach((lineElements, lIdx) => {
          subTl.to(
            lineElements,
            { yPercent: 110, duration: 0.26, ease: "power2.in" },
            0.05 * lIdx
          );
        });
      }

      const tagExitDone = (tagElements.length - 1) * 0.07 + 0.34;
      const copyExitDone = linesCount > 0 ? 0.05 * Math.max(0, linesCount - 1) + 0.26 : 0;
      const contentSwitchTime = Math.max(tagExitDone, copyExitDone);
      const reEnterTime = Math.max(contentSwitchTime + 0.06, overlayDelay - 0.12);

      subTl.call(() => updateLeftContent(nextIdx), undefined, contentSwitchTime);

      tagElements.forEach((tag, idx) => {
        subTl.to(tag, { x: 0, duration: 0.5, ease: "power3.out" }, reEnterTime + 0.07 * idx);
      });

      if (bodyCopyEl) {
        subTl.call(
          () => {
            getBodyLines(getBodyRiseElements()).forEach((lineElements, lIdx) => {
              subTl.to(
                lineElements,
                { yPercent: 0, duration: 0.72, ease: "power3.out" },
                reEnterTime + lIdx * 0.09
              );
            });
          },
          undefined,
          reEnterTime
        );
      }

      tl.add(subTl, 0.12);
      return subTl;
    }

    function goToProduct(nextIdx: number) {
      if (nextIdx === activeIdx) return;
      activeIdx = nextIdx;
      playOnce(SOUNDS.SLIDE_CHANGE);
      exploreBtn?.setAttribute("href", `/products/${buttons[nextIdx].dataset.index}`);

      const targetRot = (((180 - nextIdx * stepAngle - currentRot.rot) % 360) + 540) % 360 - 180;

      if (sweepTl && sweepTl.isActive()) sweepTl.progress(1);
      if (spinTl && spinTl.isActive()) spinTl.progress(1);
      if (showcaseTl && showcaseTl.isActive()) showcaseTl.progress(1);
      if (peelTl && peelTl.isActive()) peelTl.progress(1);
      if (mainTl) mainTl.kill();
      if (entryTl) {
        entryTl.kill();
        entryTl = null;
      }

      updateActiveButtons();

      if (prefersReducedMotion) {
        gsap.set(rings, { scale: 0, opacity: 0 });
        currentRot.rot += targetRot;
        updateRailPositions();
        popRing(rings[nextIdx]);
        if (hasOverlay && bgBase) bgBase.style.background = getCssProp(buttons[nextIdx], "--bg");
        const wordColor = getCssProp(buttons[nextIdx], "--word");
        topImgs.forEach((img) => img.style.setProperty("--word-colour", wordColor));
        bottomImgs.forEach((img) => {
          img.style.setProperty("--word-colour", wordColor);
          gsap.set(img, { y: 0 });
        });
        updateWord(nextIdx);
        const model = buttons[nextIdx].dataset.model || "";
        if (viewerInstance && model && viewerInstance.ready(model)) {
          viewerInstance.show(model);
          viewerInstance.spin(0);
        } else if (keyVisualImg && buttons[nextIdx].dataset.card) {
          keyVisualImg.src = buttons[nextIdx].dataset.card || "";
        }
        updateShowcasesContent(nextIdx);
        gsap.set(showcases, { rotationY: 0, z: 0 });
        applyTagColors(subhead, buttons[nextIdx]);
        applyNavColors(buttons[nextIdx]);
        applyRollItColor(buttons[nextIdx]);
        updateLeftContent(nextIdx);
        dispatchRollChange(nextIdx);
        return;
      }

      mainTl = gsap.timeline();

      // 1. Rings shrink
      mainTl.to(rings, { scale: 0, opacity: 0, duration: 0.46, ease: "back.in(0.9)" }, 0);

      // 2. Wheel rotates
      mainTl.to(
        currentRot,
        {
          rot: currentRot.rot + targetRot,
          duration: 0.85,
          ease: "sine.inOut",
          onUpdate: updateRailPositions,
        },
        0.12
      );

      // 3. Active ring pops in
      mainTl.to(rings[nextIdx], { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(1.6)" }, 0.75);

      const wordColor = getCssProp(buttons[nextIdx], "--word");

      // 4. Background wave sweep
      if (hasOverlay) {
        sweepTl = animateSweepWave(mainTl, nextIdx);
      }

      // 5. Colors/sound cues
      mainTl.call(() => applyRollItColor(buttons[nextIdx]), undefined, hasOverlay ? 0.75 + calcElementEv(rollIt) : 0);
      mainTl.call(() => applyNavColors(buttons[nextIdx]), undefined, hasOverlay ? 0.75 + calcElementEv(tapeNav, 0.2) : 0);

      // 6. Top title dip and rise
      if (topImgs.length) {
        animateWordLetters(
          mainTl,
          topImgs,
          wordColor,
          0,
          0.08,
          maskDip,
          maskAt,
          0.75 + calcElementEv(topTitle) + 0.06
        );
      }

      // 7. Bottom title dip and rise
      if (bottomImgs.length) {
        animateWordLetters(
          mainTl,
          bottomImgs,
          wordColor,
          0.06,
          0.05,
          shiftDip,
          shiftAt,
          0.75 + calcElementEv(bottomTitle) + 0.06,
          (resetFn) => {
            updateWord(nextIdx);
            resetFn();
          }
        );
      }

      // 8. 3D Model spin & switch
      spinTl = animateTapeModel(mainTl, nextIdx);

      // 9. Showcases flip
      showcaseTl = animateShowcases(mainTl, nextIdx);

      // 10. Left tags slide
      tagTl = animateLeftTags(mainTl, nextIdx, 1.6 * (hasOverlay ? 1 : 0));

      dispatchRollChange(nextIdx);
    }

    const abortCtrl = new AbortController();
    const { signal } = abortCtrl;

    buttons.forEach((btn, idx) => {
      gsap.set(btn, { xPercent: -50, yPercent: -50 });
      btn.addEventListener("click", () => goToProduct(idx), { signal });
    });

    navButtons.forEach((btn) => {
      const step = Number(btn.dataset.step) || 1;
      btn.addEventListener(
        "click",
        () => goToProduct((activeIdx + step + numButtons) % numButtons),
        { signal }
      );
    });

    track.addEventListener(
      "keydown",
      (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const nextIdx = (activeIdx + (e.key === "ArrowRight" ? 1 : -1) + numButtons) % numButtons;
        goToProduct(nextIdx);
        buttons[nextIdx].focus();
      },
      { signal }
    );

    // Pointer move listener with zero layout reflows (using cached visualCenterX, visualCenterY)
    const canHover = window.matchMedia("(hover: hover)").matches;
    let visualObserver: IntersectionObserver | null = null;

    if (!prefersReducedMotion && canHover) {
      window.addEventListener(
        "pointermove",
        (e: PointerEvent) => {
          if (!viewerInstance || !isVisualVisible) return;
          const factor = 0.5 * Math.min(window.innerWidth, window.innerHeight) * 0.42;
          const relY = visualCenterY - window.scrollY;
          viewerInstance.point((e.clientX - visualCenterX) / factor, (e.clientY - relY) / factor);
        },
        { signal, passive: true }
      );

      document.addEventListener("pointerleave", resetVisualPoint, { signal });
      window.addEventListener("blur", resetVisualPoint, { signal });

      visualObserver = new IntersectionObserver(([entry]) => {
        isVisualVisible = entry.isIntersecting;
        viewerInstance?.setActive?.(isVisualVisible);
        if (isVisualVisible) {
          measureVisualCenter();
        } else {
          resetVisualPoint();
        }
      });
      visualObserver.observe(section);
    }

    const onResize = () => {
      measureTrackRadius();
      updateRailPositions();
      measureVisualCenter();
    };

    window.addEventListener("resize", onResize, { signal, passive: true });
    window.addEventListener("scroll", measureVisualCenter, { signal, passive: true });

    measureTrackRadius();
    gsap.set(rings, { scale: 0, opacity: 0 });
    updateRailPositions();
    updateActiveButtons();

    if (hasOverlay && bgBase) {
      bgBase.style.background = getCssProp(buttons[activeIdx], "--bg");
      section.style.setProperty("--word-colour", getCssProp(buttons[activeIdx], "--word"));
    }

    // Pre-decode all slider images to prevent decoding stutters
    const imagesToPreload = Array.from(
      new Set(
        buttons.reduce<string[]>((acc, b) => {
          const card = b.dataset.card;
          const showcase = (b.dataset.showcase || "").split("|").filter(Boolean);
          const stripSrc = (b.dataset.strip || "").split("|")[0];
          return acc.concat(card ? [card] : [], showcase, stripSrc ? [stripSrc] : []);
        }, [])
      )
    );

    const preloadedImages = imagesToPreload.map((src) => {
      const img = new Image();
      img.src = src;
      img.decode?.().catch(() => {});
      return img;
    });

    if (keyVisualImg && buttons[activeIdx].dataset.card) {
      keyVisualImg.src = buttons[activeIdx].dataset.card || "";
    }

    // 3D Viewer initialization
    const modelUrls = Array.from(
      new Set([buttons[activeIdx].dataset.model, ...buttons.map((b) => b.dataset.model)].filter(Boolean) as string[])
    );

    if (keyVisual && modelUrls.length) {
      if (keyVisualImg) keyVisualImg.style.visibility = "hidden";
      const clarities: Record<string, number> = {
        double: 0.04,
        stationery: 0.11,
        opp: 0.09,
        "opp-quiet": 0.1,
      };
      const clarityMap = Object.fromEntries(
        buttons.filter((b) => b.dataset.model).map((b) => [b.dataset.model!, clarities[b.dataset.index || ""] ?? 0])
      );

      createTapeViewer(
        keyVisual,
        modelUrls,
        { key: 0, ambient: 0.97, fill: 0, env: 0.14 },
        { "Face Brown": { metalness: 0.05 } },
        {
          clarity: clarityMap,
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
          if (isDisposed) return viewer.dispose();
          viewerInstance = viewer;
          const activeModel = buttons[activeIdx].dataset.model || "";
          viewer.show(activeModel);
          viewer.spin(0);
          viewer.setActive?.(isVisualVisible);
        })
        .catch(() => {
          if (keyVisualImg) keyVisualImg.style.visibility = "visible";
        });
    }

    gsap.set(showcases, { transformPerspective: 900 });
    updateShowcasesContent(activeIdx);
    measureVisualCenter();
    applyTagColors(subhead, buttons[activeIdx]);
    applyNavColors(buttons[activeIdx]);
    applyRollItColor(buttons[activeIdx]);

    // Build static tag DOM nodes once
    if (tagContainer) {
      const maxTags = buttons.reduce((acc, b) => Math.max(acc, (b.dataset.tags || "").split("|").length), 0);
      tagContainer.textContent = "";
      tagElements.length = 0;
      for (let i = 0; i < maxTags; i++) {
        const tag = document.createElement("h6");
        tag.className = "h6";
        tagContainer.appendChild(tag);
        tagElements.push(tag);
      }
    }
    updateLeftContent(activeIdx);

    let scrollEntryObserver: IntersectionObserver | null = null;

    if (prefersReducedMotion) {
      track.classList.add("is-ready");
      popRing(rings[activeIdx], 0.4);
    } else {
      topImgs.forEach((img) => maskDip(img, dipTo(img)));
      bottomImgs.forEach((img) => shiftDip(img, dipTo(img)));

      if (leftEl && tagElements.length) {
        const exitX = -(leftEl.getBoundingClientRect().right + 40);
        tagElements.forEach((t) => gsap.set(t, { x: exitX }));
        gsap.set(getBodyRiseElements(), { yPercent: 110 });
      }

      gsap.set(showcases, { rotationY: -90, z: -55 });
      peels.forEach((p) => p?.style.setProperty("--peel", "0"));
      if (exploreBtn) gsap.set(exploreBtn, { autoAlpha: 0, scale: 0, y: 0.022 * window.innerWidth });
      if (exploreText) gsap.set(exploreText, { yPercent: 115 });

      scrollEntryObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            scrollEntryObserver?.disconnect();
            scrollEntryObserver = null;
            track.classList.add("is-ready");

            entryTl = gsap.timeline();
            entryTl.to(rings[activeIdx], { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(1.6)" }, 0.4);

            if (topImgs.length) {
              const topRiseTl = gsap.timeline();
              topImgs.forEach((img, i) => {
                const n = { y: maskAt(img) };
                topRiseTl.to(n, { y: 0, duration: 0.42, ease: "power3.out", onUpdate: () => maskDip(img, n.y) }, i * 0.08);
              });
              entryTl.add(topRiseTl, 0.1);
            }

            if (bottomImgs.length) {
              const bottomRiseTl = gsap.timeline();
              bottomImgs.forEach((img, i) => {
                const n = { y: shiftAt(img) };
                bottomRiseTl.to(n, { y: 0, duration: 0.42, ease: "power3.out", onUpdate: () => shiftDip(img, n.y) }, i * 0.05);
              });
              entryTl.add(bottomRiseTl, 0.26);
            }

            if (exploreBtn) {
              const expTl = gsap.timeline();
              expTl.set(exploreBtn, { autoAlpha: 1 }, 0);
              expTl.to(exploreBtn, { scale: 1, duration: 0.52, ease: "back.out(2.4)" }, 0);
              expTl.to(exploreBtn, { y: 0, duration: 0.68, ease: "back.out(1.9)" }, 0);
              if (exploreText) {
                expTl.to(exploreText, { yPercent: 0, duration: 0.5, ease: "power3.out" }, 0.16);
              }
              entryTl.add(expTl, 0.6);
            }

            if (showcases.length) {
              const scTl = gsap.timeline();
              showcases.forEach((sc, i) => {
                scTl.to(sc, { rotationY: 0, z: 0, duration: 0.39, ease: "power2.out" }, 0.26 * i);
              });
              entryTl.add(scTl, 0.22);
            }

            if (peels.length) {
              const pTl = gsap.timeline();
              peels.forEach((p, i) => {
                const pObj = { p: 0 };
                pTl.to(
                  pObj,
                  {
                    p: 1,
                    duration: 0.62,
                    ease: "power2.out",
                    onUpdate: () => p.style.setProperty("--peel", String(pObj.p)),
                  },
                  0.26 * i
                );
              });
              entryTl.add(pTl, 0.69);
            }

            if (leftEl && tagElements.length) {
              const leftTl = gsap.timeline();
              tagElements.forEach((tag, i) => {
                leftTl.to(tag, { x: 0, duration: 0.5, ease: "power3.out" }, 0.07 * i);
              });
              if (bodyCopyEl) {
                leftTl.call(
                  () => {
                    getBodyLines(getBodyRiseElements()).forEach((lineElements, lIdx) => {
                      leftTl.to(
                        lineElements,
                        { yPercent: 0, duration: 0.72, ease: "power3.out" },
                        lIdx * 0.09
                      );
                    });
                  },
                  undefined,
                  0
                );
              }
              entryTl.add(leftTl, 0.2);
            }
          }
        },
        { rootMargin: "0px 0px -45% 0px" }
      );
      scrollEntryObserver.observe(section);
    }

    // Slide lift responsive calculation
    function updateSlideLift() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (!w || !h) return;
      const lift = Math.min(Math.max(0, 0.36 * w - 0.576 * h), 0.036 * w);
      section?.style.setProperty("--slide-lift", `${-Math.round(10 * lift) / 10}px`);
    }

    window.addEventListener("resize", updateSlideLift, { signal, passive: true });
    updateSlideLift();

    // Subhead chip 3D flip entry
    let chipTrigger: ScrollTrigger | null = null;
    let chipTween: gsap.core.Tween | null = null;
    let unsubsChipRevealed: (() => void) | null = null;

    if (subhead && !prefersReducedMotion) {
      chipTween = gsap.fromTo(
        subhead,
        { autoAlpha: 0, rotateY: 90, transformPerspective: 800, transformOrigin: "50% 50%" },
        {
          autoAlpha: 1,
          rotateY: 0,
          duration: 0.6,
          ease: "power2.out",
          paused: true,
          onComplete: () => gsap.set(subhead, { clearProps: "transform,transformOrigin" }),
        }
      );

      chipTrigger = ScrollTrigger.create({
        trigger: subhead,
        start: "top 88%",
        once: true,
        onEnter: () => {
          unsubsChipRevealed = whenRevealed(() => chipTween?.play());
        },
      });
    }

    return () => {
      isDisposed = true;
      abortCtrl.abort();
      scrollEntryObserver?.disconnect();
      visualObserver?.disconnect();
      chipTrigger?.kill();
      chipTween?.kill();
      unsubsChipRevealed?.();

      [mainTl, entryTl, sweepTl, spinTl, showcaseTl, tagTl, peelTl].forEach((t) => t?.kill());
      gsap.killTweensOf([...rings, ...topImgs, ...bottomImgs, ...showcases, ...tagElements, currentRot]);
      peels.forEach((p) => p?.style.removeProperty("--peel"));
      if (keyVisualImg) gsap.killTweensOf(keyVisualImg);
      if (exploreBtn) gsap.killTweensOf(exploreBtn);
      if (exploreText) gsap.killTweensOf(exploreText);
      gsap.killTweensOf(getBodyRiseElements());
      viewerInstance?.dispose();
      viewerInstance = null;
      if (keyVisualImg) keyVisualImg.style.visibility = "";
      preloadedImages.length = 0;
      section.style.removeProperty("--slide-lift");
    };
  }, []);

  const curProduct = PRODUCTS[0];

  return (
    <section
      ref={sectionRef}
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
                aria-pressed={i === 0 ? "true" : "false"}
                className={i === 0 ? "is-active" : ""}
                data-card={prod.card}
                data-model={prod.model}
                data-word={prod.word}
                data-showcase={prod.showcase.join("|")}
                data-strip={prod.strip}
                data-tags={prod.tags.join("|")}
                data-copy={prod.copy}
                style={
                  {
                    "--ring": prod.ring,
                    "--bg": prod.bg,
                    "--word": prod.wordColor,
                    "--tag-bg": prod.tagBg,
                    "--tag-ink": prod.tagInk,
                    "--ink": prod.ink,
                    zIndex: i === 0 ? 2 : 1,
                  } as React.CSSProperties
                }
              >
                <span
                  className="roll-ring"
                  aria-hidden="true"
                  style={{ opacity: 0, transform: "scale(0, 0)" }}
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
              <span className="showcase">
                <img src={curProduct.showcase[0]} alt="" />
                <span
                  className="peel showcase-tape"
                  style={
                    {
                      "--peel-w": "129.23px",
                      "--peel-h": "37.12px",
                      "--peel-from": "calc(var(--peel-edge) + 0.66 * var(--peel-span))",
                      "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
                      "--peel-dir": "90deg",
                      "--peel-back": "url(#peel-back-masking)",
                      "--strip-blend": "normal",
                      "--peel": "0",
                    } as React.CSSProperties
                  }
                  data-peel="manual"
                >
                  <span className="peel-face">
                    <span className="peel-turn">
                      <img src="/assets/masking-tape-x2.png" alt="" draggable="false" />
                    </span>
                  </span>
                  <span className="peel-flap" aria-hidden="true">
                    <span className="peel-turn">
                      <img src="/assets/masking-tape-x2.png" alt="" draggable="false" />
                    </span>
                  </span>
                </span>
              </span>

              <span className="showcase">
                <img src={curProduct.showcase[1]} alt="" />
                <span
                  className="peel showcase-tape"
                  style={
                    {
                      "--peel-w": "129.23px",
                      "--peel-h": "37.12px",
                      "--peel-from": "calc(var(--peel-edge) + 0.54 * var(--peel-span))",
                      "--peel-to": "calc(var(--peel-edge) + 0 * var(--peel-span))",
                      "--peel-dir": "90deg",
                      "--peel-back": "url(#peel-back-masking)",
                      "--strip-blend": "normal",
                      "--peel": "0",
                    } as React.CSSProperties
                  }
                  data-peel="manual"
                >
                  <span className="peel-face">
                    <span className="peel-turn">
                      <img src="/assets/masking-tape-x2.png" alt="" draggable="false" />
                    </span>
                  </span>
                  <span className="peel-flap" aria-hidden="true">
                    <span className="peel-turn">
                      <img src="/assets/masking-tape-x2.png" alt="" draggable="false" />
                    </span>
                  </span>
                </span>
              </span>

              <div className="top-title">
                <img src="/assets/middle-T.webp" alt="" />
                <img src="/assets/middle-H.webp" alt="" />
                <img src="/assets/middle-E.webp" alt="" />
              </div>

              <a className="explore-button" href={`/products/${curProduct.id}`}>
                <span className="explore-clip">
                  <span className="button-text">EXPLORE</span>
                </span>
                <span className="arrow">
                  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false">
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
                <img src={curProduct.card} alt="" />
              </div>

              <div className="bottom-title" data-word="creative">
                <span className="glyph">
                  <img src="/assets/words/creative/C.webp" alt="" />
                </span>
                <span className="glyph">
                  <img src="/assets/words/creative/R.webp" alt="" />
                </span>
                <span className="glyph">
                  <img src="/assets/words/creative/E.webp" alt="" />
                </span>
                <span className="glyph">
                  <img src="/assets/words/creative/A.webp" alt="" />
                </span>
                <span className="glyph">
                  <img src="/assets/words/creative/T.webp" alt="" />
                </span>
                <span className="glyph">
                  <img src="/assets/words/creative/I.webp" alt="" />
                </span>
                <span className="glyph">
                  <img src="/assets/words/creative/V.webp" alt="" />
                </span>
                <span className="glyph">
                  <img src="/assets/words/creative/E2.webp" alt="" />
                </span>
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
          <button type="button" data-step="-1" aria-label="Previous tape">
            <img src="/assets/mobile-slider-prev.webp" alt="" width={256} height={256} loading="lazy" />
          </button>
          <button type="button" data-step="1" aria-label="Next tape">
            <img src="/assets/mobile-slider-next.webp" alt="" width={256} height={256} loading="lazy" />
          </button>
        </div>
      </div>
    </section>
  );
}
