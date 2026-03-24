import { useDayContext } from '../../../context/DayContext';
import styles from './MoodCard.module.css';

const MOODS = ['😔', '😐', '🙂', '😊', '🤩'];

export default function MoodCard() {
  const { dayData, dispatch } = useDayContext();
  const mood = dayData.mood; // -1 = none, 0-4 = mood index

  const selectMood = (index) => {
    // Click to select, click again to deselect
    dispatch({
      type: 'SET_FIELD',
      field: 'mood',
      value: mood === index ? -1 : index,
    });
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        <span className={styles.icon}>😊</span> Mood
      </div>
      <div className={styles.moodOptions}>
        {MOODS.map((emoji, i) => (
          <button
            key={i}
            className={`${styles.moodBtn}${mood === i ? ` ${styles.selected}` : ''}`}
            onClick={() => selectMood(i)}
            aria-label={`Mood ${i + 1}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
