import {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useAuthContext } from './AuthContext';
import { apiGet, apiPut } from '../services/api';
import { cacheGet, cacheSet } from '../services/cache';
import { getDateKey } from '../services/dateUtils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = 'dailyPlanner_';
const AUTO_SAVE_DELAY = 1500;

// ---------------------------------------------------------------------------
// Default day data — matches collectDayData() from the original HTML
// ---------------------------------------------------------------------------

function createEmptyDayData() {
  return {
    // Top priorities (3 slots)
    topPriorities: ['', '', ''],

    // Task categories — each item: { text, checked, alarm }
    workTodos: Array.from({ length: 5 }, () => ({ text: '', checked: false, alarm: '' })),
    healthTodos: Array.from({ length: 5 }, () => ({ text: '', checked: false, alarm: '' })),
    personalTodos: Array.from({ length: 5 }, () => ({ text: '', checked: false, alarm: '' })),

    // Mood: -1 = none selected, 0-4 = mood index
    mood: -1,

    // Gratitude (3 slots)
    gratitude: ['', '', ''],

    // Water glasses (8 glasses)
    water: [false, false, false, false, false, false, false, false],

    // Weight tracking
    weight: '',
    weightUnit: 'kg',

    // Cycle tracker
    cycleFlow: '',
    cycleDay: '',
    cycleLength: '',
    cycleNotes: '',

    // Symptoms (array of selected symptom labels)
    symptoms: [],

    // Notes
    notes: '',

    // Learning items — each: { text, status, emoji }
    learning: [],

    // Gym program
    gymDayType: '',
    gymAllExercises: {},
    gymAllNotes: {},
    gymNotes: '',

    // Meals — each item: { food, portion, cal }
    mealBreakfast: [{ food: '', portion: '', cal: '' }],
    mealLunch: [{ food: '', portion: '', cal: '' }],
    mealDinner: [{ food: '', portion: '', cal: '' }],
    mealSnacks: [{ food: '', portion: '', cal: '' }],
    mealNotes: '',

    // Finance
    expenses: [{ category: '', amount: '' }],
    financeNotes: '',
    dailyFinanceSummary: {
      startingBudget: 0,
      availableAtStart: 0,
      todaySpent: 0,
      remainingAfterToday: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const ACTION = {
  SET_FIELD: 'SET_FIELD',
  SET_TODO: 'SET_TODO',
  TOGGLE_TODO: 'TOGGLE_TODO',
  SET_EXPENSE: 'SET_EXPENSE',
  RESTORE_DAY: 'RESTORE_DAY',
  CLEAR_DAY: 'CLEAR_DAY',
};

function dayReducer(state, action) {
  switch (action.type) {
    // Generic field setter: dispatch({ type: 'SET_FIELD', field: 'mood', value: 2 })
    // Also supports nested paths: field: 'dailyFinanceSummary.todaySpent'
    case ACTION.SET_FIELD: {
      const { field, value } = action;
      // Handle dot-notation for nested fields
      if (field.includes('.')) {
        const parts = field.split('.');
        const top = parts[0];
        const sub = parts[1];
        return {
          ...state,
          [top]: {
            ...state[top],
            [sub]: value,
          },
        };
      }
      return { ...state, [field]: value };
    }

    // Update a specific todo item in a category
    // dispatch({ type: 'SET_TODO', category: 'workTodos', index: 0, updates: { text: 'Do X' } })
    case ACTION.SET_TODO: {
      const { category, index, updates } = action;
      const list = [...(state[category] || [])];
      list[index] = { ...list[index], ...updates };
      return { ...state, [category]: list };
    }

    // Toggle checked state of a todo
    // dispatch({ type: 'TOGGLE_TODO', category: 'workTodos', index: 0 })
    case ACTION.TOGGLE_TODO: {
      const { category, index } = action;
      const list = [...(state[category] || [])];
      list[index] = { ...list[index], checked: !list[index].checked };
      return { ...state, [category]: list };
    }

    // Update a specific expense row
    // dispatch({ type: 'SET_EXPENSE', index: 0, updates: { amount: '50' } })
    case ACTION.SET_EXPENSE: {
      const { index, updates } = action;
      const expenses = [...(state.expenses || [])];
      expenses[index] = { ...expenses[index], ...updates };
      return { ...state, expenses };
    }

    // Replace the entire day data (e.g. after loading from API)
    case ACTION.RESTORE_DAY:
      return { ...createEmptyDayData(), ...action.data };

    // Reset to empty
    case ACTION.CLEAR_DAY:
      return createEmptyDayData();

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const DayContext = createContext(null);

export function DayProvider({ children }) {
  const { session, isSignedIn } = useAuthContext();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayData, dispatch] = useReducer(dayReducer, null, createEmptyDayData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs for auto-save debounce
  const saveTimerRef = useRef(null);
  const switchingDateRef = useRef(false);
  const initialLoadDone = useRef(false);

  /**
   * Build the YYYY-MM-DD date key for a given date (defaults to currentDate).
   */
  const getDateKeyForDate = useCallback(
    (date) => getDateKey(date || currentDate),
    [currentDate]
  );

  /**
   * Check whether the current dayData has any meaningful content worth saving.
   */
  const hasContent = useCallback(
    (data) => {
      const d = data || dayData;
      return !!(
        d.notes ||
        d.weight ||
        d.topPriorities.some((p) => p) ||
        d.mood >= 0 ||
        d.gratitude.some((g) => g) ||
        d.water.some((w) => w) ||
        d.cycleFlow ||
        d.cycleDay ||
        d.symptoms.length > 0 ||
        (d.learning && d.learning.some((l) => l.text)) ||
        ['workTodos', 'healthTodos', 'personalTodos'].some(
          (id) => d[id] && d[id].some((t) => t.text)
        ) ||
        d.gymDayType ||
        d.gymNotes ||
        (d.gymAllExercises &&
          Object.values(d.gymAllExercises).some(
            (arr) => arr && arr.some((e) => e.name)
          )) ||
        d.mealNotes ||
        ['mealBreakfast', 'mealLunch', 'mealDinner', 'mealSnacks'].some(
          (id) => d[id] && d[id].some((m) => m.food)
        ) ||
        (d.expenses && d.expenses.some((e) => e.amount)) ||
        d.financeNotes
      );
    },
    [dayData]
  );

  /**
   * Save the current dayData to cache + cloud API.
   */
  const saveDayData = useCallback(
    async (dataOverride) => {
      const data = dataOverride || dayData;
      const dateKey = getDateKey(currentDate);
      const cacheKey = STORAGE_PREFIX + dateKey;

      // Only persist if there is actual content
      if (!hasContent(data)) return;

      setIsSaving(true);
      try {
        // Write to in-memory cache (instant)
        cacheSet(cacheKey, JSON.stringify(data));

        // Write to cloud if signed in
        if (isSignedIn && session) {
          try {
            await apiPut('days/' + dateKey, data, session);
          } catch (err) {
            console.error('Cloud save failed', err);
          }
        }
      } finally {
        setIsSaving(false);
      }
    },
    [dayData, currentDate, isSignedIn, session, hasContent]
  );

  /**
   * Load day data for a given date key from cloud (with cache fallback).
   */
  const loadDayData = useCallback(
    async (dateKey) => {
      const dk = dateKey || getDateKey(currentDate);
      const cacheKey = STORAGE_PREFIX + dk;
      let data = null;

      setIsLoading(true);
      try {
        // Try cloud first
        if (isSignedIn && session) {
          try {
            const json = await apiGet('days/' + dk, session);
            if (json && json.data) {
              data = json.data;
              // Update cache
              cacheSet(cacheKey, JSON.stringify(data));
            }
          } catch (err) {
            console.error('Cloud load failed, using cache', err);
          }
        }

        // Fallback to cache
        if (!data) {
          const raw = cacheGet(cacheKey);
          if (raw) {
            try {
              data = JSON.parse(raw);
            } catch (_) {
              // corrupt cache entry
            }
          }
        }

        if (data) {
          dispatch({ type: ACTION.RESTORE_DAY, data });
        } else {
          dispatch({ type: ACTION.CLEAR_DAY });
        }

        return !!data;
      } finally {
        setIsLoading(false);
      }
    },
    [currentDate, isSignedIn, session]
  );

  /**
   * Switch to a different date.
   * Saves current day (if it has content), then loads the new date.
   */
  const switchDate = useCallback(
    async (newDate) => {
      // Suppress auto-save during the switch
      switchingDateRef.current = true;
      clearTimeout(saveTimerRef.current);

      // Save current day if it has content
      try {
        if (hasContent()) {
          await saveDayData();
        }
      } catch (err) {
        console.error('Error saving before date switch', err);
      }

      // Update the date
      setCurrentDate(newDate);

      // Clear current data
      dispatch({ type: ACTION.CLEAR_DAY });

      // Load the new date's data
      const newDateKey = getDateKey(newDate);
      await loadDayData(newDateKey);

      switchingDateRef.current = false;
    },
    [hasContent, saveDayData, loadDayData]
  );

  // --- Auto-save: debounce dayData changes by 1500ms ---
  useEffect(() => {
    // Skip auto-save during initial load, date switches, or when not signed in
    if (!initialLoadDone.current) return;
    if (switchingDateRef.current) return;

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDayData().catch(console.error);
    }, AUTO_SAVE_DELAY);

    return () => clearTimeout(saveTimerRef.current);
  }, [dayData, saveDayData]);

  // --- Load today's data on first mount (when auth is ready) ---
  useEffect(() => {
    if (!isSignedIn || !session) return;
    if (initialLoadDone.current) return;

    (async () => {
      await loadDayData();
      initialLoadDone.current = true;
    })();
  }, [isSignedIn, session, loadDayData]);

  const value = {
    dayData,
    dispatch,
    currentDate,
    isLoading,
    isSaving,
    switchDate,
    saveDayData,
    loadDayData,
    getDateKey: getDateKeyForDate,
    hasContent,
  };

  return <DayContext.Provider value={value}>{children}</DayContext.Provider>;
}

/**
 * Hook to consume the DayContext.
 * Must be used inside a <DayProvider>.
 */
export function useDayContext() {
  const ctx = useContext(DayContext);
  if (!ctx) {
    throw new Error('useDayContext must be used within a DayProvider');
  }
  return ctx;
}

export default DayContext;
