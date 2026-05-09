import { useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { useTranslation } from '../i18n';
import { useCurrentKp, useKpForecast, useAlerts } from '../hooks/useNoaa';
import { useWind } from '../hooks/useWind';
import { CITIES } from '../services/openMeteoApi';
import PageTransition, { StaggerGrid, StaggerItem } from '../components/PageTransition';

// ── Mini espiral de viento (Canvas 2D) ──────────────────────────────
function WindSpiral({ speed = 10, direction = 180 }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const stateRef  = useRef({ particles: [] });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');

    // Velocidad normalizada → fuerza de las partículas
    const force = 0.4 + (Math.min(speed, 80) / 80) * 2.5;
    // Dirección del viento en radianes
    const dirRad = ((direction - 180) * Math.PI) / 180;
    const vx = Math.cos(dirRad) * force;
    const vy = Math.sin(dirRad) * force;

    // Crear partículas
    const COUNT = 180;
    stateRef.current.particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      life: Math.random(),
      speed: 0.4 + Math.random() * 0.8,
      trail: [],
    }));

    // Noise field simplificado (Perlin-like con senos)
    function fieldAngle(x, y, t) {
      const nx = x / W, ny = y / H;
      return (
        Math.sin(nx * 3 + t * 0.4) * Math.cos(ny * 4 - t * 0.3) * Math.PI +
        Math.sin(nx * 7 - t * 0.2) * 0.5 +
        dirRad
      );
    }

    let t = 0;
    const draw = () => {
      t += 0.012;

      // Fade trail
      ctx.fillStyle = 'rgba(5, 5, 15, 0.18)';
      ctx.fillRect(0, 0, W, H);

      stateRef.current.particles.forEach((p) => {
        p.life -= 0.004 + Math.random() * 0.003;

        // Reset partícula cuando muere
        if (p.life <= 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = Math.random() * W;
          p.y = Math.random() * H;
          p.life = 0.6 + Math.random() * 0.4;
          p.trail = [];
          return;
        }

        // Campo vectorial + componente de viento real
        const angle = fieldAngle(p.x, p.y, t);
        const dx = Math.cos(angle) * p.speed + vx * 0.15;
        const dy = Math.sin(angle) * p.speed + vy * 0.15;

        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 12) p.trail.shift();

        p.x += dx;
        p.y += dy;

        // Dibujar trail
        if (p.trail.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        p.trail.forEach((pt) => ctx.lineTo(pt.x, pt.y));

        const alpha = p.life * 0.7;
        const speed_norm = Math.min(speed, 80) / 80;
        // Color: azul cian para viento suave → verde lima para viento fuerte
        const hue = 180 - speed_norm * 40;
        ctx.strokeStyle = `hsla(${hue}, 100%, 65%, ${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Punto brillante al final del trail
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, 85%, ${alpha * 0.8})`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [speed, direction]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-xl"
      style={{ background: 'transparent' }}
    />
  );
}

// ── Mini cúpula estelar (Three.js) ──────────────────────────────────
const MINI_STARS = [
  { ra: 101.287, dec: -16.716 }, { ra: 279.235, dec: 38.784  },
  { ra: 88.793,  dec: 7.407   }, { ra: 213.915, dec: 19.182  },
  { ra: 78.634,  dec: -8.202  }, { ra: 297.696, dec: 8.868   },
  { ra: 310.358, dec: 45.280  }, { ra: 247.352, dec: -26.432 },
  { ra: 201.298, dec: -11.161 }, { ra: 68.980,  dec: 16.509  },
  { ra: 84.053,  dec: -1.202  }, { ra: 85.190,  dec: -1.943  },
  { ra: 83.002,  dec: -0.299  }, { ra: 81.283,  dec: 6.350   },
  { ra: 165.932, dec: 61.751  }, { ra: 206.885, dec: 49.313  },
  { ra: 37.953,  dec: 89.264  }, { ra: 116.329, dec: 28.026  },
  { ra: 113.650, dec: 31.888  }, { ra: 152.093, dec: 11.967  },
  { ra: 186.650, dec: -63.099 }, { ra: 191.930, dec: -59.689 },
  { ra: 187.792, dec: -57.113 }, { ra: 183.786, dec: -58.749 },
  { ra: 24.429,  dec: -57.237 }, { ra: 344.413, dec: -29.622 },
  { ra: 114.825, dec: 5.225   }, { ra: 233.672, dec: 26.715  },
];

function raDecToXYZ(ra, dec, r = 50) {
  const raR = (ra * Math.PI) / 180;
  const decR = (dec * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.cos(decR) * Math.cos(raR),
     r * Math.sin(decR),
     r * Math.cos(decR) * Math.sin(raR)
  );
}

function MiniStellarium() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    const cx = W / 2, cy = H / 2;

    const bgStars = Array.from({ length: 300 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2,
      a: 0.2 + Math.random() * 0.6,
    }));

    const mainStars = [
      { name: 'Betelgeuse', x: 0.38, y: 0.38, r: 3.5 },
      { name: 'Rigel',      x: 0.42, y: 0.62, r: 3.0 },
      { name: 'Bellatrix',  x: 0.48, y: 0.36, r: 2.5 },
      { name: 'Alnilam',    x: 0.44, y: 0.50, r: 2.2 },
      { name: 'Alnitak',    x: 0.46, y: 0.53, r: 2.0 },
      { name: 'Mintaka',    x: 0.42, y: 0.48, r: 2.0 },
      { name: 'Sirius',     x: 0.30, y: 0.70, r: 4.0 },
      { name: 'Vega',       x: 0.72, y: 0.25, r: 3.5 },
      { name: 'Deneb',      x: 0.80, y: 0.20, r: 2.8 },
      { name: 'Altair',     x: 0.68, y: 0.45, r: 2.5 },
      { name: 'Capella',    x: 0.25, y: 0.22, r: 2.8 },
      { name: 'Arcturus',   x: 0.60, y: 0.30, r: 3.0 },
      { name: 'Polaris',    x: 0.85, y: 0.15, r: 2.0 },
      { name: 'Aldebaran',  x: 0.22, y: 0.42, r: 2.5 },
      { name: 'Antares',    x: 0.65, y: 0.68, r: 2.8 },
    ].map((s) => ({ ...s, x: s.x * W, y: s.y * H }));

    const orionLines = [
      ['Betelgeuse', 'Bellatrix'],
      ['Betelgeuse', 'Alnilam'],
      ['Bellatrix',  'Alnilam'],
      ['Alnilam',    'Alnitak'],
      ['Alnilam',    'Mintaka'],
      ['Alnitak',    'Rigel'],
      ['Mintaka',    'Rigel'],
    ];

    const milkyWay = Array.from({ length: 800 }, (_, i) => {
      const t = i / 800;
      const angle = t * Math.PI * 1.2 - 0.3;
      const r = 0.15 + Math.sin(t * Math.PI) * 0.25;
      const spread = (Math.random() - 0.5) * 0.12;
      return {
        x: (0.5 + Math.cos(angle) * (r + spread)) * W,
        y: (0.5 + Math.sin(angle) * (r + spread) * 0.5) * H,
        a: 0.05 + Math.random() * 0.15,
        r: 0.5 + Math.random() * 1,
      };
    });

    let t = 0;
    const draw = () => {
      t += 0.003;
      ctx.clearRect(0, 0, W, H);

      // Fondo
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
      bg.addColorStop(0, 'rgba(15, 10, 40, 1)');
      bg.addColorStop(0.5, 'rgba(8, 8, 25, 1)');
      bg.addColorStop(1, 'rgba(3, 3, 12, 1)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Rotación del cielo
      const rotOffset = t * 1;
      const cosR = Math.cos(rotOffset);
      const sinR = Math.sin(rotOffset);
      const rotate = (x, y) => ({
        x: cx + (x - cx) * cosR - (y - cy) * sinR,
        y: cy + (x - cx) * sinR + (y - cy) * cosR,
      });

      // Vía Láctea
      milkyWay.forEach((p) => {
        const rp = rotate(p.x, p.y);
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120, 140, 255, ${p.a})`;
        ctx.fill();
      });

      // Estrellas de fondo parpadeantes
      bgStars.forEach((s) => {
        const rs = rotate(s.x, s.y);
        const flicker = s.a + Math.sin(t * 2 + s.x) * 0.1;
        ctx.beginPath();
        ctx.arc(rs.x, rs.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${flicker})`;
        ctx.fill();
      });

      // Líneas de Orión
      ctx.strokeStyle = 'rgba(80, 255, 176, 0.5)';
      ctx.lineWidth = 1;
      orionLines.forEach(([a, b]) => {
        const sa = mainStars.find((s) => s.name === a);
        const sb = mainStars.find((s) => s.name === b);
        if (!sa || !sb) return;
        const rsa = rotate(sa.x, sa.y);
        const rsb = rotate(sb.x, sb.y);
        ctx.beginPath();
        ctx.moveTo(rsa.x, rsa.y);
        ctx.lineTo(rsb.x, rsb.y);
        ctx.stroke();
      });

      // Estrellas principales con glow
      mainStars.forEach((s) => {
        const pulse = 1 + Math.sin(t * 1.5 + s.x * 0.01) * 0.15;
        const rs = rotate(s.x, s.y);

        const glow = ctx.createRadialGradient(rs.x, rs.y, 0, rs.x, rs.y, s.r * 4 * pulse);
        glow.addColorStop(0, 'rgba(200, 220, 255, 0.4)');
        glow.addColorStop(1, 'rgba(200, 220, 255, 0)');
        ctx.beginPath();
        ctx.arc(rs.x, rs.y, s.r * 4 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(rs.x, rs.y, s.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fill();
      });

      // Label Orión
      ctx.font = '9px JetBrains Mono';
      ctx.fillStyle = 'rgba(80, 255, 176, 0.6)';
      const rLabel = rotate(mainStars[2].x, mainStars[2].y);
      ctx.fillText('ORIÓN', rLabel.x + 8, rLabel.y - 8);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ background: 'transparent' }}
    />
  );
}

// ── Dashboard principal ──────────────────────────────────────────────
export default function Dashboard() {
  const { t, locale } = useTranslation();
  const kpQuery       = useCurrentKp();
  const forecastQuery = useKpForecast();
  const windQuery     = useWind(CITIES[0], 24);
  const alertsQuery   = useAlerts({ limit: 5 });

  const forecastData = useMemo(() => {
    if (!forecastQuery.data) return [];
    return forecastQuery.data.slice(0, 24).map((p) => ({
      time: p.time?.slice(8, 13),
      kp: p.kp,
    }));
  }, [forecastQuery.data]);

  const probability = useMemo(() => {
    const kp = kpQuery.data?.kp ?? 0;
    return Math.min(Math.round((kp / 9) * 100), 100);
  }, [kpQuery.data]);

  return (
    <PageTransition>
      <div className="space-y-6">

        {/* Fila 1 — 2 cards grandes */}
        <div className="grid grid-cols-2 gap-6">

          {/* Card Wind */}
          <Link to={`/${locale}/wind`} className="group block">
            <div className="glass-panel rounded-2xl overflow-hidden neon-border-glow" style={{ height: '480px' }}>
              {/* Header */}
              <div className="flex justify-between items-start p-6 pb-3">
                <div>
                  <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">
                    Solar Wind Metrics
                  </p>
                  <div className="flex items-end gap-6 mt-2">
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase">Velocidad</span>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-bold neon-text-cyan">
                          {windQuery.data?.current?.speed?.toFixed(0) ?? '--'}
                        </span>
                        <span className="text-xs text-on-surface-variant pb-1">km/s</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase">Dirección</span>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-bold text-on-surface">
                          {windQuery.data?.current?.direction?.toFixed(0) ?? '--'}
                        </span>
                        <span className="text-xs text-on-surface-variant pb-1">°</span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-xl
                  group-hover:text-neon-cyan transition-colors">open_in_full</span>
              </div>

              {/* Espiral canvas */}
              <div className="px-4" style={{ height: '320px' }}>
                <WindSpiral 
                  speed={windQuery.data?.current?.speed ?? 10}
                  direction={windQuery.data?.current?.direction ?? 180}
                />
              </div>

              {/* Footer */}
              <div className="px-6 pb-4 flex items-center justify-between">
                <div className="flex gap-2">
                  {CITIES.slice(0, 5).map((c) => (
                    <span key={c.id} className="px-2 py-1 rounded bg-white/5 text-[9px] font-mono text-on-surface-variant">
                      {c.name.slice(0, 3).toUpperCase()}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-neon-cyan/60 group-hover:text-neon-cyan transition-colors">
                  Open Globe →
                </span>
              </div>
            </div>
          </Link>

          {/* Card Stellarium */}
          <Link to={`/${locale}/stellarium`} className="group block">
            <div className="glass-panel rounded-2xl overflow-hidden neon-border-glow" style={{ height: '480px' }}>
              {/* Header */}
              <div className="flex justify-between items-start p-6 pb-3">
                <div>
                  <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">
                    Mini Stellarium
                  </p>
                  <p className="text-xs font-mono text-aurora mt-1" style={{ textShadow: '0 0 8px rgba(80,255,176,0.4)' }}>
                    RA {new Date().getUTCHours().toString().padStart(2,'0')}h{new Date().getUTCMinutes().toString().padStart(2,'0')}m
                    {' '}/ DEC {(40.42).toFixed(0)}° N
                  </p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-xl
                  group-hover:text-aurora transition-colors">open_in_full</span>
              </div>

              {/* Mini cúpula interactiva */}
              <div style={{ height: '340px' }}>
                <MiniStellarium />
              </div>

              {/* Footer */}
              <div className="px-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-aurora animate-pulse inline-block"></span>
                  <span className="text-[9px] font-mono text-aurora/60">LIVE ENGINE</span>
                </div>
                <span className="text-[10px] font-mono text-aurora/60 group-hover:text-aurora transition-colors">
                  Open Dome →
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Fila 2 — Aurora ancho completo */}
        <Link to={`/${locale}/aurora`} className="group block">
          <div className="glass-panel rounded-2xl p-6 neon-border-glow">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">
                  Aurora Forecast
                </p>
                <p className="text-xs text-on-surface-variant mt-1">Geomagnetic activity · Next 24h</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-xl
                group-hover:text-aurora transition-colors">open_in_full</span>
            </div>

            <div className="grid grid-cols-12 gap-6 items-center">
              {/* Kp dial */}
              <div className="col-span-2 flex flex-col items-center">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full kp-dial opacity-40"></div>
                  <div className="flex flex-col items-center z-10">
                    <span className="text-4xl font-bold aurora-gradient-text">
                      {kpQuery.data?.kp?.toFixed(1) ?? '--'}
                    </span>
                    <span className="text-[9px] font-mono text-on-surface-variant mt-1">Kp INDEX</span>
                  </div>
                </div>
                <div className="w-full mt-3 space-y-1">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-on-surface-variant">Probability</span>
                    <span className="text-aurora font-mono">{probability}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-aurora-cyan to-aurora-blue rounded-full transition-all duration-700"
                      style={{ width: `${probability}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Forecast chart */}
              <div className="col-span-7">
                {forecastData.length > 0 && (
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2b2a2a" />
                      <XAxis dataKey="time" stroke="#c4c7c7" fontSize={9} />
                      <YAxis domain={[0, 9]} stroke="#c4c7c7" fontSize={9} width={20} />
                      <Tooltip contentStyle={{
                        background: '#0a0a0a', border: '1px solid #444',
                        borderRadius: '6px', fontFamily: 'JetBrains Mono', fontSize: '11px',
                      }} />
                      <ReferenceLine y={5} stroke="#50FFB0" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="kp" stroke="#50FFB0" strokeWidth={2}
                        dot={false} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Alertas */}
              <div className="col-span-3 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {alertsQuery.isLoading && <div className="skeleton h-10 rounded" />}
                {alertsQuery.data?.length === 0 && (
                  <p className="text-on-surface-variant text-xs">{t('dashboard.no_alerts')}</p>
                )}
                {alertsQuery.data?.map((a) => (
                  <div key={a.id} className={`p-2 border-l-2 rounded-r text-[10px] font-mono ${
                    a.severity === 'critical' ? 'border-error text-error bg-error/5' :
                    a.severity === 'warning'  ? 'border-yellow-400 text-yellow-400 bg-yellow-400/5' :
                    'border-neon-cyan text-neon-cyan bg-neon-cyan/5'
                  }`}>
                    <div className="font-semibold uppercase">{a.severity}</div>
                    <div className="truncate opacity-70 mt-0.5">{a.summary}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Link>

      </div>
    </PageTransition>
  );
}