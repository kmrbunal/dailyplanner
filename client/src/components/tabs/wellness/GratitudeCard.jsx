import { useDayContext } from '../../../context/DayContext';
import styles from './GratitudeCard.module.css';

export default function GratitudeCard() {
  const { dayData, dispatch } = useDayContext();
  const gratitude = dayData.gratitude || ['', '', ''];

  const handleChange = (index, value) => {
    const next = [...gratitude];
    next[index] = value;
    dispatch({ type: 'SET_FIELD', field: 'gratitude', value: next });
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        <span className={styles.icon}>✨</span> Gratitude
      </div>
      <div className={styles.list}>
        {gratitude.map((text, i) => (
          <div key={i} className={styles.item}>
            <span className={styles.itemNumber}>{i + 1}.</span>
            <input
              type="text"
              className={styles.itemInput}
              placeholder="I'm grateful for..."
              value={text}
              onChange={(e) => handleChange(i, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
