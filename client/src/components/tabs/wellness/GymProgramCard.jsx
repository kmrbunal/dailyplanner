import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDayContext } from '../../../context/DayContext';
import { useStoreContext } from '../../../context/StoreContext';
import { getWeekMonday } from '../../../services/dateUtils';
import styles from './GymProgramCard.module.css';

// ---------------------------------------------------------------------------
// Constants matching the original HTML
// ---------------------------------------------------------------------------

const GYM_DAY_TYPES = [
  { key: 'upper', label: 'Upper Body', icon: '💪' },
  { key: 'lower', label: 'Lower Body', icon: '🦵' },
  { key: 'cardio', label: 'Cardio', icon: '🫀' },
  { key: 'full', label: 'Full Body', icon: '🔥' },
  { key: 'rest', label: 'Rest / Active Recovery', icon: '🧘' },
];

const GYM_DAY_LABELS = {
  upper: '💪 Upper Body Day',
  lower: '🦵 Lower Body Day',
  cardio: '🫀 Cardio Day',
  full: '🔥 Full Body Day',
  rest: '🧘 Rest / Recovery',
};

const GYM_PRESETS = {
  upper: [
    { name: 'Bench Press', sets: '4', reps: '8-10' },
    { name: 'Overhead Press', sets: '3', reps: '8-10' },
    { name: 'Bent-Over Rows', sets: '4', reps: '10' },
    { name: 'Lat Pulldowns', sets: '3', reps: '10-12' },
    { name: 'Dumbbell Curls', sets: '3', reps: '12' },
    { name: 'Tricep Pushdowns', sets: '3', reps: '12' },
    { name: 'Lateral Raises', sets: '3', reps: '15' },
  ],
  lower: [
    { name: 'Barbell Squats', sets: '4', reps: '8-10' },
    { name: 'Romanian Deadlifts', sets: '3', reps: '10' },
    { name: 'Leg Press', sets: '3', reps: '12' },
    { name: 'Walking Lunges', sets: '3', reps: '12/leg' },
    { name: 'Leg Curls', sets: '3', reps: '12' },
    { name: 'Calf Raises', sets: '4', reps: '15' },
    { name: 'Hip Thrusts', sets: '3', reps: '12' },
  ],
  cardio: [
    { name: 'Treadmill Run', sets: '\u2014', reps: '20 min' },
    { name: 'Jump Rope', sets: '3', reps: '3 min' },
    { name: 'Cycling / Bike', sets: '\u2014', reps: '15 min' },
    { name: 'Rowing Machine', sets: '\u2014', reps: '10 min' },
    { name: 'Burpees', sets: '3', reps: '15' },
    { name: 'Mountain Climbers', sets: '3', reps: '30 sec' },
  ],
  full: [
    { name: 'Deadlifts', sets: '4', reps: '6-8' },
    { name: 'Push-Ups', sets: '3', reps: '15' },
    { name: 'Pull-Ups / Assisted', sets: '3', reps: '8-10' },
    { name: 'Goblet Squats', sets: '3', reps: '12' },
    { name: 'Dumbbell Rows', sets: '3', reps: '10/arm' },
    { name: 'Plank Hold', sets: '3', reps: '45 sec' },
    { name: 'Box Jumps', sets: '3', reps: '10' },
  ],
  rest: [
    { name: 'Foam Rolling', sets: '\u2014', reps: '10 min' },
    { name: 'Stretching Routine', sets: '\u2014', reps: '15 min' },
    { name: 'Light Walking', sets: '\u2014', reps: '20 min' },
    { name: 'Yoga Flow', sets: '\u2014', reps: '15 min' },
  ],
};

const WEEK_DAYS = [
  { dow: 1, key: 'mon', label: 'Mon' },
  { dow: 2, key: 'tue', label: 'Tue' },
  { dow: 3, key: 'wed', label: 'Wed' },
  { dow: 4, key: 'thu', label: 'Thu' },
  { dow: 5, key: 'fri', label: 'Fri' },
  { dow: 6, key: 'sat', label: 'Sat' },
  { dow: 0, key: 'sun', label: 'Sun' },
];

const WEEK_OPTIONS = [
  { value: '', label: '\u2014' },
  { value: 'upper', label: '💪 Upper' },
  { value: 'lower', label: '🦵 Lower' },
  { value: 'cardio', label: '🫀 Cardio' },
  { value: 'full', label: '🔥 Full' },
  { value: 'rest', label: '🧘 Rest' },
];

const DOW_KEY_MAP = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GymProgramCard() {
  const { dayData, dispatch, currentDate } = useDayContext();
  const { gymRoutines, gymWeekly, saveGymRoutines, saveGymWeekly } = useStoreContext();

  const gymDayType = dayData.gymDayType || '';
  const gymAllExercises = dayData.gymAllExercises || {};
  const gymAllNotes = dayData.gymAllNotes || {};
  const gymNotes = dayData.gymNotes || '';

  // In-memory cache for exercises per day type within the current day.
  // We use a ref so we can snapshot before switching day types.
  const exercisesCacheRef = useRef({});
  const notesCacheRef = useRef({});

  // Seed the cache from dayData on initial render or when dayData changes externally
  useEffect(() => {
    const newCache = {};
    const newNotesCache = {};
    if (gymAllExercises && typeof gymAllExercises === 'object') {
      Object.keys(gymAllExercises).forEach((t) => {
        newCache[t] = gymAllExercises[t];
      });
    }
    if (gymAllNotes && typeof gymAllNotes === 'object') {
      Object.keys(gymAllNotes).forEach((t) => {
        newNotesCache[t] = gymAllNotes[t];
      });
    }
    exercisesCacheRef.current = newCache;
    notesCacheRef.current = newNotesCache;
  }, [gymAllExercises, gymAllNotes]);

  // The exercises currently displayed (for the active day type)
  const [exercises, setExercises] = useState([]);
  const [currentNotes, setCurrentNotes] = useState('');

  // Load exercises for a day type (from cache > saved routine > presets)
  const loadExercisesForType = useCallback(
    (dayType) => {
      let exs = exercisesCacheRef.current[dayType];
      if (!exs || !exs.length || !exs.some((e) => e.name)) {
        const routineExs = gymRoutines[dayType];
        exs =
          routineExs && routineExs.length
            ? routineExs
            : GYM_PRESETS[dayType] || [];
        exs = exs.map((e) => ({
          name: e.name || '',
          sets: e.sets || '',
          reps: e.reps || '',
          pr: e.pr || '',
          done: false,
        }));
        exercisesCacheRef.current[dayType] = exs;
      }
      setExercises([...exs]);
      setCurrentNotes(notesCacheRef.current[dayType] || '');
    },
    [gymRoutines]
  );

  // Snapshot current exercises into the cache
  const snapshotCurrent = useCallback(() => {
    if (gymDayType) {
      exercisesCacheRef.current[gymDayType] = exercises;
      notesCacheRef.current[gymDayType] = currentNotes;
    }
  }, [gymDayType, exercises, currentNotes]);

  // Persist all gym data to dayData (called on meaningful changes)
  const persistToDay = useCallback(
    (newType, newExercises, newNotes) => {
      // Snapshot current before updating
      const allExercises = { ...exercisesCacheRef.current };
      const allNotes = { ...notesCacheRef.current };
      if (newType) {
        allExercises[newType] = newExercises || exercises;
        allNotes[newType] = newNotes !== undefined ? newNotes : currentNotes;
      }
      dispatch({ type: 'SET_FIELD', field: 'gymDayType', value: newType || gymDayType });
      dispatch({ type: 'SET_FIELD', field: 'gymAllExercises', value: allExercises });
      dispatch({ type: 'SET_FIELD', field: 'gymAllNotes', value: allNotes });
      dispatch({ type: 'SET_FIELD', field: 'gymNotes', value: newNotes !== undefined ? newNotes : currentNotes });
    },
    [dispatch, gymDayType, exercises, currentNotes]
  );

  // Select a gym day type
  const selectDayType = (dayType) => {
    snapshotCurrent();
    dispatch({ type: 'SET_FIELD', field: 'gymDayType', value: dayType });
    loadExercisesForType(dayType);
    // Persist after loading
    setTimeout(() => {
      const exs = exercisesCacheRef.current[dayType] || [];
      const notes = notesCacheRef.current[dayType] || '';
      dispatch({ type: 'SET_FIELD', field: 'gymAllExercises', value: { ...exercisesCacheRef.current, [dayType]: exs } });
      dispatch({ type: 'SET_FIELD', field: 'gymAllNotes', value: { ...notesCacheRef.current, [dayType]: notes } });
      dispatch({ type: 'SET_FIELD', field: 'gymNotes', value: notes });
    }, 0);
  };

  // Load on initial mount if a day type is set
  useEffect(() => {
    if (gymDayType) {
      loadExercisesForType(gymDayType);
    }
  }, [gymDayType, loadExercisesForType]);

  // Update an exercise field
  const updateExercise = (index, field, value) => {
    const next = exercises.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex));
    setExercises(next);
    exercisesCacheRef.current[gymDayType] = next;
    persistToDay(gymDayType, next, currentNotes);
  };

  // Toggle exercise done
  const toggleDone = (index) => {
    const next = exercises.map((ex, i) => (i === index ? { ...ex, done: !ex.done } : ex));
    setExercises(next);
    exercisesCacheRef.current[gymDayType] = next;
    persistToDay(gymDayType, next, currentNotes);
  };

  // Add exercise
  const addExercise = () => {
    const next = [...exercises, { name: '', sets: '', reps: '', pr: '', done: false }];
    setExercises(next);
    exercisesCacheRef.current[gymDayType] = next;
    persistToDay(gymDayType, next, currentNotes);
  };

  // Remove exercise
  const removeExercise = (index) => {
    const next = exercises.filter((_, i) => i !== index);
    setExercises(next);
    exercisesCacheRef.current[gymDayType] = next;
    persistToDay(gymDayType, next, currentNotes);
  };

  // Notes change
  const handleNotesChange = (e) => {
    const val = e.target.value;
    setCurrentNotes(val);
    notesCacheRef.current[gymDayType] = val;
    persistToDay(gymDayType, exercises, val);
  };

  // Save as routine
  const saveRoutine = () => {
    if (!gymDayType) return;
    if (!exercises.length || !exercises.some((e) => e.name)) return;
    const next = {
      ...gymRoutines,
      [gymDayType]: exercises.map((e) => ({ name: e.name, sets: e.sets, reps: e.reps, pr: e.pr })),
    };
    saveGymRoutines(next);
  };

  // ---- Weekly Focus Tracker ----
  const todayDow = currentDate.getDay();
  const weekId = getWeekMonday(currentDate);

  // Get current week data from gymWeekly store
  const weekData = useMemo(() => {
    const all = gymWeekly || {};
    if (all[weekId]) return all[weekId];
    // Auto-inherit from most recent week
    const weeks = Object.keys(all).sort();
    const lastWeek = weeks.length ? all[weeks[weeks.length - 1]] : null;
    return {
      schedule: lastWeek ? { ...lastWeek.schedule } : {},
      completed: {},
    };
  }, [gymWeekly, weekId]);

  const scheduleFilled = Object.values(weekData.schedule || {}).filter((v) => v).length;

  const handleWeekChange = (dayKey, value) => {
    const newSchedule = { ...weekData.schedule };
    if (value) {
      newSchedule[dayKey] = value;
    } else {
      delete newSchedule[dayKey];
    }
    const newWeekData = { ...weekData, schedule: newSchedule };
    const allWeekly = { ...(gymWeekly || {}), [weekId]: newWeekData };
    saveGymWeekly(allWeekly);
  };

  // Today's suggestion
  const todayKey = DOW_KEY_MAP[todayDow];
  const todayFocus = weekData.schedule ? weekData.schedule[todayKey] : '';

  // Auto-select today's focus if no type selected yet
  useEffect(() => {
    if (!gymDayType && todayFocus) {
      selectDayType(todayFocus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayFocus]);

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        <span className={styles.icon}>🏋️</span> Gym Program
      </div>

      {/* Weekly Focus Tracker */}
      <div className={styles.weeklyFocus}>
        <div className={styles.weeklyHeader}>
          <div className={styles.weeklyTitle}>Weekly Schedule</div>
          <div className={styles.weekLabel}>{scheduleFilled}/7 days planned</div>
        </div>
        <div className={styles.weekGrid}>
          {WEEK_DAYS.map(({ dow, key, label }) => {
            const isToday = dow === todayDow;
            let colClass = styles.weekCol;
            if (isToday) colClass += ` ${styles.isToday}`;

            return (
              <div key={key} className={colClass}>
                <div className={styles.weekDay}>{label}</div>
                <select
                  className={styles.weekSelect}
                  value={(weekData.schedule && weekData.schedule[key]) || ''}
                  onChange={(e) => handleWeekChange(key, e.target.value)}
                >
                  {WEEK_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
        {todayFocus && GYM_DAY_LABELS[todayFocus] && (
          <div className={styles.todaySuggestion}>
            📅 Today's plan: <strong>{GYM_DAY_LABELS[todayFocus]}</strong>
          </div>
        )}
      </div>

      {/* Workout Day Type */}
      <div className={styles.focusSection}>
        <div className={styles.sectionLabel}>Today's Focus</div>
        <div className={styles.dayBtns}>
          {GYM_DAY_TYPES.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`${styles.dayBtn}${gymDayType === key ? ` ${styles.active}` : ''}`}
              onClick={() => selectDayType(key)}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises */}
      <div style={{ marginBottom: 10 }}>
        <div className={styles.exerciseHeader}>
          <div className={styles.sectionLabel}>Exercises</div>
          {gymDayType && GYM_DAY_LABELS[gymDayType] && (
            <div className={styles.exerciseDayLabel}>{GYM_DAY_LABELS[gymDayType]}</div>
          )}
        </div>
        <div className={styles.exerciseList}>
          {exercises.map((ex, i) => (
            <div key={i} className={styles.exerciseRow}>
              <input
                type="checkbox"
                className={styles.exerciseCheckbox}
                checked={ex.done || false}
                onChange={() => toggleDone(i)}
              />
              <input
                type="text"
                className={`${styles.exerciseName}${ex.done ? ` ${styles.exerciseNameDone}` : ''}`}
                value={ex.name || ''}
                placeholder="Exercise name..."
                onChange={(e) => updateExercise(i, 'name', e.target.value)}
              />
              <div className={styles.exerciseDetailCol}>
                <span className={styles.exerciseDetailLabel}>Sets</span>
                <input
                  type="text"
                  className={styles.exerciseDetail}
                  value={ex.sets || ''}
                  placeholder="\u2014"
                  onChange={(e) => updateExercise(i, 'sets', e.target.value)}
                />
              </div>
              <div className={styles.exerciseDetailCol}>
                <span className={styles.exerciseDetailLabel}>Reps</span>
                <input
                  type="text"
                  className={styles.exerciseDetail}
                  value={ex.reps || ''}
                  placeholder="\u2014"
                  onChange={(e) => updateExercise(i, 'reps', e.target.value)}
                />
              </div>
              <div className={styles.exerciseDetailCol}>
                <span className={styles.exerciseDetailLabel}>PR</span>
                <input
                  type="text"
                  className={`${styles.exerciseDetail} ${styles.exercisePr}`}
                  value={ex.pr || ''}
                  placeholder="\u2014"
                  onChange={(e) => updateExercise(i, 'pr', e.target.value)}
                />
              </div>
              <button
                className={styles.removeExerciseBtn}
                onClick={() => removeExercise(i)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <div className={styles.actionRow}>
          <button className={styles.addBtn} onClick={addExercise}>
            + Add exercise
          </button>
          <button className={styles.saveBtn} onClick={saveRoutine}>
            💾 Save as routine
          </button>
        </div>
      </div>

      {/* Gym Notes */}
      <div>
        <textarea
          className={styles.notesArea}
          placeholder="How did the workout feel? PRs, fatigue, adjustments..."
          value={currentNotes}
          onChange={handleNotesChange}
        />
      </div>
    </div>
  );
}
