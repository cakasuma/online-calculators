import { useEffect, useState } from "react";

/**
 * Returns a callback ref and a boolean `inView` that flips true once the
 * element enters the viewport. Uses a callback ref so the observer
 * re-initializes whenever the DOM node becomes available or `threshold`
 * changes — fixes the silent no-op when the element is conditionally rendered
 * and not yet attached on the first effect pass. Disconnects after the first
 * trigger so the animation only fires on entrance, not re-entrance.
 */
export function useInView(threshold = 0.12) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [node, threshold]);

  return { ref: setNode, inView };
}
