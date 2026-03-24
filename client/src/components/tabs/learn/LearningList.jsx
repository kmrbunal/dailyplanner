import { useCallback, useEffect, useRef } from 'react';
import { useDayContext } from '../../../context/DayContext';
import { useStoreContext } from '../../../context/StoreContext';
import { getDateKey } from '../../../services/dateUtils';
import styles from './LearnTab.module.css';

const LEARNING_EMOJIS = ['📖', '🧠', '🎯', '🌍', '🔬', '🎵', '🏊', '🧘', '✍️', '🛠️'];
const DEFAULT_EMOJIS = ['🎓', '🎨', '💻', '🏃'];

function randomEmoji() {
  return LEARNING_EMOJIS[Math.floor(Math.random() * LEARNING_EMOJIS.length)];
}

export default function LearningList() {
  const { dayData, dispatch } = useDayContext();
  const { learningActive, saveLearningActive, achievements, saveAchievements } =
    useStoreContext();

  const initializedRef = useRef(false);

  // On mount, merge learningActive (carry-forward) into dayData.learning
  // if the day has no learning items yet.
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const dayLearning = dayData.learning || [];
    if (dayLearning.length === 0 && learningActive && learningActive.length > 0) {
      dispatch({
        type: 'SET_FIELD',
        field: 'learning',
        value: learningActive.map((item) => ({
          text: item.text || '',
          status: item.status || 'explore',
          emoji: item.emoji || randomEmoji(),
        })),
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const items = dayData.learning && dayData.learning.length > 0
    ? dayData.learning
    : DEFAULT_EMOJIS.map((emoji) => ({ text: '', status: 'explore', emoji }));

  // Ensure dayData.learning is populated if we are using defaults
  useEffect(() => {
    if (!dayData.learning || dayData.learning.length === 0) {
      dispatch({
        type: 'SET_FIELD',
        field: 'learning',
        value: DEFAULT_EMOJIS.map((emoji) => ({ text: '', status: 'explore', emoji })),
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Persist non-completed items to the global learningActive store
   * and newly completed items to the achievements store.
   */
  const syncStores = useCallback(
    (updatedItems) => {
      // Save non-completed items as the carry-forward master list
      const active = updatedItems
        .filter((l) => l.text && l.status !== 'done');
      saveLearningActive(active);

      // Check for newly completed items and add to achievements
      const completed = updatedItems.filter((l) => l.text && l.status === 'done');
      if (completed.length > 0) {
        const existingTexts = new Set(
          (achievements || []).map((a) => a.text.toLowerCase().trim())
        );
        const newAchievements = completed.filter(
          (c) => !existingTexts.has(c.text.toLowerCase().trim())
        );
        if (newAchievements.length > 0) {
          const updated = [
            ...(achievements || []),
            ...newAchievements.map((item) => ({
              text: item.text,
              emoji: item.emoji || '🏆',
              completedDate: getDateKey(),
            })),
          ];
          saveAchievements(updated);
        }
      }
    },
    [achievements, saveAchievements, saveLearningActive]
  );

  const updateItem = useCallback(
    (index, updates) => {
      const updated = items.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      );
      dispatch({ type: 'SET_FIELD', field: 'learning', value: updated });
      syncStores(updated);
    },
    [items, dispatch, syncStores]
  );

  const addItem = useCallback(() => {
    const updated = [
      ...items,
      { text: '', status: 'explore', emoji: randomEmoji() },
    ];
    dispatch({ type: 'SET_FIELD', field: 'learning', value: updated });
  }, [items, dispatch]);

  const removeItem = useCallback(
    (index) => {
      const updated = items.filter((_, i) => i !== index);
      dispatch({ type: 'SET_FIELD', field: 'learning', value: updated });
      syncStores(updated);
    },
    [items, dispatch, syncStores]
  );

  return (
    <div className={styles.learningSection}>
      <div className={`${styles.cardTitle} ${styles.learningTitle}`}>
        <span className={`${styles.icon} ${styles.learningTitleIcon}`}>📚</span>
        Learning &amp; Growth
      </div>
      <p className={styles.subtitle}>
        Courses, classes, and new activities to explore. Keep growing!
      </p>

      <div className={styles.learningList}>
        {items.map((item, i) => (
          <div key={i} className={styles.learningItem}>
            <span className={styles.learningEmoji}>{item.emoji}</span>
            <input
              type="text"
              className={styles.learningInput}
              placeholder={getPlaceholder(i)}
              value={item.text}
              onChange={(e) => updateItem(i, { text: e.target.value })}
            />
            <select
              className={styles.learningStatus}
              value={item.status}
              onChange={(e) => updateItem(i, { status: e.target.value })}
            >
              <option value="explore">Exploring</option>
              <option value="enrolled">Enrolled</option>
              <option value="progress">In Progress</option>
              <option value="done">Completed</option>
            </select>
            {items.length > 1 && (
              <button
                className={styles.removeBtn}
                onClick={() => removeItem(i)}
                title="Remove item"
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>

      <button className={styles.addBtn} onClick={addItem}>
        + Add course or activity
      </button>
    </div>
  );
}

const PLACEHOLDERS = [
  'e.g. Learn a new language on Duolingo...',
  'e.g. Try a pottery or painting class...',
  'e.g. Take an online coding course...',
  'e.g. Sign up for a dance or yoga class...',
];

function getPlaceholder(index) {
  return PLACEHOLDERS[index] || 'e.g. Add a course or activity...';
}
