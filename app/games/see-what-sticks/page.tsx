'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { getLevelProgress } from '@/lib/gameLogic';
import { TaskCategory } from '@/lib/types';
import { getGameDay } from '@/lib/gameDay';
import Matter from 'matter-js';
import { loadState, saveState } from '@/lib/supabase/storage';

const STICKS_KEY = 'gainfully-sticks';

const CW = 480;
const CH = 300;
const WALL_X = Math.round(CW * 0.82);    // 394
const WALL_W = 14;
const STICKY_TOP = Math.round(CH * 0.30); // 90
const STICKY_BOT = Math.round(CH * 0.45); // 135

// Each ball: XP value, color, radius, launch angle (deg above horizontal), speed
const BALL_CONFIGS = [
  { xp: 5,  color: '#6366f1', r: 13, angleDeg: -48, speed: 11.0 },
  { xp: 10, color: '#8b5cf6', r: 13, angleDeg: -44, speed: 12.5 },
  { xp: 15, color: '#a855f7', r: 13, angleDeg: -40, speed: 13.5 },
  { xp: 20, color: '#ec4899', r: 14, angleDeg: -37, speed: 14.5 },
  { xp: 30, color: '#f59e0b', r: 14, angleDeg: -34, speed: 15.5 },
  { xp: 50, color: '#ef4444', r: 15, angleDeg: -31, speed: 16.0 },
];

interface BallData { xp: number; color: string; r: number }


// ─── pure render (no component closure) ──────────────────────────────────────
function drawScene(
  ctx: CanvasRenderingContext2D,
  engine: Matter.Engine,
  stuck: Set<number>,
  ballData: Map<number, BallData>,
  armDeg: number,
  fired: boolean,
) {
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, CW, CH);

  // Floor
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, CH - 2); ctx.lineTo(CW, CH - 2); ctx.stroke();

  // Wall
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(WALL_X, 0, WALL_W, CH);
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
  ctx.strokeRect(WALL_X, 0, WALL_W, CH);

  // Sticky patch
  ctx.fillStyle = '#15803d';
  ctx.fillRect(WALL_X, STICKY_TOP, WALL_W, STICKY_BOT - STICKY_TOP);
  ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 10;
  ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 1.5;
  ctx.strokeRect(WALL_X, STICKY_TOP, WALL_W, STICKY_BOT - STICKY_TOP);
  ctx.shadowBlur = 0;

  ctx.save();
  ctx.font = 'bold 8px system-ui';
  ctx.fillStyle = '#86efac';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.translate(WALL_X + WALL_W / 2, (STICKY_TOP + STICKY_BOT) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('STICKY', 0, 0);
  ctx.restore();

  // Catapult
  const bx = CW * 0.1; // 48
  const by = CH - 10;  // 290
  const armLen = 55;
  const ar = (armDeg * Math.PI) / 180;

  ctx.save();
  ctx.translate(bx, by);
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.lineTo(11, 26); ctx.lineTo(-11, 26);
  ctx.closePath(); ctx.fill();
  ctx.rotate(ar);
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -armLen); ctx.stroke();
  ctx.fillStyle = '#64748b';
  ctx.beginPath(); ctx.arc(0, -armLen, 7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Loaded balls (pre-fire) — drawn in a 3×2 grid above the cup
  if (!fired) {
    const tipX = bx + Math.sin(ar) * armLen;
    const tipY = by - Math.cos(ar) * armLen;
    const cols = 3;
    BALL_CONFIGS.forEach((cfg, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const px = tipX + (col - 1) * 30;
      const py = tipY - cfg.r - row * 30 - 6;

      ctx.beginPath();
      ctx.arc(px, py, cfg.r, 0, Math.PI * 2);
      ctx.fillStyle = cfg.color;
      ctx.shadowColor = cfg.color; ctx.shadowBlur = 6;
      ctx.fill(); ctx.shadowBlur = 0;

      ctx.font = `bold ${Math.round(cfg.r * 0.85)}px system-ui`;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(cfg.xp), px, py);
    });
  }

  // Physics balls (in-flight / stuck)
  for (const body of Matter.Composite.allBodies(engine.world)) {
    if (body.label !== 'ball') continue;
    const { x, y } = body.position;
    const data = ballData.get(body.id);
    if (!data) continue;
    const isStuck = stuck.has(body.id);

    ctx.beginPath();
    ctx.arc(x, y, data.r, 0, Math.PI * 2);
    ctx.fillStyle = isStuck ? '#4ade80' : data.color;
    ctx.shadowColor = isStuck ? '#4ade80' : data.color;
    ctx.shadowBlur = isStuck ? 14 : 7;
    ctx.fill(); ctx.shadowBlur = 0;

    ctx.font = `bold ${Math.round(data.r * 0.85)}px system-ui`;
    ctx.fillStyle = isStuck ? '#052e16' : 'rgba(255,255,255,0.92)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(data.xp), x, y);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export default function SeeWhatSticksPage() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const engineRef   = useRef<Matter.Engine | null>(null);
  const ballDataRef = useRef(new Map<number, BallData>());
  const stuckRef    = useRef(new Set<number>());
  const handledRef   = useRef(new Set<number>());
  const armRef       = useRef(-30);
  const firedRef     = useRef(false);
  const stallRef     = useRef(new Map<number, number>()); // ballId → stall-frame count
  const awardXPRef   = useRef<(xp: number) => void>(() => {});

  const [lvl, setLvl]               = useState(getLevelProgress(0));
  const [totalXP, setTotalXP]       = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [mounted, setMounted]       = useState(false);
  const [sessionXP, setSessionXP]   = useState(0);
  const [stuckCount, setStuckCount] = useState(0);
  const [lostCount, setLostCount]   = useState(0);
  const [firedToday, setFiredToday] = useState(false);
  const [allDone, setAllDone]       = useState(false);
  const resolvedRef = useRef(0);

  const awardXP = useCallback(async (xp: number) => {
    setSessionXP(p => p + xp);
    setTotalXP(p => { const n = p + xp; setLvl(getLevelProgress(n)); return n; });
    try {
      const data = await loadState();
      const s: Record<string, unknown> = data ?? { tasks: [], totalXP: 0, badges: [], customActivities: [], xpOverrides: {} };
      const now = new Date().toISOString();
      s.tasks = [{
        id: `sticks-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: 'See What Sticks',
        category: 'selfcare' as TaskCategory,
        xp, completed: true, completedAt: now, createdAt: now,
      }, ...((s.tasks as unknown[]) ?? [])];
      s.totalXP = ((s.totalXP as number) ?? 0) + xp;
      await saveState(s);
    } catch { /* ignore */ }
  }, []);

  // Keep a ref so the render loop can call awardXP without dep-array issues
  useEffect(() => { awardXPRef.current = awardXP; }, [awardXP]);

  // Load persisted state
  useEffect(() => {
    try {
      const sk = localStorage.getItem(STICKS_KEY);
      if (sk && JSON.parse(sk).lastFiredDate === getGameDay()) {
        setFiredToday(true);
        setAllDone(true);
        firedRef.current = true;
      }
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  // Init Matter.js
  useEffect(() => {
    if (!mounted) return;
    const engine = Matter.Engine.create({ gravity: { x: 0, y: 0.35 } });
    engineRef.current = engine;

    const floor = Matter.Bodies.rectangle(CW / 2, CH + 25, CW * 2, 50, { isStatic: true, label: 'floor' });
    const lWall = Matter.Bodies.rectangle(-25, CH / 2, 50, CH * 2, { isStatic: true, label: 'lwall' });
    const rWall = Matter.Bodies.rectangle(WALL_X + WALL_W / 2, CH / 2, WALL_W, CH * 2, { isStatic: true, label: 'rwall' });
    const sMidY = (STICKY_TOP + STICKY_BOT) / 2;
    const sticky = Matter.Bodies.rectangle(
      WALL_X + WALL_W / 2, sMidY, WALL_W + 10, STICKY_BOT - STICKY_TOP,
      { isStatic: true, isSensor: true, label: 'sticky' }
    );
    Matter.Composite.add(engine.world, [floor, lWall, rWall, sticky]);

    const handler = (ev: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of ev.pairs) {
        const { bodyA, bodyB } = pair;

        if (bodyA.label === 'sticky' || bodyB.label === 'sticky') {
          const ball = bodyA.label === 'sticky' ? bodyB : bodyA;
          if (ball.label === 'ball' && !handledRef.current.has(ball.id)) {
            handledRef.current.add(ball.id);
            stuckRef.current.add(ball.id);
            Matter.Body.setVelocity(ball, { x: 0, y: 0 });
            Matter.Body.setStatic(ball, true);
            const data = ballDataRef.current.get(ball.id);
            if (data) { setStuckCount(s => s + 1); awardXP(data.xp); }
            resolvedRef.current += 1;
            if (resolvedRef.current >= BALL_CONFIGS.length) setAllDone(true);
          }
        }

        if (bodyA.label === 'floor' || bodyB.label === 'floor') {
          const ball = bodyA.label === 'floor' ? bodyB : bodyA;
          if (ball.label === 'ball' && !handledRef.current.has(ball.id)) {
            handledRef.current.add(ball.id);
            setLostCount(l => l + 1);
            awardXP(1);
            resolvedRef.current += 1;
            if (resolvedRef.current >= BALL_CONFIGS.length) setAllDone(true);
            setTimeout(() => {
              const eng = engineRef.current;
              if (eng) Matter.Composite.remove(eng.world, ball);
            }, 500);
          }
        }
      }
    };

    Matter.Events.on(engine, 'collisionStart', handler);
    return () => {
      Matter.Events.off(engine, 'collisionStart', handler);
      Matter.Engine.clear(engine);
      engineRef.current = null;
    };
  }, [mounted, awardXP]);

  // Render loop
  useEffect(() => {
    if (!mounted) return;
    let rafId = 0;
    const loop = () => {
      const canvas = canvasRef.current;
      const engine = engineRef.current;
      if (canvas && engine) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          Matter.Engine.update(engine, 1000 / 60);

          // Resolve balls that have come to rest without hitting the floor (e.g. stacked on a stuck ball)
          if (firedRef.current) {
            for (const body of Matter.Composite.allBodies(engine.world)) {
              if (body.label !== 'ball' || handledRef.current.has(body.id)) continue;
              const speed = Math.hypot(body.velocity.x, body.velocity.y);
              if (speed < 0.25) {
                const frames = (stallRef.current.get(body.id) ?? 0) + 1;
                stallRef.current.set(body.id, frames);
                if (frames >= 60) {
                  handledRef.current.add(body.id);
                  stallRef.current.delete(body.id);
                  setLostCount(l => l + 1);
                  awardXPRef.current(1);
                  resolvedRef.current += 1;
                  if (resolvedRef.current >= BALL_CONFIGS.length) setAllDone(true);
                  Matter.Composite.remove(engine.world, body);
                }
              } else {
                stallRef.current.set(body.id, 0);
              }
            }
          }

          drawScene(ctx, engine, stuckRef.current, ballDataRef.current, armRef.current, firedRef.current);
        }
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [mounted]);

  const fire = useCallback(() => {
    if (firedRef.current || firedToday) return;
    const engine = engineRef.current;
    if (!engine) return;

    firedRef.current = true;
    setFiredToday(true);
    localStorage.setItem(STICKS_KEY, JSON.stringify({ lastFiredDate: getGameDay() }));

    // Arm swing: -30° → +60° → back
    let a = -30;
    const fwd = () => {
      a = Math.min(a + 9, 60);
      armRef.current = a;
      if (a < 60) requestAnimationFrame(fwd);
      else setTimeout(() => {
        const bk = () => { a = Math.max(a - 5, -30); armRef.current = a; if (a > -30) requestAnimationFrame(bk); };
        requestAnimationFrame(bk);
      }, 150);
    };
    requestAnimationFrame(fwd);

    // Launch all balls from above the catapult cup
    const bx = CW * 0.1;  // 48
    const by = CH - 10;   // 290
    BALL_CONFIGS.forEach((cfg, i) => {
      const angleRad = (cfg.angleDeg + (Math.random() - 0.5) * 5) * (Math.PI / 180);
      const speed    = cfg.speed + (Math.random() - 0.5) * 1.5;
      const ball = Matter.Bodies.circle(bx + 12 + i * 3, by - 55 - i * 5, cfg.r, {
        label: 'ball', restitution: 0.3, friction: 0.05, frictionAir: 0.005,
      });
      ballDataRef.current.set(ball.id, { xp: cfg.xp, color: cfg.color, r: cfg.r });
      Matter.Composite.add(engine.world, ball);
      Matter.Body.setVelocity(ball, {
        x:  Math.cos(angleRad) * speed,
        y:  Math.sin(angleRad) * speed,
      });
    });
  }, [firedToday]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); fire(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fire]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />

      <main className="max-w-lg mx-auto px-4 py-8">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-[#97887A] hover:text-[#2C2724] transition-colors mb-6">
          ← Back to Games
        </Link>

        <div className="text-center mb-5">
          <h1 className="font-fredoka font-bold text-[24px] text-[#2C2724] mb-1">🎲 See What Sticks</h1>
          <p className="text-[#97887A] text-sm">
            Hit the <span className="text-[#16A34A] font-semibold">green patch</span> to stick · each ball shows its XP · floor balls are 1 XP · one shot per day
          </p>
        </div>

        <div className="relative w-full rounded-2xl overflow-hidden mb-4" style={{ border: '2px solid #F1E2CF' }}>
          <canvas ref={canvasRef} width={CW} height={CH} className="block w-full" />
          {!firedToday && (
            <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
              <span className="text-[#6f6155] text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: 'rgba(255,246,236,0.9)' }}>
                Press <kbd className="font-mono bg-[#F2E8DB] text-[#2C2724] px-1.5 py-0.5 rounded text-[10px]">Space</kbd> or tap below
              </span>
            </div>
          )}
        </div>

        {firedToday ? (
          <div className="w-full py-3 rounded-xl text-[#7C6F63] text-sm font-semibold text-center mb-5" style={{ background: '#F2E8DB', border: '2px solid #EFE0CC' }}>
            {allDone ? '✓ Done for today · come back tomorrow' : 'Balls in flight…'}
          </div>
        ) : (
          <button
            onClick={fire}
            className="w-full py-3 rounded-xl text-white font-fredoka font-bold text-base transition-colors mb-5"
            style={{ background: '#16A34A', boxShadow: '0 3px 0 #0F7A37' }}
          >
            🪃 Fire!
          </button>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center" style={{ border: '2px solid #F1E2CF' }}>
            <div className="font-fredoka font-black text-xl text-[#F5A300]">{sessionXP}</div>
            <div className="text-[#A99C8D] text-xs mt-0.5">XP earned</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ border: '2px solid #B0EFC8' }}>
            <div className="font-fredoka font-black text-xl text-[#16A34A]">{stuckCount}</div>
            <div className="text-[#A99C8D] text-xs mt-0.5">stuck</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center" style={{ border: '2px solid #F1E2CF' }}>
            <div className="font-fredoka font-black text-xl text-[#97887A]">{lostCount}</div>
            <div className="text-[#A99C8D] text-xs mt-0.5">lost</div>
          </div>
        </div>
      </main>
    </div>
  );
}
