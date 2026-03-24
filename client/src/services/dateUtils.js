// Date helper functions

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday'
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Returns a date key string in "YYYY-MM-DD" format.
 * @param {Date} [date] - The date to format. Defaults to today.
 * @returns {string} e.g. "2026-03-24"
 */
export function getDateKey(date) {
  const d = date || new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

/**
 * Returns a human-readable date string.
 * @param {Date} date - The date to format
 * @returns {string} e.g. "Wednesday, March 24, 2026"
 */
export function formatDate(date) {
  return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Returns the month key from a date string.
 * @param {string} [dateStr] - A "YYYY-MM-DD" date string. Defaults to today.
 * @returns {string} e.g. "2026-03"
 */
export function getMonthKey(dateStr) {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0')
  );
}

/**
 * Returns the "YYYY-MM-DD" of the Monday for the week containing the given date.
 * @param {Date} date - Any date
 * @returns {string} e.g. "2026-03-23" (the Monday of that week)
 */
export function getWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
  d.setDate(d.getDate() + diff);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}
