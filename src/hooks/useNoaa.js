/*
tres hooks separados para los tres endpoints de NOAA — 
el Kp actual refresca cada 60 segundos automáticamente (refetchInterval),
el forecast cada 5 minutos, y las alertas cada 2 minutos.
*/

import { useQuery } from '@tanstack/react-query';
import { getCurrentKp, getKpForecast, getAlerts } from '../services/noaaApi';

export function useCurrentKp() {
  return useQuery({
    queryKey: ['noaa', 'kp', 'current'],
    queryFn: getCurrentKp,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useKpForecast() {
  return useQuery({
    queryKey: ['noaa', 'kp', 'forecast'],
    queryFn: getKpForecast,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAlerts({ limit = 10 } = {}) {
  return useQuery({
    queryKey: ['noaa', 'alerts', limit],
    queryFn: () => getAlerts({ limit }),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}