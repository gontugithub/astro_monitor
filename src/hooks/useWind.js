/*
envuelve getWindForecast en React Query con una cache key que incluye la ciudad — si cambias de Madrid a Tokyo, 
hace una nueva petición pero Madrid sigue cacheado. El enabled: !!city?.id evita que se ejecute si no hay ciudad seleccionada.
*/

import { useQuery } from '@tanstack/react-query';
import { getWindForecast } from '../services/openMeteoApi';

export function useWind(city, hours = 48) {
  return useQuery({
    queryKey: ['wind', city?.id, hours],
    queryFn: () => getWindForecast({ lat: city.lat, lon: city.lon, hours }),
    enabled: !!city?.id,
    staleTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}