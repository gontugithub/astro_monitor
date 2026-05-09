import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useTranslation } from '../i18n';
import { useCurrentKp, useAlerts } from '../hooks/useNoaa';
import { useWind } from '../hooks/useWind';
import { CITIES } from '../services/openMeteoApi';
import PageTransition, { StaggerGrid, StaggerItem } from '../components/PageTransition';

/*
muestra 3 widgets — Kp actual de NOAA con el dial circular, 
velocidad de viento de Madrid con un sparkline, y las últimas alertas de NOAA. 
Cada widget es un link que lleva a su página completa.
*/

export default function Dashboard() {
  const { t, locale } = useTranslation();
  const kpQuery = useCurrentKp();
  const windQuery = useWind(CITIES[0], 24);
  const alertsQuery = useAlerts({ limit: 3 });

  const sparkData = useMemo(() => {
    if (!windQuery.data?.points) return [];
    return windQuery.data.points.slice(0, 24).map((p, i) => ({ i, speed: p.speed }));
  }, [windQuery.data]);

  return (
    <PageTransition>
      <StaggerGrid className="grid grid-cols-12 gap-6">

        {/* Widget Aurora */}
        <StaggerItem className="col-span-12 md:col-span-6">
          <Link
            to={`/${locale}/aurora`}
            className="glass-panel rounded-xl p-8 min-h-[200px] flex items-center gap-8 hover:bg-white/5 transition-all neon-border-glow group block"
          >
            <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
              <div className="absolute inset-0 rounded-full kp-dial opacity-30"></div>
              <div className="flex flex-col items-center z-10">
                {kpQuery.isLoading ? (
                  <div className="skeleton w-16 h-10 rounded-md"></div>
                ) : (
                  <>
                    <span className="text-4xl font-bold aurora-gradient-text">
                      {kpQuery.data?.kp?.toFixed(1) ?? '--'}
                    </span>
                    <span className="text-[9px] font-mono text-on-surface-variant tracking-wider uppercase mt-1">
                      Kp Index
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
                {t('dashboard.aurora_forecast')}
              </h3>
              <p className="text-sm text-on-surface leading-relaxed">
                {kpQuery.data?.kp >= 5
                  ? '🌌 Aurora visible at mid-latitudes'
                  : kpQuery.data?.kp >= 3
                  ? '✨ Aurora possible at high latitudes'
                  : '🌙 Quiet geomagnetic field'}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-primary mt-3 opacity-70 group-hover:opacity-100">
                View details
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </div>
          </Link>
        </StaggerItem>

        {/* Widget Wind */}
        <StaggerItem className="col-span-12 md:col-span-6">
          <Link
            to={`/${locale}/wind`}
            className="glass-panel rounded-xl p-8 min-h-[200px] flex flex-col gap-4 hover:bg-white/5 transition-all neon-border-glow group block"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
                {t('dashboard.atmospheric_wind')}
              </h3>
              <span className="text-[10px] font-mono text-on-surface-variant">{CITIES[0].name}</span>
            </div>
            <div className="flex items-end gap-3">
              {windQuery.isLoading ? (
                <div className="skeleton w-24 h-12 rounded-md"></div>
              ) : (
                <>
                  <span className="text-5xl font-bold neon-text-cyan">
                    {windQuery.data?.current?.speed?.toFixed(1) ?? '--'}
                  </span>
                  <span className="text-sm text-on-surface-variant pb-2">{t('wind.unit_kmh')}</span>
                </>
              )}
            </div>
            {sparkData.length > 0 && (
              <div className="h-16 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData}>
                    <defs>
                      <linearGradient id="dashSpark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#00f5ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="speed" stroke="#00f5ff" strokeWidth={1.5} fill="url(#dashSpark)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-primary opacity-70 group-hover:opacity-100">
              View globe
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </span>
          </Link>
        </StaggerItem>

        {/* Widget Alerts */}
        <StaggerItem className="col-span-12">
          <section className="glass-panel rounded-xl p-6">
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-base">warning</span>
              {t('dashboard.alerts')}
            </h3>
            {alertsQuery.isLoading && <div className="skeleton h-12 rounded-lg" />}
            {alertsQuery.data?.length === 0 && (
              <p className="text-on-surface-variant text-sm">{t('dashboard.no_alerts')}</p>
            )}
            {alertsQuery.data?.length > 0 && (
              <ul className="space-y-2">
                {alertsQuery.data.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg text-sm">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      a.severity === 'critical' ? 'bg-error' :
                      a.severity === 'warning' ? 'bg-yellow-400' : 'bg-neon-cyan'
                    }`}></span>
                    <span className="font-mono text-[10px] text-on-surface-variant flex-shrink-0">
                      {a.issued?.slice(0, 16)}
                    </span>
                    <span className="flex-1 text-on-surface truncate">{a.summary}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </StaggerItem>

      </StaggerGrid>
    </PageTransition>
  );
}