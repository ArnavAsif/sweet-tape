import gsap from "gsap";

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function initPoke(container: HTMLElement, selector = ".title .h1"): () => void {
  const target = container.querySelector<HTMLElement>(selector);
  const isFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isTablet = !isFine && window.matchMedia("(min-width: 744px)").matches;
  if (!target || (!isFine && !isTablet) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }

  const chars = Array.from(target.querySelectorAll<HTMLElement>(".char"));
  const charMap = new Map(chars.map((c, i) => [c, i]));
  let centers: { x: number; y: number }[] = [];
  let fontSize = 16;
  let pointer: { x: number; y: number } | null = null;
  let animFrame = 0;
  const settled = new Set<HTMLElement>();

  const update = () => {
    animFrame = 0;
    if (!pointer) return;

    for (const c of chars) {
      if (!settled.has(c)) {
        if (!gsap.isTweening(c) && gsap.getProperty(c, "yPercent") === 0) {
          settled.add(c);
          if (c.parentElement) c.parentElement.style.overflow = "visible";
        }
      }
    }
    if (settled.size === 0) return;

    if (!target.hasAttribute("data-poke")) {
      const box = target.getBoundingClientRect();
      fontSize = parseFloat(getComputedStyle(target).fontSize) || 16;
      centers = chars.map((c) => {
        const pBox = c.parentElement ? c.parentElement.getBoundingClientRect() : c.getBoundingClientRect();
        return {
          x: pBox.left - box.left + pBox.width / 2,
          y: pBox.top - box.top + pBox.height / 2,
        };
      });
      target.dataset.poke = "";
    }

    const box = target.getBoundingClientRect();
    const rx = pointer.x - box.left;
    const ry = pointer.y - box.top;
    const radius = 0.8 * fontSize;

    const getInfluence = (i: number) => {
      const center = centers[i];
      if (!center) return 0;
      const dist = Math.hypot(rx - center.x, ry - center.y);
      const t = clamp(1 - dist / radius, 0, 1);
      return t * t * (3 - 2 * t);
    };

    const activeChars = chars.filter((c) => settled.has(c));
    gsap.to(activeChars, {
      y: (_, el) => {
        const i = charMap.get(el) ?? 0;
        return -0.08 * fontSize * getInfluence(i);
      },
      rotate: (_, el) => {
        const i = charMap.get(el) ?? 0;
        const inf = getInfluence(i);
        const center = centers[i];
        const dx = center ? rx - center.x : 0;
        return -11 * inf * clamp(dx / (0.5 * radius), -1, 1);
      },
      scale: (_, el) => {
        const i = charMap.get(el) ?? 0;
        return 1 + 0.08 * getInfluence(i);
      },
      transformOrigin: "50% 100%",
      duration: 0.45,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  const onPointerMove = (e: PointerEvent) => {
    pointer = { x: e.clientX, y: e.clientY };
    if (!animFrame) {
      animFrame = requestAnimationFrame(update);
    }
  };

  const onPointerLeave = () => {
    pointer = null;
    if (target.hasAttribute("data-poke")) {
      gsap.to(chars.filter((c) => settled.has(c)), {
        y: 0,
        rotate: 0,
        scale: 1,
        duration: 0.9,
        ease: "elastic.out(1, 0.45)",
        stagger: { each: 0.014, from: "center" },
        overwrite: "auto",
        onComplete: () => {
          delete target.dataset.poke;
          settled.forEach((c) => {
            if (c.parentElement) c.parentElement.style.overflow = "";
          });
          settled.clear();
        },
      });
    }
  };

  target.addEventListener("pointermove", onPointerMove);
  target.addEventListener("pointerleave", onPointerLeave);

  return () => {
    if (animFrame) cancelAnimationFrame(animFrame);
    target.removeEventListener("pointermove", onPointerMove);
    target.removeEventListener("pointerleave", onPointerLeave);
    delete target.dataset.poke;
    settled.forEach((c) => {
      if (c.parentElement) c.parentElement.style.overflow = "";
    });
    settled.clear();
  };
}
