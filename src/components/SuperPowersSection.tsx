"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import productSectionsData from "@/data/productSections.json";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function parseStyleString(str: string): React.CSSProperties {
  const style: Record<string, string> = {};
  if (!str) return style;
  str.split(";").forEach((pair) => {
    const colonIdx = pair.indexOf(":");
    if (colonIdx !== -1) {
      const key = pair.substring(0, colonIdx).trim();
      const val = pair.substring(colonIdx + 1).trim();
      if (key && val) style[key] = val;
    }
  });
  return style as React.CSSProperties;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface SuperPowersSectionProps {
  slug: string;
}

export default function SuperPowersSection({ slug }: SuperPowersSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const sectionData = (productSectionsData as any)[slug]?.superPowers;

  useIsomorphicLayoutEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !sectionData) return;

    gsap.registerPlugin(ScrollTrigger);

    const stage = section.querySelector<HTMLElement>(".powers-stage");
    const nameChars = Array.from(section.querySelectorAll<HTMLElement>(".powers-name .char"));
    const slots = Array.from(section.querySelectorAll<HTMLElement>(".powers-slot"));

    if (slots.length < 3) return;

    const cardCount = slots.length - 2; // Usually 3
    const scrollSteps = cardCount - 1 + 1 + 1; // 4

    section.dataset.reveal = "live";
    const bodyCopies = Array.from(section.querySelectorAll<HTMLElement>(".body-copy"));
    bodyCopies.forEach((el) => {
      el.dataset.reveal = "live";
    });

    const isMobile = window.matchMedia("(max-width: 743px)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isMobile) {
      bodyCopies.forEach((el) => {
        el.dataset.arrived = "";
      });
      slots.forEach((slot) => {
        const isCard = slot.classList.contains("powers-card");
        const val = isCard ? 1 : 0;
        gsap.set(slot, { "--pow-shown": val, "--pow-open": val, "--pow-fill": val });
      });
      return;
    }

    const titleCharsPerSlot = slots.map((s) =>
      Array.from(s.querySelectorAll<HTMLElement>(".powers-card-title .char"))
    );
    const bodyRisePerSlot = slots.map((s) =>
      Array.from(s.querySelectorAll<HTMLElement>(".body-rise"))
    );

    const allTitleChars = [...nameChars, ...titleCharsPerSlot.flat()];
    const allBodyRise = bodyRisePerSlot.flat();

    if (prefersReduced) {
      bodyCopies.forEach((el) => {
        el.dataset.arrived = "";
      });
      slots.forEach((slot, idx) => {
        const shown = Math.abs(idx - 1) <= 1 ? 1 : 0;
        const open = idx === 1 ? 1 : 0;
        gsap.set(slot, { "--pow-shown": shown, "--pow-open": open, "--pow-fill": open });
      });
      return;
    }

    const activeTweens: gsap.core.Tween[] = [];
    const activeTimelines: gsap.core.Timeline[] = [];
    const activeTriggers: ScrollTrigger[] = [];

    if (allTitleChars.length) gsap.set(allTitleChars, { yPercent: 130 });
    if (allBodyRise.length) gsap.set(allBodyRise, { yPercent: 110 });

    const markOut = (slot: HTMLElement) => {
      if (slot.dataset.mark === "go") slot.dataset.mark = "out";
    };
    const markReset = (slot: HTMLElement) => {
      delete slot.dataset.mark;
    };

    const cardAnimMap = new Map<HTMLElement, { title: gsap.core.Timeline; copy: gsap.core.Timeline }>();
    const getCardAnim = (idx: number) => {
      const slot = slots[idx];
      const existing = cardAnimMap.get(slot);
      if (existing) return existing;

      const titleTl = gsap.timeline({ paused: true });
      const copyTl = gsap.timeline({ paused: true });

      const tChars = titleCharsPerSlot[idx];
      if (tChars && tChars.length) {
        titleTl.to(
          shuffle(tChars),
          { yPercent: 0, duration: 0.6, stagger: 0.055, ease: "power3.out" },
          0.34
        );
      }

      const cLines = bodyRisePerSlot[idx];
      if (cLines && cLines.length) {
        cLines.forEach((line, lineIdx) => {
          copyTl.to(
            line,
            {
              yPercent: 0,
              duration: 0.6,
              ease: "power3.out",
              onComplete:
                lineIdx === cLines.length - 1
                  ? () => {
                      const parent = line.closest<HTMLElement>(".body-copy");
                      if (parent) parent.dataset.arrived = "";
                    }
                  : undefined,
            },
            0.96 + lineIdx * 0.03
          );
        });
      }

      const record = { title: titleTl, copy: copyTl };
      cardAnimMap.set(slot, record);
      activeTimelines.push(titleTl, copyTl);
      return record;
    };

    let markDelayTimer: gsap.core.Tween | null = null;
    let activeIndex = -1;
    let isActivated = false;

    const setCardFill = (slot: HTMLElement, fill: number, animate: boolean) => {
      gsap.killTweensOf(slot);
      activeTweens.push(
        gsap.to(slot, {
          "--pow-fill": fill,
          duration: animate ? 0.5 : 0,
          ease: "power2.inOut",
        })
      );
    };

    const updateSlotsTransform = (pos: number) => {
      for (let i = 0; i < slots.length; i++) {
        const dist = Math.abs(i - pos);
        const shown = pos < 0 ? 0 : Math.min(Math.max(2 - dist, 0), 1);
        const open = pos < 0 ? 0 : Math.min(Math.max(1 - dist, 0), 1);
        slots[i].style.setProperty("--pow-shown", String(shown));
        slots[i].style.setProperty("--pow-open", String(open));
      }
    };

    const activateCard = (idx: number) => {
      isActivated = true;
      setCardFill(slots[idx], 1, true);
      const anims = getCardAnim(idx);
      anims.title.play(0);
      anims.copy.play(0);
      markDelayTimer?.kill();
      markDelayTimer = gsap.delayedCall(0.56, () => {
        const mark = slots[idx]?.querySelector(".powers-mark");
        if (mark) {
          delete slots[idx].dataset.mark;
          mark.getBoundingClientRect();
          slots[idx].dataset.mark = "go";
        }
      });
      activeTweens.push(markDelayTimer);
    };

    const stepTo = (targetIdx: number, animate: boolean) => {
      if (targetIdx === activeIndex) return;
      const prev = activeIndex;
      activeIndex = targetIdx;
      markDelayTimer?.kill();
      isActivated = false;

      if (prev >= 0 && prev !== targetIdx) {
        const prevAnim = cardAnimMap.get(slots[prev]);
        prevAnim?.title.reverse();
        prevAnim?.copy.reverse();
        markOut(slots[prev]);
        setCardFill(slots[prev], 0, animate);
      }

      if (targetIdx >= 0 && animate) {
        activateCard(targetIdx);
      }
    };

    // Name intro
    let nameTl: gsap.core.Timeline | null = null;
    if (nameChars.length) {
      nameTl = gsap.timeline({ paused: true });
      nameTl.to(shuffle(nameChars), {
        yPercent: 0,
        duration: 0.6,
        stagger: 0.018,
        ease: "power3.out",
      });
      activeTimelines.push(nameTl);
    }

    activeTriggers.push(
      ScrollTrigger.create({
        trigger: stage ?? section,
        start: "top 50%",
        onEnter: () => nameTl?.play(),
        onEnterBack: () => nameTl?.play(),
        onLeaveBack: () => nameTl?.reverse(),
      })
    );

    activeTriggers.push(
      ScrollTrigger.create({
        trigger: stage ?? section,
        start: "top 99%",
        onEnter: () => {
          updateSlotsTransform(1);
          stepTo(1, false);
        },
        onEnterBack: () => {
          if (activeIndex < 0) {
            updateSlotsTransform(1);
            stepTo(1, false);
          }
        },
        onLeaveBack: () => {
          updateSlotsTransform(-1);
          stepTo(-1, false);
          slots.forEach((s) => {
            markOut(s);
            setCardFill(s, 0, false);
          });
          cardAnimMap.forEach((rec) => {
            rec.title.pause(0);
            rec.copy.pause(0);
          });
          const allChars = titleCharsPerSlot.flat();
          if (allChars.length) gsap.set(allChars, { yPercent: 130 });
          if (allBodyRise.length) gsap.set(allBodyRise, { yPercent: 110 });
          bodyCopies.forEach((el) => delete el.dataset.arrived);
        },
      })
    );

    const calcProgress = (progress: number) => {
      const r = progress * scrollSteps;
      const step = Math.min(Math.floor(r), scrollSteps - 1);
      const rem = r - step;
      let smooth = 0;
      if (rem > 0.45) {
        const t = (rem - 0.45) / 0.55;
        smooth = t * t * (3 - 2 * t);
      }
      updateSlotsTransform(Math.min(1 + step + smooth, cardCount));
      return Math.min(1 + step + (smooth > 0.5 ? 1 : 0), cardCount);
    };

    if (stage) {
      activeTriggers.push(
        ScrollTrigger.create({
          trigger: stage,
          start: "top top",
          end: () => `+=${Math.round(0.8 * window.innerHeight * scrollSteps)}`,
          pin: stage,
          pinSpacing: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onEnter: () => {
            if (activeIndex >= 0 && !isActivated) activateCard(activeIndex);
          },
          onEnterBack: () => {
            if (activeIndex >= 0 && !isActivated) activateCard(activeIndex);
          },
          onRefresh: (self) => {
            calcProgress(self.progress);
            if (isActivated && activeIndex >= 0 && slots[activeIndex]?.classList.contains("powers-card")) {
              const rec = getCardAnim(activeIndex);
              rec.title.progress(1, true);
              rec.copy.progress(1, true);
            }
          },
          onUpdate: (self) => {
            stepTo(calcProgress(self.progress), true);
          },
        })
      );
    }

    const cleanup = () => {
      activeTriggers.forEach((st) => st.kill(true));
      activeTimelines.forEach((tl) => tl.kill());
      activeTweens.forEach((tw) => tw.kill());
      if (allTitleChars.length) gsap.set(allTitleChars, { clearProps: "transform" });
      if (allBodyRise.length) gsap.set(allBodyRise, { clearProps: "transform" });
      bodyCopies.forEach((el) => {
        el.dataset.arrived = "";
      });
      slots.forEach((s) => {
        markReset(s);
        gsap.set(s, { clearProps: "--pow-shown,--pow-open,--pow-fill" });
      });
      slots.forEach((s, i) => {
        gsap.set(s, {
          "--pow-shown": Math.abs(i - 1) <= 1 ? 1 : 0,
          "--pow-open": i === 1 ? 1 : 0,
          "--pow-fill": i === 1 ? 1 : 0,
        });
      });
    };

    cleanupRef.current = cleanup;
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [sectionData]);

  if (!sectionData || !sectionData.cards?.length) return null;

  const styleObj = parseStyleString(sectionData.style);

  return (
    <section ref={sectionRef} className="super-powers" style={styleObj}>
      <div className="powers-stage">
        <noscript>
          <style>{`.super-powers .char { transform: none }\n.super-powers .body-rise { transform: none }\n.super-powers .powers-slot { --pow-shown: 1 }\n.super-powers .powers-card { --pow-fill: 1 }\n.super-powers .powers-mark-jump, .super-powers .powers-mark-plate { opacity: 1 }`}</style>
        </noscript>

        <h2 className="powers-name" aria-label="SUPER POWERS">
          <span className="line" aria-hidden="true">
            {"SUPER".split("").map((c, i) => (
              <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                <span className="char">{c}</span>
              </span>
            ))}
          </span>
        </h2>

        <div className="powers-stack">
          {/* Leading empty slot */}
          <div className="powers-slot" aria-hidden="true" />

          {/* Cards */}
          {sectionData.cards.map((card: any, idx: number) => (
            <div key={idx} className="powers-slot powers-card">
              <div className="powers-card-face">
                <h3 className="powers-card-title" aria-label={card.title}>
                  {card.lines.map((line: string, lIdx: number) => (
                    <span key={lIdx} className="line" aria-hidden="true">
                      {line.split("").map((c: string, cIdx: number) => (
                        <span key={cIdx} className="clip" style={{ "--i": cIdx } as React.CSSProperties}>
                          <span className="char">{c === " " ? "\u00A0" : c}</span>
                        </span>
                      ))}
                    </span>
                  ))}
                </h3>

                {/* SVG Icon */}
                <div
                  className="powers-mark-wrap"
                  dangerouslySetInnerHTML={{ __html: card.svgHtml }}
                />

                <p className="powers-card-copy body-copy">
                  {card.copyWords.map((word: string, wIdx: number) => (
                    <React.Fragment key={wIdx}>
                      <span className="body-clip">
                        <span className="body-rise">{word}</span>
                      </span>{" "}
                    </React.Fragment>
                  ))}
                </p>
              </div>
            </div>
          ))}

          {/* Trailing empty slot */}
          <div className="powers-slot" aria-hidden="true" />
        </div>

        <p className="powers-name" aria-hidden="true">
          <span className="line">
            {"POWERS".split("").map((c, i) => (
              <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                <span className="char">{c}</span>
              </span>
            ))}
          </span>
        </p>
      </div>
    </section>
  );
}
