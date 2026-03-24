import styles from './TabNav.module.css'

const TABS = [
  { id: 'tasks', icon: '📋', label: 'Tasks' },
  { id: 'health', icon: '💪', label: 'Health' },
  { id: 'wellness', icon: '🧘', label: 'Wellness' },
  { id: 'finance', icon: '💰', label: 'Finance' },
  { id: 'inspire', icon: '💡', label: 'Inspire' },
  { id: 'learn', icon: '📚', label: 'Learn' },
  { id: 'notes', icon: '📝', label: 'Notes' },
  { id: 'routines', icon: '🔁', label: 'Routines' },
  { id: 'account', icon: '👤', label: 'Account' },
]

export default function TabNav({ activeTab, onTabChange }) {
  return (
    <div className={styles.tabNav}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onTabChange(tab.id)}
          data-tab={tab.id}
        >
          <span className={styles.tabIcon}>{tab.icon}</span>
          <span className={styles.tabLabel}>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
