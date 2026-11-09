"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  crimson: boolean;
};

const NAVY = { r: 15, g: 30, b: 61 }; // #0F1E3D
const CRIMSON = { r: 180, g: 35, b: 24 }; // #B42318
const LINK_DIST = 120;
const MOUSE_RADIUS = 140;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function particleCount(width: number, height: number): number {
  const area = width * height;
  const isMobile = width < 768;
  const target = Math.round(area / (isMobile ? 18000 : 14000));
  return Math.max(12, Math.min(isMobile ? 30 : 70, target));
}

/**
 * Lightweight canvas particle field — navy dots with crimson accents,
 * faint links, gentle mouse influence. Fixed behind content.
 */
export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let particles: Particle[] = [];
    let raf = 0;
    let running = true;
    let reduced = prefersReducedMotion();
    let width = 0;
    let height = 0;
    let dpr = 1;
    const mouse = { x: -9999, y: -9999, active: false };
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const makeParticles = () => {
      const count = particleCount(width, height);
      particles = Array.from({ length: count }, () => {
        const crimson = Math.random() < 0.18;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          r: crimson ? 1.4 + Math.random() * 1.2 : 1.1 + Math.random() * 1.4,
          crimson,
        };
      });
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeParticles();
      if (reduced) {
        drawFrame(false);
      }
    };

    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };

    const drawFrame = (animate: boolean) => {
      ctx.clearRect(0, 0, width, height);

      // Soft vignette wash so particles never fight text contrast
      const wash = ctx.createLinearGradient(0, 0, 0, height);
      wash.addColorStop(0, "rgba(247, 248, 250, 0.15)");
      wash.addColorStop(1, "rgba(247, 248, 250, 0.35)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (animate) {
          // Gentle mouse force (attract slightly when close, soft push at center)
          if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < MOUSE_RADIUS) {
              const force = (1 - dist / MOUSE_RADIUS) * 0.035;
              // Mild repulsion near cursor, slight tangential drift
              p.vx += (dx / dist) * force;
              p.vy += (dy / dist) * force;
            }
          }

          p.x += p.vx;
          p.y += p.vy;

          // Soft wrap
          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;
          if (p.y < -20) p.y = height + 20;
          if (p.y > height + 20) p.y = -20;

          // Dampen so motion stays calm
          p.vx *= 0.995;
          p.vy *= 0.995;
          // Keep a tiny baseline drift
          p.vx += (Math.random() - 0.5) * 0.01;
          p.vy += (Math.random() - 0.5) * 0.01;
          const speed = Math.hypot(p.vx, p.vy);
          if (speed > 0.55) {
            p.vx *= 0.55 / speed;
            p.vy *= 0.55 / speed;
          }
        }

        const c = p.crimson ? CRIMSON : NAVY;
        const alpha = p.crimson ? 0.28 : 0.22;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Faint connecting lines
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > LINK_DIST) continue;
          const t = 1 - dist / LINK_DIST;
          const accent = a.crimson || b.crimson;
          const c = accent ? CRIMSON : NAVY;
          ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${0.08 + t * 0.1})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    };

    const loop = () => {
      if (!running) return;
      drawFrame(true);
      raf = window.requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        window.cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        raf = window.requestAnimationFrame(loop);
      }
    };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };

    const onMotionChange = (e: MediaQueryListEvent) => {
      reduced = e.matches;
      window.cancelAnimationFrame(raf);
      running = false;
      if (reduced) {
        drawFrame(false);
      } else {
        running = true;
        raf = window.requestAnimationFrame(loop);
      }
    };

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", onMotionChange);

    resize();
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    if (!reduced) {
      running = true;
      raf = window.requestAnimationFrame(loop);
    } else {
      drawFrame(false);
    }

    return () => {
      running = false;
      window.cancelAnimationFrame(raf);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      mq.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      aria-hidden="true"
    />
  );
}
