import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useDayContext } from '../../../context/DayContext';
import { useStoreContext } from '../../../context/StoreContext';
import {
  ROUTINE_GROUPS,
  ROUTINE_TO_TODO,
  genId,
  insertAt,
  moveById,
  removeById,
  normalizeRoutines,
  mergeRoutinesIntoTodos,
} from '../../../services/taskUtils';
import styles from './RoutinesTab.module.css';

/**
 * Column definitions for the 3 routine categories.
 */
const COLUMNS = [
  {
    key: 'work',
    label: 'Work Routines',
    loadLabel: 'Load Work Routines',
    target: 'Work To-Dos',
    colorClass: 'work',
    placeholders: ['e.g. Check emails...', 'e.g. Team standup...', 'Add routine...'],
  },
  {
    key: 'health',
    label: 'Health Routines',
    loadLabel: 'Load Health Routines',
    target: 'Health & Fitness',
    colorClass: 'health',
    placeholders: ['e.g. Morning workout...', 'e.g. Take vitamins...', 'Add routine...'],
  },
  {
    key: 'personal',
    label: 'Personal Routines',
    loadLabel: 'Load Personal Routines',
    target: 'Personal Tasks',
    colorClass: 'personal',
    placeholders: ['e.g. Journaling...', 'e.g. Read 30 mins...', 'Add routine...'],
  },
];

/**
 * RoutinesTab - Routine template editor with 3 groups (work, health, personal).
 * Templates are saved globally (StoreContext) and are separate from daily tasks:
 * loading copies missing routines into today's columns (DayContext) without
 * removing or resetting anything already there.
 */
export default function RoutinesTab() {
  const { dayData, dispatch } = useDayContext();
  const { routines, saveRoutines } = useStoreContext();

  const savedRoutines = useMemo(() => normalizeRoutines(routines), [routines]);

  // Local editing state. Each group holds an array of { id, text }.
  const [localRoutines, setLocalRoutines] = useState(() => buildLocal(savedRoutines));
  const [syncedFrom, setSyncedFrom] = useState(routines);

  // If saved routines change (e.g. cloud sync finishes after this tab mounted),
  // refresh the editor unless the user has unsaved edits.
  if (routines !== syncedFrom) {
    const editedSincePrevSync = isDirty(localRoutines, normalizeRoutines(syncedFrom));
    setSyncedFrom(routines);
    if (!editedSincePrevSync) setLocalRoutines(buildLocal(savedRoutines));
  }

  const dirty = isDirty(localRoutines, savedRoutines);

  const [statusMessage, setStatusMessage] = useState('');
  const [focusId, setFocusId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const statusTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(statusTimerRef.current), []);

  // Show a temporary status message
  const showStatus = useCallback((msg) => {
    setStatusMessage(msg);
    clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => setStatusMessage(''), 4000);
  }, []);

  const updateGroup = useCallback((catKey, fn) => {
    setLocalRoutines((prev) => ({ ...prev, [catKey]: fn(prev[catKey]) }));
  }, []);

  // --- Editing ---
  const handleTextChange = useCallback(
    (catKey, id, value) =>
      updateGroup(catKey, (list) => list.map((r) => (r.id === id ? { ...r, text: value } : r))),
    [updateGroup]
  );

  const handleRemove = useCallback(
    (catKey, id) => updateGroup(catKey, (list) => removeById(list, id)),
    [updateGroup]
  );

  const handleInsert = useCallback(
    (catKey, id, offset) => {
      const fresh = { id: genId('r'), text: '' };
      updateGroup(catKey, (list) => {
        const idx = id ? list.findIndex((r) => r.id === id) : -1;
        return insertAt(list, idx === -1 ? list.length : idx + offset, fresh);
      });
      setFocusId(fresh.id);
      setOpenMenuId(null);
    },
    [updateGroup]
  );

  const handleMove = useCallback(
    (catKey, id, delta) => updateGroup(catKey, (list) => moveById(list, id, delta)),
    [updateGroup]
  );

  // --- Save routines ---
  const handleSaveRoutines = useCallback(() => {
    const data = cleanRoutines(localRoutines);
    saveRoutines(data);
    const total = ROUTINE_GROUPS.reduce((n, g) => n + data[g].length, 0);
    showStatus('Routines saved! (' + total + ' tasks total)');
  }, [localRoutines, saveRoutines, showStatus]);

  // --- Load routines into today (one group or all) ---
  const handleLoad = useCallback(
    (groups) => {
      // Load what is on screen. Unsaved edits are saved first so the
      // template and today's tasks stay consistent.
      let source = savedRoutines;
      let prefix = '';
      if (dirty) {
        source = cleanRoutines(localRoutines);
        saveRoutines(source);
        prefix = 'Changes saved. ';
      }

      const total = groups.reduce((n, g) => n + source[g].length, 0);
      if (total === 0) {
        showStatus(
          groups.length === 1
            ? 'No ' + groups[0] + ' routines to load. Add some first!'
            : 'No routines to load. Add some tasks first!'
        );
        return;
      }

      let added = 0;
      let already = 0;
      groups.forEach((g) => {
        const todosKey = ROUTINE_TO_TODO[g];
        const items = source[g];
        if (items.length === 0) return;
        const preview = mergeRoutinesIntoTodos(dayData[todosKey] || [], items);
        added += preview.added;
        already += preview.skipped;
        if (preview.added > 0) {
          dispatch({
            type: 'UPDATE_TODOS',
            category: todosKey,
            updater: (list) => mergeRoutinesIntoTodos(list, items).todos,
          });
        }
      });

      const where =
        groups.length === 1
          ? COLUMNS.find((c) => c.key === groups[0]).target
          : "today's lists";
      let msg = prefix;
      msg += added === 0
        ? 'Everything is already in ' + where + '.'
        : added + ' routine task' + (added === 1 ? '' : 's') + ' added to ' + where + '.';
      if (added > 0 && already > 0) msg += ' ' + already + ' already there.';
      showStatus(msg);
    },
    [savedRoutines, dirty, localRoutines, saveRoutines, dayData, dispatch, showStatus]
  );

  return (
    <div className={styles.routineSection}>
      <div className={styles.routineHeader}>
        <div className={styles.routineSectionTitle}>
          <span className={styles.routineSectionIcon}>{'🔁'}</span>
          {' '}My Routines
        </div>
      </div>

      <p className={styles.routineDescription}>
        Save your regular daily tasks here. Loading adds any missing routines to today&apos;s
        task lists &mdash; existing tasks, checkmarks and notes are kept.
      </p>

      <div className={styles.routineGrid}>
        {COLUMNS.map((col) => {
          const list = localRoutines[col.key];
          return (
            <div key={col.key} className={styles.routineCol}>
              <div className={`${styles.routineColTitle} ${styles[col.colorClass] || ''}`}>
                {col.label}
              </div>
              <div>
                {list.map((item, i) => (
                  <RoutineRow
                    key={item.id}
                    item={item}
                    placeholder={col.placeholders[i] || 'Add routine...'}
                    autoFocus={item.id === focusId}
                    menuOpen={openMenuId === item.id}
                    canMoveUp={i > 0}
                    canMoveDown={i < list.length - 1}
                    onToggleMenu={() => setOpenMenuId((cur) => (cur === item.id ? null : item.id))}
                    onTextChange={(v) => handleTextChange(col.key, item.id, v)}
                    onRemove={() => handleRemove(col.key, item.id)}
                    onInsertAbove={() => handleInsert(col.key, item.id, 0)}
                    onInsertBelow={() => handleInsert(col.key, item.id, 1)}
                    onMoveUp={() => handleMove(col.key, item.id, -1)}
                    onMoveDown={() => handleMove(col.key, item.id, 1)}
                  />
                ))}
              </div>
              <button
                type="button"
                className={styles.addBtn}
                onClick={() => handleInsert(col.key, null, 0)}
              >
                + Add routine
              </button>
              <button
                type="button"
                className={`${styles.colLoadBtn} ${styles[col.colorClass] || ''}`}
                onClick={() => handleLoad([col.key])}
                title={'Add missing ' + col.label.toLowerCase() + ' to ' + col.target}
              >
                {'↳'} {col.loadLabel}
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.routineActions}>
        <button
          type="button"
          className={styles.routineBtnSave}
          onClick={handleSaveRoutines}
        >
          Save routines{dirty ? ' •' : ''}
        </button>
        <button
          type="button"
          className={styles.routineBtnLoad}
          onClick={() => handleLoad(ROUTINE_GROUPS)}
        >
          Load all routines into today
        </button>
      </div>

      <div className={styles.routineStatus}>
        {statusMessage || (dirty ? 'You have unsaved routine changes.' : '')}
      </div>
    </div>
  );
}

function RoutineRow({
  item,
  placeholder,
  autoFocus,
  menuOpen,
  canMoveUp,
  canMoveDown,
  onToggleMenu,
  onTextChange,
  onRemove,
  onInsertAbove,
  onInsertBelow,
  onMoveUp,
  onMoveDown,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  return (
    <div className={styles.routineRow}>
      <div className={styles.routineTask}>
        <input
          ref={inputRef}
          type="text"
          className={styles.routineTaskInput}
          placeholder={placeholder}
          value={item.text}
          onChange={(e) => onTextChange(e.target.value)}
        />
        <button
          type="button"
          className={`${styles.routineMenuBtn} ${menuOpen ? styles.routineMenuBtnOpen : ''}`}
          onClick={onToggleMenu}
          aria-label="Routine actions"
          aria-expanded={menuOpen}
          title="Insert or move"
        >
          {'⋯'}
        </button>
        <button
          type="button"
          className={styles.routineRemove}
          onClick={onRemove}
          aria-label="Remove routine"
        >
          {'×'}
        </button>
      </div>
      {menuOpen && (
        <div className={styles.routineActionStrip}>
          <button type="button" className={styles.routineActionBtn} onClick={onInsertAbove}>
            + Above
          </button>
          <button type="button" className={styles.routineActionBtn} onClick={onInsertBelow}>
            + Below
          </button>
          <button
            type="button"
            className={styles.routineActionBtn}
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            {'↑'} Up
          </button>
          <button
            type="button"
            className={styles.routineActionBtn}
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            {'↓'} Down
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the editor list from saved routines. Empty groups get 3 blank slots
 * (matching the original default).
 */
function buildLocal(saved) {
  const out = {};
  COLUMNS.forEach((col) => {
    const items = saved[col.key] || [];
    out[col.key] = items.length
      ? items.map((r) => ({ id: r.id, text: r.text }))
      : col.placeholders.map(() => ({ id: genId('r'), text: '' }));
  });
  return out;
}

/** Drop blank rows and trim names; keep ids and order. */
function cleanRoutines(local) {
  const out = {};
  ROUTINE_GROUPS.forEach((g) => {
    out[g] = (local[g] || [])
      .map((r) => ({ id: r.id, text: (r.text || '').trim() }))
      .filter((r) => r.text);
  });
  return out;
}

function isDirty(local, saved) {
  const a = cleanRoutines(local);
  return ROUTINE_GROUPS.some((g) => {
    const b = saved[g] || [];
    return (
      a[g].length !== b.length ||
      a[g].some((r, i) => r.id !== b[i].id || r.text !== b[i].text.trim())
    );
  });
}
