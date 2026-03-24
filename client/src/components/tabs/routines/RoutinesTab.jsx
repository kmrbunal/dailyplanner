import { useState, useCallback, useRef } from 'react';
import { useDayContext } from '../../../context/DayContext';
import { useStoreContext } from '../../../context/StoreContext';
import styles from './RoutinesTab.module.css';

/**
 * Column definitions for the 3 routine categories.
 */
const COLUMNS = [
  {
    key: 'work',
    label: 'Work Routines',
    colorClass: 'work',
    placeholders: ['e.g. Check emails...', 'e.g. Team standup...', 'Add routine...'],
  },
  {
    key: 'health',
    label: 'Health Routines',
    colorClass: 'health',
    placeholders: ['e.g. Morning workout...', 'e.g. Take vitamins...', 'Add routine...'],
  },
  {
    key: 'personal',
    label: 'Personal Routines',
    colorClass: 'personal',
    placeholders: ['e.g. Journaling...', 'e.g. Read 30 mins...', 'Add routine...'],
  },
];

/**
 * Mapping from routine category key to the dayData todos key.
 */
const TODO_MAPPING = {
  work: 'workTodos',
  health: 'healthTodos',
  personal: 'personalTodos',
};

/**
 * RoutinesTab - Routine editor with 3 sections (work, health, personal).
 * Each section has editable routine task inputs.
 * Has "Save routines" and "Load routines into today" buttons.
 * Uses StoreContext for persistence and DayContext for loading into today.
 */
export default function RoutinesTab() {
  const { dayData, dispatch } = useDayContext();
  const { routines, saveRoutines } = useStoreContext();

  // Local editing state: initialised from StoreContext routines
  // Each key holds an array of { text } objects
  const [localRoutines, setLocalRoutines] = useState(() => {
    return {
      work: buildLocalList(routines.work, COLUMNS[0].placeholders),
      health: buildLocalList(routines.health, COLUMNS[1].placeholders),
      personal: buildLocalList(routines.personal, COLUMNS[2].placeholders),
    };
  });

  const [statusMessage, setStatusMessage] = useState('');
  const statusTimerRef = useRef(null);

  // Show a temporary status message
  const showStatus = useCallback((msg) => {
    setStatusMessage(msg);
    clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => setStatusMessage(''), 3000);
  }, []);

  // --- Routine text change ---
  const handleTextChange = useCallback((catKey, index, value) => {
    setLocalRoutines((prev) => {
      const list = [...prev[catKey]];
      list[index] = { ...list[index], text: value };
      return { ...prev, [catKey]: list };
    });
  }, []);

  // --- Remove routine ---
  const handleRemove = useCallback((catKey, index) => {
    setLocalRoutines((prev) => {
      const list = prev[catKey].filter((_, i) => i !== index);
      return { ...prev, [catKey]: list };
    });
  }, []);

  // --- Add routine ---
  const handleAdd = useCallback((catKey) => {
    setLocalRoutines((prev) => {
      const list = [...prev[catKey], { text: '' }];
      return { ...prev, [catKey]: list };
    });
  }, []);

  // --- Save routines ---
  const handleSaveRoutines = useCallback(() => {
    const data = {
      work: localRoutines.work.map((r) => r.text.trim()).filter(Boolean),
      health: localRoutines.health.map((r) => r.text.trim()).filter(Boolean),
      personal: localRoutines.personal.map((r) => r.text.trim()).filter(Boolean),
    };
    saveRoutines(data);
    const total = data.work.length + data.health.length + data.personal.length;
    showStatus('Routines saved! (' + total + ' tasks total)');
  }, [localRoutines, saveRoutines, showStatus]);

  // --- Load routines into today ---
  const handleLoadRoutines = useCallback(() => {
    // Gather routine texts: prefer saved store routines, fall back to local inputs
    let source = routines;
    const storeTotal =
      (source.work || []).length + (source.health || []).length + (source.personal || []).length;

    if (storeTotal === 0) {
      // Fall back to local input values
      source = {
        work: localRoutines.work.map((r) => r.text.trim()).filter(Boolean),
        health: localRoutines.health.map((r) => r.text.trim()).filter(Boolean),
        personal: localRoutines.personal.map((r) => r.text.trim()).filter(Boolean),
      };
      const localTotal = source.work.length + source.health.length + source.personal.length;
      if (localTotal === 0) {
        showStatus('No routines to load. Add some tasks first!');
        return;
      }
      // Auto-save them
      saveRoutines(source);
    }

    loadIntoTodos(source, dayData, dispatch);
    const loaded =
      (source.work || []).length + (source.health || []).length + (source.personal || []).length;
    showStatus(loaded + ' routine tasks loaded into today\'s lists!');
  }, [routines, localRoutines, saveRoutines, dayData, dispatch, showStatus]);

  return (
    <div className={styles.routineSection}>
      <div className={styles.routineHeader}>
        <div className={styles.routineSectionTitle}>
          <span className={styles.routineSectionIcon}>{'\uD83D\uDD01'}</span>
          {' '}My Routines
        </div>
      </div>

      <p className={styles.routineDescription}>
        Save your regular daily tasks here. Click &quot;Load routines&quot; to copy them into
        today&apos;s task lists.
      </p>

      <div className={styles.routineGrid}>
        {COLUMNS.map((col) => (
          <div key={col.key}>
            <div className={`${styles.routineColTitle} ${styles[col.colorClass] || ''}`}>
              {col.label}
            </div>
            <div>
              {localRoutines[col.key].map((item, i) => (
                <div key={i} className={styles.routineTask}>
                  <input
                    type="text"
                    className={styles.routineTaskInput}
                    placeholder={col.placeholders[i] || 'Add routine...'}
                    value={item.text}
                    onChange={(e) => handleTextChange(col.key, i, e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.routineRemove}
                    onClick={() => handleRemove(col.key, i)}
                    aria-label="Remove routine"
                  >
                    {'\u00D7'}
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => handleAdd(col.key)}
            >
              + Add routine
            </button>
          </div>
        ))}
      </div>

      <div className={styles.routineActions}>
        <button
          type="button"
          className={styles.routineBtnSave}
          onClick={handleSaveRoutines}
        >
          Save routines
        </button>
        <button
          type="button"
          className={styles.routineBtnLoad}
          onClick={handleLoadRoutines}
        >
          Load routines into today
        </button>
      </div>

      <div className={styles.routineStatus}>{statusMessage}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the initial local routine list from stored text array.
 * If the stored array is empty, pre-populate with placeholder slots.
 */
function buildLocalList(storedTexts, placeholders) {
  if (storedTexts && storedTexts.length > 0) {
    return storedTexts.map((t) => ({ text: t }));
  }
  // Default: 3 empty slots (matching the HTML default)
  return placeholders.map(() => ({ text: '' }));
}

/**
 * Load routine tasks into today's todos.
 * Mirrors the original loadIntoTodos() from the HTML:
 *   - Skip if a todo with the same text already exists
 *   - Fill empty slots first, then append new items
 */
function loadIntoTodos(routinesToLoad, dayData, dispatch) {
  for (const [catKey, todosKey] of Object.entries(TODO_MAPPING)) {
    const tasks = routinesToLoad[catKey] || [];
    const currentTodos = [...(dayData[todosKey] || [])];

    tasks.forEach((text) => {
      // Check if already exists
      const exists = currentTodos.some((t) => t.text === text);
      if (exists) return;

      // Find an empty slot
      const emptyIdx = currentTodos.findIndex((t) => t.text.trim() === '');
      if (emptyIdx !== -1) {
        currentTodos[emptyIdx] = { ...currentTodos[emptyIdx], text };
      } else {
        // Append new item
        currentTodos.push({ text, checked: false, alarm: '' });
      }
    });

    dispatch({ type: 'SET_FIELD', field: todosKey, value: currentTodos });
  }
}
