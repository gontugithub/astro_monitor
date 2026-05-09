import { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell,
} from 'recharts';
import { useTranslation } from '../i18n';
import { useCurrentKp, useKpForecast, useAlerts, useKpHistory } from '../hooks/useNoaa';
import PageTransition from '../components/PageTransition';

export default function Aurora() {
  const { t } = useTranslation();
  const kpQuery = useCurrentKp();
  const forecastQuery = useKpForecast();
  const alertsQuery = useAlerts({ limit: 8 });
  const historyQuery = useKpHistory();

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

          {/* Histórico últimas 24h */}
        <section className="col-span-12 glass-panel rounded-xl p-8">
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-aurora text-base">history</span>
            Kp History — Last 24h
          </h2>
          {historyQuery.isLoading && <div className="skeleton w-full h-40 rounded-lg" />}
          {historyQuery.data && (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={historyQuery.data.slice(-24)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2b2a2a" />
                <XAxis
                  dataKey="time"
                  stroke="#c4c7c7"
                  fontSize={9}
                  tickFormatter={(v) => v?.slice(11, 16)}
                />
                <YAxis domain={[0, 9]} stroke="#c4c7c7" fontSize={10} width={20} />
                <Tooltip
                  contentStyle={{
                    background: '#0a0a0a',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                  }}
                  labelFormatter={(v) => v?.slice(0, 16)}
                  formatter={(v) => [`Kp ${v?.toFixed(1)}`, '']}
                />
                <ReferenceLine y={5} stroke="#50FFB0" strokeDasharray="3 3" />
                <Bar dataKey="kp" radius={[3, 3, 0, 0]}>
                  {historyQuery.data.slice(-24).map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.kp >= 7 ? '#ff4444' :
                        entry.kp >= 5 ? '#50FFB0' :
                        entry.kp >= 3 ? '#4facfe' :
                        '#444748'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-6 mt-4 text-[10px] font-mono">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#ff4444] inline-block"></span>Severe (≥7)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-aurora inline-block"></span>Aurora visible (≥5)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-aurora-blue inline-block"></span>Active (≥3)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-outline-variant inline-block"></span>Quiet</span>
          </div>
        </section>

        {/* Top eventos fuertes */}
        <section className="col-span-12 glass-panel rounded-xl p-8">
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-base">bolt</span>
            Strongest Events — Recent Activity
          </h2>
          {historyQuery.data && (() => {
            const strong = historyQuery.data
              .filter((p) => p.kp >= 4)
              .sort((a, b) => b.kp - a.kp)
              .slice(0, 6);

            if (strong.length === 0) return (
              <p className="text-on-surface-variant text-sm">
                🌙 No significant activity recorded in the last 24h. Quiet geomagnetic field.
              </p>
            );

            return (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {strong.map((e, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${
                    e.kp >= 7 ? 'border-error/40 bg-error/5' :
                    e.kp >= 5 ? 'border-aurora/40 bg-aurora/5' :
                    'border-aurora-blue/40 bg-aurora-blue/5'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-2xl font-bold font-mono ${
                        e.kp >= 7 ? 'text-error' :
                        e.kp >= 5 ? 'text-aurora' :
                        'text-aurora-blue'
                      }`}>
                        {e.kp.toFixed(1)}
                      </span>
                      <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        e.kp >= 7 ? 'bg-error/20 text-error' :
                        e.kp >= 5 ? 'bg-aurora/20 text-aurora' :
                        'bg-aurora-blue/20 text-aurora-blue'
                      }`}>
                        {e.kp >= 7 ? 'SEVERE' : e.kp >= 5 ? 'AURORA' : 'ACTIVE'}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-on-surface-variant">
                      {e.time?.slice(0, 16)}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      {e.kp >= 7 ? '🔴 Visible at low latitudes' :
                       e.kp >= 5 ? '🟢 Visible at mid-latitudes' :
                       '🔵 Visible at high latitudes'}
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
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