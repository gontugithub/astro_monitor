import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

/*
cuando el valor del Kp o la velocidad del viento cambia, 
el número no salta directamente sino que cuenta animado desde el valor anterior hasta el nuevo. 
Úsalo sustituyendo cualquier número grande por <AnimatedNumber value={kp} decimals={1} 
*/

export default function AnimatedNumber({
  value,
  decimals = 1,
  duration = 0.8,
  className = '',
}) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => {
    if (latest == null || isNaN(latest)) return '--';
    return latest.toFixed(decimals);
  });

  useEffect(() => {
    if (value == null || isNaN(value)) return;
    const controls = animate(motionValue, value, {
      duration,
      ease: 'easeOut',
    });
    return () => controls.stop();
  }, [value, duration, motionValue]);

  return <motion.span className={className}>{rounded}</motion.span>;
}