import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useDayContext } from '../../../context/DayContext';
import { useStoreContext } from '../../../context/StoreContext';
import { getDateKey } from '../../../services/dateUtils';
import styles from './WeightTracker.module.css';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function WeightTracker() {
  const { dayData, dispatch, currentDate } = useDayContext();
  const { weightHistory, saveWeightHistory } = useStoreContext();
  const saveTimerRef = useRef(null);

  const todayKey = getDateKey(currentDate);
  const weight = dayData.weight || '';
  const weightUnit = dayData.weightUnit || 'kg';

  // Save weight entry to history after a debounce
  const saveEntry = useCallback(
    (w, unit) => {
      const val = parseFloat(w);
      if (!val || isNaN(val)) return;
      const next = { ...weightHistory, [todayKey]: { weight: val, unit } };
      saveWeightHistory(next);
    },
    [weightHistory, todayKey, saveWeightHistory]
  );

  const handleWeightChange = (e) => {
    const val = e.target.value;
    dispatch({ type: 'SET_FIELD', field: 'weight', value: val });
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveEntry(val, weightUnit);
    }, 1500);
  };

  const handleUnitChange = (e) => {
    const unit = e.target.value;
    dispatch({ type: 'SET_FIELD', field: 'weightUnit', value: unit });
    saveEntry(weight, unit);
  };

  const deleteEntry = (dateKey) => {
    const next = { ...weightHistory };
    delete next[dateKey];
    saveWeightHistory(next);
    if (dateKey === todayKey) {
      dispatch({ type: 'SET_FIELD', field: 'weight', value: '' });
    }
  };

  // Cleanup timer
  useEffect(() => {
    return () => clearTimeout(saveTimerRef.current);
  }, []);

  // Compute delta and chart data
  const dates = useMemo(() => Object.keys(weightHistory).sort(), [weightHistory]);
  const todayEntry = weightHistory[todayKey];
  const currentVal = todayEntry ? todayEntry.weight : parseFloat(weight);

  // Previous entry (most recent before today)
  const prevDates = useMemo(() => dates.filter((d) => d < todayKey && weightHistory[d].weight), [dates, todayKey, weightHistory]);
  const prevEntry = prevDates.length ? weightHistory[prevDates[prevDates.length - 1]] : null;

  // Delta calculation with unit conversion
  let deltaContent = null;
  let prevLabelText = '';
  const showProgress = !!(currentVal && (prevEntry || !prevEntry));

  if (currentVal && prevEntry) {
    const unit = todayEntry ? todayEntry.unit : weightUnit;
    let prevWeight = prevEntry.weight;
    if (prevEntry.unit !== unit) {
      if (prevEntry.unit === 'kg' && unit === 'lbs') prevWeight = prevWeight * 2.20462;
      else if (prevEntry.unit === 'lbs' && unit === 'kg') prevWeight = prevWeight / 2.20462;
    }
    const diff = currentVal - prevWeight;

    if (Math.abs(diff) < 0.01) {
      deltaContent = <span className={styles.deltaNone}>&rarr; No change</span>;
    } else if (diff < 0) {
      deltaContent = <span className={styles.deltaDown}>&darr; {Math.abs(diff).toFixed(1)} {unit}</span>;
    } else {
      deltaContent = <span className={styles.deltaUp}>&uarr; +{diff.toFixed(1)} {unit}</span>;
    }
    prevLabelText = `vs ${prevDates[prevDates.length - 1]} (${prevEntry.weight} ${prevEntry.unit})`;
  } else if (currentVal && !prevEntry) {
    deltaContent = <span className={styles.deltaFirst}>First entry — keep logging!</span>;
    prevLabelText = '';
  }

  // Bar chart data: last 7 entries with weight
  const recentDates = useMemo(() => dates.filter((d) => weightHistory[d].weight).slice(-7), [dates, weightHistory]);
  const recentWeights = recentDates.map((d) => weightHistory[d].weight);
  const minW = recentWeights.length >= 2 ? Math.min(...recentWeights) - 0.5 : 0;
  const maxW = recentWeights.length >= 2 ? Math.max(...recentWeights) + 0.5 : 1;
  const range = maxW - minW || 1;

  // History log: most recent 14 entries, reversed
  const allEntryDates = useMemo(() => dates.filter((d) => weightHistory[d].weight), [dates, weightHistory]);
  const showEntries = allEntryDates.slice(-14).reverse();

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        <span className={styles.icon}>&#x2696;&#xFE0F;</span> Weigh-In
      </div>
      <div className={styles.inputRow}>
        <input
          type="number"
          className={styles.weightInput}
          placeholder="0.0"
          step="0.1"
          value={weight}
          onChange={handleWeightChange}
        />
        <select className={styles.unitSelect} value={weightUnit} onChange={handleUnitChange}>
          <option value="kg">kg</option>
          <option value="lbs">lbs</option>
        </select>
      </div>

      {/* Delta indicator */}
      {currentVal > 0 && (
        <div className={styles.progress}>
          <div className={styles.delta}>{deltaContent}</div>
          {prevLabelText && <div className={styles.prevLabel}>{prevLabelText}</div>}
        </div>
      )}

      {/* Mini bar chart */}
      {recentDates.length >= 2 && (
        <div className={styles.barChart}>
          {recentDates.map((d, i) => {
            const val = weightHistory[d].weight;
            const h = Math.max(6, ((val - minW) / range) * 32);
            const isToday = d === todayKey;
            let color = 'var(--border)';
            if (i > 0) {
              const prevVal = recentWeights[i - 1];
              if (val < prevVal) color = '#3d8b5e';
              else if (val > prevVal) color = '#c0392b';
              else color = 'var(--text-light)';
            }
            return (
              <div
                key={d}
                className={styles.bar}
                title={`${d}: ${val}`}
                style={{
                  width: isToday ? 10 : 7,
                  height: h,
                  background: color,
                  boxShadow: isToday ? `0 0 0 2px ${color}33` : undefined,
                  opacity: isToday ? 1 : 0.7,
                }}
              />
            );
          })}
        </div>
      )}

      {/* History log */}
      {allEntryDates.length > 0 && (
        <div className={styles.historyLog}>
          <div className={styles.historyTitle}>History</div>
          <div className={styles.historyRows}>
            {showEntries.map((d) => {
              const entry = weightHistory[d];
              const revIdx = allEntryDates.indexOf(d);
              const prevDate = revIdx > 0 ? allEntryDates[revIdx - 1] : null;
              const prevW = prevDate ? weightHistory[prevDate].weight : null;
              const diff = prevW !== null ? entry.weight - prevW : null;

              const parts = d.split('-');
              const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
              const niceDate = `${DAY_NAMES[dateObj.getDay()]}, ${MONTH_NAMES[dateObj.getMonth()]} ${dateObj.getDate()}`;
              const isToday = d === todayKey;

              let diffEl = null;
              if (diff !== null && Math.abs(diff) >= 0.01) {
                if (diff < 0) {
                  diffEl = <span className={styles.historyRowDiffDown}>&#9660; {Math.abs(diff).toFixed(1)}</span>;
                } else {
                  diffEl = <span className={styles.historyRowDiffUp}>&#9650; +{diff.toFixed(1)}</span>;
                }
              } else if (diff !== null) {
                diffEl = <span className={styles.historyRowDiffNone}>&mdash;</span>;
              }

              return (
                <div key={d} className={`${styles.historyRow}${isToday ? ` ${styles.today}` : ''}`}>
                  <span className={`${styles.historyRowDate} ${isToday ? styles.historyRowDateToday : styles.historyRowDateOther}`}>
                    {isToday ? '● Today' : niceDate}
                  </span>
                  <span className={styles.historyRowWeight}>
                    {entry.weight}{' '}
                    <span className={styles.historyRowUnit}>{entry.unit}</span>
                  </span>
                  <span className={styles.historyRowDiff}>{diffEl}</span>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => deleteEntry(d)}
                    title="Delete this entry"
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.subtitle}>Log your daily weight</div>
    </div>
  );
}
