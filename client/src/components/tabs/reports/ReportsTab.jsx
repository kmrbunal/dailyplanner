import { useState } from 'react';
import DailyReport from './DailyReport';
import WeeklyReport from './WeeklyReport';
import MonthlyReport from './MonthlyReport';
import styles from './ReportsTab.module.css';

const VIEWS = ['Daily', 'Weekly', 'Monthly'];

export default function ReportsTab() {
  const [activeView, setActiveView] = useState('Daily');

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.toggleGroup}>
          {VIEWS.map((view) => (
            <button
              key={view}
              className={activeView === view ? styles.toggleBtnActive : styles.toggleBtn}
              onClick={() => setActiveView(view)}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.reportContainer}>
        {activeView === 'Daily' && <DailyReport />}
        {activeView === 'Weekly' && <WeeklyReport />}
        {activeView === 'Monthly' && <MonthlyReport />}
      </div>
    </div>
  );
}
