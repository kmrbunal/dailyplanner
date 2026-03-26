import { useState, useMemo, useCallback } from 'react';
import { cacheGet } from '../../../services/cache';
import { getDateKey, formatDate } from '../../../services/dateUtils';
import { exportDailyPDF } from '../../../services/pdfExport';
import styles from './ReportsTab.module.css';

const MOOD_EMOJIS = ['\uD83D\uDE2B', '\uD83D\uDE15', '\uD83D\uDE0A', '\uD83D\uDE04', '\uD83E\uDD29'];
const MOOD_LABELS = ['Awful', 'Meh', 'Good', 'Great', 'Amazing'];
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

function countCompleted(todos) {
  if (!todos || !Array.isArray(todos)) return { done: 0, total: 0 };
  const filled = todos.filter((t) => t.text && t.text.trim());
  return {
    done: filled.filter((t) => t.checked).length,
    total: filled.length,
  };
}

function sumExpenses(expenses) {
  if (!expenses || !Array.isArray(expenses)) return 0;
  return expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
}

function formatCurrency(n) {
  return '\u20B1' + (Number(n) || 0).toFixed(2);
}

function mealItems(meals) {
  if (!meals || !Array.isArray(meals)) return [];
  return meals.filter((m) => m.food && m.food.trim());
}

export default function DailyReport() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateKey = useMemo(() => getDateKey(selectedDate), [selectedDate]);
  const rawData = useMemo(() => loadDayFromCache(dateKey), [dateKey]);

  const dayData = rawData || {};
  const hasData = !!rawData;

  const goToPrev = () => {
    setSelectedDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() - 1);
      return n;
    });
  };

  const goToNext = () => {
    setSelectedDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + 1);
      return n;
    });
  };

  const work = countCompleted(dayData.workTodos);
  const health = countCompleted(dayData.healthTodos);
  const personal = countCompleted(dayData.personalTodos);
  const totalDone = work.done + health.done + personal.done;
  const totalTasks = work.total + health.total + personal.total;

  const waterCount = dayData.water ? dayData.water.filter(Boolean).length : 0;
  const totalExpenses = sumExpenses(dayData.expenses);
  const fs = dayData.dailyFinanceSummary || {};

  const priorities = (dayData.topPriorities || []).filter((p) => p && p.trim());
  const gratitudes = (dayData.gratitude || []).filter((g) => g && g.trim());
  const learningItems = (dayData.learning || []).filter((l) => l.text && l.text.trim());
  const expenses = (dayData.expenses || []).filter((e) => e.amount && parseFloat(e.amount));

  const breakfast = mealItems(dayData.mealBreakfast);
  const lunch = mealItems(dayData.mealLunch);
  const dinner = mealItems(dayData.mealDinner);
  const snacks = mealItems(dayData.mealSnacks);
  const hasMeals = breakfast.length + lunch.length + dinner.length + snacks.length > 0;

  return (
    <>
      <div className={styles.navSelector}>
        <button className={styles.navBtn} onClick={goToPrev}>{'\u25C0'}</button>
        <span className={styles.navLabel}>{formatDate(selectedDate)}</span>
        <button className={styles.navBtn} onClick={goToNext}>{'\u25B6'}</button>
        <button className={styles.exportBtn} onClick={() => exportDailyPDF(dateKey, formatDate(selectedDate), dayData)}>
          {'\uD83D\uDCE4'} Export PDF
        </button>
      </div>

      {/* Overview */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon} style={{ background: 'var(--accent-light)' }}>{'\uD83D\uDCCA'}</span>
          Daily Overview
        </div>
        <div className={styles.summaryGrid}>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>Tasks Done</div>
            <div className={styles.statValue}>{totalDone}/{totalTasks}</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>Water</div>
            <div className={styles.statValue}>{waterCount}/8</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>Mood</div>
            <div className={styles.statValue}>
              {dayData.mood >= 0 ? MOOD_EMOJIS[dayData.mood] : '\u2014'}
            </div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>Total Spent</div>
            <div className={styles.statValue}>{formatCurrency(totalExpenses)}</div>
          </div>
          {dayData.weight ? (
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Weight</div>
              <div className={styles.statValue}>{dayData.weight} {dayData.weightUnit || 'kg'}</div>
            </div>
          ) : null}
          {dayData.mood >= 0 ? (
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Feeling</div>
              <div className={styles.statValueSmall}>{MOOD_LABELS[dayData.mood]}</div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Task breakdown */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon} style={{ background: 'var(--olive-light)' }}>{'\u2705'}</span>
          Tasks
        </div>
        <div className={styles.summaryGrid}>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>Work</div>
            <div className={styles.statValue}>{work.done}/{work.total}</div>
          </div>
          <div className={styles.statBoxGold}>
            <div className={styles.statLabel}>Health</div>
            <div className={styles.statValue}>{health.done}/{health.total}</div>
          </div>
          <div className={styles.statBoxRose}>
            <div className={styles.statLabel}>Personal</div>
            <div className={styles.statValue}>{personal.done}/{personal.total}</div>
          </div>
        </div>
        {totalTasks > 0 && (
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${(totalDone / totalTasks) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Top priorities */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon} style={{ background: 'var(--gold-light)' }}>{'\uD83C\uDFAF'}</span>
          Top Priorities
        </div>
        {priorities.length > 0 ? (
          <ul className={styles.itemList}>
            {priorities.map((p, i) => (
              <li key={i}>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{i + 1}.</span> {p}
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptyField}>No priorities set</div>
        )}
      </div>

      {/* Water tracker */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon} style={{ background: '#d0e8f2' }}>{'\uD83D\uDCA7'}</span>
          Water Intake
        </div>
        <div className={styles.waterRow}>
          {(dayData.water || []).map((filled, i) => (
            <div key={i} className={filled ? styles.waterFilled : styles.waterEmpty}>
              {filled ? '\uD83D\uDCA7' : '\u25CB'}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-light)' }}>
          {waterCount} of 8 glasses
        </div>
      </div>

      {/* Expenses */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon} style={{ background: 'var(--gold-light)' }}>{'\uD83D\uDCB0'}</span>
          Expenses
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Category</th>
              <th className={styles.textRight}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length > 0 ? (
              expenses.map((e, i) => (
                <tr key={i}>
                  <td>{e.category || 'Uncategorized'}</td>
                  <td className={styles.textRight}>{formatCurrency(e.amount)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-light)', fontStyle: 'italic' }}>
                  No expenses recorded
                </td>
              </tr>
            )}
            <tr className={styles.totalRow}>
              <td>Total</td>
              <td className={styles.textRight}>{formatCurrency(totalExpenses)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Finance summary */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon} style={{ background: 'var(--accent-light)' }}>{'\uD83C\uDFE6'}</span>
          Finance Summary
        </div>
        <div className={styles.financeRow}>
          <span className={styles.financeLabel}>Pool Carried</span>
          <span className={styles.financeValue}>{formatCurrency(fs.poolCarried)}</span>
        </div>
        <div className={styles.financeRow}>
          <span className={styles.financeLabel}>Daily Allocation</span>
          <span className={styles.financeValue}>{formatCurrency(fs.dailyAllocation)}</span>
        </div>
        <div className={styles.financeRow}>
          <span className={styles.financeLabel}>Extra Deposit</span>
          <span className={styles.financeValue}>{formatCurrency(fs.extraDeposit)}</span>
        </div>
        <div className={styles.financeRow}>
          <span className={styles.financeLabel}>Available Today</span>
          <span className={styles.financeValue}>{formatCurrency(fs.todayAvailable)}</span>
        </div>
        <div className={styles.financeRow}>
          <span className={styles.financeLabel}>Spent Today</span>
          <span className={styles.financeValue}>{formatCurrency(fs.todaySpent)}</span>
        </div>
        <div className={styles.financeRow}>
          <span className={styles.financeLabel}>Remaining</span>
          <span
            className={styles.financeValue}
            style={{ color: (fs.remaining || 0) < 0 ? '#8b3a3a' : 'var(--accent-dark)' }}
          >
            {formatCurrency(fs.remaining)}
          </span>
        </div>
      </div>

      {/* Meals */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon} style={{ background: 'var(--olive-light)' }}>{'\uD83C\uDF7D\uFE0F'}</span>
          Meals
        </div>
        {hasMeals ? (
          <>
            {[
              { label: 'Breakfast', items: breakfast, icon: '\uD83C\uDF73' },
              { label: 'Lunch', items: lunch, icon: '\uD83C\uDF5B' },
              { label: 'Dinner', items: dinner, icon: '\uD83C\uDF5D' },
              { label: 'Snacks', items: snacks, icon: '\uD83C\uDF6A' },
            ].map(({ label, items, icon }) =>
              items.length > 0 ? (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>
                    {icon} {label}
                  </div>
                  <ul className={styles.itemList}>
                    {items.map((m, i) => (
                      <li key={i}>
                        {m.food}
                        {m.portion ? (
                          <span style={{ color: 'var(--text-light)', marginLeft: 6, fontSize: 11 }}>
                            ({m.portion})
                          </span>
                        ) : null}
                        {m.cal ? (
                          <span style={{ color: 'var(--gold)', marginLeft: 6, fontSize: 11 }}>
                            {m.cal} cal
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}
            {dayData.mealNotes ? (
              <div className={styles.notesExcerpt} style={{ marginTop: 8 }}>
                <strong>Meal Notes:</strong> {dayData.mealNotes}
              </div>
            ) : null}
          </>
        ) : (
          <div className={styles.emptyField}>No meals recorded</div>
        )}
      </div>

      {/* Gratitude */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon} style={{ background: 'var(--rose-light)' }}>{'\uD83D\uDE4F'}</span>
          Gratitude
        </div>
        {gratitudes.length > 0 ? (
          <ul className={styles.itemList}>
            {gratitudes.map((g, i) => (
              <li key={i}>
                <span style={{ color: 'var(--rose)' }}>{'\u2764\uFE0F'}</span> {g}
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptyField}>No gratitude entries</div>
        )}
      </div>

      {/* Learning */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon} style={{ background: 'var(--khaki-light)' }}>{'\uD83D\uDCDA'}</span>
          Learning
        </div>
        {learningItems.length > 0 ? (
          <ul className={styles.itemList}>
            {learningItems.map((l, i) => (
              <li key={i}>
                <span style={{ fontSize: 16 }}>{l.emoji || '\uD83D\uDCD6'}</span>
                <span>{l.text}</span>
                <span className={styles.badge} style={{ marginLeft: 'auto' }}>
                  {l.status || 'In Progress'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptyField}>No learning items</div>
        )}
      </div>

      {/* Notes */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon} style={{ background: 'var(--bg)' }}>{'\uD83D\uDCDD'}</span>
          Notes
        </div>
        <div className={styles.notesExcerpt}>
          {dayData.notes || <span className={styles.emptyField}>No notes</span>}
        </div>
      </div>

      {/* Finance notes */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon} style={{ background: 'var(--gold-light)' }}>{'\uD83D\uDCD2'}</span>
          Finance Notes
        </div>
        <div className={styles.notesExcerpt}>
          {dayData.financeNotes || <span className={styles.emptyField}>No finance notes</span>}
        </div>
      </div>

      {!hasData && (
        <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: 'var(--text-light)', fontStyle: 'italic' }}>
          No data recorded for this date
        </div>
      )}
    </>
  );
}
