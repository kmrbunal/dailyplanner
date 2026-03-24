import cardStyles from '../../common/Card.module.css';
import styles from './FinanceTab.module.css';

/**
 * 5 investment categories: Stocks / Bonds / Funds / Crypto / Other
 * Each has an amount input and a goal-allocation dropdown.
 * Grand total + net worth displayed at the bottom.
 */

const INVESTMENT_CATEGORIES = [
  { type: 'stocks', label: 'Stocks', icon: '\uD83D\uDCC8' },
  { type: 'bonds', label: 'Govt Bonds (T-Bills, Retail Bonds)', icon: '\uD83C\uDFDB\uFE0F' },
  { type: 'funds', label: 'Mutual Funds / UITF', icon: '\uD83D\uDCCA' },
  { type: 'crypto', label: 'Crypto / Digital Assets', icon: '\uD83E\uDE99' },
  { type: 'otherInvest', label: 'Other Investments', icon: '\uD83D\uDD17' },
];

/**
 * @param {{
 *   breakdown: Object<string, string>,
 *   allocations: Object<string, string>,
 *   goalNames: string[],
 *   onBreakdownChange: (type: string, value: string) => void,
 *   onAllocationChange: (type: string, goalName: string) => void,
 *   grandTotal: number,
 *   netWorth: number
 * }} props
 */
export default function InvestmentBreakdownCard({
  breakdown,
  allocations,
  goalNames,
  onBreakdownChange,
  onAllocationChange,
  grandTotal,
  netWorth,
}) {
  return (
    <div className={cardStyles.card} style={{ gridColumn: 'span 2' }}>
      <div className={cardStyles.cardTitle} style={{ color: 'var(--gold)' }}>
        <span
          className="icon"
          style={{ background: 'var(--gold-light)' }}
        >
          {'\uD83D\uDCC8'}
        </span>
        Investment Breakdown
      </div>
      <p className={styles.breakdownDesc}>
        Track your investment portfolio.
      </p>

      <div className={styles.breakdownList}>
        {INVESTMENT_CATEGORIES.map((cat) => (
          <div key={cat.type} className={styles.breakdownRow}>
            <span className={styles.breakdownIcon}>{cat.icon}</span>
            <span className={styles.breakdownLabel}>{cat.label}</span>
            <span className={styles.breakdownCurrency}>{'\u20B1'}</span>
            <input
              type="number"
              className={`${styles.breakdownInput} ${styles.breakdownInputInvest}`}
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

      {/* Grand Total Investments */}
      <div className={`${styles.totalBox} ${styles.totalBoxInvest}`}>
        <div className={`${styles.totalLabel} ${styles.totalLabelInvest}`}>
          Total Investments
        </div>
        <div className={`${styles.totalValue} ${styles.totalValueInvest}`}>
          {'\u20B1'}
          {grandTotal.toFixed(2)}
        </div>
      </div>

      {/* Net Worth */}
      <div className={styles.netWorthBox}>
        <div className={styles.netWorthLabel}>
          Total Net Worth (Savings + Investments)
        </div>
        <div className={styles.netWorthValue}>
          {'\u20B1'}
          {netWorth.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
