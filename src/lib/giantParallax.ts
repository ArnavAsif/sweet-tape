import gsap from "gsap";

export interface GiantParallaxOptions {
  canvas?: string;
  layers?: string;
  turn?: string;
}

export interface GiantParallaxInstance {
  measure: () => void;
  update: (scrollX: number) => void;
  destroy: () => void;
}

export function initGiantParallax(
  root: HTMLElement,
  options: GiantParallaxOptions = {}
): GiantParallaxInstance {
  const canvasSelector = options.canvas || ".giant-canvas";
  const layersSelector = options.layers || ".giant-prop, .giant-slot";
  const turnSelector = options.turn || ".giant-prop--tag";

  const canvas = root.querySelector<HTMLElement>(canvasSelector);
  if (!canvas) {
    return {
      measure: () => {},
      update: () => {},
      destroy: () => {},
    };
  }

  const layers = Array.from(root.querySelectorAll<HTMLElement>(layersSelector));
  if (!layers.length) {
    return {
      measure: () => {},
      update: () => {},
      destroy: () => {},
    };
  }

  const defaultEase = "power2.inOut";
  const getCenterOffset = (el: HTMLElement) => {
    let offset = el.offsetWidth / 2;
    let curr: HTMLElement | null = el;
    while (curr && curr !== canvas) {
      offset += curr.offsetLeft;
      curr = curr.offsetParent as HTMLElement | null;
    }
    return offset;
  };

  const parseEase = (name: string) => gsap.parseEase(name) ?? gsap.parseEase(defaultEase);
  const baseEase = parseEase(defaultEase);

  const layerItems = layers.map((el) => ({
    el,
    set: gsap.quickSetter(el, "--pdx"),
    rot: el.matches(turnSelector) ? gsap.quickSetter(el, "--prot") : null,
    home: 0,
    drift: 0.03,
    easeName: defaultEase,
    ease: baseEase,
  }));

  const measure = () => {
    for (const item of layerItems) {
      item.home = getCenterOffset(item.el);
      const computed = getComputedStyle(item.el);
      const pp = parseFloat(computed.getPropertyValue("--pp"));
      item.drift = Number.isFinite(pp) ? pp : 0.03;
      item.easeName = computed.getPropertyValue("--pe").trim() || defaultEase;
      item.ease = parseEase(item.easeName);
    }
  };

  measure();

  const update = (canvasX: number) => {
    const width = window.innerWidth;
    const mid = width / 2;
    const span = 0.65 * width;

    for (const item of layerItems) {
      const pp = parseFloat(item.el.style.getPropertyValue("--pp"));
      const drift = Number.isFinite(pp) ? pp : item.drift;
      const pe = item.el.style.getPropertyValue("--pe").trim();
      if (pe && pe !== item.easeName) {
        item.easeName = pe;
        item.ease = parseEase(pe);
      }

      const ratio = Math.max(-1, Math.min(1, (canvasX + item.home - mid) / span));
      const curved = Math.sign(ratio) * item.ease(Math.abs(ratio));

      item.set(`${-drift * width * curved}px`);
      item.rot?.(`${-8 * curved}deg`);
    }
  };

  const destroy = () => {
    for (const item of layerItems) {
      item.el.style.removeProperty("--pdx");
      item.el.style.removeProperty("--prot");
    }
  };

  return { measure, update, destroy };
}
