import { useState, useEffect, useRef, useCallback } from 'react';

export function useDebouncedUpdates<T extends Record<string, any>>(
  updateCallback: (updates: Partial<T>) => void,
  delay: number = 1000
) {
  const [pendingUpdates, setPendingUpdates] = useState<Partial<T>>({});
  const pendingUpdatesRef = useRef<Partial<T>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update the ref whenever pendingUpdates changes
  useEffect(() => {
    pendingUpdatesRef.current = pendingUpdates;
  }, [pendingUpdates]);

  const addUpdate = useCallback((field: keyof T, value: any) => {
    setPendingUpdates(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Debounced update effect
  useEffect(() => {
    if (Object.keys(pendingUpdates).length === 0) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      updateCallback(pendingUpdatesRef.current);
      setPendingUpdates({});
      pendingUpdatesRef.current = {};
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [pendingUpdates, updateCallback, delay]);

  return { addUpdate, pendingUpdates };
}