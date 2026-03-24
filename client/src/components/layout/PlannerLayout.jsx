import { useState } from 'react'
import Header from './Header'
import TabNav from './TabNav'
import SaveIndicator from '../common/SaveIndicator'
import AlarmOverlay from '../common/AlarmOverlay'
import ClearConfirmModal from '../common/ClearConfirmModal'
import QuoteBar from '../common/QuoteBar'
import ProgressBar from '../common/ProgressBar'
import TasksTab from '../tabs/tasks/TasksTab'
import WellnessTab from '../tabs/wellness/WellnessTab'
import HealthTab from '../tabs/health/HealthTab'
import FinanceTab from '../tabs/finance/FinanceTab'
import InspireTab from '../tabs/inspire/InspireTab'
import LearnTab from '../tabs/learn/LearnTab'
import NotesTab from '../tabs/notes/NotesTab'
import RoutinesTab from '../tabs/routines/RoutinesTab'
import AccountTab from '../tabs/account/AccountTab'
import styles from './PlannerLayout.module.css'

const TAB_ORDER = ['tasks', 'health', 'wellness', 'finance', 'inspire', 'learn', 'notes', 'routines', 'account']

const TAB_THEMES = {
  tasks: { gradient: 'linear-gradient(135deg, #3d6b5e, #2a4a3e, #1e3830)', accent: '#3d6b5e' },
  health: { gradient: 'linear-gradient(135deg, #3b6b6b, #2a4f4f, #1e3838)', accent: '#3b6b6b' },
  wellness: { gradient: 'linear-gradient(135deg, #4a6b5e, #35524a, #253b34)', accent: '#4a6b5e' },
  routines: { gradient: 'linear-gradient(135deg, #3e5c6b, #2b4150, #1d2e38)', accent: '#3e5c6b' },
  learn: { gradient: 'linear-gradient(135deg, #3d5e6b, #2a444f, #1e3038)', accent: '#3d5e6b' },
  finance: { gradient: 'linear-gradient(135deg, #7a6b3c, #5c4f2a, #3d341c)', accent: '#7a6b3c' },
  notes: { gradient: 'linear-gradient(135deg, #8b6b3e, #6b4f2e, #4a3520)', accent: '#8b6b3e' },
  inspire: { gradient: 'linear-gradient(135deg, #8b5e4a, #6b4235, #4a2c22)', accent: '#8b5e4a' },
  account: { gradient: 'linear-gradient(135deg, #5a6b5e, #3e4f42, #2a382e)', accent: '#5a6b5e' },
}

const TAB_COMPONENTS = {
  tasks: TasksTab,
  health: HealthTab,
  wellness: WellnessTab,
  finance: FinanceTab,
  inspire: InspireTab,
  learn: LearnTab,
  notes: NotesTab,
  routines: RoutinesTab,
  account: AccountTab,
}

export default function PlannerLayout() {
  const [activeTab, setActiveTab] = useState('tasks')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const theme = TAB_THEMES[activeTab] || TAB_THEMES.tasks
  const ActiveTabComponent = TAB_COMPONENTS[activeTab]

  // Swipe handling for mobile tab switching
  const handleSwipe = (direction) => {
    const idx = TAB_ORDER.indexOf(activeTab)
    if (direction === 'left' && idx < TAB_ORDER.length - 1) {
      setActiveTab(TAB_ORDER[idx + 1])
    } else if (direction === 'right' && idx > 0) {
      setActiveTab(TAB_ORDER[idx - 1])
    }
  }

  return (
    <div className={styles.planner}>
      <Header
        headerGradient={theme.gradient}
        onClearDay={() => setShowClearConfirm(true)}
      />
      <SaveIndicator />
      <AlarmOverlay />
      {showClearConfirm && (
        <ClearConfirmModal onClose={() => setShowClearConfirm(false)} />
      )}
      <QuoteBar />
      <ProgressBar />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      <div className={styles.tabContent}>
        {ActiveTabComponent && <ActiveTabComponent />}
      </div>
    </div>
  )
}
