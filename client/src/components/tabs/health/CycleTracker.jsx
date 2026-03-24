import { useDayContext } from '../../../context/DayContext';
import styles from './CycleTracker.module.css';

const FLOW_LEVELS = ['none', 'spotting', 'light', 'medium', 'heavy'];
const FLOW_LABELS = { none: 'None', spotting: 'Spotting', light: 'Light', medium: 'Medium', heavy: 'Heavy' };

const SYMPTOMS = ['Cramps', 'Bloating', 'Headache', 'Fatigue', 'Mood swings', 'Back pain', 'Acne', 'Cravings'];

/**
 * Calculate the current cycle phase given day number and cycle length.
 * Phase boundaries scale with cycle length (luteal is ~14 days, ovulation ~2 days before).
 */
function getPhaseInfo(day, len) {
  if (!day || day < 1) return { phase: '', activePhase: '' };

  const lutealStart = len - 13;
  const ovulationStart = lutealStart - 2;

  if (day <= 5) {
    return { phase: `Menstrual Phase — Day ${day}`, activePhase: 'menstrual' };
  } else if (day < ovulationStart) {
    return { phase: `Follicular Phase — Day ${day}`, activePhase: 'follicular' };
  } else if (day < lutealStart) {
    return { phase: `Ovulation Window — Day ${day}`, activePhase: 'ovulation' };
  } else {
    return { phase: `Luteal Phase — Day ${day}`, activePhase: 'luteal' };
  }
}

export default function CycleTracker() {
  const { dayData, dispatch } = useDayContext();

  const cycleFlow = dayData.cycleFlow || '';
  const cycleDay = dayData.cycleDay || '';
  const cycleLength = dayData.cycleLength || '';
  const cycleNotes = dayData.cycleNotes || '';
  const symptoms = dayData.symptoms || [];

  const effectiveLength = parseInt(cycleLength) || 28;
  const dayNum = parseInt(cycleDay) || 0;
  const { phase, activePhase } = getPhaseInfo(dayNum, effectiveLength);

  const PHASES = ['menstrual', 'follicular', 'ovulation', 'luteal'];

  const selectFlow = (flow) => {
    dispatch({ type: 'SET_FIELD', field: 'cycleFlow', value: cycleFlow === flow ? '' : flow });
  };

  const toggleSymptom = (symptom) => {
    const next = symptoms.includes(symptom)
      ? symptoms.filter((s) => s !== symptom)
      : [...symptoms, symptom];
    dispatch({ type: 'SET_FIELD', field: 'symptoms', value: next });
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>
        <span className={styles.icon}>🩸</span> Cycle Tracker
      </div>

      {/* Flow */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Today's Flow</div>
        <div className={styles.flowBtns}>
          {FLOW_LEVELS.map((flow) => (
            <button
              key={flow}
              className={`${styles.flowBtn}${cycleFlow === flow ? ` ${styles.active}` : ''}`}
              onClick={() => selectFlow(flow)}
            >
              {FLOW_LABELS[flow]}
            </button>
          ))}
        </div>
      </div>

      {/* Cycle Day */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Cycle Day</div>
        <div className={styles.cycleDayRow}>
          <input
            type="number"
            className={styles.cycleDayInput}
            min="1"
            max="45"
            placeholder="—"
            value={cycleDay}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'cycleDay', value: e.target.value })}
          />
          <span className={styles.cycleDayLabel}>of</span>
          <input
            type="number"
            className={styles.cycleLengthInput}
            min="20"
            max="45"
            placeholder="28"
            value={cycleLength}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'cycleLength', value: e.target.value })}
          />
          <span className={styles.cycleDayLabel}>day cycle</span>
        </div>
      </div>

      {/* Phase indicator */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Current Phase</div>
        <div className={styles.phaseBar}>
          {PHASES.map((p) => {
            let className = `${styles.phaseSegment} ${styles[p]}`;
            if (activePhase) {
              className += activePhase === p ? ` ${styles.active}` : ` ${styles.dimmed}`;
            }
            const titles = {
              menstrual: 'Menstrual (Days 1-5)',
              follicular: `Follicular (Days 6-${(effectiveLength - 13 - 2) - 1})`,
              ovulation: `Ovulation (Days ${effectiveLength - 13 - 2}-${effectiveLength - 13 - 1})`,
              luteal: `Luteal (Days ${effectiveLength - 13}-${effectiveLength})`,
            };
            return (
              <div
                key={p}
                className={className}
                title={titles[p]}
              />
            );
          })}
        </div>
        <div className={styles.phaseLabels}>
          <span>Menstrual</span>
          <span>Follicular</span>
          <span>Ovulation</span>
          <span>Luteal</span>
        </div>
        {phase && <div className={styles.phaseText}>{phase}</div>}
      </div>

      {/* Symptoms */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Symptoms</div>
        <div className={styles.symptomBtns}>
          {SYMPTOMS.map((s) => (
            <button
              key={s}
              className={`${styles.symptomBtn}${symptoms.includes(s) ? ` ${styles.active}` : ''}`}
              onClick={() => toggleSymptom(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <input
          type="text"
          className={styles.notesInput}
          placeholder="Additional cycle notes..."
          value={cycleNotes}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'cycleNotes', value: e.target.value })}
        />
      </div>
    </div>
  );
}
