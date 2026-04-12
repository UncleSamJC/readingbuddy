import { useEffect, useRef, useState } from "react";

const THRESHOLD = 80; // px to pull before triggering refresh

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || startYRef.current === null || isRefreshing) return;
      if (window.scrollY > 0) {
        isPullingRef.current = false;
        setPullDistance(0);
        return;
      }
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0) {
        // Dampen the pull so it feels springy
        setPullDistance(Math.min(delta * 0.4, THRESHOLD));
      }
    };

    const onTouchEnd = async () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;
      startYRef.current = null;

      if (pullDistance >= THRESHOLD * 0.4 && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(0);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      } else {
        setPullDistance(0);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh]);

  return { pullDistance, isRefreshing };
}
