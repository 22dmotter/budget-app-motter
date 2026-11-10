"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  /** Base upward speed (negative y in canvas coords = up) */
  speed: number;
  /** Sway amplitude in px */
  swayAmp: number;
  /** Sway frequency */
  swayFreq: number;
  /** Phase offset for sine sway */
  phase: number;
  r: number;
  crimson: boolean;
  /** 0–1 life used for fade; advances with ascent */
  life: number;
  /** Larger bokeh orbs drift slower / stay fainter */
  bokeh: boolean;
};

const SLATE = { r: 186, g: 198, b: 220 }; // soft silver-blue, visible on #0b1020
const CRIMSON = { r: 225, g: 29, b: 72 }; // #e11d48
const MOUSE_RADIUS = 130;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function particleCount(width: number, height: number): number {
  const area = width * height;
  const isMobile = width < 768;
  const target = Math.round(area / (isMobile ? 20000 : 16000));
  return Math.max(14, Math.min(isMobile ? 30 : 70, target));
}

function spawnParticle(
  width: number,
  height: number,
  fromBottom: boolean
): Particle {
  const bokeh = Math.random() < 0.12;
  const crimson = !bokeh && Math.random() < 0.2;
  const r = bokeh
    ? 10 + Math.random() * 18
    : 1.5 + Math.random() * 5.5;
  // Bigger = slower (parallax)
  const speed = bokeh
    ? 0.12 + Math.random() * 0.18
    : 0.35 + Math.random() * 0.55 + (7 - Math.min(r, 7)) * 0.04;
  return {
    x: Math.random() * width,
    y: fromBottom
      ? height + r + Math.random() * 40
      : Math.random() * height,
    speed,
    swayAmp: bokeh ? 8 + Math.random() * 16 : 12 + Math.random() * 28,
    swayFreq: 0.0004 + Math.random() * 0.0009,
    phase: Math.random() * Math.PI * 2,
    r,
    crimson,
    life: fromBottom ? 0 : Math.random(),
    bokeh,
  };
}

/**
 * Soft rising particles with glow — silver-blue + crimson accents, no network lines.
 * Calm fintech backdrop layered over the CSS gradient blobs on the dark theme.
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
    let t = 0;
    const mouse = { x: -9999, y: -9999, active: false };
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const isCoarse =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;

    const makeParticles = () => {
      const count = particleCount(width, height);
      particles = Array.from({ length: count }, () =>
        spawnParticle(width, height, false)
      );
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
      if (reduced) drawFrame(false);
    };

    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };

    const drawParticle = (p: Particle, alphaScale: number) => {
      const c = p.crimson ? CRIMSON : SLATE;
      // Fade in near bottom, fade out near top
      const edge = Math.min(1, p.y / (height * 0.18), (height - p.y) / (height * 0.2));
      const baseAlpha = p.bokeh
        ? 0.08 + 0.06 * (1 - p.r / 30)
        : p.crimson
          ? 0.32
          : 0.22;
      const alpha = Math.max(0, baseAlpha * edge * alphaScale);

      if (alpha < 0.01) return;

      if (p.bokeh || p.r > 3.5 || p.crimson) {
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * (p.bokeh ? 1.6 : 2.4));
        glow.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${alpha})`);
        glow.addColorStop(0.45, `rgba(${c.r},${c.g},${c.b},${alpha * 0.45})`);
        glow.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (p.bokeh ? 1.6 : 2.4), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${Math.min(0.35, alpha * (p.bokeh ? 0.7 : 1.35))})`;
      ctx.arc(p.x, p.y, p.r * (p.bokeh ? 0.55 : 1), 0, Math.PI * 2);
      ctx.fill();
    };

    const drawFrame = (animate: boolean) => {
      ctx.clearRect(0, 0, width, height);

      if (animate) t += 1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (animate) {
          const sway = Math.sin(t * p.swayFreq * 60 + p.phase) * p.swayAmp * 0.02;
          let dx = sway;
          let dy = -p.speed;

          // Desktop-only gentle push away from cursor
          if (mouse.active && !isCoarse) {
            const mx = p.x - mouse.x;
            const my = p.y - mouse.y;
            const dist = Math.hypot(mx, my) || 1;
            if (dist < MOUSE_RADIUS) {
              const force = (1 - dist / MOUSE_RADIUS) * 0.45;
              dx += (mx / dist) * force;
              dy += (my / dist) * force * 0.35;
            }
          }

          p.x += dx;
          p.y += dy;

          // Soft horizontal wrap
          if (p.x < -30) p.x = width + 30;
          if (p.x > width + 30) p.x = -30;

          // Respawn at bottom when past the top
          if (p.y < -p.r * 3) {
            particles[i] = spawnParticle(width, height, true);
            continue;
          }
        }

        drawParticle(p, 1);
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
      if (isCoarse) return;
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
