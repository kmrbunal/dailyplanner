import { useDayContext } from '../../../context/DayContext';
import MealSection from './MealSection';
import styles from './MealLog.module.css';

export default function MealLog() {
  const { dayData, dispatch } = useDayContext();

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        <span className={styles.icon}>🍽️</span> Meal Log
      </div>
      <p className={styles.subtitle}>
        Track your meals, snacks, and water intake throughout the day.
      </p>

      <MealSection mealId="mealBreakfast" title="Breakfast" icon="🌅" />
      <MealSection mealId="mealLunch" title="Lunch" icon="☀️" />
      <MealSection mealId="mealDinner" title="Dinner" icon="🌙" />
      <MealSection mealId="mealSnacks" title="Snacks" icon="🍪" isSnack />

      {/* Meal Notes */}
      <div>
        <div className={styles.notesLabel}>Meal Notes</div>
        <textarea
          className={styles.notesArea}
          placeholder="Allergies, cravings, how you felt after eating..."
          value={dayData.mealNotes || ''}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'mealNotes', value: e.target.value })}
        />
      </div>
    </div>
  );
}
