import { useState, useMemo, useCallback, useEffect } from 'react';
import { useDayContext } from '../../../context/DayContext';
import { useStoreContext } from '../../../context/StoreContext';
import { getDateKey, getMonthKey } from '../../../services/dateUtils';
import {
  computeDayBudget,
  getMonthlyExpenseTotal,
  getMonthlyExtraIncome,
  getDaysInMonth,
  getDayOfMonth,
  getEqualDailyAmount,
} from '../../../services/financeCalc';
import DailyBalanceDisplay from './DailyBalanceDisplay';
import DayFinanceSnapshot from './DayFinanceSnapshot';
import ExpenseRow from './ExpenseRow';
import CloseOutMonthPanel from './CloseOutMonthPanel';
import BudgetDistribution from './BudgetDistribution';
import cardStyles from '../../common/Card.module.css';
import styles from './FinanceTab.module.css';

export default function MonthlyBudgetCard({ onApplyAllocations }) {
  const { dayData, dispatch, currentDate } = useDayContext();
  const { monthlyFinance, saveMonthlyFinance, synced } = useStoreContext();

  const [closeOutVisible, setCloseOutVisible] = useState(false);

  const dateKey = useMemo(() => getDateKey(currentDate), [currentDate]);
  const todayKey = useMemo(() => getDateKey(new Date()), []);
  const isPastDay = dateKey < todayKey;
  const monthKey = useMemo(() => getMonthKey(dateKey), [dateKey]);

  if (!synced) {
    return (
      <div className={cardStyles.card} style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-light)' }}>
        Loading finance data...
      </div>
    );
  }

  // ---- Monthly budget ----
  const cashOnHand = parseFloat(monthlyFinance.cashOnHand) || 0;
  const digitalWallet = parseFloat(monthlyFinance.digitalWallet) || 0;
  const totalMonthlyBudget = cashOnHand + digitalWallet;

  // ---- Today's expenses ----
  const expenses = dayData.expenses || [{ category: '', amount: '' }];
  const todaySpent = useMemo(() => {
    let sum = 0;
    expenses.forEach((e) => { sum += parseFloat(e.amount) || 0; });
    return sum;
  }, [expenses]);

  // ---- Extra deposit for today ----
  const extraDeposit = parseFloat(dayData.extraDeposit) || 0;

  // ---- Compute today's budget ----
  const snapshot = dayData.dailyFinanceSummary || null;
  const hasSnapshot = isPastDay && snapshot && snapshot.todayAvailable !== undefined && snapshot.todayAvailable !== 0;

  const dayBudget = useMemo(() => {
    if (hasSnapshot) {
      return {
        poolCarried: snapshot.poolCarried || 0,
        dailyAllocation: snapshot.dailyAllocation || 0,
        extraDeposit: snapshot.extraDeposit || 0,
        todayAvailable: snapshot.todayAvailable,
      };
    }
    return computeDayBudget(dateKey, monthlyFinance, extraDeposit);
  }, [hasSnapshot, snapshot, dateKey, monthlyFinance, extraDeposit]);

  const remaining = dayBudget.todayAvailable - todaySpent;

  // ---- Sync dailyFinanceSummary for auto-save ----
  useEffect(() => {
    if (isPastDay || !synced) return;
    const current = dayData.dailyFinanceSummary || {};
    if (
      current.todayAvailable !== dayBudget.todayAvailable ||
      current.todaySpent !== todaySpent ||
      current.dailyAllocation !== dayBudget.dailyAllocation
    ) {
      dispatch({
        type: 'SET_FIELD',
        field: 'dailyFinanceSummary',
        value: {
          poolCarried: dayBudget.poolCarried,
          dailyAllocation: dayBudget.dailyAllocation,
          extraDeposit: dayBudget.extraDeposit,
          todayAvailable: dayBudget.todayAvailable,
          todaySpent,
          remaining: dayBudget.todayAvailable - todaySpent,
        },
      });
    }
  }, [dayBudget, todaySpent, isPastDay, synced, dispatch]);

  // ---- Month totals ----
  const monthSpentOtherDays = useMemo(() => getMonthlyExpenseTotal(dateKey), [dateKey]);
  const totalMonthSpent = monthSpentOtherDays + todaySpent;
  const totalExtraIncome = useMemo(() => getMonthlyExtraIncome(dateKey, extraDeposit), [dateKey, extraDeposit]);
  const effectiveMonthlyBudget = totalMonthlyBudget + totalExtraIncome;

  // ---- Available note ----
  const availableNote = useMemo(() => {
    if (hasSnapshot) return 'Balance at start of this day';
    const parts = [];
    if (dayBudget.poolCarried > 0) parts.push('Pool: \u20B1' + dayBudget.poolCarried.toFixed(0));
    if (dayBudget.dailyAllocation > 0) parts.push('Alloc: \u20B1' + dayBudget.dailyAllocation.toFixed(0));
    if (dayBudget.extraDeposit > 0) parts.push('Extra: \u20B1' + dayBudget.extraDeposit.toFixed(0));
    return parts.length > 0 ? parts.join(' + ') : 'No budget allocated yet';
  }, [hasSnapshot, dayBudget]);

  // ---- Handlers ----
  const handleCashChange = useCallback((value) => {
    saveMonthlyFinance({ ...monthlyFinance, cashOnHand: value }, monthKey);
  }, [monthlyFinance, saveMonthlyFinance, monthKey]);

  const handleDigitalChange = useCallback((value) => {
    saveMonthlyFinance({ ...monthlyFinance, digitalWallet: value }, monthKey);
  }, [monthlyFinance, saveMonthlyFinance, monthKey]);

  const handleExtraDepositChange = useCallback((e) => {
    dispatch({ type: 'SET_FIELD', field: 'extraDeposit', value: e.target.value });
  }, [dispatch]);

  const handleExpenseChange = useCallback((index, updates) => {
    dispatch({ type: 'SET_EXPENSE', index, updates });
  }, [dispatch]);

  const handleExpenseRemove = useCallback((index) => {
    const updated = expenses.filter((_, i) => i !== index);
    dispatch({
      type: 'SET_FIELD',
      field: 'expenses',
      value: updated.length > 0 ? updated : [{ category: '', amount: '' }],
    });
  }, [expenses, dispatch]);

  const handleAddExpense = useCallback(() => {
    dispatch({
      type: 'SET_FIELD',
      field: 'expenses',
      value: [...expenses, { category: '', amount: '' }],
    });
  }, [expenses, dispatch]);

  const handleDistributionChange = useCallback((updates) => {
    saveMonthlyFinance({ ...monthlyFinance, ...updates }, monthKey);
  }, [monthlyFinance, saveMonthlyFinance, monthKey]);

  const fmt = (v) => '\u20B1' + v.toFixed(2);

  return (
    <div className={cardStyles.card}>
      <div className={cardStyles.cardTitle} style={{ color: 'var(--accent)' }}>
        <span className={cardStyles.icon} style={{ background: 'var(--accent-light)' }}>
          {'\uD83D\uDCB0'}
        </span>
        Monthly Finance Tracker
      </div>

      {/* Monthly Starting Funds */}
      <div style={{ marginBottom: 16 }}>
        <div className={styles.sectionLabel}>Monthly Starting Funds</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className={styles.fundsRow} style={{ background: 'var(--accent-light)' }}>
            <span className={styles.fundsIcon}>{'\uD83D\uDCB5'}</span>
            <span className={styles.fundsLabel}>Cash on Hand</span>
            <span className={styles.currencySign}>{'\u20B1'}</span>
            <input type="number" className={styles.fundsInput} placeholder="0" step="0.01"
              value={monthlyFinance.cashOnHand || ''} onChange={(e) => handleCashChange(e.target.value)} disabled={isPastDay} />
          </div>
          <div className={styles.fundsRow} style={{ background: '#f5f6f0' }}>
            <span className={styles.fundsIcon}>{'\uD83D\uDCF1'}</span>
            <span className={styles.fundsLabel}>Digital Wallets</span>
            <span className={styles.currencySign}>{'\u20B1'}</span>
            <input type="number" className={styles.fundsInput} placeholder="0" step="0.01"
              value={monthlyFinance.digitalWallet || ''} onChange={(e) => handleDigitalChange(e.target.value)} disabled={isPastDay} />
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className={styles.summaryGrid} style={{ gridTemplateColumns: totalExtraIncome > 0 ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr' }}>
        <div className={styles.summaryBox} style={{ background: 'var(--accent-light)' }}>
          <div className={styles.summaryBoxLabel} style={{ color: 'var(--accent)' }}>Base Budget</div>
          <div className={styles.summaryBoxValue} style={{ color: 'var(--accent-dark)' }}>{fmt(totalMonthlyBudget)}</div>
        </div>
        {totalExtraIncome > 0 && (
          <div className={styles.summaryBox} style={{ background: '#f0f0e0' }}>
            <div className={styles.summaryBoxLabel} style={{ color: '#8b7d3c' }}>+ Extra Income</div>
            <div className={styles.summaryBoxValue} style={{ color: '#8b7d3c' }}>{fmt(totalExtraIncome)}</div>
          </div>
        )}
        <div className={styles.summaryBox} style={{ background: '#e0eae0' }}>
          <div className={styles.summaryBoxLabel} style={{ color: 'var(--accent-dark)' }}>Total Budget</div>
          <div className={styles.summaryBoxValue} style={{ color: 'var(--accent-dark)', fontWeight: 800 }}>{fmt(effectiveMonthlyBudget)}</div>
        </div>
        <div className={styles.summaryBox} style={{ background: '#e8eddf' }}>
          <div className={styles.summaryBoxLabel} style={{ color: '#6b7c3f' }}>Month Spent</div>
          <div className={styles.summaryBoxValue} style={{ color: '#6b7c3f' }}>{fmt(totalMonthSpent)}</div>
        </div>
      </div>

      {/* Budget Distribution */}
      {totalMonthlyBudget > 0 && !isPastDay && (
        <BudgetDistribution
          totalBudget={totalMonthlyBudget}
          dateKey={dateKey}
          monthlyFinance={monthlyFinance}
          onChange={handleDistributionChange}
        />
      )}

      {/* Daily Budget Breakdown */}
      <div style={{ margin: '16px 0', padding: '14px', background: 'linear-gradient(135deg, #eef4e8, #e5eddb)', borderRadius: '12px', border: '1px solid #c0d0a8' }}>
        <div className={styles.sectionLabel} style={{ marginBottom: 10 }}>Today's Budget Pool</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 100, textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
            <div style={{ fontSize: 9, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Carried Over</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-dark)' }}>{fmt(dayBudget.poolCarried)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-light)', fontSize: 16 }}>+</div>
          <div style={{ flex: 1, minWidth: 100, textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
            <div style={{ fontSize: 9, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Allocation</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#6b7c3f' }}>{fmt(dayBudget.dailyAllocation)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-light)', fontSize: 16 }}>+</div>
          <div style={{ flex: 1, minWidth: 100, textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
            <div style={{ fontSize: 9, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>+ Income</div>
            {isPastDay ? (
              <div style={{ fontSize: 15, fontWeight: 700, color: '#8b7d3c' }}>{fmt(dayBudget.extraDeposit)}</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{'\u20B1'}</span>
                <input type="number" placeholder="0" step="0.01" min="0"
                  title="Extra income for today (freelance, gifts, refunds, etc.)"
                  style={{ width: 70, textAlign: 'center', fontSize: 14, fontWeight: 700, border: 'none', outline: 'none', background: 'transparent', color: '#8b7d3c', fontFamily: 'inherit' }}
                  value={dayData.extraDeposit || ''} onChange={handleExtraDepositChange} />
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '8px 12px', background: 'var(--accent)', borderRadius: 8 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 }}>Today's Available</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>{fmt(dayBudget.todayAvailable)}</div>
        </div>
      </div>

      {/* Daily Balance Display */}
      <DailyBalanceDisplay todayAvailable={dayBudget.todayAvailable} remaining={remaining} note={availableNote} />

      {/* Close Out Month */}
      <div className={styles.closeOutBtnWrap}>
        <CloseOutMonthPanel remaining={remaining} startingBudget={totalMonthlyBudget} currentDate={currentDate}
          onApplyAllocations={onApplyAllocations} onClose={() => setCloseOutVisible(false)} visible={closeOutVisible} />
        {!closeOutVisible && totalMonthlyBudget > 0 && (
          <CloseOutButton dateKey={dateKey} onClick={() => setCloseOutVisible(true)} />
        )}
      </div>

      {/* Snapshot (past days) */}
      {hasSnapshot && <DayFinanceSnapshot snapshot={dayData.dailyFinanceSummary} />}

      {/* Today's Expenses */}
      <div>
        <div className={styles.expenseHeader}>
          <div className={styles.expenseTitle}>Today's Expenses</div>
          <div className={styles.expenseTodayTotal}>{fmt(todaySpent)} today</div>
        </div>
        <div className={styles.expenseList}>
          {expenses.map((exp, i) => (
            <ExpenseRow key={i} expense={exp} onChange={(updates) => handleExpenseChange(i, updates)}
              onRemove={() => handleExpenseRemove(i)} disabled={isPastDay} />
          ))}
        </div>
        {!isPastDay && (
          <button className={cardStyles.addBtn} onClick={handleAddExpense} type="button">+ Add expense</button>
        )}
      </div>
    </div>
  );
}

function CloseOutButton({ dateKey, onClick }) {
  const { closedMonths } = useStoreContext();
  const monthKey = getMonthKey(dateKey);
  if (closedMonths.includes(monthKey)) return null;
  return (
    <button className={styles.closeOutBtn} onClick={onClick} type="button">
      {'\uD83D\uDCCB'} Close Out Month & Allocate Remaining
    </button>
  );
}
