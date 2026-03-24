import { useCallback } from 'react';
import { useDayContext } from '../../../context/DayContext';
import styles from './NotesTab.module.css';

export default function NotesTab() {
  const { dayData, dispatch } = useDayContext();

  const handleChange = useCallback(
    (e) => {
      dispatch({ type: 'SET_FIELD', field: 'notes', value: e.target.value });
    },
    [dispatch]
  );

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <span className={styles.icon}>📝</span> Notes
        </div>
        <textarea
          className={styles.notesArea}
          placeholder="Jot down thoughts, ideas, reminders..."
          value={dayData.notes || ''}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
