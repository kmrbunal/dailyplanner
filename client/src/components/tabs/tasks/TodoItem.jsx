import { useState, useRef, useEffect, useCallback } from 'react';
import { genId, subtaskProgress, insertAt, moveById, removeById } from '../../../services/taskUtils';
import styles from './TasksTab.module.css';

/**
 * Single todo row: checkbox + text input + alarm + details badge + "⋯" actions.
 * The "⋯" button opens a compact action strip under the row (insert, move,
 * details, delete). Details (notes + subtasks) open in a collapsible panel.
 *
 * Props:
 *   todo        - { id, text, checked, alarm, notes?, subtasks?, routineId? }
 *   onChange    - (updates | (todo) => updates) => void
 *   onToggle    - () => void
 *   onInsertAbove, onInsertBelow, onMoveUp, onMoveDown, onMoveTop, onDelete - () => void
 *   canMoveUp, canMoveDown - booleans
 *   autoFocus   - focus the text input on mount (new rows)
 *   placeholder - string
 *   checkClass  - optional extra className for the checkbox (category colour)
 */
export default function TodoItem({
  todo,
  onChange,
  onToggle,
  onInsertAbove,
  onInsertBelow,
  onMoveUp,
  onMoveDown,
  onMoveTop,
  onDelete,
  canMoveUp,
  canMoveDown,
  autoFocus,
  placeholder,
  checkClass,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTime, setPickerTime] = useState(todo.alarm || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [focusSubId, setFocusSubId] = useState(null);
  const pickerRef = useRef(null);
  const textRef = useRef(null);

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;

    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [pickerOpen]);

  // Sync local picker time when todo.alarm changes externally
  useEffect(() => {
    setPickerTime(todo.alarm || '');
  }, [todo.alarm]);

  // Focus newly inserted rows
  useEffect(() => {
    if (autoFocus && textRef.current) textRef.current.focus();
  }, [autoFocus]);

  const handleSetAlarm = useCallback(() => {
    if (!pickerTime) return;
    onChange({ alarm: pickerTime });
    setPickerOpen(false);
  }, [pickerTime, onChange]);

  const handleClearAlarm = useCallback(() => {
    onChange({ alarm: '' });
    setPickerTime('');
    setPickerOpen(false);
  }, [onChange]);

  const handleTogglePicker = useCallback(() => {
    // Request notification permission on first alarm interaction
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setPickerOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setConfirmDelete(false);
  }, []);

  const runAndClose = (fn) => () => {
    fn();
    closeMenu();
  };

  // --- Subtasks (stored on the task itself, so they follow renames/reorders) ---
  const updateSubtasks = useCallback(
    (fn) => onChange((t) => ({ subtasks: fn(t.subtasks || []) })),
    [onChange]
  );

  const addSubtask = useCallback(
    (index) => {
      const sub = { id: genId('s'), text: '', checked: false };
      updateSubtasks((list) => insertAt(list, index ?? list.length, sub));
      setFocusSubId(sub.id);
    },
    [updateSubtasks]
  );

  const hasAlarm = !!todo.alarm;
  const subtasks = todo.subtasks || [];
  const progress = subtaskProgress(todo);
  const hasNotes = !!(todo.notes || '').trim();
  const hasDetails = progress.total > 0 || hasNotes;
  const subtaskCount = progress.total;

  return (
    <div className={styles.todoRow}>
      <div className={styles.todoItem}>
        <input
          type="checkbox"
          className={`${styles.priorityCheck} ${checkClass || ''}`}
          checked={todo.checked}
          onChange={onToggle}
          aria-label="Mark task complete"
        />
        <input
          ref={textRef}
          type="text"
          className={`${styles.todoTextInput} ${todo.checked ? styles.checked : ''}`}
          placeholder={placeholder}
          value={todo.text}
          onChange={(e) => onChange({ text: e.target.value })}
        />
        {hasDetails && (
          <button
            type="button"
            className={`${styles.detailsBadge} ${
              progress.total > 0 && progress.done === progress.total ? styles.detailsBadgeDone : ''
            }`}
            onClick={() => setDetailsOpen((v) => !v)}
            title={detailsOpen ? 'Hide details' : 'Show details'}
            aria-expanded={detailsOpen}
          >
            {progress.total > 0 ? `${progress.done}/${progress.total}` : '📝'}
          </button>
        )}
        <span className={styles.alarmTime}>{todo.alarm || ''}</span>
        <button
          type="button"
          className={`${styles.alarmBtn} ${hasAlarm ? styles.set : ''}`}
          onClick={handleTogglePicker}
          title="Set reminder"
        >
          {'🔔'}
        </button>
        <button
          type="button"
          className={`${styles.rowMenuBtn} ${menuOpen ? styles.rowMenuBtnOpen : ''}`}
          onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
          title="Task actions"
          aria-label="Task actions"
          aria-expanded={menuOpen}
        >
          {'⋯'}
        </button>
        <div
          ref={pickerRef}
          className={`${styles.alarmPicker} ${pickerOpen ? styles.show : ''}`}
        >
          <input
            type="time"
            className={styles.alarmPickerTimeInput}
            value={pickerTime}
            onChange={(e) => setPickerTime(e.target.value)}
          />
          <button
            type="button"
            className={styles.alarmPickerBtn}
            onClick={handleSetAlarm}
          >
            Set Alarm
          </button>
          <button
            type="button"
            className={styles.alarmClearBtn}
            onClick={handleClearAlarm}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Action strip */}
      {menuOpen && (
        <div
          className={styles.actionStrip}
          onKeyDown={(e) => e.key === 'Escape' && closeMenu()}
        >
          {confirmDelete ? (
            <>
              <span className={styles.confirmText}>
                Delete {todo.text.trim() ? `"${todo.text.trim()}"` : 'this task'}
                {subtaskCount > 0
                  ? ` and its ${subtaskCount} subtask${subtaskCount === 1 ? '' : 's'}`
                  : ''}
                ?
              </span>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                onClick={runAndClose(onDelete)}
                autoFocus
              >
                Delete
              </button>
              <button type="button" className={styles.actionBtn} onClick={closeMenu}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.actionBtn} onClick={runAndClose(onInsertAbove)}>
                + Above
              </button>
              <button type="button" className={styles.actionBtn} onClick={runAndClose(onInsertBelow)}>
                + Below
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={onMoveUp}
                disabled={!canMoveUp}
                title="Move up"
              >
                {'↑'} Up
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={onMoveDown}
                disabled={!canMoveDown}
                title="Move down"
              >
                {'↓'} Down
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={runAndClose(onMoveTop)}
                disabled={!canMoveUp}
                title="Move to the top of the list"
              >
                {'⤒'} Top
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={runAndClose(() => setDetailsOpen((v) => !v))}
              >
                {detailsOpen ? 'Hide details' : 'Details'}
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Details panel: notes + subtasks */}
      {detailsOpen && (
        <div className={styles.detailsPanel}>
          <textarea
            className={styles.notesInput}
            placeholder="Notes or description..."
            rows={2}
            value={todo.notes || ''}
            onChange={(e) => onChange({ notes: e.target.value })}
          />

          <div className={styles.subtaskHeader}>
            <span>Subtasks</span>
            {progress.total > 0 && (
              <span className={styles.subtaskProgress}>
                {progress.done}/{progress.total} completed
              </span>
            )}
          </div>

          <div className={styles.subtaskList}>
            {subtasks.map((sub, i) => (
              <SubtaskRow
                key={sub.id}
                sub={sub}
                autoFocus={sub.id === focusSubId}
                canMoveUp={i > 0}
                canMoveDown={i < subtasks.length - 1}
                checkClass={checkClass}
                onChange={(updates) =>
                  updateSubtasks((list) =>
                    list.map((s) => (s.id === sub.id ? { ...s, ...updates } : s))
                  )
                }
                onMove={(delta) => updateSubtasks((list) => moveById(list, sub.id, delta))}
                onDelete={() => updateSubtasks((list) => removeById(list, sub.id))}
                onEnter={() => addSubtask(i + 1)}
              />
            ))}
          </div>

          <button type="button" className={styles.addSubBtn} onClick={() => addSubtask()}>
            + Add subtask
          </button>
        </div>
      )}
    </div>
  );
}

function SubtaskRow({ sub, autoFocus, canMoveUp, canMoveDown, checkClass, onChange, onMove, onDelete, onEnter }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  return (
    <div className={styles.subtaskItem}>
      <input
        type="checkbox"
        className={`${styles.priorityCheck} ${styles.subtaskCheck} ${checkClass || ''}`}
        checked={!!sub.checked}
        onChange={() => onChange({ checked: !sub.checked })}
        aria-label="Mark subtask complete"
      />
      <input
        ref={inputRef}
        type="text"
        className={`${styles.subtaskInput} ${sub.checked ? styles.checked : ''}`}
        placeholder="Subtask..."
        value={sub.text}
        onChange={(e) => onChange({ text: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onEnter();
          }
        }}
      />
      <button
        type="button"
        className={styles.subtaskBtn}
        onClick={() => onMove(-1)}
        disabled={!canMoveUp}
        aria-label="Move subtask up"
      >
        {'↑'}
      </button>
      <button
        type="button"
        className={styles.subtaskBtn}
        onClick={() => onMove(1)}
        disabled={!canMoveDown}
        aria-label="Move subtask down"
      >
        {'↓'}
      </button>
      <button
        type="button"
        className={`${styles.subtaskBtn} ${styles.subtaskDelete}`}
        onClick={onDelete}
        aria-label="Delete subtask"
      >
        {'×'}
      </button>
    </div>
  );
}
