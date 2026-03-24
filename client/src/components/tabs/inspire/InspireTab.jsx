import { useState, useCallback } from 'react';
import valuables from '../../../data/valuables';
import styles from './InspireTab.module.css';

/**
 * Pick a random index that differs from the current one (when possible).
 */
function randomIndex(currentIdx) {
  if (valuables.length <= 1) return 0;
  let next;
  do {
    next = Math.floor(Math.random() * valuables.length);
  } while (next === currentIdx);
  return next;
}

export default function InspireTab() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * valuables.length));

  const article = valuables[idx];

  const showNext = useCallback(() => {
    setIdx((prev) => randomIndex(prev));
  }, []);

  if (!article) return null;

  return (
    <div className={styles.grid}>
      <div className={styles.valuableSection}>
        <div className={styles.cardTitle}>
          <span className={styles.icon}>💡</span> Something Valuable
        </div>
        <div className={styles.valuableCategory}>{article.category}</div>
        <div className={styles.valuableTitle}>{article.title}</div>
        <div className={styles.valuableBody}>{article.body}</div>
        <div className={styles.valuableFooter}>
          <span className={styles.valuableSource}>{article.source}</span>
          <button className={styles.valuableRefresh} onClick={showNext}>
            Show me another
          </button>
        </div>
      </div>
    </div>
  );
}
