import { useDayContext } from '../../../context/DayContext';
import styles from './WaterTracker.module.css';

export default function WaterTracker() {
  const { dayData, dispatch } = useDayContext();
  const water = dayData.water || [false, false, false, false, false, false, false, false];
  const filledCount = water.filter(Boolean).length;

  const toggleGlass = (index) => {
    const next = [...water];
    next[index] = !next[index];
    dispatch({ type: 'SET_FIELD', field: 'water', value: next });
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        <span className={styles.icon}>💧</span> Water Intake
      </div>
      <div className={styles.glasses}>
        {water.map((filled, i) => (
          <div
            key={i}
            className={`${styles.glass}${filled ? ` ${styles.filled}` : ''}`}
            onClick={() => toggleGlass(i)}
            role="button"
            tabIndex={0}
            aria-label={`Glass ${i + 1}${filled ? ' (filled)' : ''}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleGlass(i);
              }
            }}
          />
        ))}
      </div>
      <div className={styles.counter}>
        <span>{filledCount}</span> / 8 glasses
      </div>
    </div>
  );
}
