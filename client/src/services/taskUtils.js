/**
 * Pure helpers for daily tasks (Tasks tab) and routine templates (Routines tab).
 * No React imports here so the logic can be tested in plain Node.
 */

export const TODO_KEYS = ['workTodos', 'healthTodos', 'personalTodos'];

// Routine group -> daily task column
export const ROUTINE_TO_TODO = {
  work: 'workTodos',
  health: 'healthTodos',
  personal: 'personalTodos',
};

export const ROUTINE_GROUPS = Object.keys(ROUTINE_TO_TODO);

export function genId(prefix = 't') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return prefix + '_' + crypto.randomUUID().slice(0, 12);
  }
  return prefix + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// Daily tasks
// ---------------------------------------------------------------------------

export function createTodo(fields = {}) {
  return { id: genId('t'), text: '', checked: false, alarm: '', ...fields };
}

/**
 * Backward-compatible migration: older saved tasks are { text, checked, alarm }
 * without an id. Give every task (and subtask) a stable id, keep all other fields.
 */
export function normalizeTodo(todo) {
  const t = todo && typeof todo === 'object' ? todo : { text: String(todo || '') };
  const out = {
    ...t,
    id: t.id || genId('t'),
    text: typeof t.text === 'string' ? t.text : '',
    checked: !!t.checked,
    alarm: t.alarm || '',
  };
  if (Array.isArray(t.subtasks)) {
    out.subtasks = t.subtasks.map((s) => ({
      ...s,
      id: (s && s.id) || genId('s'),
      text: s && typeof s.text === 'string' ? s.text : '',
      checked: !!(s && s.checked),
    }));
  }
  return out;
}

export function normalizeTodos(list) {
  if (!Array.isArray(list)) return [];
  let changed = false;
  const out = list.map((t) => {
    if (t && t.id && typeof t.text === 'string' && (!t.subtasks || t.subtasks.every((s) => s && s.id))) {
      return t;
    }
    changed = true;
    return normalizeTodo(t);
  });
  return changed ? out : list;
}

/** Apply normalizeTodos to the three task columns of a day object. */
export function normalizeDayTodos(day) {
  const out = { ...day };
  TODO_KEYS.forEach((k) => {
    if (out[k] !== undefined) out[k] = normalizeTodos(out[k]);
  });
  return out;
}

/** An open task with a name is eligible to be the column's priority. */
export function isEligiblePriority(todo) {
  return !!todo && !todo.checked && typeof todo.text === 'string' && todo.text.trim() !== '';
}

/** First eligible open task in row order (no separate ranking system exists). */
export function getPriorityTask(todos) {
  return (todos || []).find(isEligiblePriority) || null;
}

/** Derive the legacy topPriorities array (read by Reports / PDF export) from the columns. */
export function computeTopPriorities(day) {
  return TODO_KEYS.map((k) => {
    const p = getPriorityTask(day[k]);
    return p ? p.text.trim() : '';
  });
}

/** True when a row has no content at all and can be reused as an empty slot. */
export function isBlankTodo(t) {
  return (
    !!t &&
    !(t.text || '').trim() &&
    !t.checked &&
    !t.alarm &&
    !t.routineId &&
    !(t.notes || '').trim() &&
    !(Array.isArray(t.subtasks) && t.subtasks.length > 0)
  );
}

export function subtaskProgress(todo) {
  const subs = (todo && todo.subtasks) || [];
  return { done: subs.filter((s) => s.checked).length, total: subs.length };
}

// ---------------------------------------------------------------------------
// Generic list operations (return new arrays, never mutate)
// ---------------------------------------------------------------------------

export function insertAt(list, index, item) {
  const i = Math.max(0, Math.min(index, list.length));
  return [...list.slice(0, i), item, ...list.slice(i)];
}

export function removeById(list, id) {
  return list.filter((x) => x.id !== id);
}

export function updateById(list, id, updates) {
  return list.map((x) => (x.id === id ? { ...x, ...updates } : x));
}

export function moveById(list, id, delta) {
  const from = list.findIndex((x) => x.id === id);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= list.length) return list;
  const out = [...list];
  const [item] = out.splice(from, 1);
  out.splice(to, 0, item);
  return out;
}

export function moveToTop(list, id) {
  const from = list.findIndex((x) => x.id === id);
  if (from <= 0) return list;
  return moveById(list, id, -from);
}

// ---------------------------------------------------------------------------
// Routine templates
// ---------------------------------------------------------------------------

function hashText(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/**
 * Routines were saved as { work: [string], ... }. New format is
 * { work: [{ id, text }], ... }. Legacy strings get a deterministic id derived
 * from group + text + occurrence, so the same legacy routine keeps the same id
 * across sessions until it is re-saved in the new format.
 */
export function normalizeRoutines(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  ROUTINE_GROUPS.forEach((g) => {
    const seen = {};
    out[g] = (Array.isArray(src[g]) ? src[g] : [])
      .map((item) => {
        if (item && typeof item === 'object') {
          const text = typeof item.text === 'string' ? item.text : '';
          if (item.id) return { ...item, text };
          return { ...item, id: legacyId(g, text, seen), text };
        }
        const text = String(item ?? '');
        return { id: legacyId(g, text, seen), text };
      })
      .filter((r) => r.text.trim() !== '');
  });
  return out;
}

function legacyId(group, text, seen) {
  const key = text.trim().toLowerCase();
  seen[key] = (seen[key] || 0) + 1;
  return 'r_' + group + '_' + hashText(key) + '_' + seen[key];
}

function normText(s) {
  return (s || '').trim().toLowerCase();
}

/**
 * Add routine entries to a daily task column without removing or resetting
 * anything that is already there.
 *
 * A routine counts as already present when:
 *   1. a task carries its routineId, or
 *   2. a task with the same name exists that is not linked to another routine
 *      of this group (covers tasks typed by hand and tasks loaded before ids
 *      existed). Each such task can only satisfy one routine entry, so
 *      intentional duplicate routines are still both loaded.
 *
 * Missing routines first fill completely blank rows (the default empty slots),
 * then are appended in template order.
 */
export function mergeRoutinesIntoTodos(todos, routineItems) {
  const result = [...(todos || [])];
  const items = (routineItems || []).filter((r) => r && (r.text || '').trim());
  const groupIds = new Set(items.map((r) => r.id));
  const claimed = new Set();
  let added = 0;
  let skipped = 0;

  for (const r of items) {
    if (result.some((t) => t.routineId === r.id)) {
      skipped++;
      continue;
    }
    const key = normText(r.text);
    const matchIdx = result.findIndex(
      (t, i) =>
        !claimed.has(i) &&
        (!t.routineId || !groupIds.has(t.routineId)) &&
        normText(t.text) === key
    );
    if (matchIdx !== -1) {
      claimed.add(matchIdx);
      skipped++;
      continue;
    }
    const text = r.text.trim();
    const blankIdx = result.findIndex(isBlankTodo);
    if (blankIdx !== -1) {
      result[blankIdx] = { ...result[blankIdx], text, routineId: r.id };
      claimed.add(blankIdx);
    } else {
      result.push(createTodo({ text, routineId: r.id }));
      claimed.add(result.length - 1);
    }
    added++;
  }

  return { todos: added > 0 ? result : todos || [], added, skipped };
}
