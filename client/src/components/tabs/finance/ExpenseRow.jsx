import expenseCategories from '../../../data/expenseCategories';
import styles from './FinanceTab.module.css';

/**
 * Single expense row with category dropdown, amount input, and delete button.
 *
 * @param {{
 *   expense: { category: string, amount: string },
 *   onChange: (updates: { category?: string, amount?: string }) => void,
 *   onRemove: () => void,
 *   disabled?: boolean
 * }} props
 */
export default function ExpenseRow({ expense, onChange, onRemove, disabled }) {
  return (
    <div className={styles.expenseRow}>
      <select
        className={styles.expenseSelect}
        value={expense.category || expenseCategories[0]}
        onChange={(e) => onChange({ category: e.target.value })}
        disabled={disabled}
      >
        {expenseCategories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <span className={styles.expenseCurrency}>{'\u20B1'}</span>
      <input
        type="number"
        className={styles.expenseInput}
        placeholder="0"
        step="0.01"
        value={expense.amount || ''}
        onChange={(e) => onChange({ amount: e.target.value })}
        disabled={disabled}
      />
      {!disabled && (
        <button
          className={styles.deleteBtn}
          onClick={onRemove}
          type="button"
          aria-label="Remove expense"
        >
          ×
        </button>
      )}
    </div>
  );
}
