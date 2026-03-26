import { useState, useMemo } from 'react';
import { cacheGet } from '../../../services/cache';
import { getDateKey, getWeekMonday } from '../../../services/dateUtils';
import { exportWeeklyPDF } from '../../../services/pdfExport';
import styles from './ReportsTab.module.css';

const MOOD_EMOJIS = ['\uD83D\uDE2B', '\uD83D\uDE15', '\uD83D\uDE0A', '\uD83D\uDE04', '\uD83E\uDD29'];
const MOOD_LABELS = ['Awful', 'Meh', 'Good', 'Great', 'Amazing'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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

function getWeekDates(mondayStr) {
  const parts = mondayStr.split('-').map(Number);
  const mon = new Date(parts[0], parts[1] - 1, parts[2]);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function countCompleted(dayData) {
  if (!dayData) return { done: 0, total: 0 };
  let done = 0;
  let total = 0;
  ['workTodos', 'healthTodos', 'personalTodos'].forEach((cat) => {
    const list = dayData[cat] || [];
    const filled = list.filter((t) => t.text && t.text.trim());
    total += filled.length;
    done += filled.filter((t) => t.checked).length;
  });
  return { done, total };
}

function sumExpenses(dayData) {
  if (!dayData || !dayData.expenses) return 0;
  return dayData.expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
}

function formatCurrency(n) {
  return '\u20B1' + (Number(n) || 0).toFixed(2);
}

function formatShortDate(date) {
  return (
    String(date.getMonth() + 1).padStart(2, '0') +
    '/' +
    String(date.getDate()).padStart(2, '0')
  );
}

export default function WeeklyReport() {
  const [weekStart, setWeekStart] = useState(() => {
    const monday = getWeekMonday(new Date());
    return monday;
  });

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const weekData = useMemo(() => {
    return weekDates.map((date) => {
      const dk = getDateKey(date);
      const data = loadDayFromCache(dk);
      return { date, dateKey: dk, data };
    });
  }, [weekDates]);

  const goToPrev = () => {
    setWeekStart((prev) => {
      const parts = prev.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() - 7);
      return getDateKey(d);
    });
  };

  const goToNext = () => {
    setWeekStart((prev) => {
      const parts = prev.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + 7);
      return getDateKey(d);
    });
  };

  // Compute aggregates
  const totals = useMemo(() => {
    let totalDone = 0;
    let totalTasks = 0;
    let totalSpent = 0;
    const moodCounts = {};
    let firstWeight = null;
    let lastWeight = null;
    let firstWeightUnit = 'kg';
    let lastWeightUnit = 'kg';
    const categoryExpenses = {};

    weekData.forEach(({ data }) => {
      if (!data) return;

      const tasks = countCompleted(data);
      totalDone += tasks.done;
      totalTasks += tasks.total;

      const spent = sumExpenses(data);
      totalSpent += spent;

      if (data.mood >= 0) {
        moodCounts[data.mood] = (moodCounts[data.mood] || 0) + 1;
      }

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

      (data.expenses || []).forEach((e) => {
        const amt = parseFloat(e.amount) || 0;
        if (amt > 0) {
          const cat = e.category || 'Uncategorized';
          categoryExpenses[cat] = (categoryExpenses[cat] || 0) + amt;
        }
      });
    });

    const daysWithData = weekData.filter((d) => d.data).length;
    const avgDaily = daysWithData > 0 ? totalSpent / daysWithData : 0;

    // Sort categories by total descending
    const topCategories = Object.entries(categoryExpenses)
      .sort((a, b) => b[1] - a[1]);

    return {
      totalDone,
      totalTasks,
      totalSpent,
      avgDaily,
      moodCounts,
      firstWeight,
      lastWeight,
      firstWeightUnit,
      lastWeightUnit,
      topCategories,
      daysWithData,
    };
  }, [weekData]);

  const mondayDate = weekDates[0];
  const sundayDate = weekDates[6];
  const weekLabel =
    formatShortDate(mondayDate) +
    ' - ' +
    formatShortDate(sundayDate) +
    ', ' +
    sundayDate.getFullYear();

  const hasAnyData = totals.daysWithData > 0;

  return (
    <>
      <div className={styles.navSelector}>
        <button className={styles.navBtn} onClick={goToPrev}>{'\u25C0'}</button>
        <span className={styles.navLabel}>Week: {weekLabel}</span>
        <button className={styles.navBtn} onClick={goToNext}>{'\u25B6'}</button>
        <button className={styles.exportBtn} onClick={() => exportWeeklyPDF(weekLabel, weekData.map(d => ({ ...d, hasData: !!d.data })))}>
          {'\uD83D\uDCE4'} Export PDF
        </button>
      </div>

      {!hasAnyData ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>{'\uD83D\uDCC5'}</div>
          <p>No data recorded for this week.</p>
        </div>
      ) : (
        <>
          {/* Weekly totals */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon} style={{ background: 'var(--accent-light)' }}>{'\uD83D\uDCCA'}</span>
              Weekly Summary
            </div>
            <div className={styles.summaryGrid}>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Tasks Done</div>
                <div className={styles.statValue}>{totals.totalDone}/{totals.totalTasks}</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Total Spent</div>
                <div className={styles.statValue}>{formatCurrency(totals.totalSpent)}</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Avg Daily Spend</div>
                <div className={styles.statValue}>{formatCurrency(totals.avgDaily)}</div>
              </div>
            </div>
            {totals.totalTasks > 0 && (
              <>
                <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 4 }}>
                  Task completion: {totals.totalTasks > 0 ? Math.round((totals.totalDone / totals.totalTasks) * 100) : 0}%
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${totals.totalTasks > 0 ? (totals.totalDone / totals.totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Day-by-day breakdown */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon} style={{ background: 'var(--olive-light)' }}>{'\uD83D\uDCC6'}</span>
              Day by Day
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {weekData.map(({ date, data }, i) => {
                const tasks = data ? countCompleted(data) : { done: 0, total: 0 };
                const spent = data ? sumExpenses(data) : 0;
                const mood = data && data.mood >= 0 ? data.mood : -1;

                return (
                  <div key={i} className={styles.weekDayRow}>
                    <span className={styles.weekDayName}>{DAY_SHORT[i]}</span>
                    <span className={styles.weekDayTasks}>
                      {data ? `${tasks.done}/${tasks.total} tasks` : '\u2014 no data'}
                    </span>
                    <span className={styles.weekDaySpent}>
                      {data ? formatCurrency(spent) : '\u2014'}
                    </span>
                    <span className={styles.weekDayMood}>
                      {mood >= 0 ? MOOD_EMOJIS[mood] : '\u2014'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weight trend */}
          {totals.firstWeight !== null && totals.lastWeight !== null && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon} style={{ background: 'var(--khaki-light)' }}>{'\u2696\uFE0F'}</span>
                Weight Trend
              </div>
              <div className={styles.summaryGrid2}>
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>Start of Week</div>
                  <div className={styles.statValue}>{totals.firstWeight} {totals.firstWeightUnit}</div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>End of Week</div>
                  <div className={styles.statValue}>{totals.lastWeight} {totals.lastWeightUnit}</div>
                </div>
              </div>
              {totals.firstWeight !== totals.lastWeight && (
                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: totals.lastWeight < totals.firstWeight ? 'var(--accent)' : '#8b3a3a' }}>
                    {totals.lastWeight < totals.firstWeight ? '\u25BC' : '\u25B2'}{' '}
                    {Math.abs(totals.lastWeight - totals.firstWeight).toFixed(1)} {totals.lastWeightUnit}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mood distribution */}
          {Object.keys(totals.moodCounts).length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon} style={{ background: 'var(--rose-light)' }}>{'\uD83D\uDE0A'}</span>
                Mood Distribution
              </div>
              <div className={styles.moodDistribution}>
                {[0, 1, 2, 3, 4].map((m) => (
                  totals.moodCounts[m] ? (
                    <div key={m} className={styles.moodDistItem}>
                      <span className={styles.moodDistEmoji}>{MOOD_EMOJIS[m]}</span>
                      <span className={styles.moodDistCount}>{totals.moodCounts[m]}</span>
                      <span className={styles.moodDistLabel}>{MOOD_LABELS[m]}</span>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          )}

          {/* Top expense categories */}
          {totals.topCategories.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon} style={{ background: 'var(--gold-light)' }}>{'\uD83D\uDCB3'}</span>
                Top Expenses by Category
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className={styles.textRight}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.topCategories.map(([cat, amt], i) => (
                    <tr key={i}>
                      <td>{cat}</td>
                      <td className={styles.textRight}>{formatCurrency(amt)}</td>
                    </tr>
                  ))}
                  <tr className={styles.totalRow}>
                    <td>Total</td>
                    <td className={styles.textRight}>{formatCurrency(totals.totalSpent)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
