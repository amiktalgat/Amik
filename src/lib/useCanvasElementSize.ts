import { useEffect, useState, type RefObject } from 'react';

type ElementSize = {
  width: number;
  height: number;
};

export function useCanvasElementSize(ref: RefObject<HTMLElement>, initialSize: ElementSize) {
  const [size, setSize] = useState(initialSize);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: Math.max(320, Math.floor(entry.contentRect.width)),
        height: Math.max(320, Math.floor(entry.contentRect.height)),
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
