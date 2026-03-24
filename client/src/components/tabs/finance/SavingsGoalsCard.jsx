import cardStyles from '../../common/Card.module.css';
import styles from './FinanceTab.module.css';

/**
 * Savings Goals card -- list of goals with name, auto-computed "saved",
 * target, progress bar, and "Add goal" button.
 *
 * The "saved" (current) value for each goal is auto-computed from breakdown
 * allocations, so it is read-only.
 *
 * @param {{
 *   goals: Array<{ name: string, current: string|number, target: string|number }>,
 *   onGoalChange: (index: number, updates: object) => void,
 *   onGoalRemove: (index: number) => void,
 *   onAddGoal: () => void,
 *   goalTotals: Object<string, number>
 * }} props
 */
export default function SavingsGoalsCard({
  goals,
  onGoalChange,
  onGoalRemove,
  onAddGoal,
  goalTotals,
}) {
  return (
    <div className={cardStyles.card} style={{ gridColumn: 'span 2' }}>
      <div className={cardStyles.cardTitle} style={{ color: '#8b7d3c' }}>
        <span
          className="icon"
          style={{ background: 'var(--gold-light)' }}
        >
          {'\uD83C\uDFAF'}
        </span>
        Savings Goals
      </div>

      <div className={styles.goalsContainer}>
        {goals.map((goal, i) => (
          <GoalRow
            key={i}
            goal={goal}
            computedSaved={goalTotals[goal.name?.trim()] || 0}
            onChange={(updates) => onGoalChange(i, updates)}
            onRemove={() => onGoalRemove(i)}
          />
        ))}
      </div>

      <button
        className={cardStyles.addBtn}
        onClick={onAddGoal}
        type="button"
      >
        + Add savings goal
      </button>
    </div>
  );
}

/**
 * Single goal row with name, saved (read-only), target, progress bar.
 */
function GoalRow({ goal, computedSaved, onChange, onRemove }) {
  const current = computedSaved || 0;
  const target = parseFloat(goal.target) || 0;
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div className={styles.goalRow}>
      {/* Header: name + delete */}
      <div className={styles.goalHeader}>
        <input
          type="text"
          className={styles.goalNameInput}
          placeholder="Goal name (e.g. Emergency Fund)..."
          value={goal.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <button
          className={styles.goalDeleteBtn}
          onClick={onRemove}
          type="button"
          aria-label="Remove goal"
        >
          ×
        </button>
      </div>

      {/* Amounts: Saved / of / Target / pct */}
      <div className={styles.goalAmounts}>
        <div className={styles.goalAmountBlock}>
          <div className={styles.goalAmountLabel}>
            Saved{' '}
            <span className={styles.goalAmountLabelHint}>
              (from breakdown)
            </span>
          </div>
          <div className={styles.goalAmountInputWrap}>
            <span className={styles.goalAmountCurrency}>{'\u20B1'}</span>
            <input
              type="number"
              className={styles.goalSavedInput}
              placeholder="0"
              step="0.01"
              value={current || ''}
              readOnly
              title="Auto-computed from Savings Breakdown allocations"
            />
          </div>
        </div>

        <div className={styles.goalOf}>of</div>

        <div className={styles.goalAmountBlock}>
          <div className={styles.goalAmountLabel}>Target</div>
          <div className={styles.goalAmountInputWrap}>
            <span className={styles.goalAmountCurrency}>{'\u20B1'}</span>
            <input
              type="number"
              className={styles.goalTargetInput}
              placeholder="0"
              step="0.01"
              value={goal.target || ''}
              onChange={(e) => onChange({ target: e.target.value })}
            />
          </div>
        </div>

        <div className={styles.goalPct}>{pct}%</div>
      </div>

      {/* Progress bar */}
      <div className={styles.goalBarTrack}>
        <div
          className={styles.goalBarFill}
          style={{ width: pct + '%' }}
        />
      </div>
    </div>
  );
}
