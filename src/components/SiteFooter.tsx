"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Matter from "matter-js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { playOnce, SOUNDS } from "@/lib/sounds";
import { initPoke } from "@/lib/initPoke";

const PHYSICS = {
  STAGE: 4,
  STAGGER: 0.26,
  SPEED: 55,
  DROP: 6,
  PERSIST: 90,
  SPIN: 5,
  TOP: 9,
  SPAN: 9,
};

const SOUND_CONFIG = {
  MIN: 10,
  FULL: 70,
  VOLUME: 0.5,
  GAP: 90,
};

const REVEAL_CONFIG = {
  HIDDEN: 130,
  DURATION: 0.6,
  STAGGER: 0.025,
  EASE: "power3.out",
};

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function SiteFooter() {
  const footerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const footer = footerRef.current;
    if (!footer) return;

    const cleanupFns: (() => void)[] = [];

    // 1. Entrance Reveal Animation
    const linkChars = Array.from(footer.querySelectorAll<HTMLElement>(".footer-link .char"));
    const linkDots = Array.from(footer.querySelectorAll<HTMLElement>(".footer-link-dot"));
    const headlineChars = Array.from(footer.querySelectorAll<HTMLElement>(".footer-headline .char"));

    if (linkChars.length || headlineChars.length) {
      gsap.set([...linkChars, ...headlineChars], { y: 0 });

      const revealTl = gsap.timeline({ paused: true });

      if (linkChars.length) {
        revealTl.fromTo(
          shuffle(linkChars),
          { yPercent: REVEAL_CONFIG.HIDDEN, y: 0 },
          {
            yPercent: 0,
            y: 0,
            duration: REVEAL_CONFIG.DURATION,
            stagger: 0.014,
            ease: REVEAL_CONFIG.EASE,
          },
          0
        );
      }

      if (linkDots.length) {
        revealTl.fromTo(
          linkDots,
          { scale: 0 },
          {
            scale: 1,
            duration: 0.5,
            stagger: 0.05,
            ease: "back.out(2.2)",
          },
          0.3
        );
      }

      if (headlineChars.length) {
        revealTl.fromTo(
          shuffle(headlineChars),
          { yPercent: REVEAL_CONFIG.HIDDEN, y: 0 },
          {
            yPercent: 0,
            y: 0,
            duration: REVEAL_CONFIG.DURATION,
            stagger: REVEAL_CONFIG.STAGGER,
            ease: REVEAL_CONFIG.EASE,
          },
          0.24
        );
      }

      const st = ScrollTrigger.create({
        trigger: footer,
        start: "top 80%",
        once: true,
        onEnter: () => {
          footer.dataset.reveal = "live";
          revealTl.play();
        },
      });

      cleanupFns.push(() => {
        st.kill();
        revealTl.kill();
        gsap.set([...linkChars, ...headlineChars], { clearProps: "transform" });
        if (linkDots.length) gsap.set(linkDots, { clearProps: "transform" });
      });
    }

    // 2. Interactive Poke on Footer Headline
    const pokeCleanup = initPoke(footer, ".footer-headline");
    cleanupFns.push(pokeCleanup);

    // 3. Matter.js Interactive Physics Simulation
    const footerBottom = footer.querySelector<HTMLElement>(".footer-bottom");
    const ballElements = Array.from(footer.querySelectorAll<HTMLElement>(".footer-ball"));

    if (
      footerBottom &&
      ballElements.length &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const {
        Bodies,
        Body,
        Composite,
        Constraint,
        Engine,
        Events,
        Sleeping,
        Vector,
      } = Matter;

      type BallData = {
        el: HTMLElement;
        body: Matter.Body;
        home: { x: number; y: number };
        side: number;
        releaseAt: number;
        released: boolean;
        armed: boolean;
      };

      type SimulationState = {
        engine: Matter.Engine;
        w: number;
        h: number;
        sx: number;
        balls: BallData[];
        elapsed: number;
      };

      let state: SimulationState | null = null;
      let lastSoundTime = -Infinity;
      let ballScale = 1;

      // Mouse tracking
      let mouseX = 0;
      let mouseY = 0;
      let deltaX = 0;
      let deltaY = 0;
      let isInside = false;
      let activeConstraint: Matter.Constraint | null = null;
      let activeBody: Matter.Body | null = null;
      let dragStartX = 0;
      let dragStartY = 0;
      let isDraggedFar = false;
      let isFooterVisible = false;

      const R = (vw: number) => (vw * window.innerWidth) / 100;

      const initPhysics = (initialState?: { fx: number; fy: number; vx: number; vy: number; spin: number }[]) => {
        const w = footerBottom.clientWidth;
        const h = footerBottom.clientHeight;
        if (!w || !h) return;

        const engine = Engine.create({ enableSleeping: true });
        ballScale =
          parseFloat(getComputedStyle(ballElements[0]).getPropertyValue("--ball-scale")) || 1;
        engine.gravity.y = 1;
        engine.gravity.scale = (60 * ballScale * R(1)) / 1e6;

        // Collision sound handler
        Events.on(engine, "collisionStart", ({ pairs }) => {
          let maxImpact = 0;
          for (const { bodyA, bodyB, collision } of pairs) {
            const normal = collision.normal;
            const impact =
              (60 *
                Math.abs(
                  (bodyA.velocity.x - bodyB.velocity.x) * normal.x +
                    (bodyA.velocity.y - bodyB.velocity.y) * normal.y
                )) /
              R(1);
            maxImpact = Math.max(maxImpact, impact);
          }
          const now = performance.now();
          if (maxImpact > SOUND_CONFIG.MIN && now - lastSoundTime >= SOUND_CONFIG.GAP) {
            lastSoundTime = now;
            const volume =
              Math.min((maxImpact - SOUND_CONFIG.MIN) / (SOUND_CONFIG.FULL - SOUND_CONFIG.MIN), 1) *
              SOUND_CONFIG.VOLUME;
            playOnce(SOUNDS.BALL_HIT, volume);
          }
        });

        const groundY = h - R(3.2);

        // Calculate homes and sides
        const ballMetrics = ballElements.map((el) => {
          const r = el.offsetWidth / 2;
          return {
            r,
            home: Vector.create(el.offsetLeft + r, el.offsetTop + r),
          };
        });

        const sides = ballMetrics.map((m) => (m.home.x < w / 2 ? -1 : 1));
        const leftIndices = sides.map((s, i) => (s < 0 ? i : -1)).filter((i) => i >= 0);
        const rightIndices = sides.map((s, i) => (s > 0 ? i : -1)).filter((i) => i >= 0);

        const staggerOrder = new Map<number, number>();
        const maxLen = Math.max(leftIndices.length, rightIndices.length);
        for (let i = 0; i < maxLen; i++) {
          if (i < leftIndices.length) staggerOrder.set(leftIndices[i], staggerOrder.size);
          if (i < rightIndices.length) staggerOrder.set(rightIndices[i], staggerOrder.size);
        }

        let maxSpawnDist = 0;
        const balls: BallData[] = ballElements.map((el, n) => {
          const { r, home } = ballMetrics[n];
          const side = sides[n];
          const staggerIndex = staggerOrder.get(n) ?? 0;
          const spawnDist = R(PHYSICS.STAGE) + r;
          maxSpawnDist = Math.max(maxSpawnDist, spawnDist + r);

          const count = Math.max(ballElements.length - 1, 1);
          const topY = Math.min(
            Math.max(R(PHYSICS.TOP) + (1 - staggerIndex / count) * R(PHYSICS.SPAN), r + R(0.5)),
            groundY - r
          );

          const saved = initialState?.[n];
          const initialX = saved ? saved.fx * w : side < 0 ? -spawnDist : w + spawnDist;
          const initialY = saved ? saved.fy * h : topY;

          const body = Bodies.circle(initialX, initialY, r, {
            restitution: 0.32,
            friction: 0.16,
            frictionAir: 0.004,
            density: 0.001,
            collisionFilter: {
              category: 1,
              mask: saved ? -1 : -3,
              group: 0,
            },
          });

          if (saved) {
            Body.setVelocity(body, { x: saved.vx, y: saved.vy });
            Body.setAngularVelocity(body, saved.spin);
          }

          return {
            el,
            body,
            home,
            side,
            releaseAt: saved ? 0 : staggerIndex * PHYSICS.STAGGER,
            released: !!saved,
            armed: !!saved,
          };
        });

        // World boundaries
        const wallThickness = R(20);
        const sideMargin = R(2);
        const worldWidth = w + 2 * (maxSpawnDist + wallThickness);

        const createWall = (
          x: number,
          y: number,
          width: number,
          height: number,
          options: { friction?: number; category?: number } = {}
        ) =>
          Bodies.rectangle(x, y, width, height, {
            isStatic: true,
            friction: options.friction ?? 0,
            restitution: 0.32,
            collisionFilter: {
              category: options.category ?? 1,
              mask: -1,
              group: 0,
            },
          });

        Composite.add(engine.world, [
          createWall(w / 2, -wallThickness / 2, worldWidth, wallThickness),
          createWall(w / 2, groundY + wallThickness / 2, worldWidth, wallThickness, {
            friction: 0.16,
          }),
          createWall(-sideMargin - wallThickness / 2, h / 2, wallThickness, h + 2 * wallThickness, {
            category: 2,
          }),
          createWall(
            w + sideMargin + wallThickness / 2,
            h / 2,
            wallThickness,
            h + 2 * wallThickness,
            { category: 2 }
          ),
          ...balls.filter((b) => b.released).map((b) => b.body),
        ]);

        state = {
          engine,
          w,
          h,
          sx: sideMargin,
          balls,
          elapsed: 0,
        };

        renderTransforms(state);
      };

      const renderTransforms = (currState: SimulationState) => {
        for (const { el, body, home } of currState.balls) {
          const dx = body.position.x - home.x;
          const dy = body.position.y - home.y;
          el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${body.angle.toFixed(4)}rad)`;
        }
      };

      const updatePointerCoords = (e: PointerEvent) => {
        const rect = footerBottom.getBoundingClientRect();
        const curX = e.clientX - rect.left;
        const curY = e.clientY - rect.top;
        deltaX = curX - mouseX;
        deltaY = curY - mouseY;
        mouseX = curX;
        mouseY = curY;

        const pad = R(2) + R(5);
        isInside =
          curX > -pad && curY > -pad && curX < rect.width + pad && curY < rect.height + pad;
      };

      const releaseConstraint = () => {
        if (activeConstraint && state) {
          Composite.remove(state.engine.world, activeConstraint);
        }
        activeConstraint = null;
        activeBody = null;
      };

      // Main physics step loop
      const onTick = (_time: number, deltaTime: number) => {
        const curr = state;
        if (!curr || !isFooterVisible) return;

        const dt = Math.min(deltaTime, 20);
        curr.elapsed += dt / 1000;

        // 1. Release balls whose time has arrived
        for (const b of curr.balls) {
          if (!b.released && curr.elapsed >= b.releaseAt) {
            b.released = true;
            Body.setVelocity(b.body, {
              x: (-b.side * R(PHYSICS.SPEED)) / 60,
              y: R(PHYSICS.DROP) / 60,
            });
            Body.setAngularVelocity(b.body, (-b.side * PHYSICS.SPIN) / 60);
            Composite.add(curr.engine.world, b.body);
          }
        }

        // 2. Cursor momentum impulse
        if (isInside) {
          const moveDist = Math.min(Math.hypot(deltaX, deltaY), 60);
          if (moveDist >= 0.5) {
            const influenceRadius = R(5);
            const speedRatio = moveDist / 60;
            const ballRadius = R(18) / 2;
            const areaScale = ((Math.PI * ballRadius * ballRadius * 0.001 * R(1)) / 1e6);
            const forceMain = 200 * areaScale;
            const forceVel = 70 * areaScale;

            for (const { body } of curr.balls) {
              if (body === activeBody) continue;
              const r = body.circleRadius ?? 0;
              const dx = body.position.x - mouseX;
              const dy = body.position.y - mouseY;
              const dist = Math.hypot(dx, dy) || 1e-4;
              const clearance = dist - r;

              if (clearance <= influenceRadius) {
                const factor = Math.min(1 - clearance / influenceRadius, 1);
                const nx = dx / dist;
                const ny = dy / dist;
                const contactPoint = {
                  x: body.position.x - nx * r,
                  y: body.position.y - ny * r,
                };
                const fRadial = forceMain * factor * speedRatio;
                const fMotion = forceVel * factor;

                if (body.isSleeping) Sleeping.set(body, false);
                Body.applyForce(body, contactPoint, {
                  x: nx * fRadial + (deltaX / moveDist) * fMotion,
                  y: ny * fRadial + (deltaY / moveDist) * fMotion,
                });
              }
            }
          }
        }

        // 3. Update Matter Engine
        Engine.update(curr.engine, dt);

        // 4. Velocity clamping
        const maxVelocity = (R(85) * ballScale) / 60;
        for (const { body } of curr.balls) {
          const vel = body.velocity;
          const currentSpeed = Math.hypot(vel.x, vel.y);
          if (currentSpeed > maxVelocity) {
            const ratio = maxVelocity / currentSpeed;
            Body.setVelocity(body, { x: vel.x * ratio, y: vel.y * ratio });
          }
        }

        // 5. Inward persistence force until armed
        const persistMagnitude = (R(PHYSICS.PERSIST) * R(1)) / 1e6;
        for (const b of curr.balls) {
          if (b.armed || !b.released) continue;
          const r = b.body.circleRadius ?? 0;
          const px = b.body.position.x;
          if (px >= -curr.sx + r && px <= curr.w + curr.sx - r) {
            b.armed = true;
            b.body.collisionFilter.mask = -1;
            continue;
          }
          if (b.body.isSleeping) Sleeping.set(b.body, false);
          Body.applyForce(b.body, b.body.position, {
            x: -b.side * persistMagnitude * b.body.mass,
            y: 0,
          });
        }

        if (activeBody) {
          Body.setAngularVelocity(activeBody, 0.9 * activeBody.angularVelocity);
        }

        deltaX = 0;
        deltaY = 0;
        renderTransforms(curr);
      };

      // Intersection Observer to run physics only when footer is near viewport
      const io = new IntersectionObserver(
        ([entry]) => {
          isFooterVisible = entry.isIntersecting;
        },
        { threshold: 0.1 }
      );
      io.observe(footer);

      // Pointer event listeners
      const onPointerMove = (e: PointerEvent) => {
        if (isFooterVisible || activeConstraint) {
          updatePointerCoords(e);
          if (activeConstraint) {
            if (Math.hypot(mouseX - dragStartX, mouseY - dragStartY) > 6) {
              isDraggedFar = true;
            }
            activeConstraint.pointA = { x: mouseX, y: mouseY };
          }
        }
      };

      const onPointerDown = (e: PointerEvent) => {
        if (e.button !== 0 || !state) return;
        updatePointerCoords(e);

        const targetBall = state.balls.find(({ body }) => {
          const r = body.circleRadius ?? 0;
          return Math.hypot(body.position.x - mouseX, body.position.y - mouseY) <= r;
        });

        if (!targetBall) return;
        activeBody = targetBall.body;
        dragStartX = mouseX;
        dragStartY = mouseY;
        isDraggedFar = false;
        Sleeping.set(targetBall.body, false);

        const localOffset = Vector.mult(
          Vector.rotate(
            Vector.sub({ x: mouseX, y: mouseY }, targetBall.body.position),
            -targetBall.body.angle
          ),
          0.34
        );

        activeConstraint = Constraint.create({
          pointA: { x: mouseX, y: mouseY },
          bodyB: targetBall.body,
          pointB: localOffset,
          length: 0,
          stiffness: 0.06,
          damping: 0.08,
        });

        Composite.add(state.engine.world, activeConstraint);
        e.preventDefault();
      };

      const onClick = (e: MouseEvent) => {
        if (isDraggedFar) {
          e.preventDefault();
          e.stopPropagation();
          isDraggedFar = false;
        }
      };

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointerup", releaseConstraint, { passive: true });
      window.addEventListener("pointercancel", releaseConstraint, { passive: true });
      footerBottom.addEventListener("click", onClick, { capture: true });

      // Resize handler
      let resizeTimer = 0;
      const onResize = () => {
        window.clearTimeout(resizeTimer);
        const snapshot = state
          ? state.balls.map(({ body }) => {
              const r = body.circleRadius ?? 0;
              return {
                fx: Math.min(Math.max(body.position.x, r), state!.w - r) / state!.w,
                fy: body.position.y / state!.h,
                vx: body.velocity.x,
                vy: body.velocity.y,
                spin: body.angularVelocity,
              };
            })
          : undefined;

        resizeTimer = window.setTimeout(() => {
          releaseConstraint();
          if (state) {
            Composite.clear(state.engine.world, false);
            Engine.clear(state.engine);
            state = null;
          }
          initPhysics(snapshot);
        }, 180);
      };

      window.addEventListener("resize", onResize, { passive: true });

      initPhysics();
      gsap.ticker.add(onTick);

      cleanupFns.push(() => {
        window.clearTimeout(resizeTimer);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointerup", releaseConstraint);
        window.removeEventListener("pointercancel", releaseConstraint);
        footerBottom.removeEventListener("click", onClick, { capture: true });
        io.disconnect();
        gsap.ticker.remove(onTick);
        if (state) {
          Composite.clear(state.engine.world, false);
          Engine.clear(state.engine);
          state = null;
        }
        for (const el of ballElements) {
          el.style.transform = "";
        }
      });
    }

    return () => {
      cleanupFns.forEach((fn) => fn());
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

        {/* Physics interactive bouncy tape rolls & social discs */}
        <div className="footer-balls">
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
