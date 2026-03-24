import { useState, useEffect, useRef } from 'react'
import { getDateKey } from '../../services/dateUtils'
import { useDayContext } from '../../context/DayContext'
import styles from './CalendarPopup.module.css'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPopup({ currentDate, onSelectDate, onClose }) {
  const [viewDate, setViewDate] = useState(new Date(currentDate))
  const ref = useRef()
  const { getSavedDates } = useDayContext()

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [onClose])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  const selectedStr = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`
  const savedDates = getSavedDates()

  const totalCells = firstDay + daysInMonth
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)

  return (
    <div className={styles.calendarPopup} ref={ref} onClick={e => e.stopPropagation()}>
      <div className={styles.calHeader}>
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))}>&#8249;</button>
        <span className={styles.calMonthYear}>{MONTHS[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))}>&#8250;</button>
      </div>
      <div className={styles.calGrid}>
        {DAYS.map(d => <div key={d} className={styles.calDayLabel}>{d}</div>)}
        {/* Previous month days */}
        {Array.from({ length: firstDay }, (_, i) => {
          const d = daysInPrevMonth - firstDay + i + 1
          const pm = month - 1 < 0 ? 11 : month - 1
          const py = month - 1 < 0 ? year - 1 : year
          return (
            <button key={`p${i}`} className={`${styles.calDay} ${styles.otherMonth}`}
              onClick={() => onSelectDate(new Date(py, pm, d))}>{d}</button>
          )
        })}
        {/* Current month days */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1
          const dayStr = `${year}-${month}-${d}`
          const dateKeyCheck = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const isToday = dayStr === todayStr
          const isSelected = dayStr === selectedStr
          const hasData = savedDates.includes(dateKeyCheck)
          return (
            <button key={d}
              className={[styles.calDay, isToday && styles.today, isSelected && styles.selected, hasData && styles.hasData].filter(Boolean).join(' ')}
              onClick={() => onSelectDate(new Date(year, month, d))}>{d}</button>
          )
        })}
        {/* Next month days */}
        {Array.from({ length: remainingCells }, (_, i) => {
          const d = i + 1
          const nm = month + 1 > 11 ? 0 : month + 1
          const ny = month + 1 > 11 ? year + 1 : year
          return (
            <button key={`n${i}`} className={`${styles.calDay} ${styles.otherMonth}`}
              onClick={() => onSelectDate(new Date(ny, nm, d))}>{d}</button>
          )
        })}
      </div>
      <button className={styles.calTodayBtn} onClick={() => onSelectDate(new Date())}>Today</button>
    </div>
  )
}
