import { useState, useMemo, useCallback } from 'react';
import { useDayContext } from '../../../context/DayContext';
import { useStoreContext } from '../../../context/StoreContext';
import { getDateKey, getMonthKey } from '../../../services/dateUtils';
import {
  getTodayAvailable,
  getMonthlyExpenseTotal,
} from '../../../services/financeCalc';
import DailyBalanceDisplay from './DailyBalanceDisplay';
import DayFinanceSnapshot from './DayFinanceSnapshot';
import ExpenseRow from './ExpenseRow';
import CloseOutMonthPanel from './CloseOutMonthPanel';
import cardStyles from '../../common/Card.module.css';
import styles from './FinanceTab.module.css';

/**
 * Monthly Budget Card -- the primary finance card.
 *
 * Contains:
 * - Cash on Hand + Digital Wallet inputs (monthly, from monthlyFinance)
 * - Budget summary: Starting Budget, Month Spent, Today's Available, Remaining
 * - DayFinanceSnapshot for past days
 * - Expense log for the current day
 * - Close Out Month panel
 *
 * @param {{
 *   onApplyAllocations: (allocations: object) => void
 * }} props
 */
export default function MonthlyBudgetCard({ onApplyAllocations }) {
  const { dayData, dispatch, currentDate } = useDayContext();
  const { monthlyFinance, saveMonthlyFinance, synced } = useStoreContext();

  const [closeOutVisible, setCloseOutVisible] = useState(false);

  const dateKey = useMemo(() => getDateKey(currentDate), [currentDate]);
  const todayKey = useMemo(() => getDateKey(new Date()), []);
  const isPastDay = dateKey < todayKey;

  // Don't render finance calculations until store data is synced from cloud
  if (!synced) {
    return (
      <div className={cardStyles.card} style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px 24px', color: 'var(--text-light)' }}>
        Loading finance data...
      </div>
    );
  }

  // ---- Monthly starting funds (from monthlyFinance in StoreContext) ----
  const cashOnHand = parseFloat(monthlyFinance.cashOnHand) || 0;
  const digitalWallet = parseFloat(monthlyFinance.digitalWallet) || 0;
  const startingBudget = cashOnHand + digitalWallet;

  // ---- Today's expenses from dayData ----
  const expenses = dayData.expenses || [{ category: '', amount: '' }];
  const todaySpent = useMemo(() => {
    let sum = 0;
    expenses.forEach((e) => {
      sum += parseFloat(e.amount) || 0;
    });
    return sum;
  }, [expenses]);

  // ---- Daily available / remaining ----
  // For past days with a snapshot, use the frozen snapshot values.
  // For current day, compute live.
  const snapshot = dayData.dailyFinanceSummary || null;
  const hasSnapshot = isPastDay && snapshot && snapshot.availableAtStart !== undefined;

  const todayAvailable = useMemo(() => {
    if (hasSnapshot) {
      return snapshot.availableAtStart;
    }
    // Live computation using financeCalc
    return getTodayAvailable(dateKey, startingBudget, null);
  }, [hasSnapshot, snapshot, dateKey, startingBudget]);

  const remaining = todayAvailable - todaySpent;

  // Note text under "Today's Available"
  const availableNote = useMemo(() => {
    if (hasSnapshot) return 'Carried from previous day';
    // Check if this is the first day of the month (no prior days)
    // getTodayAvailable returns startingBudget when no prior days exist
    if (todayAvailable === startingBudget && startingBudget > 0) {
      return 'Starting budget (first day)';
    }
    return "Yesterday's balance";
  }, [hasSnapshot, todayAvailable, startingBudget]);

  // ---- Month spent (all other days this month, excluding today) ----
  const monthSpentOtherDays = useMemo(
    () => getMonthlyExpenseTotal(dateKey),
    [dateKey]
  );
  const totalMonthSpent = monthSpentOtherDays + todaySpent;

  // ---- Handlers ----
  const handleCashChange = useCallback(
    (value) => {
      const mk = getMonthKey(dateKey);
      saveMonthlyFinance({ ...monthlyFinance, cashOnHand: value }, mk);
    },
    [monthlyFinance, saveMonthlyFinance, dateKey]
  );

  const handleDigitalChange = useCallback(
    (value) => {
      const mk = getMonthKey(dateKey);
      saveMonthlyFinance({ ...monthlyFinance, digitalWallet: value }, mk);
    },
    [monthlyFinance, saveMonthlyFinance, dateKey]
  );

  const handleExpenseChange = useCallback(
    (index, updates) => {
      dispatch({ type: 'SET_EXPENSE', index, updates });
    },
    [dispatch]
  );

  const handleExpenseRemove = useCallback(
    (index) => {
      const updated = expenses.filter((_, i) => i !== index);
      dispatch({
        type: 'SET_FIELD',
        field: 'expenses',
        value: updated.length > 0 ? updated : [{ category: '', amount: '' }],
      });
    },
    [expenses, dispatch]
  );

  const handleAddExpense = useCallback(() => {
    dispatch({
      type: 'SET_FIELD',
      field: 'expenses',
      value: [...expenses, { category: '', amount: '' }],
    });
  }, [expenses, dispatch]);

  const formatPeso = (v) => '\u20B1' + v.toFixed(2);

  return (
    <div className={cardStyles.card} style={{ gridColumn: 'span 2' }}>
      <div className={cardStyles.cardTitle} style={{ color: 'var(--accent)' }}>
        <span
          className="icon"
          style={{ background: 'var(--accent-light)' }}
        >
          {'\uD83D\uDCB0'}
        </span>
        Monthly Finance Tracker
      </div>

      {/* ---- Monthly Starting Funds ---- */}
      <div style={{ marginBottom: 16 }}>
        <div className={styles.sectionLabel}>Monthly Starting Funds</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className={styles.fundsRow} style={{ background: 'var(--accent-light)' }}>
            <span className={styles.fundsIcon}>{'\uD83D\uDCB5'}</span>
            <span className={styles.fundsLabel}>Cash on Hand</span>
            <span className={styles.currencySign}>{'\u20B1'}</span>
            <input
              type="number"
              className={styles.fundsInput}
              placeholder="0"
              step="0.01"
              value={monthlyFinance.cashOnHand || ''}
              onChange={(e) => handleCashChange(e.target.value)}
              disabled={isPastDay}
            />
          </div>
          <div className={styles.fundsRow} style={{ background: '#f5f6f0' }}>
            <span className={styles.fundsIcon}>{'\uD83D\uDCF1'}</span>
            <span className={styles.fundsLabel}>Digital Wallets</span>
            <span className={styles.currencySign}>{'\u20B1'}</span>
            <input
              type="number"
              className={styles.fundsInput}
              placeholder="0"
              step="0.01"
              value={monthlyFinance.digitalWallet || ''}
              onChange={(e) => handleDigitalChange(e.target.value)}
              disabled={isPastDay}
            />
          </div>
        </div>
      </div>

      {/* ---- Monthly Summary (Starting Budget / Month Spent) ---- */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryBox} style={{ background: 'var(--accent-light)' }}>
          <div className={styles.summaryBoxLabel} style={{ color: 'var(--accent)' }}>
            Starting Budget
          </div>
          <div className={styles.summaryBoxValue} style={{ color: 'var(--accent-dark)' }}>
            {formatPeso(startingBudget)}
          </div>
        </div>
        <div className={styles.summaryBox} style={{ background: '#e8eddf' }}>
          <div className={styles.summaryBoxLabel} style={{ color: '#6b7c3f' }}>
            Month Spent
          </div>
          <div className={styles.summaryBoxValue} style={{ color: '#6b7c3f' }}>
            {formatPeso(totalMonthSpent)}
          </div>
        </div>
      </div>

      {/* ---- Daily Rolling Balance ---- */}
      <DailyBalanceDisplay
        todayAvailable={todayAvailable}
        remaining={remaining}
        note={availableNote}
      />

      {/* ---- Close Out Month ---- */}
      <div className={styles.closeOutBtnWrap}>
        <CloseOutMonthPanel
          remaining={remaining}
          startingBudget={startingBudget}
          currentDate={currentDate}
          onApplyAllocations={onApplyAllocations}
          onClose={() => setCloseOutVisible(false)}
          visible={closeOutVisible}
        />
        {/* Show the button only when panel is not visible and conditions are met */}
        {!closeOutVisible && startingBudget > 0 && (
          <CloseOutButton
            currentDate={currentDate}
            dateKey={dateKey}
            onClick={() => setCloseOutVisible(true)}
          />
        )}
      </div>

      {/* ---- Day Finance Snapshot (past days only) ---- */}
      {hasSnapshot && <DayFinanceSnapshot snapshot={snapshot} />}

      {/* ---- Today's Expenses ---- */}
      <div>
        <div className={styles.expenseHeader}>
          <div className={styles.expenseTitle}>Today's Expenses</div>
          <div className={styles.expenseTodayTotal}>
            {formatPeso(todaySpent)} today
          </div>
        </div>
        <div className={styles.expenseList}>
          {expenses.map((exp, i) => (
            <ExpenseRow
              key={i}
              expense={exp}
              onChange={(updates) => handleExpenseChange(i, updates)}
              onRemove={() => handleExpenseRemove(i)}
              disabled={isPastDay}
            />
          ))}
        </div>
        {!isPastDay && (
          <button
            className={cardStyles.addBtn}
            onClick={handleAddExpense}
            type="button"
          >
            + Add expense
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Renders the "Close Out Month" button when the month is not yet closed.
 * Hidden if the month is already closed (handled inside CloseOutMonthPanel).
 */
function CloseOutButton({ currentDate, dateKey, onClick }) {
  const { closedMonths } = useStoreContext();
  const monthKey = getMonthKey(dateKey);
  const alreadyClosed = closedMonths.includes(monthKey);

  if (alreadyClosed) return null;

  return (
    <button
      className={styles.closeOutBtn}
      onClick={onClick}
      type="button"
    >
      {'\uD83D\uDCCB'} Close Out Month & Allocate Remaining
    </button>
  );
}
