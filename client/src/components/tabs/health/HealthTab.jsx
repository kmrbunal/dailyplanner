import WaterTracker from './WaterTracker';
import WeightTracker from './WeightTracker';
import CycleTracker from './CycleTracker';
import MealLog from './MealLog';
import styles from './HealthTab.module.css';

export default function HealthTab() {
  return (
    <div className={styles.healthGrid}>
      <WaterTracker />
      <WeightTracker />
      <CycleTracker />
      <div className={styles.mealSlide}>
        <MealLog />
      </div>
    </div>
  );
}
