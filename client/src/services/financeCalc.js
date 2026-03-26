// Finance calculation functions — Budget Pool model
//
// Monthly budget is set once, then distributed across days (equal or custom).
// Each day: available = poolCarriedOver + dailyAllocation + extraDeposit
// Remaining at end of day carries to next day's pool.

import { cacheGet, cacheKeys } from './cache';

const STORAGE_PREFIX = 'dailyPlanner_';

/**
 * Get the number of days in a month from a dateKey.
 * @param {string} dateKey "YYYY-MM-DD"
 * @returns {number}
 */
export function getDaysInMonth(dateKey) {
  const [y, m] = dateKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

/**
 * Get the day-of-month from a dateKey (1-indexed).
 * @param {string} dateKey "YYYY-MM-DD"
 * @returns {number}
 */
export function getDayOfMonth(dateKey) {
  return parseInt(dateKey.split('-')[2], 10);
}

/**
 * Compute the daily allocation for a given dateKey based on the monthly finance config.
 *
 * @param {string} dateKey "YYYY-MM-DD"
 * @param {object} monthlyFinance - the monthly finance object from store
 * @returns {number} the daily allocation for this day
 */
export function getDailyAllocation(dateKey, monthlyFinance) {
  const totalBudget = (parseFloat(monthlyFinance.cashOnHand) || 0) +
    (parseFloat(monthlyFinance.digitalWallet) || 0);

  if (totalBudget <= 0) return 0;

  const distributionMode = monthlyFinance.distributionMode || 'equal';

  if (distributionMode === 'custom' && monthlyFinance.customDailyAmounts) {
    // Custom: user set specific amounts per day-of-month
    const dayNum = getDayOfMonth(dateKey);
    const custom = monthlyFinance.customDailyAmounts;
    return parseFloat(custom[dayNum]) || 0;
  }

  // Equal distribution
  const daysInMonth = getDaysInMonth(dateKey);
  return totalBudget / daysInMonth;
}

/**
 * Get the pool carried over from the previous day.
 * Walks through all saved days this month before dateKey.
 *
 * @param {string} dateKey "YYYY-MM-DD"
 * @returns {number} the remaining from the most recent previous day, or 0
 */
export function getPoolFromPreviousDay(dateKey) {
  const monthPrefix = dateKey.substring(0, 7);
  const prevDays = [];

  cacheKeys().forEach((k) => {
    if (k.startsWith(STORAGE_PREFIX)) {
      const d = k.replace(STORAGE_PREFIX, '');
      if (d.startsWith(monthPrefix) && d < dateKey && d.match(/^\d{4}-\d{2}-\d{2}$/)) {
        prevDays.push({ date: d, key: k });
      }
    }
  });

  if (prevDays.length === 0) return 0;

  // Get the most recent previous day
  prevDays.sort((a, b) => a.date.localeCompare(b.date));
  const lastDay = prevDays[prevDays.length - 1];

  try {
    const data = JSON.parse(cacheGet(lastDay.key));
    if (data && data.dailyFinanceSummary && data.dailyFinanceSummary.remaining !== undefined) {
      return data.dailyFinanceSummary.remaining;
    }
    // Fallback: compute from expenses
    if (data && data.dailyFinanceSummary) {
      const avail = data.dailyFinanceSummary.todayAvailable || 0;
      const spent = data.dailyFinanceSummary.todaySpent || 0;
      return avail - spent;
    }
  } catch (e) { }

  return 0;
}

/**
 * Compute total budget pool for a given day.
 *
 * @param {string} dateKey
 * @param {object} monthlyFinance
 * @param {number} extraDeposit - additional deposit for this day
 * @returns {{ poolCarried: number, dailyAllocation: number, extraDeposit: number, todayAvailable: number }}
 */
export function computeDayBudget(dateKey, monthlyFinance, extraDeposit) {
  const poolCarried = getPoolFromPreviousDay(dateKey);
  const dailyAllocation = getDailyAllocation(dateKey, monthlyFinance);
  const extra = parseFloat(extraDeposit) || 0;
  const todayAvailable = poolCarried + dailyAllocation + extra;

  return {
    poolCarried,
    dailyAllocation,
    extraDeposit: extra,
    todayAvailable,
  };
}

/**
 * Sum all expenses from every day this month EXCEPT the given dateKey.
 */
export function getMonthlyExpenseTotal(dateKey) {
  const monthPrefix = dateKey.substring(0, 7);
  let total = 0;

  cacheKeys().forEach((k) => {
    if (k.startsWith(STORAGE_PREFIX)) {
      const d = k.replace(STORAGE_PREFIX, '');
      if (d.startsWith(monthPrefix) && d !== dateKey && d.match(/^\d{4}-\d{2}-\d{2}$/)) {
        try {
          const data = JSON.parse(cacheGet(k));
          if (data && data.expenses) {
            data.expenses.forEach((e) => { total += parseFloat(e.amount) || 0; });
          }
        } catch (e) { }
      }
    }
  });

  return total;
}

/**
 * Compute equal distribution preview for a month.
 * @param {number} totalBudget
 * @param {string} dateKey
 * @returns {number} per-day amount
 */
export function getEqualDailyAmount(totalBudget, dateKey) {
  const days = getDaysInMonth(dateKey);
  return days > 0 ? totalBudget / days : 0;
}

/**
 * Sum all extra income/deposits from every day this month (including today).
 * This represents additional money added beyond the monthly starting budget.
 * @param {string} dateKey
 * @param {number} todayExtra - the current day's extra deposit (from live input)
 * @returns {number}
 */
export function getMonthlyExtraIncome(dateKey, todayExtra) {
  const monthPrefix = dateKey.substring(0, 7);
  let total = parseFloat(todayExtra) || 0;

  cacheKeys().forEach((k) => {
    if (k.startsWith(STORAGE_PREFIX)) {
      const d = k.replace(STORAGE_PREFIX, '');
      if (d.startsWith(monthPrefix) && d !== dateKey && d.match(/^\d{4}-\d{2}-\d{2}$/)) {
        try {
          const data = JSON.parse(cacheGet(k));
          if (data) {
            total += parseFloat(data.extraDeposit) || 0;
          }
        } catch (e) { }
      }
    }
  });

  return total;
}
