import { useCallback } from 'react';
import { useDayContext } from '../../../context/DayContext';
import TodoItem from './TodoItem';
import styles from './TasksTab.module.css';

/**
 * Category configuration for colours and placeholders.
 */
const CATEGORY_CONFIG = {
  work: {
    todosKey: 'workTodos',
    priorityIndex: 0,
    priorityPlaceholder: 'Your #1 work priority today...',
    taskPlaceholder: 'Work task...',
    priorityBoxClass: '',
    priorityLabelClass: styles.work || '',
    priorityInputClass: styles.work || '',
    checkClass: 'priorityCheckWork',
  },
  health: {
    todosKey: 'healthTodos',
    priorityIndex: 1,
    priorityPlaceholder: 'Your #1 health goal today...',
    taskPlaceholder: 'Workout or health goal...',
    priorityBoxClass: styles.health || '',
    priorityLabelClass: styles.health || '',
    priorityInputClass: styles.health || '',
    checkClass: 'priorityCheckHealth',
  },
  personal: {
    todosKey: 'personalTodos',
    priorityIndex: 2,
    priorityPlaceholder: 'Your #1 personal priority today...',
    taskPlaceholder: 'Personal task...',
    priorityBoxClass: styles.personal || '',
    priorityLabelClass: styles.personal || '',
    priorityInputClass: styles.personal || '',
    checkClass: 'priorityCheckPersonal',
  },
};

/**
 * TaskCategory renders a card with:
 *   - Title with icon
 *   - Top priority input
 *   - Todo list
 *   - "Add task" button
 *
 * Props:
 *   category - "work" | "health" | "personal"
 *   title    - display title, e.g. "Work To-Dos"
 *   icon     - emoji string, e.g. "\uD83D\uDCBC"
 */
export default function TaskCategory({ category, title, icon }) {
  const { dayData, dispatch } = useDayContext();
  const config = CATEGORY_CONFIG[category];
  const todosKey = config.todosKey;
  const todos = dayData[todosKey] || [];

  // --- Top priority ---
  const priorityValue = (dayData.topPriorities || [])[config.priorityIndex] || '';

  const handlePriorityChange = useCallback(
    (e) => {
      const updated = [...(dayData.topPriorities || ['', '', ''])];
      updated[config.priorityIndex] = e.target.value;
      dispatch({ type: 'SET_FIELD', field: 'topPriorities', value: updated });
    },
    [dayData.topPriorities, config.priorityIndex, dispatch]
  );

  // --- Todo updates ---
  const handleTodoChange = useCallback(
    (index, updates) => {
      dispatch({ type: 'SET_TODO', category: todosKey, index, updates });
    },
    [todosKey, dispatch]
  );

  const handleTodoToggle = useCallback(
    (index) => {
      dispatch({ type: 'TOGGLE_TODO', category: todosKey, index });
    },
    [todosKey, dispatch]
  );

  // --- Add task ---
  const handleAddTask = useCallback(() => {
    const newList = [...todos, { text: '', checked: false, alarm: '' }];
    dispatch({ type: 'SET_FIELD', field: todosKey, value: newList });
  }, [todos, todosKey, dispatch]);

  return (
    <div className={styles.taskCat}>
      <div className={`${styles.taskCatTitle} ${styles[category] || ''}`}>
        <span className={`${styles.taskCatIcon} ${styles[category] || ''}`}>{icon}</span>
        {' '}{title}
      </div>

      {/* Top Priority Box */}
      <div className={`${styles.topPriorityBox} ${config.priorityBoxClass}`}>
        <span className={`${styles.topPriorityLabel} ${config.priorityLabelClass}`}>
          {'\uD83C\uDFAF'} Top Priority
        </span>
        <input
          type="text"
          className={`${styles.topPriorityInput} ${config.priorityInputClass}`}
          placeholder={config.priorityPlaceholder}
          value={priorityValue}
          onChange={handlePriorityChange}
        />
      </div>

      {/* Todo List */}
      <div className={styles.todoList}>
        {todos.map((todo, i) => (
          <TodoItem
            key={i}
            todo={todo}
            onChange={(updates) => handleTodoChange(i, updates)}
            onToggle={() => handleTodoToggle(i)}
            placeholder={config.taskPlaceholder}
            checkClass={styles[config.checkClass] || ''}
          />
        ))}
      </div>

      {/* Add Task Button */}
      <button type="button" className={styles.addBtn} onClick={handleAddTask}>
        + Add task
      </button>
    </div>
  );
}
