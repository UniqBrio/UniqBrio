import { useEffect, useState, useRef } from 'react';

interface UseCounterAnimationProps {
  targetValue: number | null;
  duration?: number; // in milliseconds
}

export function useCounterAnimation({ 
  targetValue, 
  duration = 3000 
}: UseCounterAnimationProps): number | null {
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const animationFrameRef = useRef<number>();
  const hasAnimatedRef = useRef<boolean>(false);

  useEffect(() => {
    // If targetValue is null, reset
    if (targetValue === null) {
      setCurrentValue(null);
      hasAnimatedRef.current = false;
      return;
    }

    // Only animate once when we first receive the target value
    if (hasAnimatedRef.current) {
      setCurrentValue(targetValue);
      return;
    }

    hasAnimatedRef.current = true;
    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easing function (easeInOutQuad for smoother start and end)
      const easeInOutQuad = (t: number): number => {
        return t < 0.5 
          ? 2 * t * t 
          : 1 - Math.pow(-2 * t + 2, 2) / 2;
      };

      const easedProgress = easeInOutQuad(progress);
      
      // Use Math.round for smoother increments
      const value = Math.round(
        startValue + (targetValue - startValue) * easedProgress
      );

      setCurrentValue(value);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetValue, duration]);

  return currentValue;
}
