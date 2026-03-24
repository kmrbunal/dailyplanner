// Finance calculation functions
import { cacheGet, cacheKeys } from './cache';
import { getDateKey, getMonthKey } from './dateUtils';

const STORAGE_PREFIX = 'dailyPlanner_';

/**
 * Gets all saved days for the same month as the given dateKey, sorted by date.
 * Each entry contains the date string, total spent, and the saved finance snapshot.
 *
 * @param {string} dateKey - A "YYYY-MM-DD" date key
 * @returns {Array<{date: string, spent: number, snapshot: object|null}>}
 */
export function getMonthDaysSorted(dateKey) {
  const monthPrefix = dateKey.substring(0, 7);
  const days = [];

  cacheKeys().forEach(k => {
    if (k.startsWith(STORAGE_PREFIX)) {
      const dateStr = k.replace(STORAGE_PREFIX, '');
      if (
        dateStr.startsWith(monthPrefix) &&
        dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
      ) {
        try {
          const dayData = JSON.parse(cacheGet(k));
          if (dayData) {
            let spent = 0;
            if (dayData.expenses) {
              dayData.expenses.forEach(e => {
                spent += parseFloat(e.amount) || 0;
              });
            }
            days.push({
              date: dateStr,
              spent: spent,
              snapshot: dayData.dailyFinanceSummary || null
            });
          }
        } catch (e) {
          // skip malformed data
        }
      }
    }
  });

  return days.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Walks the chain of days prior to dateKey to find the remaining balance.
 * Uses saved snapshots when available, otherwise subtracts each day's expenses
 * from the running balance.
 *
 * @param {string} dateKey - The current "YYYY-MM-DD" date key
 * @param {number} startingBudget - The user's total starting budget for the month
 * @returns {number|null} The remaining balance from the previous day, or null if no prior days
 */
export function getPreviousDayRemaining(dateKey, startingBudget) {
  const days = getMonthDaysSorted(dateKey).filter(d => d.date < dateKey);
  if (days.length === 0) return null;

  // Walk forward from the first day, carrying remaining forward
  let balance = startingBudget;
  for (const day of days) {
    // If this day has a snapshot, trust it
    if (
      day.snapshot &&
      day.snapshot.remainingAfterToday !== undefined
    ) {
      balance = day.snapshot.remainingAfterToday;
    } else {
      // No snapshot — compute: balance from previous day minus this day's expenses
      balance = balance - day.spent;
    }
  }

  return balance;
}

/**
 * Sums all expenses from every day this month EXCEPT the given dateKey.
 * Used for the month-total display.
 *
 * @param {string} dateKey - The current "YYYY-MM-DD" date key (excluded from total)
 * @returns {number} Total expenses from other days this month
 */
export function getMonthlyExpenseTotal(dateKey) {
  const monthKey = getMonthKey(dateKey);
  const year = monthKey.split('-')[0];
  const month = monthKey.split('-')[1];
  let totalExpenses = 0;

  cacheKeys().forEach(k => {
    if (k.startsWith(STORAGE_PREFIX)) {
      const dateStr = k.replace(STORAGE_PREFIX, '');
      if (
        dateStr.startsWith(year + '-' + month) &&
        dateStr !== dateKey &&
        dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
      ) {
        try {
          const dayData = JSON.parse(cacheGet(k));
          if (dayData && dayData.expenses) {
            dayData.expenses.forEach(e => {
              totalExpenses += parseFloat(e.amount) || 0;
            });
          }
        } catch (e) {
          // skip malformed data
        }
      }
    }
  });

  return totalExpenses;
}

/**
 * Returns the available balance for the given day.
 *
 * Priority order:
 * 1. If cachedValue is provided and matches the dateKey, return it immediately.
 * 2. If today already has a saved snapshot with availableAtStart, use that.
 * 3. If there are prior days this month, walk the chain via getPreviousDayRemaining.
 * 4. Otherwise, fall back to startingBudget (first day of the month).
 *
 * @param {string} dateKey - The current "YYYY-MM-DD" date key
 * @param {number} startingBudget - The user's total starting budget (cash + digital)
 * @param {number|null} [cachedValue=null] - A previously cached value for this dateKey
 * @returns {number} The available balance for today
 */
export function getTodayAvailable(dateKey, startingBudget, cachedValue) {
  // Return cache if already locked
  if (cachedValue !== null && cachedValue !== undefined) {
    return cachedValue;
  }

  // Check if today already has a saved snapshot with locked availableAtStart
  try {
    const existing = JSON.parse(cacheGet(STORAGE_PREFIX + dateKey));
    if (
      existing &&
      existing.dailyFinanceSummary &&
      existing.dailyFinanceSummary.availableAtStart !== undefined
    ) {
      return existing.dailyFinanceSummary.availableAtStart;
    }
  } catch (e) {
    // skip
  }

  // No saved snapshot — compute live
  const prevRemaining = getPreviousDayRemaining(dateKey, startingBudget);
  if (prevRemaining !== null) {
    // Previous day has data — this value is stable
    return prevRemaining;
  }

  // First day of the month — use startingBudget directly
  return startingBudget;
}
