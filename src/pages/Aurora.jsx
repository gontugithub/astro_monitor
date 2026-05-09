import { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { useTranslation } from '../i18n';
import { useCurrentKp, useKpForecast, useAlerts } from '../hooks/useNoaa';
import PageTransition from '../components/PageTransition';

export default function Aurora() {
  const { t } = useTranslation();
  const kpQuery = useCurrentKp();
  const forecastQuery = useKpForecast();
  const alertsQuery = useAlerts({ limit: 8 });

  const probability = useMemo(() => {
    const kp = kpQuery.data?.kp ?? 0;
    return Math.min(Math.round((kp / 9) * 100), 100);
  }, [kpQuery.data]);

  const forecastData = useMemo(() => {
    if (!forecastQuery.data) return [];
    return forecastQuery.data.slice(0, 24).map((p) => ({
      time: p.time?.slice(5, 16),
      kp: p.kp,
    }));
  }, [forecastQuery.data]);

  return (
    <PageTransition>
      <div className="grid grid-cols-12 gap-6">

        {/* Kp Dial */}
        <section className="col-span-12 md:col-span-4 glass-panel rounded-xl p-8 flex flex-col items-center justify-center min-h-[360px]">
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-8">
            {t('aurora.kp_current')}
          </h2>
          <div className="relative w-56 h-56 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full kp-dial opacity-30"></div>
            <div className="absolute inset-[10px] rounded-full border border-white/5 border-dashed"></div>
            <div className="flex flex-col items-center z-10">
              {kpQuery.isLoading ? (
                <div className="skeleton w-24 h-12 rounded-md"></div>
              ) : (
                <>
                  <span className="text-6xl font-bold aurora-gradient-text">
                    {kpQuery.data?.kp?.toFixed(1) ?? '--'}
                  </span>
                  <span className="text-[10px] font-mono text-on-surface-variant tracking-wider uppercase mt-1">
                    Kp Index
                  </span>
                </>
              )}
            </div>
            {kpQuery.data?.kp != null && (
              <div
                className="absolute w-0.5 h-24 bg-white/40 bottom-1/2 origin-bottom"
                style={{ transform: `rotate(${(kpQuery.data.kp / 9) * 360 - 180}deg)` }}
              ></div>
            )}
          </div>

          <div className="w-full mt-8 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-on-surface-variant">{t('aurora.probability')}</span>
              <span className="font-mono text-on-surface">{probability}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-aurora-cyan to-aurora-blue rounded-full transition-all duration-700"
                style={{ width: `${probability}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* Forecast Chart */}
        <section className="col-span-12 md:col-span-8 glass-panel rounded-xl p-8 min-h-[360px]">
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-6">
            {t('aurora.kp_forecast')}
          </h2>
          {forecastQuery.isLoading && <div className="skeleton w-full h-64 rounded-lg" />}
          {forecastData.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2b2a2a" />
                <XAxis dataKey="time" stroke="#c4c7c7" fontSize={10} />
                <YAxis domain={[0, 9]} stroke="#c4c7c7" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#0a0a0a',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine
                  y={5}
                  stroke="#50FFB0"
                  strokeDasharray="3 3"
                  label={{ value: 'Aurora threshold', fill: '#50FFB0', fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="kp"
                  stroke="#50FFB0"
                  strokeWidth={2}
                  dot={{ fill: '#50FFB0', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* Alerts */}
        <section className="col-span-12 glass-panel rounded-xl p-8">
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-error">warning</span>
            {t('aurora.alerts_title')}
          </h2>
          {alertsQuery.isLoading && (
            <div className="space-y-3">
              <div className="skeleton h-16 rounded-lg" />
              <div className="skeleton h-16 rounded-lg" />
            </div>
          )}
          {alertsQuery.data?.length === 0 && (
            <p className="text-on-surface-variant text-sm">{t('dashboard.no_alerts')}</p>
          )}
          {alertsQuery.data?.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {alertsQuery.data.map((alert) => (
                <AlertCard key={alert.id} alert={alert} t={t} />
              ))}
            </div>
          )}
        </section>

      </div>
    </PageTransition>
  );
}

function AlertCard({ alert, t }) {
  const classes = {
    critical: 'border-error bg-error/5 text-error',
    warning: 'border-yellow-500 bg-yellow-500/5 text-yellow-400',
    info: 'border-neon-cyan bg-neon-cyan/5 text-neon-cyan',
  };
  return (
    <div className={`p-4 border-l-2 rounded-r-lg ${classes[alert.severity] || classes.info}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {t(`aurora.severity.${alert.severity}`)}
        </span>
        <span className="font-mono text-[10px] opacity-60 text-on-surface-variant">
          {alert.issued?.slice(0, 16)}
        </span>
      </div>
      <p className="text-sm text-on-surface leading-relaxed">{alert.summary}</p>
    </div>
  );
}