import { useStoreContext } from '../../../context/StoreContext';
import styles from './LearnTab.module.css';

export default function AchievementsLog() {
  const { achievements } = useStoreContext();

  const items = achievements || [];

  return (
    <div className={styles.achievementsSection}>
      <div className={`${styles.cardTitle} ${styles.achievementsTitle}`}>
        <span className={`${styles.icon} ${styles.achievementsTitleIcon}`}>🏆</span>
        Achievements This Year
      </div>
      <p className={styles.achievementsSubtitle}>
        Courses and activities you&apos;ve completed. These are tracked across all
        days automatically.
      </p>

      <div className={styles.achievementsList}>
        {items.length === 0 ? (
          <div className={styles.emptyMessage}>
            No completed items yet. Mark a course as &quot;Completed&quot; to see it here!
          </div>
        ) : (
          items.map((a, i) => (
            <div key={i} className={styles.achievementItem}>
              <span className={styles.achievementEmoji}>{a.emoji || '🏆'}</span>
              <span className={styles.achievementText}>{a.text}</span>
              <span className={styles.achievementDate}>{a.completedDate || ''}</span>
            </div>
          ))
        )}
      </div>

      <div className={styles.totalBar}>
        <span className={styles.totalLabel}>Total Achievements</span>
        <span className={styles.totalCount}>{items.length}</span>
      </div>
    </div>
  );
}
