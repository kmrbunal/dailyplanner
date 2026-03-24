import styles from './FinanceTab.module.css';

/**
 * Frozen past-day banner showing Available / Spent / Remaining.
 * Only rendered when viewing a past day that has a saved snapshot.
 *
 * @param {{ snapshot: { availableAtStart: number, todaySpent: number, remainingAfterToday: number } }} props
 */
export default function DayFinanceSnapshot({ snapshot }) {
  if (!snapshot) return null;

  const available = snapshot.availableAtStart || 0;
  const spent = snapshot.todaySpent || 0;
  const remaining = snapshot.remainingAfterToday || 0;
  const isOver = remaining < 0;

  const formatPeso = (v) => {
    const abs = Math.abs(v);
    return (v < 0 ? '-' : '') + '\u20B1' + abs.toFixed(2);
  };

  return (
    <div className={styles.snapshot}>
      <div className={styles.snapshotTitle}>Day Snapshot</div>
      <div className={styles.snapshotGrid}>
        <div>
          <div className={styles.snapshotLabel}>Available</div>
          <div
            className={styles.snapshotValue}
            style={{ color: 'var(--accent-dark)' }}
          >
            {formatPeso(available)}
          </div>
        </div>
        <div>
          <div className={styles.snapshotLabel}>Spent</div>
          <div
            className={styles.snapshotValue}
            style={{ color: '#6b7c3f' }}
          >
            {formatPeso(spent)}
          </div>
        </div>
        <div>
          <div className={styles.snapshotLabel}>Remaining</div>
          <div
            className={styles.snapshotValue}
            style={{ color: isOver ? '#8b3a3a' : 'var(--accent-dark)' }}
          >
            {formatPeso(remaining)}
          </div>
        </div>
      </div>
    </div>
  );
}
