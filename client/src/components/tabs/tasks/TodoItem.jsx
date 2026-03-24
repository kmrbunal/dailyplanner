import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './TasksTab.module.css';

/**
 * Single todo row: checkbox + text input + alarm time display + alarm button
 * + alarm picker dropdown.
 *
 * Props:
 *   todo       - { text, checked, alarm }
 *   onChange   - (updates) => void   — partial update object, e.g. { text: 'new' }
 *   onToggle   - () => void          — toggle checked state
 *   placeholder - string
 *   checkClass - optional extra className for the checkbox (category colour)
 */
export default function TodoItem({ todo, onChange, onToggle, placeholder, checkClass }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTime, setPickerTime] = useState(todo.alarm || '');
  const pickerRef = useRef(null);

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

  const hasAlarm = !!todo.alarm;

  return (
    <div className={styles.todoItem}>
      <input
        type="checkbox"
        className={`${styles.priorityCheck} ${checkClass || ''}`}
        checked={todo.checked}
        onChange={onToggle}
      />
      <input
        type="text"
        className={`${styles.todoTextInput} ${todo.checked ? styles.checked : ''}`}
        placeholder={placeholder}
        value={todo.text}
        onChange={(e) => onChange({ text: e.target.value })}
      />
      <span className={styles.alarmTime}>{todo.alarm || ''}</span>
      <button
        type="button"
        className={`${styles.alarmBtn} ${hasAlarm ? styles.set : ''}`}
        onClick={handleTogglePicker}
        title="Set reminder"
      >
        {'\uD83D\uDD14'}
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
  );
}
