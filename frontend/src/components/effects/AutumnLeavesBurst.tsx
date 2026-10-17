'use client';

import { useEffect, useState } from 'react';

/**
 * AutumnLeavesBurst — 6 distinct Nordic autumn leaves choreographed in a 1 -> 2 -> 1 -> 2 wave pattern:
 *
 * Wave 1 (1 leaf):
 *   - Leaf 1: Norwegian Maple (Burnt Paprika, left: 22vw) — drops solo at 0.4s (glide & dive).
 *
 * Wave 2 (2 leaves, widely spaced):
 *   - Leaf 2: Golden Sugar Maple (Honey Amber, left: 14vw) — drops at 2.8s (3D corkscrew spiral).
 *   - Leaf 3: Crimson Japanese Maple (Crimson, left: 76vw) — drops at 3.3s (vertical autorotation tumble).
 *
 * Wave 3 (1 leaf):
 *   - Leaf 4: Nordic Oak (Maple Amber, left: 52vw) — drops solo at 5.6s (pendulum rocking drift).
 *
 * Wave 4 (2 leaves, widely spaced):
 *   - Leaf 5: Golden Birch (Warm Ochre, left: 32vw) — drops at 7.8s (micro-flutter).
 *   - Leaf 6: Grand Autumn Maple (Burnt Paprika, left: 68vw) — drops at 8.6s with a grand sweeping flowing wind animation.
 *
 * All leaves spawn from above the screen only after load and fall all the way past the bottom (118vh).
 */

const LEAVES_SESSION_KEY = 'smakr_leaves_shown_session';
const LEAVES_LAST_TS_KEY = 'smakr_leaves_last_shown_at';
const LEAVES_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

export function AutumnLeavesBurst() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    try {
      const shownInSession = sessionStorage.getItem(LEAVES_SESSION_KEY);
      const lastShownRaw = localStorage.getItem(LEAVES_LAST_TS_KEY);
      const lastShownAt = lastShownRaw ? Number(lastShownRaw) : 0;
      const now = Date.now();

      if (shownInSession === '1' || (lastShownAt > 0 && now - lastShownAt < LEAVES_COOLDOWN_MS)) {
        return;
      }

      sessionStorage.setItem(LEAVES_SESSION_KEY, '1');
      localStorage.setItem(LEAVES_LAST_TS_KEY, String(now));
      setIsActive(true);
    } catch {
      return;
    }

    // Unmount after all 4 waves (6 leaves total) complete their descent past the bottom
    const timer = setTimeout(() => {
      setIsActive(false);
    }, 22000);

    return () => clearTimeout(timer);
  }, []);

  if (!isActive) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none [perspective:1200px]"
    >
      <style>{`
        /* Vertical descent from above screen (-80px) to past bottom (118vh) */
        @keyframes fallAllTheWay {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(118vh);
          }
        }

        /* 1. Glide & Dive: Steep angled glide, stall, and banking dive */
        @keyframes glideAndDive {
          0% {
            transform: translateX(50px) rotateX(-40deg) rotateY(15deg) rotateZ(24deg);
          }
          35% {
            transform: translateX(-70px) rotateX(20deg) rotateY(-100deg) rotateZ(-28deg);
          }
          50% {
            transform: translateX(-90px) rotateX(50deg) rotateY(-130deg) rotateZ(-12deg);
          }
          75% {
            transform: translateX(30px) rotateX(-30deg) rotateY(-240deg) rotateZ(18deg);
          }
          100% {
            transform: translateX(50px) rotateX(-40deg) rotateY(-320deg) rotateZ(24deg);
          }
        }

        /* 2. 3D Corkscrew Spiral: Orbits in a circular vortex while spinning */
        @keyframes corkscrewSpiral {
          0% {
            transform: translateX(-35px) translateZ(30px) rotateX(25deg) rotateY(0deg) rotateZ(15deg);
          }
          25% {
            transform: translateX(25px) translateZ(60px) rotateX(-20deg) rotateY(90deg) rotateZ(45deg);
          }
          50% {
            transform: translateX(50px) translateZ(0px) rotateX(30deg) rotateY(180deg) rotateZ(75deg);
          }
          75% {
            transform: translateX(-15px) translateZ(-40px) rotateX(-25deg) rotateY(270deg) rotateZ(45deg);
          }
          100% {
            transform: translateX(-35px) translateZ(30px) rotateX(25deg) rotateY(360deg) rotateZ(15deg);
          }
        }

        /* 3. Vertical Autorotation: Tumbles end-over-end with minimal sway */
        @keyframes verticalTumble {
          0% {
            transform: translateX(-6px) rotateX(0deg) rotateY(10deg) rotateZ(-5deg);
          }
          25% {
            transform: translateX(10px) rotateX(90deg) rotateY(-15deg) rotateZ(10deg);
          }
          50% {
            transform: translateX(-4px) rotateX(180deg) rotateY(20deg) rotateZ(-12deg);
          }
          75% {
            transform: translateX(8px) rotateX(270deg) rotateY(-10deg) rotateZ(8deg);
          }
          100% {
            transform: translateX(-6px) rotateX(360deg) rotateY(10deg) rotateZ(-5deg);
          }
        }

        /* 4. Pendulum Drift: Soft metronomic rocking without wide lateral travel */
        @keyframes pendulumDrift {
          0% {
            transform: translateX(25px) rotateX(-15deg) rotateY(15deg) rotateZ(22deg);
          }
          25% {
            transform: translateX(0px) rotateX(10deg) rotateY(-10deg) rotateZ(4deg);
          }
          50% {
            transform: translateX(-30px) rotateX(20deg) rotateY(-25deg) rotateZ(-22deg);
          }
          75% {
            transform: translateX(5px) rotateX(-10deg) rotateY(10deg) rotateZ(-4deg);
          }
          100% {
            transform: translateX(25px) rotateX(-15deg) rotateY(15deg) rotateZ(22deg);
          }
        }

        /* 5. Micro Flutter: Rapid light tremors and micro-sways in breeze */
        @keyframes microFlutter {
          0% {
            transform: translateX(-20px) rotateX(18deg) rotateY(-20deg) rotateZ(-14deg);
          }
          20% {
            transform: translateX(25px) rotateX(-26deg) rotateY(40deg) rotateZ(18deg);
          }
          40% {
            transform: translateX(-12px) rotateX(30deg) rotateY(-10deg) rotateZ(-22deg);
          }
          60% {
            transform: translateX(30px) rotateX(-18deg) rotateY(55deg) rotateZ(14deg);
          }
          80% {
            transform: translateX(4px) rotateX(22deg) rotateY(12deg) rotateZ(-8deg);
          }
          100% {
            transform: translateX(-20px) rotateX(18deg) rotateY(-20deg) rotateZ(-14deg);
          }
        }

        /* 6. Grand Flowing Wind Swirl (The Finale): Sweeping, graceful S-curve wind flight */
        @keyframes grandFlowingWind {
          0% {
            transform: translateX(0px) rotateX(28deg) rotateY(-20deg) rotateZ(-14deg);
          }
          18% {
            transform: translateX(-150px) rotateX(-22deg) rotateY(50deg) rotateZ(30deg);
          }
          32% {
            transform: translateX(-210px) rotateX(50deg) rotateY(115deg) rotateZ(42deg);
          }
          52% {
            transform: translateX(-40px) rotateX(-16deg) rotateY(210deg) rotateZ(12deg);
          }
          72% {
            transform: translateX(170px) rotateX(46deg) rotateY(310deg) rotateZ(-28deg);
          }
          88% {
            transform: translateX(70px) rotateX(-16deg) rotateY(375deg) rotateZ(-10deg);
          }
          100% {
            transform: translateX(0px) rotateX(28deg) rotateY(420deg) rotateZ(-14deg);
          }
        }

        /* ── Wave 1 (1 leaf): drops at 0.4s ── */
        .leaf-track-1 {
          left: 22vw;
          animation: fallAllTheWay 9.5s linear 0.4s 1 normal both;
        }
        .leaf-blade-1 {
          animation: glideAndDive 4.2s ease-in-out infinite;
        }

        /* ── Wave 2 (2 leaves, widely spaced): drops at 2.8s & 3.3s ── */
        .leaf-track-2 {
          left: 14vw;
          animation: fallAllTheWay 10.2s linear 2.8s 1 normal both;
        }
        .leaf-blade-2 {
          animation: corkscrewSpiral 4.0s ease-in-out infinite;
        }

        .leaf-track-3 {
          left: 76vw;
          animation: fallAllTheWay 8.8s linear 3.3s 1 normal both;
        }
        .leaf-blade-3 {
          animation: verticalTumble 2.2s ease-in-out infinite;
        }

        /* ── Wave 3 (1 leaf): drops at 5.6s ── */
        .leaf-track-4 {
          left: 52vw;
          animation: fallAllTheWay 9.8s linear 5.6s 1 normal both;
        }
        .leaf-blade-4 {
          animation: pendulumDrift 3.8s ease-in-out infinite;
        }

        /* ── Wave 4 (2 leaves, widely spaced): drops at 7.8s & 8.6s (Finale) ── */
        .leaf-track-5 {
          left: 32vw;
          animation: fallAllTheWay 9.2s linear 7.8s 1 normal both;
        }
        .leaf-blade-5 {
          animation: microFlutter 2.6s ease-in-out infinite;
        }

        .leaf-track-6 {
          left: 68vw;
          animation: fallAllTheWay 12.5s linear 8.6s 1 normal both;
        }
        .leaf-blade-6 {
          animation: grandFlowingWind 5.2s ease-in-out infinite;
        }
      `}</style>

      {/* ── Wave 1 (1 leaf): Norwegian Maple — Glide & Dive ── */}
      <div className="absolute -top-20 [transform-style:preserve-3d] will-change-transform leaf-track-1">
        <div className="w-11 h-11 [transform-style:preserve-3d] will-change-transform [transform-origin:50%_20%] leaf-blade-1">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_12px_10px_rgba(0,0,0,0.25)]">
            <path
              d="M50 5 C54 20 72 22 70 34 C78 35 88 44 82 56 C74 54 70 60 66 70 C60 68 56 76 53 82 L47 82 C44 76 40 68 34 70 C30 60 26 54 18 56 C12 44 22 35 30 34 C28 22 46 20 50 5 Z"
              fill="#e84a27"
            />
            <path d="M50 82 L50 96" stroke="#9a3412" strokeWidth="3.2" strokeLinecap="round" />
            <path
              d="M50 16 L50 82 M50 40 L68 28 M50 40 L32 28 M50 58 L72 50 M50 58 L28 50 M50 70 L62 66 M50 70 L38 66"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.38"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* ── Wave 2 (2 leaves, left & right): Golden Sugar Maple — 3D Spiral Corkscrew ── */}
      <div className="absolute -top-20 [transform-style:preserve-3d] will-change-transform leaf-track-2">
        <div className="w-11 h-11 [transform-style:preserve-3d] will-change-transform [transform-origin:50%_20%] leaf-blade-2">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_12px_10px_rgba(0,0,0,0.25)]">
            <path
              d="M50 6 C55 22 75 25 72 37 C82 39 90 48 84 60 C76 58 72 64 68 72 C62 70 57 77 53 82 L47 82 C43 77 38 70 32 72 C28 64 24 58 16 60 C10 48 18 39 28 37 C25 25 45 22 50 6 Z"
              fill="#f59e0b"
            />
            <path d="M50 82 L50 96" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
            <path
              d="M50 18 L50 82 M50 42 L67 30 M50 42 L33 30 M50 60 L70 54 M50 60 L30 54"
              stroke="#ffffff"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.4"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* ── Wave 2 (2nd of pair): Crimson Japanese Maple — Vertical Tumble ── */}
      <div className="absolute -top-20 [transform-style:preserve-3d] will-change-transform leaf-track-3">
        <div className="w-10 h-10 [transform-style:preserve-3d] will-change-transform [transform-origin:50%_50%] leaf-blade-3">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_12px_10px_rgba(0,0,0,0.25)]">
            <path
              d="M50 6 C52 24 64 26 76 18 C70 30 84 36 90 48 C76 48 76 58 72 70 C64 66 58 74 53 82 L47 82 C42 74 36 66 28 70 C24 58 24 48 10 48 C16 36 30 30 24 18 C36 26 48 24 50 6 Z"
              fill="#be123c"
            />
            <path d="M50 82 L50 97" stroke="#881337" strokeWidth="3" strokeLinecap="round" />
            <path
              d="M50 20 L50 82 M50 45 L72 32 M50 45 L28 32 M50 62 L74 56 M50 62 L26 56"
              stroke="#ffffff"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.38"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* ── Wave 3 (1 leaf): Nordic Oak — Pendulum Rocking Drift ── */}
      <div className="absolute -top-20 [transform-style:preserve-3d] will-change-transform leaf-track-4">
        <div className="w-12 h-12 [transform-style:preserve-3d] will-change-transform [transform-origin:50%_20%] leaf-blade-4">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_12px_10px_rgba(0,0,0,0.25)]">
            <path
              d="M50 8 C62 16 75 28 68 44 C78 52 74 66 53 82 L47 82 C26 66 22 52 32 44 C25 28 38 16 50 8 Z"
              fill="#ea580c"
            />
            <path d="M50 82 L50 96" stroke="#9a3412" strokeWidth="3" strokeLinecap="round" />
            <path
              d="M50 16 L50 82 M50 36 L65 28 M50 36 L35 28 M50 54 L66 48 M50 54 L34 48 M50 68 L62 64 M50 68 L38 64"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.35"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* ── Wave 4 (2 leaves, left & right): Golden Birch — Micro Flutter ── */}
      <div className="absolute -top-20 [transform-style:preserve-3d] will-change-transform leaf-track-5">
        <div className="w-10 h-10 [transform-style:preserve-3d] will-change-transform [transform-origin:50%_20%] leaf-blade-5">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_12px_10px_rgba(0,0,0,0.25)]">
            <path
              d="M50 10 C66 26 76 52 52 82 L48 82 C24 52 34 26 50 10 Z"
              fill="#d97706"
            />
            <path d="M50 82 L50 95" stroke="#78350f" strokeWidth="2.8" strokeLinecap="round" />
            <path
              d="M50 20 L50 82 M50 38 L64 30 M50 38 L36 30 M50 56 L64 50 M50 56 L36 50 M50 70 L60 66 M50 70 L40 66"
              stroke="#ffffff"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.35"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* ── Wave 4 (Finale): Autumn Maple — Grand Flowing Wind Swirl ── */}
      <div className="absolute -top-20 [transform-style:preserve-3d] will-change-transform leaf-track-6">
        <div className="w-11 h-11 [transform-style:preserve-3d] will-change-transform [transform-origin:50%_20%] leaf-blade-6">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_12px_10px_rgba(0,0,0,0.25)]">
            <path
              d="M50 4 C54 19 72 21 70 33 C78 34 88 43 82 55 C74 53 70 59 66 69 C60 67 56 75 53 82 L47 82 C44 75 40 67 34 69 C30 59 26 53 18 55 C12 43 22 34 30 33 C28 21 46 19 50 4 Z"
              fill="#e84a27"
            />
            <path d="M50 82 L50 97" stroke="#9a3412" strokeWidth="3.2" strokeLinecap="round" />
            <path
              d="M50 15 L50 82 M50 39 L68 27 M50 39 L32 27 M50 57 L72 49 M50 57 L28 49 M50 69 L63 65 M50 69 L37 65"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.38"
              fill="none"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
