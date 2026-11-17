"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function StickyNote3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const SHEET = { W: 1, H: 0.94 };
    const NOTE = { W: SHEET.W, H: SHEET.H, SEGS: 44, SPAN: 0.62 };
    const WIND = {
      SPEED: 1,
      CURL: 0.14,
      FLUTTER: 0.035,
      TREMBLE: 0.016,
      GUST: 0.3,
      SCROLL: 1.1,
      POKE: 0.6,
      PIN_HALF: 0.3,
    };
    const LIGHT = { X: -2, Y: 2.5, Z: 3, POWER: 1.1, AMBIENT: 0.72 };
    const SHADOW = { OPACITY: 0.2, SOFT: 9 };

    const clamp = (e: number) => Math.min(1, Math.max(0, e));
    const smooth = (e: number) => {
      const t = clamp(e);
      return t * t * (3 - 2 * t);
    };

    // Draw the yellow note texture
    const canvas = document.createElement("canvas");
    const cw = 512;
    const ch = Math.round(512 * (SHEET.H / SHEET.W));
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, ch);
      grad.addColorStop(0, "#f9dd55");
      grad.addColorStop(1, "#f2cf3e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);

      ctx.fillStyle = "#7c4a12";
      ctx.font = `800 ${0.16 * cw}px futura-pt-condensed, "Arial Narrow", sans-serif`;
      ctx.fillText("TO-DO LIST", 0.09 * cw, 0.24 * ch);

      ctx.font = `italic ${0.055 * cw}px "Bradley Hand", "Comic Sans MS", cursive`;
      ["clean up plates", "daily yoga 30 minutes", "meal prep"].forEach((text, i) => {
        const y = ch * (0.36 + 0.115 * i);
        ctx.beginPath();
        ctx.arc(0.12 * cw, y - 0.02 * cw, 0.02 * cw, 0, 2 * Math.PI);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#7c4a12";
        ctx.stroke();

        ctx.fillText(text, 0.17 * cw, y);

        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(0.09 * cw, y + 0.025 * cw);
        ctx.lineTo(0.91 * cw, y + 0.025 * cw);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
    camera.position.z = NOTE.H / NOTE.SPAN / (2 * Math.tan((Math.PI / 180) * 17.5));

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;

    container.appendChild(renderer.domElement);

    // Lights
    const dirLight = new THREE.DirectionalLight(0xffffff, LIGHT.POWER);
    dirLight.position.set(LIGHT.X, LIGHT.Y, LIGHT.Z);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(512, 512);

    scene.add(dirLight, new THREE.AmbientLight(0xffffff, Math.PI * LIGHT.AMBIENT));

    // Material & Geometry
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.92,
      side: THREE.DoubleSide,
    });

    const geometry = new THREE.PlaneGeometry(NOTE.W, NOTE.H, NOTE.SEGS, NOTE.SEGS);
    const basePositions = geometry.attributes.position.array.slice() as Float32Array;

    const noteMesh = new THREE.Mesh(geometry, material);
    noteMesh.castShadow = true;
    scene.add(noteMesh);

    // Shadow catcher plane
    const shadowMat = new THREE.ShadowMaterial({ opacity: SHADOW.OPACITY });
    const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), shadowMat);
    shadowMesh.position.z = -0.02;
    shadowMesh.receiveShadow = true;
    scene.add(shadowMesh);

    const resize = () => {
      const w = container.clientWidth || 310;
      const h = container.clientHeight || 290;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let reqId: number;
    let lastScroll = window.scrollY;
    let scrollGust = 0;
    let pokeX = 0;
    let pokeY = 0;
    let pokeIntensity = 0;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      const dist = Math.hypot(nx, ny);
      if (dist < 1.7) {
        pokeIntensity = Math.max(0, 1 - dist / 1.7);
        pokeX = Math.max(-1, Math.min(1, 1.4 * nx));
        pokeY = Math.max(-1, Math.min(1, 1.4 * ny));
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let startTime = performance.now();

    const loop = (time: number) => {
      reqId = requestAnimationFrame(loop);
      const elapsed = (time - startTime) / 1000;

      // Scroll speed tracking
      const curScroll = window.scrollY;
      const scrollDiff = Math.abs(curScroll - lastScroll) / 500;
      lastScroll = curScroll;
      scrollGust += (scrollDiff - scrollGust) * 0.1;

      const d = elapsed * WIND.SPEED;
      const waveVal =
        Math.pow(Math.max(0, Math.sin(0.31 * d) * Math.sin(0.117 * d + 2) - 0.25) / 0.75, 1.6) +
        scrollGust * WIND.SCROLL;
      const gust = WIND.GUST * waveVal;

      const posArray = geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < posArray.length; i += 3) {
        const origX = basePositions[i];
        const origY = basePositions[i + 1];

        const pinWeight = (() => {
          const normY = (NOTE.H / 2 - origY) / NOTE.H;
          const normX = Math.abs(origX) / NOTE.W;
          return Math.pow(
            clamp(
              smooth(normY / 0.85) +
                smooth((normX - WIND.PIN_HALF) / (0.5 - WIND.PIN_HALF)) *
                  (1 - smooth(normY / 0.35)) *
                  smooth(normY / 0.12) *
                  0.55
            ),
            2.1
          );
        })();

        const m = (NOTE.H / 2 - origY) / NOTE.H;
        const M = m * (0.5 - origX / NOTE.W);

        const flutter =
          WIND.FLUTTER *
          (Math.sin(1.1 * d + 1.4 * m - 0.8 * origX) +
            0.5 * Math.sin(1.9 * d - 0.9 * m - 1.2 * origX + 1.3));

        const tremble =
          WIND.TREMBLE *
          (0.35 + 1.8 * waveVal) *
          (Math.sin(8.7 * d + 1.9 * origX + 1.1 * m) + 0.6 * Math.sin(13.3 * d + 3.1 * origX));

        const E = 0.55 + 0.45 * Math.sin(1.3 * d + 1.6 * origX) + 0.9 * M;
        const P = WIND.POKE * pokeIntensity * (0.5 + 0.9 * (origX * pokeX + (m - 0.5) * pokeY));

        const z = pinWeight * (WIND.CURL + (flutter + tremble + gust * E + P));

        posArray[i + 2] = z;
        posArray[i + 1] = origY + z * z * 0.4 * smooth(m / 0.3);
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();

      renderer.render(scene, camera);
    };

    reqId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("pointermove", onPointerMove);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      shadowMesh.geometry.dispose();
      shadowMat.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="sticky-note" aria-hidden="true" />;
}
