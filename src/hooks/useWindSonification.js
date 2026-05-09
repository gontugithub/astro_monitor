/*
 genera ruido rosa filtrado con Tone.js — cuanto más rápido el viento, más agudo y fuerte suena. 
 El toggle debe llamarse desde un click del usuario porque los navegadores bloquean el audio automático.
*/

// @ai-assisted — Tone.js chain: Noise → Filter → Volume, frequency mapped to wind speed

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';

function mapSpeedToSound(speed) {
  const capped = Math.min(speed, 80);
  const volumeDb = -40 + (capped / 80) * 30;
  const filterFreq = 200 + (capped / 80) * 3800;
  const filterQ = 1 + (capped / 80) * 4;
  return { volumeDb, filterFreq, filterQ };
}

export function useWindSonification(windSpeed) {
  const noiseRef = useRef(null);
  const filterRef = useRef(null);
  const volumeRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const ensureChain = useCallback(() => {
    if (noiseRef.current) return;
    const noise = new Tone.Noise('pink');
    const filter = new Tone.Filter(800, 'lowpass');
    const volume = new Tone.Volume(-30);
    noise.chain(filter, volume, Tone.Destination);
    noiseRef.current = noise;
    filterRef.current = filter;
    volumeRef.current = volume;
  }, []);

  useEffect(() => {
    if (!isPlaying || !filterRef.current) return;
    const { volumeDb, filterFreq, filterQ } = mapSpeedToSound(windSpeed || 0);
    volumeRef.current.volume.rampTo(volumeDb, 0.4);
    filterRef.current.frequency.rampTo(filterFreq, 0.4);
    filterRef.current.Q.rampTo(filterQ, 0.4);
  }, [windSpeed, isPlaying]);

  const toggle = useCallback(async () => {
    await Tone.start();
    ensureChain();
    if (isPlaying) {
      noiseRef.current?.stop();
      setIsPlaying(false);
    } else {
      const { volumeDb, filterFreq, filterQ } = mapSpeedToSound(windSpeed || 0);
      volumeRef.current.volume.value = volumeDb;
      filterRef.current.frequency.value = filterFreq;
      filterRef.current.Q.value = filterQ;
      noiseRef.current.start();
      setIsPlaying(true);
    }
  }, [isPlaying, windSpeed, ensureChain]);

  useEffect(() => {
    return () => {
      try {
        noiseRef.current?.stop();
        noiseRef.current?.dispose();
        filterRef.current?.dispose();
        volumeRef.current?.dispose();
      } catch (_) {}
    };
  }, []);

  return { isPlaying, toggle };
}