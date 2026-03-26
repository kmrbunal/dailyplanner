import { useState, useEffect } from 'react'
import { useClerk, useUser } from '@clerk/clerk-react'
import { useDayContext } from '../../context/DayContext'
import { formatDate } from '../../services/dateUtils'
import CalendarPopup from './CalendarPopup'
import styles from './Header.module.css'

function LiveClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    function update() {
      const now = new Date()
      let h = now.getHours()
      const m = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      const ampm = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      setTime(`${h}:${m}:${s} ${ampm}`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return <div className={styles.liveClock}>{time}</div>
}

export default function Header({ headerGradient, onClearDay, onAccountClick }) {
  const { signOut } = useClerk()
  const { user } = useUser()
  const { currentDate, switchDate } = useDayContext()
  const [showCalendar, setShowCalendar] = useState(false)

  const userName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress || ''

  function changeDate(delta) {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + delta)
    switchDate(newDate)
  }

  return (
    <div className={styles.header} style={{ background: headerGradient }}>
      <div className={styles.userBar}>
        <span className={styles.userName} onClick={onAccountClick} style={{ cursor: 'pointer' }}>{userName}</span>
        <button className={styles.signOutBtn} onClick={() => signOut()}>Sign Out</button>
      </div>
      <LiveClock />
      <h1>Daily Planner</h1>
      <p className={styles.subtitle}>by Cafe Mocha</p>
      <div className={styles.dateNav}>
        <button onClick={() => changeDate(-1)}>&#8249;</button>
        <div className={styles.calendarWrapper}>
          <div
            className={styles.dateDisplay}
            onClick={(e) => { e.stopPropagation(); setShowCalendar(!showCalendar) }}
          >
            <span style={{ marginRight: 8, fontSize: 16 }}>{'\uD83D\uDCC5'}</span>
            {formatDate(currentDate)}
          </div>
          {showCalendar && (
            <CalendarPopup
              currentDate={currentDate}
              onSelectDate={(d) => { switchDate(d); setShowCalendar(false) }}
              onClose={() => setShowCalendar(false)}
            />
          )}
        </div>
        <button onClick={() => changeDate(1)}>&#8250;</button>
      </div>
      <button className={styles.newDayBtn} onClick={onClearDay}>
        &#10024; Start New Day &mdash; Clear All
      </button>
    </div>
  )
}
