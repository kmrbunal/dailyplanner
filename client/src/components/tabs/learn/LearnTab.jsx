import LearningList from './LearningList';
import AchievementsLog from './AchievementsLog';
import styles from './LearnTab.module.css';

export default function LearnTab() {
  return (
    <div className={styles.grid}>
      <LearningList />
      <AchievementsLog />
    </div>
  );
}
