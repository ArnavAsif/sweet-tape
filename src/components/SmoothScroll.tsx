"use client";

import { useEffect, ReactNode } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenis.on("scroll", ScrollTrigger.update);

    if (!window.location.hash) {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
      lenis.scrollTo(0, { immediate: true, force: true });
    }

    const onBeforeUnload = () => {
      if (!window.location.hash) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      lenis.destroy();
      gsap.ticker.remove(updateLenis);
    };
  }, []);

  return <>{children}</>;
}
