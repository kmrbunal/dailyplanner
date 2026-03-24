import MoodCard from './MoodCard';
import GymProgramCard from './GymProgramCard';
import GratitudeCard from './GratitudeCard';
import styles from './WellnessTab.module.css';

export default function WellnessTab() {
  return (
    <div className={styles.wellnessGrid}>
      <MoodCard />
      <GymProgramCard />
      <GratitudeCard />
    </div>
  );
}
