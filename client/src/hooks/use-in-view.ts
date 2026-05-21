import { useEffect, useRef, useState } from "react";

/**
 * Returns a ref and a boolean `inView` that flips true once the element
 * enters the viewport. Disconnects the observer after the first trigger so
 * the animation only fires once (entrance, not exit/re-entrance).
 */
export function useInView(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, inView };
}
