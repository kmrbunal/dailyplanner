import { useState, useMemo } from 'react';
import { cacheGet } from '../../../services/cache';
import { getDateKey, getMonthKey } from '../../../services/dateUtils';
import { useStoreContext } from '../../../context/StoreContext';
import { exportMonthlyPDF } from '../../../services/pdfExport';
import styles from './ReportsTab.module.css';

const MOOD_EMOJIS = ['\uD83D\uDE2B', '\uD83D\uDE15', '\uD83D\uDE0A', '\uD83D\uDE04', '\uD83E\uDD29'];
const MOOD_LABELS = ['Awful', 'Meh', 'Good', 'Great', 'Amazing'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const STORAGE_PREFIX = 'dailyPlanner_';

function loadDayFromCache(dateKey) {
  const raw = cacheGet(STORAGE_PREFIX + dateKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function formatCurrency(n) {
  return '\u20B1' + (Number(n) || 0).toFixed(2);
}

export default function MonthlyReport() {
  const { monthlyFinance, weightHistory, achievements } = useStoreContext();

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());

  const monthKey = useMemo(
    () => selectedYear + '-' + String(selectedMonth + 1).padStart(2, '0'),
    [selectedYear, selectedMonth]
  );

  const daysInMonth = useMemo(
    () => getDaysInMonth(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  // Load all days in the month from cache
  const monthDays = useMemo(() => {
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dk = monthKey + '-' + String(d).padStart(2, '0');
      const data = loadDayFromCache(dk);
      days.push({ day: d, dateKey: dk, data });
    }
    return days;
  }, [monthKey, daysInMonth]);

  const goToPrev = () => {
    setSelectedMonth((m) => {
      if (m === 0) {
        setSelectedYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const goToNext = () => {
    setSelectedMonth((m) => {
      if (m === 11) {
        setSelectedYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  // Aggregate statistics
  const stats = useMemo(() => {
    let totalSpent = 0;
    let totalTasksDone = 0;
    let totalTasksCount = 0;
    let workDone = 0, workTotal = 0;
    let healthDone = 0, healthTotal = 0;
    let personalDone = 0, personalTotal = 0;
    const moodCounts = {};
    const categoryExpenses = {};
    const dailySpending = [];
    let firstWeight = null;
    let lastWeight = null;
    let firstWeightUnit = 'kg';
    let lastWeightUnit = 'kg';
    const learningCompleted = [];
    let daysWithData = 0;

    monthDays.forEach(({ day, data }) => {
      const daySpent = data && data.expenses
        ? data.expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
        : 0;
      dailySpending.push({ day, amount: daySpent, hasData: !!data });

      if (!data) return;
      daysWithData++;

      totalSpent += daySpent;

      // Tasks
      ['workTodos', 'healthTodos', 'personalTodos'].forEach((cat) => {
        const list = (data[cat] || []).filter((t) => t.text && t.text.trim());
        const done = list.filter((t) => t.checked).length;
        totalTasksDone += done;
        totalTasksCount += list.length;
        if (cat === 'workTodos') { workDone += done; workTotal += list.length; }
        if (cat === 'healthTodos') { healthDone += done; healthTotal += list.length; }
        if (cat === 'personalTodos') { personalDone += done; personalTotal += list.length; }
      });

      // Mood
      if (data.mood >= 0) {
        moodCounts[data.mood] = (moodCounts[data.mood] || 0) + 1;
      }

      // Weight
      if (data.weight && data.weight.toString().trim()) {
        const w = parseFloat(data.weight);
        if (!isNaN(w)) {
          if (firstWeight === null) {
            firstWeight = w;
            firstWeightUnit = data.weightUnit || 'kg';
          }
          lastWeight = w;
          lastWeightUnit = data.weightUnit || 'kg';
        }
      }

      // Expenses by category
      (data.expenses || []).forEach((e) => {
        const amt = parseFloat(e.amount) || 0;
        if (amt > 0) {
          const cat = e.category || 'Uncategorized';
          categoryExpenses[cat] = (categoryExpenses[cat] || 0) + amt;
        }
      });

      // Learning completed
      (data.learning || []).forEach((l) => {
        if (l.text && l.text.trim() && l.status === 'Completed') {
          learningCompleted.push(l);
        }
      });
    });

    // Also check store-level achievements for this month
    const monthAchievements = (achievements || []).filter((a) => {
      if (!a.date) return false;
      return a.date.startsWith(monthKey);
    });

    const topCategories = Object.entries(categoryExpenses)
      .sort((a, b) => b[1] - a[1]);

    const maxDailySpend = Math.max(...dailySpending.map((d) => d.amount), 1);

    return {
      totalSpent,
      totalTasksDone,
      totalTasksCount,
      workDone, workTotal,
      healthDone, healthTotal,
      personalDone, personalTotal,
      moodCounts,
      topCategories,
      dailySpending,
      maxDailySpend,
      firstWeight,
      lastWeight,
      firstWeightUnit,
      lastWeightUnit,
      learningCompleted,
      monthAchievements,
      daysWithData,
    };
  }, [monthDays, achievements, monthKey]);

  // Monthly finance info from store
  const mf = monthlyFinance || {};
  const baseBudget = (parseFloat(mf.cashOnHand) || 0) + (parseFloat(mf.digitalWallet) || 0);

  // Compute total extra income from all days
  const totalExtraIncome = useMemo(() => {
    let total = 0;
    monthDays.forEach(({ data }) => {
      if (data) {
        total += parseFloat(data.extraDeposit) || 0;
      }
    });
    return total;
  }, [monthDays]);

  const monthLabel = MONTH_NAMES[selectedMonth] + ' ' + selectedYear;
  const hasAnyData = stats.daysWithData > 0;

  return (
    <>
      <div className={styles.navSelector}>
        <button className={styles.navBtn} onClick={goToPrev}>{'\u25C0'}</button>
        <span className={styles.navLabel}>{monthLabel}</span>
        <button className={styles.navBtn} onClick={goToNext}>{'\u25B6'}</button>
        <button className={styles.exportBtn} onClick={() => exportMonthlyPDF(monthLabel, {
          totalBudget: baseBudget,
          totalExtraIncome,
          totalSpent: stats.totalSpent,
          days: stats.dailySpending.map(d => ({ day: d.day, spent: d.amount, tasksDone: 0, tasksTotal: 0 })),
          moodCounts: Object.values(stats.moodCounts).length === 5 ? Object.values(stats.moodCounts) : [stats.moodCounts[0]||0, stats.moodCounts[1]||0, stats.moodCounts[2]||0, stats.moodCounts[3]||0, stats.moodCounts[4]||0],
          topCategories: stats.topCategories.map(([cat, total]) => ({ category: cat, total, pct: stats.totalSpent > 0 ? Math.round(total / stats.totalSpent * 100) : 0 })),
          achievements: stats.monthAchievements || [],
        })}>
          {'\uD83D\uDCE4'} Export PDF
        </button>
      </div>

      {!hasAnyData && baseBudget <= 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>{'\uD83D\uDCC5'}</div>
          <p>No data recorded for {monthLabel}.</p>
        </div>
      ) : (
        <>
          {/* Finance overview */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon} style={{ background: 'var(--accent-light)' }}>{'\uD83C\uDFE6'}</span>
              Finance Overview
            </div>
            <div className={styles.summaryGrid}>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Base Budget</div>
                <div className={styles.statValue}>{formatCurrency(baseBudget)}</div>
              </div>
              <div className={styles.statBoxGold}>
                <div className={styles.statLabel}>Extra Income</div>
                <div className={styles.statValue}>{formatCurrency(totalExtraIncome)}</div>
              </div>
              <div className={styles.statBoxRose}>
                <div className={styles.statLabel}>Total Spent</div>
                <div className={styles.statValue}>{formatCurrency(stats.totalSpent)}</div>
              </div>
            </div>
            <div className={styles.summaryGrid2}>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Total Available</div>
                <div className={styles.statValue}>{formatCurrency(baseBudget + totalExtraIncome)}</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Remaining</div>
                <div className={styles.statValue} style={{
                  color: (baseBudget + totalExtraIncome - stats.totalSpent) < 0 ? '#8b3a3a' : 'var(--accent-dark)'
                }}>
                  {formatCurrency(baseBudget + totalExtraIncome - stats.totalSpent)}
                </div>
              </div>
            </div>
          </div>

          {/* Daily spending chart */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon} style={{ background: 'var(--gold-light)' }}>{'\uD83D\uDCB8'}</span>
              Daily Spending
            </div>
            <div className={styles.barChart}>
              {stats.dailySpending.map(({ day, amount, hasData }) => {
                const heightPx = stats.maxDailySpend > 0
                  ? Math.max((amount / stats.maxDailySpend) * 100, 0)
                  : 0;
                return (
                  <div key={day} className={styles.barCol}>
                    {amount > 0 && (
                      <span className={styles.barValue}>{Math.round(amount)}</span>
                    )}
                    <div
                      className={amount > 0 ? styles.bar : styles.barZero}
                      style={{ height: amount > 0 ? `${heightPx}px` : '2px' }}
                    />
                    <span className={styles.barLabel}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task completion */}
          {stats.totalTasksCount > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon} style={{ background: 'var(--olive-light)' }}>{'\u2705'}</span>
                Task Completion
              </div>
              <div className={styles.summaryGrid}>
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>Work</div>
                  <div className={styles.statValue}>
                    {stats.workTotal > 0 ? Math.round((stats.workDone / stats.workTotal) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                    {stats.workDone}/{stats.workTotal}
                  </div>
                </div>
                <div className={styles.statBoxGold}>
                  <div className={styles.statLabel}>Health</div>
                  <div className={styles.statValue}>
                    {stats.healthTotal > 0 ? Math.round((stats.healthDone / stats.healthTotal) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                    {stats.healthDone}/{stats.healthTotal}
                  </div>
                </div>
                <div className={styles.statBoxRose}>
                  <div className={styles.statLabel}>Personal</div>
                  <div className={styles.statValue}>
                    {stats.personalTotal > 0 ? Math.round((stats.personalDone / stats.personalTotal) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                    {stats.personalDone}/{stats.personalTotal}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>
                  Overall: {stats.totalTasksDone}/{stats.totalTasksCount} ({stats.totalTasksCount > 0 ? Math.round((stats.totalTasksDone / stats.totalTasksCount) * 100) : 0}%)
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${stats.totalTasksCount > 0 ? (stats.totalTasksDone / stats.totalTasksCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Weight trend */}
          {stats.firstWeight !== null && stats.lastWeight !== null && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon} style={{ background: 'var(--khaki-light)' }}>{'\u2696\uFE0F'}</span>
                Weight Trend
              </div>
              <div className={styles.summaryGrid2}>
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>First Recorded</div>
                  <div className={styles.statValue}>{stats.firstWeight} {stats.firstWeightUnit}</div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>Last Recorded</div>
                  <div className={styles.statValue}>{stats.lastWeight} {stats.lastWeightUnit}</div>
                </div>
              </div>
              {stats.firstWeight !== stats.lastWeight && (
                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 14, fontWeight: 600 }}>
                  <span style={{ color: stats.lastWeight < stats.firstWeight ? 'var(--accent)' : '#8b3a3a' }}>
                    {stats.lastWeight < stats.firstWeight ? '\u25BC' : '\u25B2'}{' '}
                    {Math.abs(stats.lastWeight - stats.firstWeight).toFixed(1)} {stats.lastWeightUnit}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mood distribution */}
          {Object.keys(stats.moodCounts).length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon} style={{ background: 'var(--rose-light)' }}>{'\uD83D\uDE0A'}</span>
                Mood Distribution
              </div>
              <div className={styles.moodDistribution}>
                {[0, 1, 2, 3, 4].map((m) => (
                  stats.moodCounts[m] ? (
                    <div key={m} className={styles.moodDistItem}>
                      <span className={styles.moodDistEmoji}>{MOOD_EMOJIS[m]}</span>
                      <span className={styles.moodDistCount}>{stats.moodCounts[m]}</span>
                      <span className={styles.moodDistLabel}>{MOOD_LABELS[m]}</span>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          )}

          {/* Top expense categories */}
          {stats.topCategories.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon} style={{ background: 'var(--gold-light)' }}>{'\uD83D\uDCB3'}</span>
                Top Expense Categories
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className={styles.textRight}>Total</th>
                    <th className={styles.textRight}>% of Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topCategories.map(([cat, amt], i) => (
                    <tr key={i}>
                      <td>{cat}</td>
                      <td className={styles.textRight}>{formatCurrency(amt)}</td>
                      <td className={styles.textRight}>
                        {stats.totalSpent > 0 ? Math.round((amt / stats.totalSpent) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                  <tr className={styles.totalRow}>
                    <td>Total</td>
                    <td className={styles.textRight}>{formatCurrency(stats.totalSpent)}</td>
                    <td className={styles.textRight}>100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Learning achievements */}
          {(stats.learningCompleted.length > 0 || stats.monthAchievements.length > 0) && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon} style={{ background: 'var(--khaki-light)' }}>{'\uD83C\uDFC6'}</span>
                Learning Achievements
              </div>
              {stats.learningCompleted.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                    Completed This Month
                  </div>
                  <ul className={styles.itemList}>
                    {stats.learningCompleted.map((l, i) => (
                      <li key={i}>
                        <span style={{ fontSize: 16 }}>{l.emoji || '\uD83D\uDCD6'}</span>
                        <span>{l.text}</span>
                        <span className={styles.badge} style={{ marginLeft: 'auto', background: 'var(--accent-light)', color: 'var(--accent-dark)' }}>
                          Completed
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {stats.monthAchievements.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 6 }}>
                    Achievements Logged
                  </div>
                  <ul className={styles.itemList}>
                    {stats.monthAchievements.map((a, i) => (
                      <li key={i}>
                        <span style={{ fontSize: 16 }}>{a.emoji || '\uD83C\uDFC5'}</span>
                        <span>{a.text || a.title || 'Achievement'}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
