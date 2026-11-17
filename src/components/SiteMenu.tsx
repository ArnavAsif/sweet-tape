"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { playOnce, SOUNDS, setSoundOn, onSoundChange } from "@/lib/sounds";

interface MenuItem {
  label: string;
  href: string;
  thumb: string;
}

const MENU_ITEMS: MenuItem[] = [
  { label: "HOME", href: "/", thumb: "/assets/mask-image-1.jpg" },
  { label: "ABOUT", href: "/about", thumb: "/assets/menu/about.webp" },
  { label: "OUR FAMILY", href: "/products", thumb: "/assets/menu/products.webp" },
  { label: "NEWS", href: "/news", thumb: "/assets/menu/news.webp" },
  { label: "CONTACT", href: "/contact", thumb: "/assets/menu/contact.webp" },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function SiteMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(false);
  const pathname = usePathname();

  const menuRef = useRef<HTMLElement | null>(null);
  const timelinesRef = useRef<{ drop: gsap.core.Timeline; contents: gsap.core.Timeline } | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    return onSoundChange((active) => {
      setSoundActive(active);
    });
  }, []);

  // 1. Build drop & contents timelines
  useEffect(() => {
    const menuEl = menuRef.current;
    if (!menuEl) return;

    const killTimelines = () => {
      tweenRef.current?.kill();
      tweenRef.current = null;
      timelinesRef.current?.drop.kill();
      timelinesRef.current?.contents.kill();
      timelinesRef.current = null;
    };

    const buildTimelines = () => {
      killTimelines();
      const panel = menuEl.querySelector<HTMLElement>(".menu-panel");
      const sheet = menuEl.querySelector<HTMLElement>(".menu-sheet");
      const items = Array.from(menuEl.querySelectorAll<HTMLElement>(".menu-item"));

      if (!panel || !sheet || !items.length) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set([panel, sheet], { clearProps: "width,height,transform" });
        return;
      }
      gsap.set([panel, sheet], { clearProps: "width,height,transform" });

      const isMobile = window.matchMedia("(max-width: 743px)").matches;
      const ease = "back.out(1.9)";

      const dropTl = gsap.timeline({ paused: true });
      const contentsTl = gsap.timeline({ paused: true });

      if (isMobile) {
        dropTl.fromTo(
          panel,
          { width: 0 },
          { width: () => sheet.offsetWidth, duration: 0.7, ease },
          0
        );
      } else {
        dropTl.fromTo(
          panel,
          { height: 0 },
          { height: "auto", duration: 0.7, ease },
          0
        );
        dropTl.fromTo(
          sheet,
          { yPercent: -100 },
          { yPercent: 0, duration: 0.7, ease },
          0
        );
      }

      items.forEach((item, idx) => {
        const t = 0.28 + 0.16 * idx;
        const rule = item.querySelector<HTMLElement>(".menu-rule");
        const chars = Array.from(item.querySelectorAll<HTMLElement>(".char"));
        const arrow = item.querySelector<HTMLElement>(".menu-arrow");

        if (rule) {
          contentsTl.fromTo(
            rule,
            { clipPath: "inset(0% 100% 0% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power2.out" },
            t
          );
        }

        if (chars.length) {
          contentsTl.fromTo(
            shuffle(chars),
            { y: 0, yPercent: 130 },
            { yPercent: 0, duration: 0.6, stagger: 0.025, ease: "power3.out" },
            t + 0.1
          );
        }

        if (arrow) {
          contentsTl.fromTo(
            arrow,
            { scale: 0 },
            { scale: 1, duration: 0.5, ease: "back.out(2.2)" },
            t + 0.26
          );
        }
      });

      timelinesRef.current = { drop: dropTl, contents: contentsTl };
    };

    buildTimelines();

    const mediaQuery = window.matchMedia("(max-width: 743px)");
    mediaQuery.addEventListener("change", buildTimelines);

    return () => {
      mediaQuery.removeEventListener("change", buildTimelines);
      killTimelines();
    };
  }, []);

  // 2. Tab initial arrival slide-down animation
  useEffect(() => {
    const menuEl = menuRef.current;
    if (!menuEl) return;
    const tab = menuEl.querySelector<HTMLElement>(".menu-tab");
    if (!tab || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    tab.classList.add("is-arriving");
    const isMobile = window.matchMedia("(max-width: 743px)").matches;
    const initTransform = isMobile ? { x: 0, xPercent: 115 } : { y: 0, yPercent: -115 };
    gsap.set(tab, initTransform);

    const tween = gsap.fromTo(
      tab,
      initTransform,
      {
        xPercent: 0,
        yPercent: 0,
        duration: 0.75,
        delay: 0.7,
        ease: "back.out(1.9)",
        onComplete: () => tab.classList.remove("is-arriving"),
      }
    );

    return () => {
      tween.kill();
      tab.classList.remove("is-arriving");
      gsap.set(tab, { clearProps: "transform" });
    };
  }, []);

  // 3. Play / reverse timelines when isOpen changes
  useEffect(() => {
    const tl = timelinesRef.current;
    if (!tl) return;

    tweenRef.current?.kill();
    tweenRef.current = null;

    if (isOpen) {
      tl.drop.play();
      tl.contents.play();
      return;
    }

    tl.contents.pause();
    if (tl.drop.time() === 0) {
      tl.contents.pause(0);
      return;
    }

    playOnce(SOUNDS.MENU_PULL, 0.8);
    tweenRef.current = tl.drop.tweenTo(0, {
      duration: 0.85,
      ease: "power2.inOut",
      onComplete: () => tl.contents.pause(0),
    });
  }, [isOpen]);

  // 4. Outside click and Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        menuRef.current?.querySelector<HTMLElement>(".menu-tab")?.focus();
      }
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.(".menu-tab, .menu-sound, .menu-link")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    const next = !isOpen;
    setIsOpen(next);
    playOnce(SOUNDS.MENU_PULL, 0.8);
  };

  const handleSoundToggle = () => {
    const next = !soundActive;
    setSoundOn(next);
  };

  const handleLinkHover = (e: React.MouseEvent) => {
    if (!isOpen) return;
    const last = lastPointerRef.current;
    if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 12) return;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    playOnce(SOUNDS.MENU_HOVER, 0.5);
  };

  return (
    <nav ref={menuRef} className="site-menu" data-open={isOpen ? "true" : "false"} aria-label="Main">
      <div className="menu-panel" id="site-menu-panel">
        <div className="menu-sheet">
          <ul className="menu-list">
            {MENU_ITEMS.map((item) => {
              const isHomeCurrent = item.href === "/" && pathname === "/";
              return (
                <li
                  key={item.href}
                  className="menu-item"
                  style={isHomeCurrent ? { display: "none" } : undefined}
                >
                  <span className="menu-rule" aria-hidden="true" />
                  <Link
                    className="menu-link"
                    href={item.href}
                    prefetch={false}
                    aria-label={item.label}
                    tabIndex={isOpen ? 0 : -1}
                    onMouseEnter={handleLinkHover}
                  >
                    <span className="menu-thumb" aria-hidden="true">
                      <img src={item.thumb} alt="" />
                    </span>
                    <span className="menu-label" aria-hidden="true">
                      {item.label.split("").map((c, i) => (
                        <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                          <span className="char">{c === " " ? "\u00A0" : c}</span>
                        </span>
                      ))}
                    </span>
                    <span className="menu-arrow" aria-hidden="true">
                      <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false">
                        <path
                          d="M1.4 10.6 10.6 1.4M3.6 1.4h7v7"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="square"
                        />
                      </svg>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <button
        className="menu-tab"
        type="button"
        aria-expanded={isOpen}
        aria-controls="site-menu-panel"
        onClick={toggleMenu}
      >
        <span className="menu-tab-sheet">PULL ME</span>
      </button>

      <button
        className="menu-sound"
        type="button"
        aria-label="Sound"
        aria-pressed={soundActive}
        onClick={handleSoundToggle}
      >
        <svg
          stroke="currentColor"
          fill="currentColor"
          strokeWidth="0"
          viewBox="0 0 576 512"
          aria-hidden="true"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          {soundActive ? (
            <path d="M301.1 34.8C312.6 40 320 51.4 320 64l0 384c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352 64 352c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l67.8 0L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM425 167l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z" />
          ) : (
            <path d="M301.1 34.8C312.6 40 320 51.4 320 64l0 384c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352 64 352c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l67.8 0L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3z" />
          )}
        </svg>
        <img className="menu-sound-ball" src="/assets/tape-sound-ball.webp" alt="" aria-hidden="true" />
      </button>
    </nav>
  );
}
