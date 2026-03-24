import styles from './MealRow.module.css';

export default function MealRow({ item, index, onChange, onDelete }) {
  return (
    <div className={styles.row}>
      <input
        type="text"
        className={styles.foodInput}
        placeholder="Food item..."
        value={item.food || ''}
        onChange={(e) => onChange(index, 'food', e.target.value)}
      />
      <input
        type="text"
        className={styles.portionInput}
        placeholder="Portion"
        value={item.portion || ''}
        onChange={(e) => onChange(index, 'portion', e.target.value)}
      />
      <input
        type="number"
        className={styles.calInput}
        placeholder="cal"
        value={item.cal || ''}
        onChange={(e) => onChange(index, 'cal', e.target.value)}
      />
      <button className={styles.deleteBtn} onClick={() => onDelete(index)}>
        &times;
      </button>
    </div>
  );
}
