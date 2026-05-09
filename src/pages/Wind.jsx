import { useState, useMemo, useRef } from 'react';
import Globe from 'react-globe.gl';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { useTranslation } from '../i18n';
import { useWind } from '../hooks/useWind';
import { useWindSonification } from '../hooks/useWindSonification';
import { CITIES } from '../services/openMeteoApi';
import PageTransition from '../components/PageTransition';

/*
muestra el globo 3D con marcadores en las 10 ciudades — el seleccionado aparece en cyan y más grande, los demás en gris. 
Al hacer click en un marcador cambia la ciudad activa, actualiza los datos de viento y el chart de las próximas 24h.
*/

// @ai-assisted

export default function Wind() {
  const { t } = useTranslation();
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const globeRef = useRef(null);

  function flyToCity(city) {
    setSelectedCity(city);
    globeRef.current?.pointOfView(
      { lat: city.lat, lng: city.lon, altitude: 1.5 },
      1000
    );
  }

  const { data, isLoading, isError } = useWind(selectedCity, 48);
  const currentSpeed = data?.current?.speed ?? 0;
  const { isPlaying, toggle } = useWindSonification(currentSpeed);

  const globePoints = useMemo(() => CITIES.map((c) => ({
    ...c,
    size: c.id === selectedCity.id ? 1.5 : 0.6,
    color: c.id === selectedCity.id ? '#00f5ff' : '#c9c6c5',
  })), [selectedCity]);

  const chartData = useMemo(() => {
    if (!data?.points) return [];
    return data.points.slice(0, 24).map((p) => ({
      hour: new Date(p.time).getHours() + 'h',
      speed: p.speed,
      gusts: p.gusts,
    }));
  }, [data]);

  return (
    <PageTransition>
      <div className="grid grid-cols-12 gap-6 min-h-[calc(100vh-7rem)]">

        {/* Globo 3D */}
        <section className="col-span-12 lg:col-span-8 glass-panel rounded-xl relative overflow-hidden inner-glow min-h-[500px]">

          {/* Header del panel */}
          <div className="absolute top-6 left-6 z-20 flex flex-col gap-2 pointer-events-none">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest">
              Atmospheric Wind Field
            </span>
            {isLoading && <div className="skeleton w-32 h-10 rounded-md"></div>}
            {data?.current && (
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold neon-text-cyan">
                  {data.current.speed.toFixed(1)}
                </span>
                <span className="text-base text-on-surface-variant pb-1">{t('wind.unit_kmh')}</span>
              </div>
            )}
            <span className="text-xs font-mono text-on-surface-variant">
              📍 {selectedCity.name}
            </span>
          </div>

          {/* Globo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Globe
              ref={globeRef}
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
              backgroundColor="rgba(0,0,0,0)"
              pointsData={globePoints}
              pointLat="lat"
              pointLng="lon"
              pointAltitude={0.02}
              pointRadius="size"
              pointColor="color"
              pointLabel={(p) =>
                `<div style="background:#0a0a0a;color:#e5e2e1;padding:6px 10px;border-radius:6px;font-family:JetBrains Mono;font-size:11px;border:1px solid #444">${p.name}</div>`
              }
              onPointClick={(p) => flyToCity(p)}
              atmosphereColor="#00f5ff"
              atmosphereAltitude={0.15}
            />
          </div>

          {/* Bottom — métricas + sonificación */}
          <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end gap-4">
            <div className="glass-panel-dense p-4 rounded-lg flex gap-6">
              <div>
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">
                  {t('wind.direction')}
                </p>
                <p className="text-2xl font-mono mt-1">
                  {data?.current?.direction?.toFixed(0) ?? '--'}°
                </p>
              </div>
              <div className="w-px bg-white/10"></div>
              <div>
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">
                  {t('wind.gusts')}
                </p>
                <p className="text-2xl font-mono mt-1">
                  {data?.current?.gusts?.toFixed(1) ?? '--'}
                  <span className="text-xs ml-1 opacity-50">{t('wind.unit_kmh')}</span>
                </p>
              </div>
            </div>

            <button
              onClick={toggle}
              disabled={isLoading || isError}
              className={`px-5 py-3 rounded-full glass-panel-dense flex items-center gap-2 transition-all ${
                isPlaying
                  ? 'bg-neon-cyan/20 text-neon-cyan'
                  : 'hover:bg-white/10 text-on-surface'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="material-symbols-outlined">
                {isPlaying ? 'stop_circle' : 'graphic_eq'}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest">
                {isPlaying ? t('wind.sound_stop') : t('wind.sound_play')}
              </span>
            </button>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6">

          {/* Selector de ciudades */}
          <section className="glass-panel rounded-xl p-6">
            <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4">
              {t('wind.select_city')}
            </h2>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {CITIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => flyToCity(c)}
                  className={`p-2 rounded-lg text-left text-xs font-mono transition-all ${
                    selectedCity.id === c.id
                      ? 'bg-neon-cyan/10 border border-neon-cyan/40 text-neon-cyan'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </section>

          {/* Chart */}
          <section className="glass-panel rounded-xl p-6 flex-1 min-h-[280px]">
            <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4">
              {t('wind.next_hours', { hours: 24 })}
            </h2>
            {isLoading && <div className="skeleton w-full h-40 rounded-lg" />}
            {isError && <p className="text-error text-sm">{t('status.error')}</p>}
            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#00f5ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2b2a2a" />
                  <XAxis dataKey="hour" stroke="#c4c7c7" fontSize={11} />
                  <YAxis stroke="#c4c7c7" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: '#0a0a0a',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="speed"
                    stroke="#00f5ff"
                    strokeWidth={2}
                    fill="url(#windGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </section>

        </aside>
      </div>
    </PageTransition>
  );
}