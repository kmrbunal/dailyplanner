import { useState, useEffect } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import { useStoreContext } from '../../../context/StoreContext';
import styles from './AccountTab.module.css';

export default function DataSummaryCard() {
  const { user, profile, session } = useAuthContext();
  const { cloudDates, synced } = useStoreContext();
  const email = profile.email || user?.emailAddresses?.[0]?.emailAddress || '';

  const [daysCount, setDaysCount] = useState(null);

  // Derive days count from the cloudDates already fetched by StoreContext
  useEffect(() => {
    if (cloudDates && Array.isArray(cloudDates)) {
      setDaysCount(cloudDates.length);
    }
  }, [cloudDates]);

  const isLoading = daysCount === null && !synced;

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        <span className={styles.icon}>📊</span> Data Summary
      </div>

      <div className={styles.dataSummary}>
        {isLoading ? (
          'Loading...'
        ) : (
          <>
            Days recorded: <strong>{daysCount ?? 0}</strong>
            <br />
            Account email: <strong>{email}</strong>
            <br />
            Synced to cloud:{' '}
            <strong>{session && synced ? 'Yes' : 'Pending'}</strong>
          </>
        )}
      </div>
    </div>
  );
}
