import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useAuth, useUser, useSession } from '@clerk/clerk-react';
import { apiGet, apiPut, getAuthToken } from '../services/api';

const AuthContext = createContext(null);

const INITIAL_PROFILE = {
  email: '',
  display_name: '',
  timezone: '',
  currency: '',
};

export function AuthProvider({ children }) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { session } = useSession();

  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);

  /**
   * Get a JWT token from the current Clerk session.
   * Components can call this before making their own API requests.
   */
  const getToken = useCallback(async () => {
    return getAuthToken(session);
  }, [session]);

  /**
   * Fetch the user profile from the cloud API.
   */
  const loadProfile = useCallback(async () => {
    if (!session) return null;
    try {
      const data = await apiGet('profile', session);
      if (data) {
        const loaded = {
          email: data.email || '',
          display_name: data.display_name || '',
          timezone: data.timezone || '',
          currency: data.currency || '',
        };
        setProfile(loaded);
        setProfileLoaded(true);
        return loaded;
      }
    } catch (err) {
      console.error('Load profile failed', err);
    }
    return null;
  }, [session]);

  /**
   * Save profile fields to the cloud API.
   * @param {object} fields - Partial profile object (display_name, timezone, currency)
   */
  const saveProfile = useCallback(
    async (fields) => {
      if (!session) return false;
      try {
        const ok = await apiPut('profile', fields, session);
        if (ok) {
          setProfile((prev) => ({ ...prev, ...fields }));
        }
        return ok;
      } catch (err) {
        console.error('Save profile failed', err);
        return false;
      }
    },
    [session]
  );

  // On mount when signed in: init profile in the database, then load it
  useEffect(() => {
    if (!isSignedIn || !user || !session) return;

    let cancelled = false;
    const email =
      user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress || '';

    (async () => {
      // POST /api/profile/init — creates the profile row if first time
      try {
        const token = await getAuthToken(session);
        if (token && !cancelled) {
          await fetch('/api/profile/init', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + token,
            },
            body: JSON.stringify({ email }),
          });
        }
      } catch (err) {
        console.error('Profile init failed', err);
      }

      // Load the full profile into state
      if (!cancelled) {
        await loadProfile();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user, session, loadProfile]);

  const value = {
    // Clerk primitives
    user,
    isSignedIn: !!isSignedIn,
    session,
    getToken,

    // Profile state + actions
    profile,
    profileLoaded,
    loadProfile,
    saveProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to consume the AuthContext.
 * Must be used inside an <AuthProvider>.
 */
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return ctx;
}

export default AuthContext;
