import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useAuthContext } from './AuthContext';
import { apiGet, apiLoadStore, apiSaveStore } from '../services/api';
import { cacheGet, cacheSet } from '../services/cache';
import { getDateKey, getMonthKey } from '../services/dateUtils';

// ---------------------------------------------------------------------------
// Cache key constants (matching the original HTML)
// ---------------------------------------------------------------------------

const CACHE_KEYS = {
  WEIGHT_HISTORY: 'dailyPlanner_weight_history',
  GYM_ROUTINES: 'dailyPlanner_gym_routines',
  GYM_WEEKLY: 'dailyPlanner_gym_weekly',
  CLOSED_MONTHS: 'dailyPlanner_closedMonths',
  ROUTINES: 'dailyPlanner_routines',
  MONTHLY_FINANCE: 'dailyPlanner_monthlyFinance_',
  ACHIEVEMENTS: 'dailyPlanner_achievements',
  LEARNING_ACTIVE: 'dailyPlanner_learning_active',
};

// Cloud store key names (used in apiLoadStore / apiSaveStore)
const CLOUD_KEYS = {
  WEIGHT_HISTORY: 'weight_history',
  GYM_ROUTINES: 'gym_routines',
  GYM_WEEKLY: 'gym_weekly',
  CLOSED_MONTHS: 'closedMonths',
  ROUTINES: 'routines',
  ACHIEVEMENTS: 'achievements',
  LEARNING_ACTIVE: 'learning_active',
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const INITIAL_STATE = {
  routines: { work: [], health: [], personal: [] },
  weightHistory: {},
  gymRoutines: {},
  gymWeekly: {},
  closedMonths: [],
  monthlyFinance: {},
  achievements: [],
  learningActive: [],
  cloudDates: [],
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const { session, isSignedIn } = useAuthContext();

  const [routines, setRoutines] = useState(INITIAL_STATE.routines);
  const [weightHistory, setWeightHistory] = useState(INITIAL_STATE.weightHistory);
  const [gymRoutines, setGymRoutines] = useState(INITIAL_STATE.gymRoutines);
  const [gymWeekly, setGymWeekly] = useState(INITIAL_STATE.gymWeekly);
  const [closedMonths, setClosedMonths] = useState(INITIAL_STATE.closedMonths);
  const [monthlyFinance, setMonthlyFinance] = useState(INITIAL_STATE.monthlyFinance);
  const [achievements, setAchievements] = useState(INITIAL_STATE.achievements);
  const [learningActive, setLearningActive] = useState(INITIAL_STATE.learningActive);
  const [cloudDates, setCloudDates] = useState(INITIAL_STATE.cloudDates);
  const [synced, setSynced] = useState(false);

  // -----------------------------------------------------------------------
  // Sync all store data from cloud on mount (after auth is ready)
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!isSignedIn || !session) return;

    let cancelled = false;

    (async () => {
      // Fetch the list of saved date keys for calendar
      try {
        const dates = await apiGet('days', session);
        if (!cancelled && dates && Array.isArray(dates)) {
          setCloudDates(dates);
        }
      } catch (_) {
        // silently continue
      }

      // Sync key-value store entries
      const storeMap = [
        {
          cloud: CLOUD_KEYS.WEIGHT_HISTORY,
          local: CACHE_KEYS.WEIGHT_HISTORY,
          setter: setWeightHistory,
          fallback: {},
        },
        {
          cloud: CLOUD_KEYS.GYM_ROUTINES,
          local: CACHE_KEYS.GYM_ROUTINES,
          setter: setGymRoutines,
          fallback: {},
        },
        {
          cloud: CLOUD_KEYS.GYM_WEEKLY,
          local: CACHE_KEYS.GYM_WEEKLY,
          setter: setGymWeekly,
          fallback: {},
        },
        {
          cloud: CLOUD_KEYS.CLOSED_MONTHS,
          local: CACHE_KEYS.CLOSED_MONTHS,
          setter: setClosedMonths,
          fallback: [],
        },
        {
          cloud: CLOUD_KEYS.ROUTINES,
          local: CACHE_KEYS.ROUTINES,
          setter: setRoutines,
          fallback: { work: [], health: [], personal: [] },
        },
        {
          cloud: CLOUD_KEYS.ACHIEVEMENTS,
          local: CACHE_KEYS.ACHIEVEMENTS,
          setter: setAchievements,
          fallback: [],
        },
        {
          cloud: CLOUD_KEYS.LEARNING_ACTIVE,
          local: CACHE_KEYS.LEARNING_ACTIVE,
          setter: setLearningActive,
          fallback: [],
        },
      ];

      for (const { cloud, local, setter, fallback } of storeMap) {
        if (cancelled) break;
        try {
          const data = await apiLoadStore(cloud, session);
          if (data) {
            cacheSet(local, JSON.stringify(data));
            setter(data);
          } else {
            // Try cache fallback
            const raw = cacheGet(local);
            if (raw) {
              try {
                setter(JSON.parse(raw));
              } catch (_) {
                setter(fallback);
              }
            }
          }
        } catch (_) {
          // Try cache fallback
          const raw = cacheGet(local);
          if (raw) {
            try {
              setter(JSON.parse(raw));
            } catch (_2) {
              // ignore
            }
          }
        }
      }

      // Sync current month's finance data
      if (!cancelled) {
        try {
          const mk = getMonthKey(getDateKey());
          const cloudKey = 'monthlyFinance_' + mk;
          const localKey = CACHE_KEYS.MONTHLY_FINANCE + mk;
          const mf = await apiLoadStore(cloudKey, session);
          if (mf) {
            cacheSet(localKey, JSON.stringify(mf));
            setMonthlyFinance(mf);
          } else {
            const raw = cacheGet(localKey);
            if (raw) {
              try {
                setMonthlyFinance(JSON.parse(raw));
              } catch (_) {
                // ignore
              }
            }
          }
        } catch (_) {
          // ignore
        }
      }

      if (!cancelled) {
        setSynced(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, session]);

  // -----------------------------------------------------------------------
  // Save helpers — each writes to state + cache + cloud
  // -----------------------------------------------------------------------

  const saveRoutines = useCallback(
    async (data) => {
      setRoutines(data);
      cacheSet(CACHE_KEYS.ROUTINES, JSON.stringify(data));
      if (isSignedIn && session) {
        try {
          await apiSaveStore(CLOUD_KEYS.ROUTINES, data, session);
        } catch (err) {
          console.error('Failed to save routines to cloud', err);
        }
      }
    },
    [isSignedIn, session]
  );

  const saveWeightHistory = useCallback(
    async (data) => {
      setWeightHistory(data);
      cacheSet(CACHE_KEYS.WEIGHT_HISTORY, JSON.stringify(data));
      if (isSignedIn && session) {
        try {
          await apiSaveStore(CLOUD_KEYS.WEIGHT_HISTORY, data, session);
        } catch (err) {
          console.error('Failed to save weight history to cloud', err);
        }
      }
    },
    [isSignedIn, session]
  );

  const saveGymRoutines = useCallback(
    async (data) => {
      setGymRoutines(data);
      cacheSet(CACHE_KEYS.GYM_ROUTINES, JSON.stringify(data));
      if (isSignedIn && session) {
        try {
          await apiSaveStore(CLOUD_KEYS.GYM_ROUTINES, data, session);
        } catch (err) {
          console.error('Failed to save gym routines to cloud', err);
        }
      }
    },
    [isSignedIn, session]
  );

  const saveGymWeekly = useCallback(
    async (data) => {
      setGymWeekly(data);
      cacheSet(CACHE_KEYS.GYM_WEEKLY, JSON.stringify(data));
      if (isSignedIn && session) {
        try {
          await apiSaveStore(CLOUD_KEYS.GYM_WEEKLY, data, session);
        } catch (err) {
          console.error('Failed to save gym weekly to cloud', err);
        }
      }
    },
    [isSignedIn, session]
  );

  const saveClosedMonths = useCallback(
    async (data) => {
      setClosedMonths(data);
      cacheSet(CACHE_KEYS.CLOSED_MONTHS, JSON.stringify(data));
      if (isSignedIn && session) {
        try {
          await apiSaveStore(CLOUD_KEYS.CLOSED_MONTHS, data, session);
        } catch (err) {
          console.error('Failed to save closed months to cloud', err);
        }
      }
    },
    [isSignedIn, session]
  );

  const saveMonthlyFinance = useCallback(
    async (data, monthKey) => {
      const mk = monthKey || getMonthKey(getDateKey());
      setMonthlyFinance(data);
      cacheSet(CACHE_KEYS.MONTHLY_FINANCE + mk, JSON.stringify(data));
      if (isSignedIn && session) {
        try {
          await apiSaveStore('monthlyFinance_' + mk, data, session);
        } catch (err) {
          console.error('Failed to save monthly finance to cloud', err);
        }
      }
    },
    [isSignedIn, session]
  );

  const saveAchievements = useCallback(
    async (data) => {
      setAchievements(data);
      cacheSet(CACHE_KEYS.ACHIEVEMENTS, JSON.stringify(data));
      if (isSignedIn && session) {
        try {
          await apiSaveStore(CLOUD_KEYS.ACHIEVEMENTS, data, session);
        } catch (err) {
          console.error('Failed to save achievements to cloud', err);
        }
      }
    },
    [isSignedIn, session]
  );

  const saveLearningActive = useCallback(
    async (data) => {
      setLearningActive(data);
      cacheSet(CACHE_KEYS.LEARNING_ACTIVE, JSON.stringify(data));
      if (isSignedIn && session) {
        try {
          await apiSaveStore(CLOUD_KEYS.LEARNING_ACTIVE, data, session);
        } catch (err) {
          console.error('Failed to save learning active to cloud', err);
        }
      }
    },
    [isSignedIn, session]
  );

  // -----------------------------------------------------------------------
  // Context value
  // -----------------------------------------------------------------------

  const value = {
    // State
    routines,
    weightHistory,
    gymRoutines,
    gymWeekly,
    closedMonths,
    monthlyFinance,
    achievements,
    learningActive,
    cloudDates,
    synced,

    // Save functions
    saveRoutines,
    saveWeightHistory,
    saveGymRoutines,
    saveGymWeekly,
    saveClosedMonths,
    saveMonthlyFinance,
    saveAchievements,
    saveLearningActive,

    // Direct setters (for local-only updates before a batch save)
    setCloudDates,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

/**
 * Hook to consume the StoreContext.
 * Must be used inside a <StoreProvider>.
 */
export function useStoreContext() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStoreContext must be used within a StoreProvider');
  }
  return ctx;
}

export default StoreContext;
