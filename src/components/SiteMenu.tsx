"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { playOnce, SOUNDS, setSoundOn, isSoundOn, onSoundChange } from "@/lib/sounds";

export default function SiteMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(false);

  useEffect(() => {
    return onSoundChange((active) => {
      setSoundActive(active);
    });
  }, []);

  const toggleMenu = () => {
    const next = !isOpen;
    setIsOpen(next);
    playOnce(SOUNDS.MENU_PULL, 0.8);
  };

  const handleSoundToggle = () => {
    const next = !soundActive;
    setSoundOn(next);
  };

  const handleLinkHover = () => {
    playOnce(SOUNDS.MENU_HOVER, 0.5);
  };

  return (
    <nav className="site-menu" data-open={isOpen ? "true" : "false"} aria-label="Main">
      <div className="menu-panel" id="site-menu-panel">
        <div className="menu-sheet">
          <ul className="menu-list">
            <li className="menu-item" style={{ display: "none" }}>
              <span className="menu-rule" aria-hidden="true" />
              <Link
                className="menu-link"
                href="/"
                aria-label="HOME"
                tabIndex={isOpen ? 0 : -1}
                onMouseEnter={handleLinkHover}
              >
                <span className="menu-thumb" aria-hidden="true">
                  <img src="/assets/mask-image-1.jpg" alt="" />
                </span>
                <span className="menu-label" aria-hidden="true">
                  {"HOME".split("").map((c, i) => (
                    <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                      <span className="char">{c}</span>
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
            <li className="menu-item">
              <span className="menu-rule" aria-hidden="true" />
              <Link
                className="menu-link"
                href="/about"
                aria-label="ABOUT"
                tabIndex={isOpen ? 0 : -1}
                onMouseEnter={handleLinkHover}
              >
                <span className="menu-thumb" aria-hidden="true">
                  <img src="/api/media/file/img-masking-tape-3.webp" alt="" />
                </span>
                <span className="menu-label" aria-hidden="true">
                  {"ABOUT".split("").map((c, i) => (
                    <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                      <span className="char">{c}</span>
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
            <li className="menu-item">
              <span className="menu-rule" aria-hidden="true" />
              <Link
                className="menu-link"
                href="/products"
                aria-label="OUR FAMILY"
                tabIndex={isOpen ? 0 : -1}
                onMouseEnter={handleLinkHover}
              >
                <span className="menu-thumb" aria-hidden="true">
                  <img src="/api/media/file/img-double-sided-tape-3.webp" alt="" />
                </span>
                <span className="menu-label" aria-hidden="true">
                  {"OUR FAMILY".split("").map((c, i) => (
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
            <li className="menu-item">
              <span className="menu-rule" aria-hidden="true" />
              <Link
                className="menu-link"
                href="/news"
                aria-label="NEWS"
                tabIndex={isOpen ? 0 : -1}
                onMouseEnter={handleLinkHover}
              >
                <span className="menu-thumb" aria-hidden="true">
                  <img src="/api/media/file/img-stationery-tape-2.webp" alt="" />
                </span>
                <span className="menu-label" aria-hidden="true">
                  {"NEWS".split("").map((c, i) => (
                    <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                      <span className="char">{c}</span>
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
            <li className="menu-item">
              <span className="menu-rule" aria-hidden="true" />
              <Link
                className="menu-link"
                href="/contact"
                aria-label="CONTACT"
                tabIndex={isOpen ? 0 : -1}
                onMouseEnter={handleLinkHover}
              >
                <span className="menu-thumb" aria-hidden="true">
                  <img src="/api/media/file/img-opp-tape-1.webp" alt="" />
                </span>
                <span className="menu-label" aria-hidden="true">
                  {"CONTACT".split("").map((c, i) => (
                    <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                      <span className="char">{c}</span>
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
