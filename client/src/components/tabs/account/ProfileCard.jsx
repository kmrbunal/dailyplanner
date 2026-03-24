import { useState, useCallback } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import styles from './AccountTab.module.css';

const TIMEZONE_OPTIONS = [
  { value: '', label: 'Auto-detect' },
  { value: 'Asia/Manila', label: 'Asia/Manila (PHT)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
];

const CURRENCY_OPTIONS = [
  { value: 'PHP', label: 'PHP - Philippine Peso' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
];

export default function ProfileCard() {
  const { profile, saveProfile } = useAuthContext();

  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [timezone, setTimezone] = useState(profile.timezone || '');
  const [currency, setCurrency] = useState(profile.currency || 'PHP');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync local state when profile loads from API
  // (profile may arrive asynchronously after first render)
  const lastSyncedRef = useState({ synced: false })[0];
  if (!lastSyncedRef.synced && profile.email) {
    lastSyncedRef.synced = true;
    // Only set if the local values are still at their initial empty state
    if (!displayName && profile.display_name) setDisplayName(profile.display_name);
    if (!timezone && profile.timezone) setTimezone(profile.timezone);
    if (currency === 'PHP' && profile.currency && profile.currency !== 'PHP') {
      setCurrency(profile.currency);
    }
  }

  const handleSave = useCallback(async () => {
    setSaving(true);
    setStatus('');
    try {
      const ok = await saveProfile({
        display_name: displayName,
        timezone,
        currency,
      });
      setStatus(ok ? 'Profile saved!' : 'Failed to save');
    } catch {
      setStatus('Failed to save');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(''), 3000);
    }
  }, [displayName, timezone, currency, saveProfile]);

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        <span className={styles.icon}>👤</span> My Account
      </div>

      <div className={styles.formGroup}>
        {/* Email — read-only */}
        <div>
          <label className={styles.fieldLabel}>Email</label>
          <input
            type="email"
            className={styles.fieldInput}
            value={profile.email || ''}
            disabled
          />
        </div>

        {/* Display Name */}
        <div>
          <label className={styles.fieldLabel}>Display Name</label>
          <input
            type="text"
            className={styles.fieldInput}
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        {/* Timezone */}
        <div>
          <label className={styles.fieldLabel}>Timezone</label>
          <select
            className={styles.fieldSelect}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {TIMEZONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Currency */}
        <div>
          <label className={styles.fieldLabel}>Currency</label>
          <select
            className={styles.fieldSelect}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Save button */}
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>

        {/* Status message */}
        <div className={styles.profileStatus}>{status}</div>
      </div>
    </div>
  );
}
