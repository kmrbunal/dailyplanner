import styles from './FinanceTab.module.css';

/**
 * Frozen past-day banner showing the budget pool breakdown + spending.
 */
export default function DayFinanceSnapshot({ snapshot }) {
  if (!snapshot) return null;

  const poolCarried = snapshot.poolCarried || 0;
  const alloc = snapshot.dailyAllocation || 0;
  const extra = snapshot.extraDeposit || 0;
  const available = snapshot.todayAvailable || snapshot.availableAtStart || 0;
  const spent = snapshot.todaySpent || 0;
  const remaining = snapshot.remaining !== undefined ? snapshot.remaining : (snapshot.remainingAfterToday || 0);
  const isOver = remaining < 0;

  const fmt = (v) => (v < 0 ? '-' : '') + '\u20B1' + Math.abs(v).toFixed(2);

  return (
    <div className={styles.snapshot}>
      <div className={styles.snapshotTitle}>Day Snapshot</div>
      <div className={styles.snapshotGrid} style={{ gridTemplateColumns: extra > 0 ? '1fr 1fr 1fr 1fr 1fr 1fr' : '1fr 1fr 1fr 1fr 1fr' }}>
        <div>
          <div className={styles.snapshotLabel}>Pool</div>
          <div className={styles.snapshotValue} style={{ color: 'var(--accent-dark)' }}>{fmt(poolCarried)}</div>
        </div>
        <div>
          <div className={styles.snapshotLabel}>Alloc</div>
          <div className={styles.snapshotValue} style={{ color: '#6b7c3f' }}>{fmt(alloc)}</div>
        </div>
        {extra > 0 && (
          <div>
            <div className={styles.snapshotLabel}>+ Income</div>
            <div className={styles.snapshotValue} style={{ color: '#8b7d3c' }}>{fmt(extra)}</div>
          </div>
        )}
        <div>
          <div className={styles.snapshotLabel}>Available</div>
          <div className={styles.snapshotValue} style={{ color: 'var(--accent-dark)', fontWeight: 800 }}>{fmt(available)}</div>
        </div>
        <div>
          <div className={styles.snapshotLabel}>Spent</div>
          <div className={styles.snapshotValue} style={{ color: '#8b3a3a' }}>{fmt(spent)}</div>
        </div>
        <div>
          <div className={styles.snapshotLabel}>Remaining</div>
          <div className={styles.snapshotValue} style={{ color: isOver ? '#8b3a3a' : 'var(--accent-dark)', fontWeight: 800 }}>{fmt(remaining)}</div>
        </div>
      </div>
    </div>
  );
}
