import styles from './FinanceTab.module.css';

/**
 * Shows "Today's Available" and "Remaining" boxes in a 2-column grid.
 * Colors red if over budget.
 *
 * @param {{ todayAvailable: number, remaining: number, note: string }} props
 */
export default function DailyBalanceDisplay({ todayAvailable, remaining, note }) {
  const isOverBudget = remaining < 0;
  const availableNegative = todayAvailable < 0;

  const formatPeso = (v) => {
    const abs = Math.abs(v);
    return (v < 0 ? '-' : '') + '\u20B1' + abs.toFixed(2);
  };

  return (
    <div className={styles.balanceGrid}>
      {/* Today's Available */}
      <div
        className={styles.balanceBox}
        style={{ background: '#eef4e8' }}
      >
        <div
          className={styles.balanceLabel}
          style={{ color: 'var(--accent)' }}
        >
          Today's Available
        </div>
        <div
          className={styles.balanceValue}
          style={{ color: availableNegative ? '#8b3a3a' : 'var(--accent-dark)' }}
        >
          {formatPeso(todayAvailable)}
        </div>
        <div className={styles.balanceNote}>{note}</div>
      </div>

      {/* Remaining */}
      <div
        className={styles.balanceBox}
        style={{
          background: isOverBudget ? '#f5e0e0' : 'var(--accent-light)',
        }}
      >
        <div
          className={styles.balanceLabel}
          style={{ color: isOverBudget ? '#8b3a3a' : 'var(--accent)' }}
        >
          {isOverBudget ? 'Over Budget' : 'Remaining'}
        </div>
        <div
          className={styles.balanceValue}
          style={{ color: isOverBudget ? '#8b3a3a' : 'var(--accent)' }}
        >
          {formatPeso(remaining)}
        </div>
        <div className={styles.balanceNote}>After today's expenses</div>
      </div>
    </div>
  );
}
