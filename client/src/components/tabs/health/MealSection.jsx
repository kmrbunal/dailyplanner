import { useCallback } from 'react';
import { useDayContext } from '../../../context/DayContext';
import MealRow from './MealRow';
import mealLogStyles from './MealLog.module.css';

/**
 * A single meal section (breakfast, lunch, dinner, or snacks).
 * Props:
 *   mealId - the dayData field name, e.g. "mealBreakfast"
 *   title  - display title, e.g. "Breakfast"
 *   icon   - emoji icon, e.g. "🌅"
 *   isSnack - optional flag to use khaki color for snack title
 */
export default function MealSection({ mealId, title, icon, isSnack }) {
  const { dayData, dispatch } = useDayContext();
  const items = dayData[mealId] || [{ food: '', portion: '', cal: '' }];

  const handleChange = useCallback(
    (index, field, value) => {
      const next = items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      dispatch({ type: 'SET_FIELD', field: mealId, value: next });
    },
    [items, mealId, dispatch]
  );

  const handleDelete = useCallback(
    (index) => {
      const next = items.filter((_, i) => i !== index);
      // Keep at least one empty row
      dispatch({
        type: 'SET_FIELD',
        field: mealId,
        value: next.length > 0 ? next : [{ food: '', portion: '', cal: '' }],
      });
    },
    [items, mealId, dispatch]
  );

  const addItem = () => {
    dispatch({
      type: 'SET_FIELD',
      field: mealId,
      value: [...items, { food: '', portion: '', cal: '' }],
    });
  };

  return (
    <div className={mealLogStyles.mealSection}>
      <div className={`${mealLogStyles.mealTitle}${isSnack ? ` ${mealLogStyles.mealTitleSnack}` : ''}`}>
        {icon} {title}
      </div>
      <div className={mealLogStyles.mealItems}>
        {items.map((item, i) => (
          <MealRow
            key={i}
            item={item}
            index={i}
            onChange={handleChange}
            onDelete={handleDelete}
          />
        ))}
      </div>
      <button className={mealLogStyles.addBtn} onClick={addItem}>
        + Add item
      </button>
    </div>
  );
}
