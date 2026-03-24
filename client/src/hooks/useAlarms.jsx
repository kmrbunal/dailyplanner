import { useState, useRef, useCallback, useEffect, createContext, useContext } from 'react';

/**
 * Custom hook for managing task alarms with audio notifications.
 *
 * @returns {{
 *   setAlarm: (taskText: string, time: string, itemId: string) => boolean,
 *   snoozeAlarm: () => void,
 *   dismissAlarm: () => void,
 *   clearAlarm: (itemId: string) => void,
 *   alarmState: { taskText: string, time: string, itemId: string } | null
 * }}
 */
export default function useAlarms() {
  // Currently firing alarm (shown in the overlay)
  const [alarmState, setAlarmState] = useState(null);

  // Active scheduled alarms: [{ timerId, itemId, taskText, time }]
  const activeAlarmsRef = useRef([]);

  // Audio context refs for the repeating beep
  const audioCtxRef = useRef(null);
  const beepIntervalRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Audio helpers
  // ---------------------------------------------------------------------------

  /**
   * Play a two-tone beep using the Web Audio API and repeat it every 3 seconds.
   */
  const startAlarmSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      function beep() {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.25;
        osc.start();
        osc.stop(ctx.currentTime + 0.15);

        setTimeout(() => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 1100;
          gain2.gain.value = 0.25;
          osc2.start();
          osc2.stop(ctx.currentTime + 0.15);
        }, 200);
      }

      beep();
      beepIntervalRef.current = setInterval(beep, 3000);
    } catch (_) {
      // Web Audio not available — silently continue
    }
  }, []);

  /**
   * Stop the repeating beep and close the audio context.
   */
  const stopAlarmSound = useCallback(() => {
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (_) {
        // ignore
      }
      audioCtxRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Fire alarm
  // ---------------------------------------------------------------------------

  /**
   * Internal: fire an alarm — show overlay, play sound, send browser notification.
   */
  const fireAlarm = useCallback(
    (taskText, time, itemId) => {
      setAlarmState({ taskText, time, itemId });

      // Browser notification
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification('Daily Planner Reminder', { body: taskText });
        } catch (_) {
          // some environments block Notification constructor
        }
      }

      startAlarmSound();
    },
    [startAlarmSound]
  );

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Schedule a new alarm.
   *
   * @param {string} taskText - The task description to show when alarm fires
   * @param {string} time - Time in "HH:MM" 24-hour format
   * @param {string} itemId - A unique identifier for the todo item (used for clearing)
   * @returns {boolean} True if the alarm was scheduled, false if the time has passed
   */
  const setAlarm = useCallback(
    (taskText, time, itemId) => {
      if (!time) return false;

      const [hours, mins] = time.split(':').map(Number);
      const now = new Date();
      const alarmDate = new Date();
      alarmDate.setHours(hours, mins, 0, 0);

      const ms = alarmDate.getTime() - now.getTime();
      if (ms <= 0) {
        // Time has already passed today
        return false;
      }

      const timerId = setTimeout(() => {
        fireAlarm(taskText, time, itemId);
        // Remove from active list after firing
        activeAlarmsRef.current = activeAlarmsRef.current.filter(
          (a) => a.timerId !== timerId
        );
      }, ms);

      // Store in active alarms
      activeAlarmsRef.current.push({ timerId, itemId, taskText, time });

      // Request notification permission if not yet granted
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'default'
      ) {
        Notification.requestPermission().catch(() => {});
      }

      return true;
    },
    [fireAlarm]
  );

  /**
   * Dismiss the currently firing alarm.
   * Stops the sound and hides the overlay.
   */
  const dismissAlarm = useCallback(() => {
    stopAlarmSound();
    setAlarmState(null);
  }, [stopAlarmSound]);

  /**
   * Snooze the currently firing alarm for 5 minutes.
   * Stops the sound, hides the overlay, then re-fires in 5 min.
   */
  const snoozeAlarm = useCallback(() => {
    stopAlarmSound();
    const current = alarmState;
    setAlarmState(null);

    if (!current) return;

    const SNOOZE_MS = 5 * 60 * 1000;
    const timerId = setTimeout(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      fireAlarm(current.taskText, h + ':' + m, current.itemId);

      // Remove from active list after firing
      activeAlarmsRef.current = activeAlarmsRef.current.filter(
        (a) => a.timerId !== timerId
      );
    }, SNOOZE_MS);

    activeAlarmsRef.current.push({
      timerId,
      itemId: current.itemId,
      taskText: current.taskText,
      time: current.time,
    });
  }, [alarmState, stopAlarmSound, fireAlarm]);

  /**
   * Clear a scheduled alarm for a specific item (before it fires).
   *
   * @param {string} itemId - The unique identifier of the todo item
   */
  const clearAlarm = useCallback((itemId) => {
    const idx = activeAlarmsRef.current.findIndex((a) => a.itemId === itemId);
    if (idx >= 0) {
      clearTimeout(activeAlarmsRef.current[idx].timerId);
      activeAlarmsRef.current.splice(idx, 1);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Cleanup all timers on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      activeAlarmsRef.current.forEach((a) => clearTimeout(a.timerId));
      activeAlarmsRef.current = [];
      stopAlarmSound();
    };
  }, [stopAlarmSound]);

  return {
    setAlarm,
    snoozeAlarm,
    dismissAlarm,
    clearAlarm,
    alarmState,
  };
}

// Context wrapper so any component can access alarms
const AlarmContext = createContext(null);

export function AlarmProvider({ children }) {
  const alarms = useAlarms();
  return <AlarmContext.Provider value={alarms}>{children}</AlarmContext.Provider>;
}

export function useAlarmContext() {
  const ctx = useContext(AlarmContext);
  if (!ctx) throw new Error('useAlarmContext must be used within AlarmProvider');
  return ctx;
}
