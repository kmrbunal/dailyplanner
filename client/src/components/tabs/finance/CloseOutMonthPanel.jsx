import { useState, useMemo, useCallback } from 'react';
import { useStoreContext } from '../../../context/StoreContext';
import { getDateKey, getMonthKey } from '../../../services/dateUtils';
import styles from './FinanceTab.module.css';

/**
 * All 9 savings + investment categories for month-end allocation.
 */
const allocCategories = [
  { type: 'bank', label: 'Bank Savings', icon: '\uD83C\uDFE6', group: 'savings' },
  { type: 'cashSavings', label: 'Cash Savings', icon: '\uD83D\uDCB5', group: 'savings' },
  { type: 'digitalSavings', label: 'Digital Wallet Savings', icon: '\uD83D\uDCF1', group: 'savings' },
  { type: 'otherSavings', label: 'Other Savings', icon: '\uD83D\uDCE6', group: 'savings' },
  { type: 'stocks', label: 'Stocks', icon: '\uD83D\uDCC8', group: 'investment' },
  { type: 'bonds', label: 'Govt Bonds', icon: '\uD83C\uDFDB\uFE0F', group: 'investment' },
  { type: 'funds', label: 'Mutual Funds / UITF', icon: '\uD83D\uDCCA', group: 'investment' },
  { type: 'crypto', label: 'Crypto / Digital Assets', icon: '\uD83E\uDE99', group: 'investment' },
  { type: 'otherInvest', label: 'Other Investments', icon: '\uD83D\uDD17', group: 'investment' },
];

/**
 * Month-end allocation panel.
 * Shows remaining amount, renders allocation rows for all 9 categories,
 * "Remaining to Allocate" decreases as user types, Confirm button
 * applies allocations to savings/investment breakdown inputs.
 *
 * @param {{
 *   remaining: number,
 *   startingBudget: number,
 *   currentDate: Date,
 *   onApplyAllocations: (allocations: Object<string, { amount: number, group: string }>) => void,
 *   onClose: () => void,
 *   visible: boolean
 * }} props
 */
export default function CloseOutMonthPanel({
  remaining,
  startingBudget,
  currentDate,
  onApplyAllocations,
  onClose,
  visible,
}) {
  const { closedMonths, saveClosedMonths } = useStoreContext();
  const [allocations, setAllocations] = useState({});
  const [error, setError] = useState('');

  const monthKey = useMemo(
    () => getMonthKey(getDateKey(currentDate)),
    [currentDate]
  );

  const alreadyClosed = closedMonths.includes(monthKey);

  const totalAllocated = useMemo(() => {
    let sum = 0;
    Object.values(allocations).forEach((v) => {
      sum += parseFloat(v) || 0;
    });
    return sum;
  }, [allocations]);

  const unallocated = remaining - totalAllocated;
  const isOverAllocated = unallocated < -0.01;

  const handleAllocChange = useCallback((type, value) => {
    setAllocations((prev) => ({ ...prev, [type]: value }));
    setError('');
  }, []);

  const handleConfirm = useCallback(() => {
    setError('');

    // Validate no negative values
    let hasNegative = false;
    let totalAlloc = 0;
    Object.entries(allocations).forEach(([, val]) => {
      const v = parseFloat(val) || 0;
      if (v < 0) hasNegative = true;
      totalAlloc += v;
    });

    if (hasNegative) {
      setError('Invalid amount! Allocation values cannot be negative.');
      return;
    }

    if (totalAlloc > remaining + 0.01) {
      setError(
        'Over-allocated! You entered \u20B1' +
          totalAlloc.toFixed(2) +
          ' but only have \u20B1' +
          remaining.toFixed(2) +
          ' remaining.'
      );
      return;
    }

    // Build allocation map grouped by type
    const allocationMap = {};
    allocCategories.forEach((cat) => {
      const amount = parseFloat(allocations[cat.type]) || 0;
      if (amount > 0) {
        allocationMap[cat.type] = { amount, group: cat.group };
      }
    });

    // Apply to parent (which updates breakdown values and saves)
    onApplyAllocations(allocationMap);

    // Mark month as closed
    const updated = [...closedMonths];
    if (!updated.includes(monthKey)) {
      updated.push(monthKey);
      saveClosedMonths(updated);
    }

    setAllocations({});
  }, [allocations, remaining, monthKey, closedMonths, saveClosedMonths, onApplyAllocations]);

  // Determine display state
  if (alreadyClosed) {
    return (
      <div className={styles.closeOutBtnWrap}>
        <div className={styles.closeOutStatus}>
          This month has been closed out. Funds were allocated.
        </div>
      </div>
    );
  }

  if (startingBudget <= 0) {
    return (
      <div className={styles.closeOutBtnWrap}>
        <div
          className={styles.closeOutStatus}
          style={{ color: 'var(--text-light)' }}
        >
          Set your Cash on Hand / Digital Wallet first.
        </div>
      </div>
    );
  }

  if (!visible) {
    return null;
  }

  // Build the message based on remaining amount
  let message;
  let showAllocRows = false;
  if (remaining > 0) {
    message = (
      <span>
        You have{' '}
        <strong style={{ color: 'var(--accent)' }}>
          {'\u20B1'}
          {remaining.toFixed(2)}
        </strong>{' '}
        remaining this month. Allocate it below to your Savings or Investments:
      </span>
    );
    showAllocRows = true;
  } else if (remaining < 0) {
    message = (
      <span>
        You are{' '}
        <strong style={{ color: '#8b3a3a' }}>
          {'\u20B1'}
          {Math.abs(remaining).toFixed(2)} over budget
        </strong>{' '}
        this month. Review your expenses and adjust next month's plan.
      </span>
    );
  } else {
    message = (
      <span>
        You've spent exactly your budget this month. No remaining funds to
        allocate.
      </span>
    );
  }

  return (
    <div className={styles.allocPanel}>
      {/* Header */}
      <div className={styles.allocPanelHeader}>
        <div className={styles.allocPanelTitle}>
          <span className={styles.allocPanelTitleIcon}>{'\uD83D\uDD14'}</span>
          <span className={styles.allocPanelTitleText}>
            Month-End Allocation
          </span>
        </div>
        <button
          className={styles.allocCloseBtn}
          onClick={onClose}
          type="button"
          aria-label="Close allocation panel"
        >
          ×
        </button>
      </div>

      {/* Message */}
      <div className={styles.allocMessage}>{message}</div>

      {/* Allocation rows */}
      {showAllocRows && (
        <>
          <div className={styles.allocSectionLabel}>
            Allocate Remaining To:
          </div>
          <div className={styles.allocRows}>
            {allocCategories.map((cat) => (
              <div key={cat.type} className={styles.allocRow}>
                <span className={styles.allocRowIcon}>{cat.icon}</span>
                <span className={styles.allocRowLabel}>{cat.label}</span>
                <span className={styles.allocRowCurrency}>{'\u20B1'}</span>
                <input
                  type="number"
                  className={styles.allocRowInput}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  value={allocations[cat.type] || ''}
                  onChange={(e) =>
                    handleAllocChange(cat.type, e.target.value)
                  }
                />
              </div>
            ))}
          </div>

          {/* Remaining to Allocate */}
          <div className={styles.allocUnallocated}>
            <span className={styles.allocUnallocatedLabel}>
              Remaining to Allocate
            </span>
            <span
              className={styles.allocUnallocatedValue}
              style={{
                color: isOverAllocated ? '#8b3a3a' : 'var(--accent-dark)',
              }}
            >
              {unallocated < 0 ? '-' : ''}
              {'\u20B1'}
              {Math.abs(unallocated).toFixed(2)}
            </span>
          </div>

          {/* Confirm button */}
          <button
            className={styles.allocConfirmBtn}
            onClick={handleConfirm}
            disabled={isOverAllocated}
            type="button"
          >
            Confirm & Close Out Month
          </button>

          {/* Error */}
          {error && <div className={styles.allocError}>{error}</div>}
        </>
      )}
    </div>
  );
}
