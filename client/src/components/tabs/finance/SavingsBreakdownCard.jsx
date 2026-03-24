import cardStyles from '../../common/Card.module.css';
import styles from './FinanceTab.module.css';

/**
 * 4 savings categories: Bank / Cash / Digital / Other
 * Each has an amount input and a goal-allocation dropdown.
 * Grand total displayed at the bottom.
 */

const SAVINGS_CATEGORIES = [
  { type: 'bank', label: 'Bank Savings', icon: '\uD83C\uDFE7' },
  { type: 'cashSavings', label: 'Cash Savings', icon: '\uD83D\uDCB5' },
  { type: 'digitalSavings', label: 'Digital Wallet Savings', icon: '\uD83D\uDCF1' },
  { type: 'otherSavings', label: 'Other Savings', icon: '\uD83D\uDD17' },
];

/**
 * @param {{
 *   breakdown: Object<string, string>,
 *   allocations: Object<string, string>,
 *   goalNames: string[],
 *   onBreakdownChange: (type: string, value: string) => void,
 *   onAllocationChange: (type: string, goalName: string) => void,
 *   grandTotal: number
 * }} props
 */
export default function SavingsBreakdownCard({
  breakdown,
  allocations,
  goalNames,
  onBreakdownChange,
  onAllocationChange,
  grandTotal,
}) {
  return (
    <div className={cardStyles.card} style={{ gridColumn: 'span 2' }}>
      <div className={cardStyles.cardTitle} style={{ color: 'var(--accent)' }}>
        <span
          className="icon"
          style={{ background: 'var(--accent-light)' }}
        >
          {'\uD83C\uDFE6'}
        </span>
        Savings Breakdown
      </div>
      <p className={styles.breakdownDesc}>
        Track where your savings are stored. Allocate to a goal to link it.
      </p>

      <div className={styles.breakdownList}>
        {SAVINGS_CATEGORIES.map((cat) => (
          <div key={cat.type} className={styles.breakdownRow}>
            <span className={styles.breakdownIcon}>{cat.icon}</span>
            <span className={styles.breakdownLabel}>{cat.label}</span>
            <span className={styles.breakdownCurrency}>{'\u20B1'}</span>
            <input
              type="number"
              className={`${styles.breakdownInput} ${styles.breakdownInputSavings}`}
              placeholder="0"
              step="0.01"
              value={breakdown[cat.type] || ''}
              onChange={(e) => onBreakdownChange(cat.type, e.target.value)}
            />
            <select
              className={styles.breakdownSelect}
              value={allocations[cat.type] || ''}
              onChange={(e) => onAllocationChange(cat.type, e.target.value)}
            >
              <option value="">No goal</option>
              {goalNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Grand Total */}
      <div className={`${styles.totalBox} ${styles.totalBoxSavings}`}>
        <div className={`${styles.totalLabel} ${styles.totalLabelSavings}`}>
          Total Savings
        </div>
        <div className={`${styles.totalValue} ${styles.totalValueSavings}`}>
          {'\u20B1'}
          {grandTotal.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
