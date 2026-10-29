import { useState, useCallback } from 'react';
import { useDayContext } from '../../../context/DayContext';
import TodoItem from './TodoItem';
import {
  createTodo,
  getPriorityTask,
  insertAt,
  moveById,
  moveToTop,
  removeById,
} from '../../../services/taskUtils';
import styles from './TasksTab.module.css';

/**
 * Category configuration for colours and placeholders.
 */
const CATEGORY_CONFIG = {
  work: {
    todosKey: 'workTodos',
    taskPlaceholder: 'Work task...',
    priorityBoxClass: '',
    priorityLabelClass: styles.work || '',
    priorityInputClass: styles.work || '',
    checkClass: 'priorityCheckWork',
  },
  health: {
    todosKey: 'healthTodos',
    taskPlaceholder: 'Workout or health goal...',
    priorityBoxClass: styles.health || '',
    priorityLabelClass: styles.health || '',
    priorityInputClass: styles.health || '',
    checkClass: 'priorityCheckHealth',
  },
  personal: {
    todosKey: 'personalTodos',
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
 *   - Top priority strip (dynamic: first open, named task in row order)
 *   - Todo list (insert / move / delete / details per row)
 *   - "Add task" button
 *
 * Props:
 *   category - "work" | "health" | "personal"
 *   title    - display title, e.g. "Work To-Dos"
 *   icon     - emoji string, e.g. "💼"
 */
export default function TaskCategory({ category, title, icon }) {
  const { dayData, dispatch } = useDayContext();
  const config = CATEGORY_CONFIG[category];
  const todosKey = config.todosKey;
  const todos = dayData[todosKey] || [];
  const [focusId, setFocusId] = useState(null);

  // All list changes go through a pure updater applied to the latest state.
  const updateList = useCallback(
    (updater) => dispatch({ type: 'UPDATE_TODOS', category: todosKey, updater }),
    [todosKey, dispatch]
  );

  // --- Dynamic top priority (computed independently for this column) ---
  const priorityTask = getPriorityTask(todos);
  const hasNamedTasks = todos.some((t) => (t.text || '').trim());
  let priorityText;
  if (priorityTask) priorityText = priorityTask.text.trim();
  else if (hasNamedTasks) priorityText = 'All tasks completed!';
  else priorityText = 'Add a task to set your priority';

  // --- Row operations (by id, so other rows are never affected) ---
  const handleChange = useCallback(
    (id, updates) =>
      updateList((list) =>
        list.map((t) =>
          t.id === id ? { ...t, ...(typeof updates === 'function' ? updates(t) : updates) } : t
        )
      ),
    [updateList]
  );

  const handleToggle = useCallback(
    (id) => updateList((list) => list.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t))),
    [updateList]
  );

  const handleInsert = useCallback(
    (id, offset) => {
      const fresh = createTodo();
      updateList((list) => {
        const idx = list.findIndex((t) => t.id === id);
        return insertAt(list, idx === -1 ? list.length : idx + offset, fresh);
      });
      setFocusId(fresh.id);
    },
    [updateList, setFocusId]
  );

  const handleAddTask = useCallback(() => {
    const fresh = createTodo();
    updateList((list) => [...list, fresh]);
    setFocusId(fresh.id);
  }, [updateList, setFocusId]);

  return (
    <div className={styles.taskCat}>
      <div className={`${styles.taskCatTitle} ${styles[category] || ''}`}>
        <span className={`${styles.taskCatIcon} ${styles[category] || ''}`}>{icon}</span>
        {' '}{title}
      </div>

      {/* Top Priority Box */}
      <div className={`${styles.topPriorityBox} ${config.priorityBoxClass}`}>
        <span className={`${styles.topPriorityLabel} ${config.priorityLabelClass}`}>
          {'🎯'} Top Priority
        </span>
        <span
          className={`${styles.topPriorityInput} ${styles.topPriorityValue} ${config.priorityInputClass} ${
            priorityTask ? '' : styles.topPriorityEmpty
          }`}
          title={priorityText}
          aria-live="polite"
        >
          {priorityText}
        </span>
      </div>

      {/* Todo List */}
      <div className={styles.todoList}>
        {todos.map((todo, i) => (
          <TodoItem
            key={todo.id || i}
            todo={todo}
            onChange={(updates) => handleChange(todo.id, updates)}
            onToggle={() => handleToggle(todo.id)}
            onInsertAbove={() => handleInsert(todo.id, 0)}
            onInsertBelow={() => handleInsert(todo.id, 1)}
            onMoveUp={() => updateList((list) => moveById(list, todo.id, -1))}
            onMoveDown={() => updateList((list) => moveById(list, todo.id, 1))}
            onMoveTop={() => updateList((list) => moveToTop(list, todo.id))}
            onDelete={() => updateList((list) => removeById(list, todo.id))}
            canMoveUp={i > 0}
            canMoveDown={i < todos.length - 1}
            autoFocus={todo.id === focusId}
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
