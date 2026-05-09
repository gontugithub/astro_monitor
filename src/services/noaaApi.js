/*
lama a tres endpoints de NOAA — Kp actual, forecast 72h y alertas activas. 
NOAA devuelve la primera fila como cabecera (strings), 
por eso hacemos raw.slice(1) para saltarla y trabajar solo con los datos reales.
*/

const PLANETARY_K = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';
const K_FORECAST = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json';
const ALERTS = 'https://services.swpc.noaa.gov/products/alerts.json';
const KP_1HOUR = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';

export async function getKpHistory() {
  const res = await fetch(KP_1HOUR);
  if (!res.ok) throw new Error(`NOAA Kp history ${res.status}`);
  const raw = await res.json();
  if (!Array.isArray(raw) || raw.length < 2) throw new Error('formato inesperado');

  return raw.slice(1).map((row) => ({
    time: row[0],
    kp: parseFloat(row[1]),
  })).filter((p) => !isNaN(p.kp));
}

export async function getCurrentKp() {
  const res = await fetch(PLANETARY_K);
  if (!res.ok) throw new Error(`NOAA Kp ${res.status}`);
  const raw = await res.json();
  if (!Array.isArray(raw) || raw.length < 2) throw new Error('NOAA Kp: formato inesperado');
  const last = raw[raw.length - 1];
  return {
    time: last[0],
    kp: parseFloat(last[1]),
    aRunning: parseFloat(last[2]),
    stationCount: parseInt(last[3], 10),
  };
}

export async function getKpForecast() {
  const res = await fetch(K_FORECAST);
  if (!res.ok) throw new Error(`NOAA Kp forecast ${res.status}`);
  const raw = await res.json();
  if (!Array.isArray(raw) || raw.length < 2) throw new Error('NOAA forecast: formato inesperado');
  return raw.slice(1).map((row) => ({
    time: row[0],
    kp: parseFloat(row[1]),
    observed: row[2] === 'observed',
  }));
}

export async function getAlerts({ limit = 10 } = {}) {
  const res = await fetch(ALERTS);
  if (!res.ok) throw new Error(`NOAA alerts ${res.status}`);
  const raw = await res.json();
  return raw
    .sort((a, b) => new Date(b.issue_datetime) - new Date(a.issue_datetime))
    .slice(0, limit)
    .map((a) => ({
      id: a.product_id,
      issued: a.issue_datetime,
      summary: extractAlertSummary(a.message),
      severity: classifySeverity(a.message),
      raw: a.message,
    }));
}

function classifySeverity(message = '') {
  const m = message.toUpperCase();
  if (m.includes('SEVERE') || m.includes('EXTREME') || m.includes('G4') || m.includes('G5')) return 'critical';
  if (m.includes('STRONG') || m.includes('G3')) return 'warning';
  return 'info';
}

function extractAlertSummary(message = '') {
  const lines = message.split('\n').map((l) => l.trim()).filter(Boolean);
  const titleLine = lines.find((l) => l.includes('Code:') || l.includes('ALERT:') || l.includes('WATCH:'));
  if (titleLine) return titleLine;
  return lines.slice(0, 2).join(' ');
}