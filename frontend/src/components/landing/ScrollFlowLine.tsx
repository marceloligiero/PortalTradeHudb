import { useEffect, useRef, useState } from 'react';

/**
 * ScrollFlowLine — Single continuous animated SVG line that flows from the
 * right side after the hero, down the entire page contouring each section.
 *
 * Path:
 *   RIGHT (after hero) → down right rail (Problem)
 *   → S-curve to LEFT (Solution) → S-curve to RIGHT (HowItWorks)
 *   → S-curve to LEFT (Metrics) → arc to CENTER (FinalCTA top)
 *
 * - 1 SVG path animated by scroll-driven stroke-dashoffset
 * - Glowing particle at the leading edge
 * - Hidden on < 1024px · Respects prefers-reduced-motion
 * - Bridge microcopy text rendered below pulse via SVG foreignObject
 */
export default function ScrollFlowLine() {
  const pathRef = useRef<SVGPathElement>(null);
  const emberRef = useRef<SVGGElement>(null);
  const endPulseRef = useRef<SVGGElement>(null);

  const lineEndScrollRef = useRef(0);
  const endPointRef = useRef({ x: 0, y: 0 });

  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [pathD, setPathD] = useState('');
  const [canShow, setCanShow] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  // Fade in after hero animation settles (~3s)
  useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // ── Measure sections and compute SVG path ──────────────────────────────
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w < 1024) { setCanShow(false); return; }

      const h = document.documentElement.scrollHeight;
      if (h < 500) return;
      setDims({ w, h });

      // Container geometry (max-w-6xl = 1152px)
      const contW = Math.min(1152, w - 48);
      const cl = (w - contW) / 2;
      const cr = cl + contW;
      const cx = w / 2;

      // Guide rails: 44px outside the content container
      const gL = Math.max(20, cl - 44);
      const gR = Math.min(w - 20, cr + 44);

      // Get all <section> elements
      // Order: [0]=Hero, [1]=Problem, [2]=Solution, [3]=HowItWorks, [4]=Metrics, [5]=FinalCTA
      const secs = Array.from(document.querySelectorAll('section'));
      if (secs.length < 5) return;

      const s = secs.map(el => {
        const top = el.offsetTop;
        const height = el.offsetHeight;
        return { top, bot: top + height, mid: top + height / 2 };
      });

      const [hero, prob, sol, how, met] = s;
      const fin = s[5] || { top: h - 400, mid: h - 250, bot: h - 100 };

      const arcH = 90;

      const maxS = h - window.innerHeight;
      if (maxS <= 0) return;

      // Line should complete drawing when FinalCTA enters the viewport
      lineEndScrollRef.current = Math.max(1, fin.top - window.innerHeight);

      // ╔══════════════════════════════════════════════════════════════════╗
      // ║  SINGLE PATH                                                    ║
      // ║  Starts at CENTER (where hero particle drop ends), goes         ║
      // ║  straight down through SocialProofBar, then curves RIGHT,      ║
      // ║  then alternates right → left → right → left → center          ║
      // ╚══════════════════════════════════════════════════════════════════╝
      const d = [
        // 1. Start at hero bottom (drops from hero feed into this line)
        `M ${cx} ${hero.bot}`,

        // 2. Straight DOWN center to ProblemSection top
        `L ${cx} ${prob.top}`,

        // 3. Arc: CENTER → RIGHT rail (curving out to the right)
        `C ${cx + (gR - cx) * 0.5} ${prob.top}, ${gR} ${prob.top + 10}, ${gR} ${prob.top + arcH}`,

        // 3. Straight DOWN the right rail (alongside ProblemSection)
        `L ${gR} ${prob.bot - arcH}`,

        // 3. S-CURVE: right → left (Problem → Solution transition)
        `C ${gR} ${prob.bot - arcH / 3}, ${gL} ${prob.bot + arcH / 3}, ${gL} ${prob.bot + arcH}`,

        // 4. Straight DOWN the left rail (alongside SolutionTabs)
        `L ${gL} ${sol.bot - arcH}`,

        // 5. S-CURVE: left → right (Solution → HowItWorks transition)
        `C ${gL} ${sol.bot - arcH / 3}, ${gR} ${sol.bot + arcH / 3}, ${gR} ${sol.bot + arcH}`,

        // 6. Straight DOWN the right rail (alongside HowItWorks)
        `L ${gR} ${how.bot - arcH}`,

        // 7. S-CURVE: right → left (HowItWorks → Metrics transition)
        `C ${gR} ${how.bot - arcH / 3}, ${gL} ${how.bot + arcH / 3}, ${gL} ${how.bot + arcH}`,

        // 8. Straight DOWN the left rail (alongside MetricsSection)
        `L ${gL} ${met.bot - arcH}`,

        // 9. Arc: LEFT → CENTER (Metrics → FinalCTA transition)
        `C ${gL} ${met.bot}, ${cx - (cx - gL) * 0.5} ${met.bot}, ${cx} ${met.bot + 10}`,

        // 10. Straight center to FinalCTA top
        `L ${cx} ${fin.top}`,
      ].join(' ');

      setPathD(d);
      endPointRef.current = { x: cx, y: fin.top };
      setCanShow(true);
    };

    const t1 = setTimeout(compute, 600);
    const t2 = setTimeout(compute, 2500);
    window.addEventListener('resize', compute);
    const ro = new ResizeObserver(() => setTimeout(compute, 100));
    ro.observe(document.body);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', compute);
      ro.disconnect();
    };
  }, []);

  // ── Scroll-driven animation ───────────────────────────────────────────
  useEffect(() => {
    if (!canShow || !pathD) return;

    let raf = 0;
    let scrollHandler: (() => void) | null = null;

    const timer = setTimeout(() => {
      const path = pathRef.current;
      const ember = emberRef.current;
      const endPulse = endPulseRef.current;
      if (!path) return;

      const totalLen = path.getTotalLength();

      // Respect reduced motion
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        path.style.strokeDasharray = 'none';
        if (ember) ember.style.opacity = '0';
        if (endPulse) endPulse.style.opacity = '0';
        return;
      }

      // Initial state: fully hidden
      path.style.strokeDasharray = `${totalLen}`;
      path.style.strokeDashoffset = `${totalLen}`;

      // Shared draw function
      const draw = (p: number) => {
        path.style.strokeDashoffset = `${totalLen * (1 - p)}`;

        if (ember) {
          try {
            const pt = path.getPointAtLength(totalLen * p);
            ember.setAttribute('transform', `translate(${pt.x},${pt.y})`);
            ember.style.opacity = (p > 0.005 && p < 0.99) ? '1' : '0';

            const sparks = ember.querySelectorAll<SVGCircleElement>('.trail-spark');
            sparks.forEach((spark, i) => {
              const offset = (i + 1) * 12;
              const trailLen = Math.max(0, totalLen * p - offset);
              const tp = path.getPointAtLength(trailLen);
              spark.setAttribute('cx', `${tp.x - pt.x}`);
              spark.setAttribute('cy', `${tp.y - pt.y}`);
            });
          } catch { /* path not yet measured */ }
        }

        if (endPulse) {
          const ep = endPointRef.current;
          endPulse.setAttribute('transform', `translate(${ep.x},${ep.y})`);
          endPulse.style.opacity = p >= 0.97 ? '1' : '0';
        }
      };

      scrollHandler = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const endScroll = lineEndScrollRef.current;
          if (endScroll <= 0) return;
          const p = Math.min(1, window.scrollY / endScroll);
          draw(p);
        });
      };

      window.addEventListener('scroll', scrollHandler, { passive: true });
      scrollHandler();
    }, 80);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
    };
  }, [canShow, pathD]);

  // ── Render ────────────────────────────────────────────────────────────
  if (!canShow || !pathD || dims.h === 0) return null;

  return (
    <svg
      className="absolute top-0 left-0 w-full pointer-events-none"
      style={{
        height: dims.h,
        zIndex: 1,
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 1.2s ease',
      }}
      viewBox={`0 0 ${dims.w} ${dims.h}`}
      aria-hidden="true"
    >
      <defs>
        <filter id="flowGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="emberGlow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="emberCore">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="25%" stopColor="#FFD700" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#FF6600" stopOpacity="0.7" />
          <stop offset="80%" stopColor="#EC0000" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#EC0000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="emberOuter">
          <stop offset="0%" stopColor="#FF6600" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#EC0000" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#EC0000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Single flowing line */}
      <path
        ref={pathRef}
        d={pathD}
        stroke="#EC0000"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        opacity={0.35}
        filter="url(#flowGlow)"
      />

      {/* Burning ember at the leading edge (scroll-driven) */}
      <g ref={emberRef} opacity="0" filter="url(#emberGlow)">
        {/* Trailing sparks (positioned by scroll handler) */}
        <circle className="trail-spark" r="2.5" fill="#EC0000" opacity="0.15" />
        <circle className="trail-spark" r="2" fill="#EC0000" opacity="0.1" />
        <circle className="trail-spark" r="1.5" fill="#FF6600" opacity="0.08" />

        {/* Outer heat halo */}
        <circle r="14" fill="url(#emberOuter)" />
        {/* Mid flame glow */}
        <circle r="8" fill="url(#emberCore)" />
        {/* White-hot core */}
        <circle r="2.5" fill="#FFFFFF" opacity="0.9" />
        {/* Flickering sparks */}
        <circle r="1" cx="-3" cy="-2" fill="#FFD700" opacity="0.6"
          style={{ animation: 'emberFlicker 0.6s ease-in-out infinite alternate' }} />
        <circle r="0.8" cx="2" cy="-3" fill="#FF6600" opacity="0.5"
          style={{ animation: 'emberFlicker 0.8s ease-in-out 0.3s infinite alternate' }} />
      </g>

      {/* Pulsing ripple at the endpoint */}
      <g ref={endPulseRef} opacity="0" style={{ transition: 'opacity 0.6s ease' }}>
        {/* Solid center dot */}
        <circle r="4" fill="#EC0000" opacity="0.8" />
        {/* Ripple ring 1 */}
        <circle
          r="8"
          fill="none"
          stroke="#EC0000"
          strokeWidth="1.5"
          opacity="0.6"
          style={{ animation: 'flowPulse 2s ease-out infinite' }}
        />
        {/* Ripple ring 2 (delayed) */}
        <circle
          r="8"
          fill="none"
          stroke="#EC0000"
          strokeWidth="1"
          opacity="0.4"
          style={{ animation: 'flowPulse 2s ease-out 0.7s infinite' }}
        />
        {/* Ripple ring 3 (delayed more) */}
        <circle
          r="8"
          fill="none"
          stroke="#EC0000"
          strokeWidth="0.5"
          opacity="0.25"
          style={{ animation: 'flowPulse 2s ease-out 1.4s infinite' }}
        />
      </g>

      <style>{`
        @keyframes flowPulse {
          0%   { r: 4; opacity: 0.7; }
          100% { r: 28; opacity: 0; }
        }
        @keyframes emberFlicker {
          0%   { opacity: 0.2; transform: translate(0, 0); }
          100% { opacity: 0.8; transform: translate(1px, -1px); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes flowPulse { 0%, 100% { r: 4; opacity: 0.4; } }
          @keyframes emberFlicker { 0%, 100% { opacity: 0.4; } }
        }
      `}</style>
    </svg>
  );
}
