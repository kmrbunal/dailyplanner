import { useMemo } from 'react';
import { getDaysInMonth, getEqualDailyAmount, getDayOfMonth } from '../../../services/financeCalc';
import styles from './FinanceTab.module.css';

/**
 * Budget Distribution — lets user choose how to spread the monthly budget across days.
 * Equal: same amount per day. Custom: user sets each day manually.
 */
export default function BudgetDistribution({ totalBudget, dateKey, monthlyFinance, onChange }) {
  const mode = monthlyFinance.distributionMode || 'equal';
  const daysInMonth = getDaysInMonth(dateKey);
  const equalAmount = getEqualDailyAmount(totalBudget, dateKey);
  const customAmounts = monthlyFinance.customDailyAmounts || {};
  const todayDayNum = getDayOfMonth(dateKey);

  // Sum of custom amounts to show remaining unallocated
  const customTotal = useMemo(() => {
    let sum = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      sum += parseFloat(customAmounts[d]) || 0;
    }
    return sum;
  }, [customAmounts, daysInMonth]);

  const unallocated = totalBudget - customTotal;

  return (
    <div style={{ margin: '12px 0 16px', padding: '14px', background: '#f8f8f2', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <div className={styles.sectionLabel} style={{ marginBottom: 8 }}>Daily Budget Distribution</div>

      {/* Toggle buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => onChange({ distributionMode: 'equal' })}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
            background: mode === 'equal' ? 'var(--accent)' : 'white',
            color: mode === 'equal' ? 'white' : 'var(--text)',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Equal ({'\u20B1'}{equalAmount.toFixed(0)}/day)
        </button>
        <button
          type="button"
          onClick={() => onChange({ distributionMode: 'custom' })}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
            background: mode === 'custom' ? 'var(--accent)' : 'white',
            color: mode === 'custom' ? 'white' : 'var(--text)',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Custom per day
        </button>
      </div>

      {/* Equal mode — just show the per-day amount */}
      {mode === 'equal' && (
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-light)' }}>
          {'\u20B1'}{totalBudget.toFixed(2)} ÷ {daysInMonth} days = <strong style={{ color: 'var(--accent)' }}>{'\u20B1'}{equalAmount.toFixed(2)}</strong> per day
        </div>
      )}

      {/* Custom mode — grid of day inputs */}
      {mode === 'custom' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {Array.from({ length: daysInMonth }, (_, i) => {
              const dayNum = i + 1;
              const isToday = dayNum === todayDayNum;
              return (
                <div key={dayNum} style={{
                  textAlign: 'center', padding: '4px 2px', borderRadius: 6,
                  background: isToday ? 'var(--accent-light)' : 'white',
                  border: isToday ? '1px solid var(--accent)' : '1px solid #eee',
                }}>
                  <div style={{ fontSize: 9, color: 'var(--text-light)', marginBottom: 2 }}>{dayNum}</div>
                  <input
                    type="number"
                    placeholder="0"
                    step="1"
                    min="0"
                    value={customAmounts[dayNum] || ''}
                    onChange={(e) => {
                      const updated = { ...customAmounts, [dayNum]: e.target.value };
                      onChange({ customDailyAmounts: updated });
                    }}
                    style={{
                      width: '100%', textAlign: 'center', border: 'none', outline: 'none',
                      fontSize: 11, fontWeight: 600, background: 'transparent',
                      color: 'var(--accent-dark)', fontFamily: 'inherit',
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '6px 8px',
            background: unallocated < 0 ? '#f5e0e0' : 'var(--accent-light)',
            borderRadius: 8, fontWeight: 600,
          }}>
            <span style={{ color: 'var(--text-light)' }}>Allocated: {'\u20B1'}{customTotal.toFixed(2)}</span>
            <span style={{ color: unallocated < 0 ? '#8b3a3a' : 'var(--accent)' }}>
              {unallocated < 0 ? 'Over by ' : 'Remaining: '}{'\u20B1'}{Math.abs(unallocated).toFixed(2)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
