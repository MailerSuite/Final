/**
 * Background Effects Component
 * Subtle animated background effects for professional marketing platform
 */

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

interface BackgroundEffectsProps {
  variant?: 'subtle' | 'moderate' | 'vibrant';
  className?: string;
}

export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({
  variant = 'subtle',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Mark a global flag to indicate a shared background is mounted
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute('data-global-bg');
    root.setAttribute('data-global-bg', '1');
    return () => {
      if (previous === null) {
        root.removeAttribute('data-global-bg');
      } else {
        root.setAttribute('data-global-bg', previous);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system for subtle animation
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      opacity: number;
      size: number;
    }> = [];

    const particleCount = variant === 'subtle' ? 20 : variant === 'moderate' ? 40 : 60;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.1 + 0.02,
        size: Math.random() * 2 + 1
      });
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${particle.opacity})`;
        ctx.fill();

        // Draw connections
        particles.forEach((otherParticle, otherIndex) => {
          if (index === otherIndex) return;

          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            const opacity = (120 - distance) / 120 * 0.05;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(34, 211, 238, ${opacity})`;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    let raf = 0;
    const loop = () => {
      if (prefersReducedMotion || document.hidden) {
        raf = requestAnimationFrame(loop);
        return;
      }
      animate();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(raf);
    };
  }, [variant, prefersReducedMotion]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800" />

      {/* Animated Gradient Orbs */}
      <motion.div
        className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"
        animate={{
          scale: prefersReducedMotion ? 1 : [1, 1.2, 1],
          opacity: prefersReducedMotion ? 0.3 : [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: prefersReducedMotion ? 0 : Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
        animate={{
          scale: prefersReducedMotion ? 1 : [1.2, 1, 1.2],
          opacity: prefersReducedMotion ? 0.2 : [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: prefersReducedMotion ? 0 : Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Subtle Vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 via-transparent to-slate-900/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-transparent to-slate-900/20" />

      {/* Fancy cursor (desktop, reduced-motion aware) - DISABLED */}
      {/* <FancyCursorOverlay /> */}
    </div>
  );
};

const FancyCursorOverlay: React.FC = () => {
  const enable = typeof window !== 'undefined' && window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [visible, setVisible] = React.useState(true)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 400, damping: 28 })
  const sy = useSpring(y, { stiffness: 400, damping: 28 })

  useEffect(() => {
    if (!enable) return
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY) }
    const enter = () => setVisible(true)
    const leave = () => setVisible(false)
    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('mouseenter', enter)
    window.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseenter', enter)
      window.removeEventListener('mouseleave', leave)
    }
  }, [enable, x, y])

  if (!enable) return null

  return (
    <>
      <motion.div
        aria-hidden
        style={{ translateX: sx, translateY: sy }}
        className="pointer-events-none fixed z-[60] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.35)] max-md:hidden"
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      />
      <motion.div
        aria-hidden
        style={{ translateX: sx, translateY: sy }}
        className="pointer-events-none fixed z-[60] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 max-md:hidden"
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      />
    </>
  )
}

export default BackgroundEffects;