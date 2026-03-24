import ProfileCard from './ProfileCard';
import DataSummaryCard from './DataSummaryCard';
import styles from './AccountTab.module.css';

export default function AccountTab() {
  return (
    <div className={styles.grid}>
      <ProfileCard />
      <DataSummaryCard />
    </div>
  );
}
