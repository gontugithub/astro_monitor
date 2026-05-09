/* construye la URL con los parámetros correctos y llama a Open-Meteo para obtener viento horario de cualquier coordenada. 
Normaliza la respuesta en un array de puntos {time, speed, direction, gusts} fácil de usar en los charts. */

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export async function getWindForecast({ lat, lon, hours = 48 }) {
  const url = new URL(BASE_URL);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('hourly', 'wind_speed_10m,wind_direction_10m,wind_gusts_10m');
  url.searchParams.set('forecast_days', String(Math.ceil(hours / 24)));
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('wind_speed_unit', 'kmh');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = await res.json();

  const points = (data.hourly?.time || []).slice(0, hours).map((time, i) => ({
    time,
    speed: data.hourly.wind_speed_10m[i],
    direction: data.hourly.wind_direction_10m[i],
    gusts: data.hourly.wind_gusts_10m[i],
  }));

  return {
    coords: { lat, lon },
    timezone: data.timezone,
    points,
    current: points[0] || null,
  };
}

export const CITIES = [
  { id: 'madrid', name: 'Madrid', lat: 40.4168, lon: -3.7038 },
  { id: 'reykjavik', name: 'Reykjavík', lat: 64.1466, lon: -21.9426 },
  { id: 'newyork', name: 'New York', lat: 40.7128, lon: -74.006 },
  { id: 'tokyo', name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { id: 'sydney', name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { id: 'capetown', name: 'Cape Town', lat: -33.9249, lon: 18.4241 },
  { id: 'tromso', name: 'Tromsø', lat: 69.6492, lon: 18.9553 },
  { id: 'ushuaia', name: 'Ushuaia', lat: -54.8019, lon: -68.303 },
  { id: 'sanfrancisco', name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
  { id: 'mumbai', name: 'Mumbai', lat: 19.076, lon: 72.8777 },
];