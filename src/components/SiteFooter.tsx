"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Matter from "matter-js";
import { playOnce, SOUNDS } from "@/lib/sounds";

export default function SiteFooter() {
  const footerRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const footer = footerRef.current;
    if (!footer) return;

    const ballsContainer = footer.querySelector<HTMLElement>(".footer-balls");
    if (!ballsContainer) return;

    const ballElements = Array.from(
      ballsContainer.querySelectorAll<HTMLElement>(".footer-ball")
    );

    // Matter.js Engine setup
    const { Engine, World, Bodies, Body, Events, Mouse, MouseConstraint } = Matter;
    const engine = Engine.create({
      gravity: { x: 0, y: 1.2 },
    });

    const w = ballsContainer.clientWidth || window.innerWidth;
    const h = ballsContainer.clientHeight || 400;

    // Boundaries
    const thickness = 60;
    const ground = Bodies.rectangle(w / 2, h + thickness / 2 - 10, w * 2, thickness, {
      isStatic: true,
      friction: 0.2,
      restitution: 0.4,
    });
    const leftWall = Bodies.rectangle(-thickness / 2, h / 2, thickness, h * 2, {
      isStatic: true,
    });
    const rightWall = Bodies.rectangle(w + thickness / 2, h / 2, thickness, h * 2, {
      isStatic: true,
    });

    World.add(engine.world, [ground, leftWall, rightWall]);

    // Create rigid bodies for each ball
    const bodies = ballElements.map((el, i) => {
      const radius = el.offsetWidth / 2 || 50;
      const initialX = (parseFloat(el.style.getPropertyValue("--ball-x") || "50") / 100) * w;
      const initialY = -100 - i * 80;

      const body = Bodies.circle(initialX, initialY, radius, {
        restitution: 0.45,
        friction: 0.15,
        frictionAir: 0.005,
        density: 0.002,
      });

      World.add(engine.world, body);
      return { el, body, radius };
    });

    // Sound on impact
    Events.on(engine, "collisionStart", (event) => {
      let maxSpeed = 0;
      for (const pair of event.pairs) {
        const speedA = Body.getSpeed(pair.bodyA);
        const speedB = Body.getSpeed(pair.bodyB);
        maxSpeed = Math.max(maxSpeed, speedA, speedB);
      }
      if (maxSpeed > 2) {
        const vol = Math.min((maxSpeed - 2) / 8, 1) * 0.5;
        playOnce(SOUNDS.BALL_HIT, vol);
      }
    });

    // Pointer drag interaction
    const mouse = Mouse.create(ballsContainer);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });
    World.add(engine.world, mouseConstraint);

    let isVisible = false;
    let animId: number;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(footer);

    const update = () => {
      animId = requestAnimationFrame(update);
      if (isVisible) {
        Engine.update(engine, 1000 / 60);

        bodies.forEach(({ el, body, radius }) => {
          const x = body.position.x - radius;
          const y = body.position.y - radius;
          el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${body.angle}rad)`;
        });
      }
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      World.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, []);

  const handleLinkHover = () => {
    playOnce(SOUNDS.MENU_HOVER, 0.4);
  };

  return (
    <footer ref={footerRef} className="site-footer">
      <nav className="footer-nav" aria-label="Footer">
        <ul>
          <li>
            <Link
              className="footer-link"
              href="/products"
              aria-label="OUR FAMILY"
              onMouseEnter={handleLinkHover}
            >
              <span className="footer-link-label" aria-hidden="true">
                {"OUR FAMILY".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c === " " ? "\u00A0" : c}</span>
                  </span>
                ))}
              </span>
              <span className="footer-link-dot" aria-hidden="true" />
            </Link>
          </li>
          <li>
            <Link
              className="footer-link"
              href="/about"
              aria-label="ABOUT"
              onMouseEnter={handleLinkHover}
            >
              <span className="footer-link-label" aria-hidden="true">
                {"ABOUT".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c}</span>
                  </span>
                ))}
              </span>
              <span className="footer-link-dot" aria-hidden="true" />
            </Link>
          </li>
          <li>
            <Link
              className="footer-link"
              href="/news"
              aria-label="NEWS"
              onMouseEnter={handleLinkHover}
            >
              <span className="footer-link-label" aria-hidden="true">
                {"NEWS".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c}</span>
                  </span>
                ))}
              </span>
              <span className="footer-link-dot" aria-hidden="true" />
            </Link>
          </li>
          <li>
            <Link
              className="footer-link"
              href="/contact"
              aria-label="CONTACT"
              onMouseEnter={handleLinkHover}
            >
              <span className="footer-link-label" aria-hidden="true">
                {"CONTACT".split("").map((c, i) => (
                  <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                    <span className="char">{c}</span>
                  </span>
                ))}
              </span>
              <span className="footer-link-dot" aria-hidden="true" />
            </Link>
          </li>
        </ul>
      </nav>

      <div className="footer-bottom">
        <img
          className="footer-mark"
          src="/assets/preloader-image.svg"
          alt=""
          draggable="false"
          loading="lazy"
        />

        <h2 className="footer-headline" aria-label="STICK BY YOU">
          <span className="line" aria-hidden="true" style={{ "--letters": 5 } as React.CSSProperties}>
            {"STICK".split("").map((c, i) => (
              <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                <span className="char">{c}</span>
              </span>
            ))}
          </span>
          <span className="line" aria-hidden="true" style={{ "--letters": 6 } as React.CSSProperties}>
            {"BY YOU".split("").map((c, i) => (
              <span key={i} className="clip" style={{ "--i": i } as React.CSSProperties}>
                <span className="char">{c === " " ? "\u00A0" : c}</span>
              </span>
            ))}
          </span>
        </h2>

        {/* Physics interactive bouncy tape rolls */}
        <div ref={canvasRef} className="footer-balls">
          <div
            className="footer-ball"
            style={{ "--ball-d": 18.7, "--ball-x": 9.6, "--ball-y": 18.7 } as React.CSSProperties}
            aria-hidden="true"
          >
            <img className="footer-ball-art" src="/assets/footer-stationery.svg" alt="" draggable="false" />
          </div>
          <div
            className="footer-ball"
            style={{ "--ball-d": 18.7, "--ball-x": 22.6, "--ball-y": 35.6 } as React.CSSProperties}
            aria-hidden="true"
          >
            <img className="footer-ball-art" src="/assets/footer-cloth.svg" alt="" draggable="false" />
          </div>
          <div
            className="footer-ball"
            style={{ "--ball-d": 18.7, "--ball-x": 65.5, "--ball-y": 37.3 } as React.CSSProperties}
            aria-hidden="true"
          >
            <img className="footer-ball-art" src="/assets/footer-double.svg" alt="" draggable="false" />
          </div>
          <div
            className="footer-ball"
            style={{ "--ball-d": 18.7, "--ball-x": 89.9, "--ball-y": 37.5 } as React.CSSProperties}
            aria-hidden="true"
          >
            <img className="footer-ball-art" src="/assets/footer-mask.svg" alt="" draggable="false" />
          </div>

          {/* Social media disc buttons */}
          <a
            className="footer-ball footer-ball--disc"
            style={
              {
                "--ball-d": 12.7,
                "--ball-x": 80.6,
                "--ball-y": 22,
                "--ball-colour": "#b6fe00",
                "--ball-ink": "#013900",
              } as React.CSSProperties
            }
            href="https://www.tiktok.com/@sweettape_official"
            target="_blank"
            rel="noreferrer"
            aria-label="TikTok"
          >
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 448 512"
              className="footer-ball-mark"
              aria-hidden="true"
              focusable="false"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" />
            </svg>
          </a>

          <a
            className="footer-ball footer-ball--disc"
            style={
              {
                "--ball-d": 12.7,
                "--ball-x": 93.6,
                "--ball-y": 20.2,
                "--ball-colour": "#b6fe00",
                "--ball-ink": "#013900",
              } as React.CSSProperties
            }
            href="https://www.facebook.com/SweetTape.Official/"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
          >
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 320 512"
              className="footer-ball-mark"
              aria-hidden="true"
              focusable="false"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M80 299.3V512H196V299.3h86.5l18-97.8H196V166.9c0-51.7 20.3-71.5 72.7-71.5c16.3 0 29.4 .4 37 1.2V7.9C291.4 4 256.4 0 236.2 0C129.3 0 80 50.5 80 159.4v42.1H14v97.8H80z" />
            </svg>
          </a>

          <a
            className="footer-ball footer-ball--disc"
            style={
              {
                "--ball-d": 12.7,
                "--ball-x": 38.7,
                "--ball-y": 38.6,
                "--ball-colour": "#b6fe00",
                "--ball-ink": "#013900",
              } as React.CSSProperties
            }
            href="https://www.instagram.com/sweettapeofficial/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 448 512"
              className="footer-ball-mark"
              aria-hidden="true"
              focusable="false"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
            </svg>
          </a>
        </div>

        <p className="footer-legal">Copyright © 2026. SB Tape Group Sdn Bhd</p>
      </div>
    </footer>
  );
}
