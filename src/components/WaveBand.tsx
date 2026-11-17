"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function WaveBand() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const textPath = section.querySelector<SVGTextPathElement>("textPath");
    const path = section.querySelector<SVGPathElement>("#wave-band-path");
    const badges = Array.from(section.querySelectorAll<SVGImageElement>(".band-badge"));
    const textEl = section.querySelector<SVGTextElement>("text");

    if (!textPath || !path || !textEl) return;

    const totalLen = path.getTotalLength();
    const subLen = 1400; // repeat unit length estimate
    let startVal = 3295;

    const updateBadges = (offset: number) => {
      badges.forEach((badge, idx) => {
        const dist = (offset + idx * 800) % totalLen;
        const validDist = dist < 0 ? dist + totalLen : dist;
        const pt = path.getPointAtLength(validDist);
        const ptBefore = path.getPointAtLength(Math.max(validDist - 6, 0));
        const ptAfter = path.getPointAtLength(Math.min(validDist + 6, totalLen));
        const angle = (180 * Math.atan2(ptAfter.y - ptBefore.y, ptAfter.x - ptBefore.x)) / Math.PI;

        badge.setAttribute("transform", `translate(${pt.x} ${pt.y}) rotate(${angle})`);
        badge.style.visibility = "visible";
      });
    };

    updateBadges(startVal);

    // Continuous marquee tween
    const tween = gsap.fromTo(
      textPath,
      { attr: { startOffset: startVal } },
      {
        attr: { startOffset: startVal - subLen },
        duration: 18,
        ease: "none",
        repeat: -1,
        onUpdate: () => {
          const currentOffset = parseFloat(textPath.getAttribute("startOffset") || "0");
          updateBadges(currentOffset);
        },
      }
    );

    // Scroll acceleration
    let lastY = window.scrollY;
    let targetTimeScale = 1;
    let curTimeScale = 1;

    const onScroll = () => {
      const curY = window.scrollY;
      const dy = Math.abs(curY - lastY);
      lastY = curY;
      targetTimeScale = 1 + Math.min(dy * 0.05, 4);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    const ticker = () => {
      curTimeScale += (targetTimeScale - curTimeScale) * 0.05;
      targetTimeScale += (1 - targetTimeScale) * 0.05;
      tween.timeScale(curTimeScale);
    };

    gsap.ticker.add(ticker);

    return () => {
      window.removeEventListener("scroll", onScroll);
      gsap.ticker.remove(ticker);
      tween.kill();
    };
  }, []);

  const repeatCount = 6;
  const repeatedText = Array(repeatCount)
    .fill("WHEN LIFE GETS MESSY,\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0SOMETHING HAS TO HOLD\u00A0\u00A0\u00A0")
    .join("");

  return (
    <section
      ref={sectionRef}
      className="wave-band"
      aria-hidden="true"
      data-head="WHEN LIFE GETS MESSY,"
      data-tail="SOMETHING HAS TO HOLD"
    >
      <svg
        viewBox="-80 60 1760 540"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <path
            id="wave-band-path"
            d="M -3200,330 Q -2800,460 -2400,330 Q -2000,200 -1600,330 Q -1200,460 -800,330 Q -400,200 0,330 Q 400,460 800,330 Q 1200,200 1600,330 Q 2000,460 2400,330 Q 2800,200 3200,330 Q 3600,460 4000,330 Q 4400,200 4800,330 Q 5200,460 5600,330 Q 6000,200 6400,330 Q 6800,460 7200,330 Q 7600,200 8000,330"
            fill="none"
          />
          <pattern
            id="wave-band-grain"
            patternUnits="userSpaceOnUse"
            x="0"
            y="60"
            width="1600"
            height="897"
          >
            <image href="/assets/paper-overlay.webp" width="1600" height="897" />
          </pattern>
        </defs>

        <use href="#wave-band-path" className="band-tape" />
        <text className="band-text" dy="0.35em">
          <textPath href="#wave-band-path" startOffset="3295">
            {repeatedText}
          </textPath>
        </text>

        {[0, 1, 2, 3, 4, 5].map((i) => (
          <image
            key={i}
            className="band-badge"
            href="/assets/sibling-opp-normal.webp"
            x="-75"
            y="-75"
            width="150"
            height="150"
          />
        ))}

        <use href="#wave-band-path" className="band-tape-grain" />
      </svg>
    </section>
  );
}
