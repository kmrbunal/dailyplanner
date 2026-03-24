import { useEffect, useRef } from 'react';

/**
 * Custom hook that auto-saves data after a debounce delay.
 *
 * @param {*} data - The data to watch for changes
 * @param {Function} saveFn - Async function to call when data changes
 * @param {number} [delay=1500] - Debounce delay in milliseconds
 * @returns {{ suppressSave: () => void, resumeSave: () => void }}
 *   - suppressSave: call before a date switch to prevent saves during transition
 *   - resumeSave: call after the switch is complete to re-enable auto-save
 */
export default function useAutoSave(data, saveFn, delay = 1500) {
  const timerRef = useRef(null);
  const switchingDateRef = useRef(false);
  const isFirstRender = useRef(true);
  const saveFnRef = useRef(saveFn);

  // Keep the save function ref up to date without triggering the effect
  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  useEffect(() => {
    // Skip auto-save on the initial render (data hasn't actually changed yet)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Don't schedule a save while switching dates
    if (switchingDateRef.current) return;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveFnRef.current().catch((err) => {
        console.error('Auto-save failed', err);
      });
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [data, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  /**
   * Suppress auto-saves (e.g. during a date switch).
   * Also cancels any pending save timer.
   */
  function suppressSave() {
    switchingDateRef.current = true;
    clearTimeout(timerRef.current);
  }

  /**
   * Re-enable auto-saves after a date switch.
   */
  function resumeSave() {
    switchingDateRef.current = false;
  }

  return { suppressSave, resumeSave };
}
