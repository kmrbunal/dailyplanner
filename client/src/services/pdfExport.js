/**
 * Generate a clean PDF report document from structured data.
 * Opens a new window with a properly formatted report, then triggers print/save.
 */

const MOOD_EMOJIS = ['\uD83D\uDE2B', '\uD83D\uDE15', '\uD83D\uDE0A', '\uD83D\uDE04', '\uD83E\uDD29'];
const MOOD_LABELS = ['Awful', 'Meh', 'Good', 'Great', 'Amazing'];

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');

:root {
  --accent: #4a5c3e; --accent-dark: #2f3d27; --accent-light: #dfe6d8;
  --text: #1e2418; --text-light: #6b7360; --border: #d4d8cd;
  --gold: #8b7d3c; --gold-light: #f2efdb;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'DM Sans', sans-serif; color: var(--text); padding: 32px; line-height: 1.6; background: white; max-width: 800px; margin: 0 auto; }
h1 { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--accent-dark); margin-bottom: 4px; letter-spacing: 1px; }
.subtitle { font-size: 12px; color: var(--text-light); margin-bottom: 20px; border-bottom: 2px solid var(--accent); padding-bottom: 12px; }
.section { margin-bottom: 18px; page-break-inside: avoid; }
.section-title { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: var(--accent-dark); margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid var(--border); }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 8px; }
.stat { background: #f5f6f0; border-radius: 8px; padding: 10px; text-align: center; }
.stat-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); margin-bottom: 2px; }
.stat-value { font-size: 16px; font-weight: 700; color: var(--accent-dark); }
table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
th { text-align: left; padding: 6px 10px; background: var(--accent-light); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); }
td { padding: 6px 10px; border-bottom: 1px solid #eee; }
.total-row td { font-weight: 700; border-top: 2px solid var(--border); }
.text-right { text-align: right; }
.empty { font-size: 11px; color: var(--text-light); font-style: italic; padding: 4px 0; }
.list { list-style: none; padding: 0; }
.list li { padding: 4px 0; border-bottom: 1px solid #f0f0ee; font-size: 12px; }
.list li:last-child { border-bottom: none; }
.finance-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f0ee; font-size: 12px; }
.finance-label { color: var(--text-light); }
.finance-value { font-weight: 600; color: var(--accent-dark); }
.bar-chart { display: flex; align-items: flex-end; gap: 3px; height: 80px; margin: 8px 0; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.bar { width: 100%; max-width: 24px; border-radius: 3px 3px 0 0; background: linear-gradient(180deg, var(--accent), var(--accent-dark)); }
.bar-label { font-size: 8px; color: var(--text-light); }
.bar-value { font-size: 8px; font-weight: 600; color: var(--accent-dark); }
.footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 10px; color: var(--text-light); text-align: center; }
@media print { body { padding: 16px; } .section { box-shadow: none; } }
`;

function fmt(v) { return '\u20B1' + (Number(v) || 0).toFixed(2); }
function esc(s) { return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/**
 * Generate and print a Daily Report PDF
 */
export function exportDailyPDF(dateKey, dateLabel, dayData) {
  const d = dayData || {};
  const work = countTodos(d.workTodos);
  const health = countTodos(d.healthTodos);
  const personal = countTodos(d.personalTodos);
  const totalDone = work.done + health.done + personal.done;
  const totalTasks = work.total + health.total + personal.total;
  const waterCount = d.water ? d.water.filter(Boolean).length : 0;
  const expenses = (d.expenses || []).filter(e => e.amount && parseFloat(e.amount));
  const totalSpent = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const fs = d.dailyFinanceSummary || {};
  const priorities = (d.topPriorities || []).filter(p => p && p.trim());
  const gratitudes = (d.gratitude || []).filter(g => g && g.trim());
  const learningItems = (d.learning || []).filter(l => l.text && l.text.trim());
  const meals = ['mealBreakfast', 'mealLunch', 'mealDinner', 'mealSnacks'];
  const mealLabels = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  let html = `
    <h1>Daily Planner Report</h1>
    <div class="subtitle">by Cafe Mocha &mdash; ${esc(dateLabel)}</div>

    <div class="section">
      <div class="section-title">Daily Overview</div>
      <div class="grid-4">
        <div class="stat"><div class="stat-label">Tasks</div><div class="stat-value">${totalDone}/${totalTasks}</div></div>
        <div class="stat"><div class="stat-label">Water</div><div class="stat-value">${waterCount}/8</div></div>
        <div class="stat"><div class="stat-label">Mood</div><div class="stat-value">${d.mood >= 0 ? MOOD_EMOJIS[d.mood] + ' ' + MOOD_LABELS[d.mood] : '—'}</div></div>
        <div class="stat"><div class="stat-label">Spent</div><div class="stat-value">${fmt(totalSpent)}</div></div>
      </div>
      ${d.weight ? `<div style="font-size:12px;color:var(--text-light);margin-top:4px;">Weight: ${d.weight} ${d.weightUnit || 'kg'}</div>` : ''}
    </div>

    <div class="section">
      <div class="section-title">Tasks Breakdown</div>
      <div class="grid">
        <div class="stat"><div class="stat-label">Work</div><div class="stat-value">${work.done}/${work.total}</div></div>
        <div class="stat"><div class="stat-label">Health</div><div class="stat-value">${health.done}/${health.total}</div></div>
        <div class="stat"><div class="stat-label">Personal</div><div class="stat-value">${personal.done}/${personal.total}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Top Priorities</div>
      ${priorities.length > 0 ? '<ul class="list">' + priorities.map((p, i) => `<li><strong>${i + 1}.</strong> ${esc(p)}</li>`).join('') + '</ul>' : '<div class="empty">No priorities set</div>'}
    </div>

    <div class="section">
      <div class="section-title">Expenses</div>
      <table>
        <thead><tr><th>Category</th><th class="text-right">Amount</th></tr></thead>
        <tbody>
          ${expenses.length > 0 ? expenses.map(e => `<tr><td>${esc(e.category) || 'Uncategorized'}</td><td class="text-right">${fmt(e.amount)}</td></tr>`).join('') : '<tr><td colspan="2" style="text-align:center;color:var(--text-light);font-style:italic;">No expenses</td></tr>'}
          <tr class="total-row"><td>Total</td><td class="text-right">${fmt(totalSpent)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Finance Summary</div>
      <div class="finance-row"><span class="finance-label">Pool Carried</span><span class="finance-value">${fmt(fs.poolCarried)}</span></div>
      <div class="finance-row"><span class="finance-label">Daily Allocation</span><span class="finance-value">${fmt(fs.dailyAllocation)}</span></div>
      <div class="finance-row"><span class="finance-label">Extra Income</span><span class="finance-value">${fmt(fs.extraDeposit)}</span></div>
      <div class="finance-row"><span class="finance-label">Available Today</span><span class="finance-value" style="font-size:14px;">${fmt(fs.todayAvailable)}</span></div>
      <div class="finance-row"><span class="finance-label">Spent Today</span><span class="finance-value">${fmt(fs.todaySpent)}</span></div>
      <div class="finance-row" style="border-bottom:none;"><span class="finance-label">Remaining</span><span class="finance-value" style="color:${(fs.remaining || 0) < 0 ? '#8b3a3a' : 'var(--accent-dark)'}; font-size:14px;">${fmt(fs.remaining)}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Meals</div>
      ${meals.map((key, i) => {
        const items = (d[key] || []).filter(m => m.food && m.food.trim());
        if (items.length === 0) return '';
        return `<div style="margin-bottom:8px;"><strong style="font-size:11px;color:var(--accent);">${mealLabels[i]}</strong><ul class="list">${items.map(m => `<li>${esc(m.food)}${m.portion ? ' <span style="color:var(--text-light);">(' + esc(m.portion) + ')</span>' : ''}${m.cal ? ' <span style="color:var(--gold);">' + m.cal + ' cal</span>' : ''}</li>`).join('')}</ul></div>`;
      }).join('') || '<div class="empty">No meals recorded</div>'}
    </div>

    <div class="section">
      <div class="section-title">Gratitude</div>
      ${gratitudes.length > 0 ? '<ul class="list">' + gratitudes.map(g => `<li>${esc(g)}</li>`).join('') + '</ul>' : '<div class="empty">No entries</div>'}
    </div>

    <div class="section">
      <div class="section-title">Learning</div>
      ${learningItems.length > 0 ? '<ul class="list">' + learningItems.map(l => `<li>${l.emoji || ''} ${esc(l.text)} <span style="float:right;font-size:10px;color:var(--accent);">${esc(l.status)}</span></li>`).join('') + '</ul>' : '<div class="empty">No learning items</div>'}
    </div>

    <div class="section">
      <div class="section-title">Notes</div>
      <div style="font-size:12px;white-space:pre-wrap;">${d.notes ? esc(d.notes) : '<span class="empty">No notes</span>'}</div>
    </div>

    <div class="footer">Daily Planner by Cafe Mocha &mdash; Generated ${new Date().toLocaleDateString()}</div>
  `;

  openPrintWindow('Daily Report - ' + dateLabel, html);
}

/**
 * Generate and print a Weekly Report PDF
 */
export function exportWeeklyPDF(weekLabel, weekData) {
  const totalSpent = weekData.reduce((s, d) => s + d.spent, 0);
  const totalDone = weekData.reduce((s, d) => s + d.tasksDone, 0);
  const totalTasks = weekData.reduce((s, d) => s + d.tasksTotal, 0);
  const maxSpent = Math.max(...weekData.map(d => d.spent), 1);
  const moodCounts = [0, 0, 0, 0, 0];
  weekData.forEach(d => { if (d.mood >= 0 && d.mood < 5) moodCounts[d.mood]++; });

  let html = `
    <h1>Weekly Planner Report</h1>
    <div class="subtitle">by Cafe Mocha &mdash; ${esc(weekLabel)}</div>

    <div class="section">
      <div class="section-title">Weekly Summary</div>
      <div class="grid">
        <div class="stat"><div class="stat-label">Total Spent</div><div class="stat-value">${fmt(totalSpent)}</div></div>
        <div class="stat"><div class="stat-label">Avg/Day</div><div class="stat-value">${fmt(totalSpent / 7)}</div></div>
        <div class="stat"><div class="stat-label">Tasks Done</div><div class="stat-value">${totalDone}/${totalTasks}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Daily Breakdown</div>
      <table>
        <thead><tr><th>Day</th><th>Mood</th><th>Tasks</th><th class="text-right">Spent</th></tr></thead>
        <tbody>
          ${weekData.map(d => `<tr><td><strong>${d.dayName}</strong> ${d.dateKey.substring(8)}</td><td>${d.mood >= 0 ? MOOD_EMOJIS[d.mood] : '—'}</td><td>${d.hasData ? d.tasksDone + '/' + d.tasksTotal : '—'}</td><td class="text-right">${d.hasData ? fmt(d.spent) : '—'}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Spending Chart</div>
      <div class="bar-chart">
        ${weekData.map(d => `<div class="bar-col"><div class="bar-value">${d.spent > 0 ? fmt(d.spent) : ''}</div><div class="bar" style="height:${Math.max((d.spent / maxSpent) * 70, 2)}px;"></div><div class="bar-label">${d.dayName}</div></div>`).join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Mood Distribution</div>
      <div style="display:flex;justify-content:center;gap:20px;">
        ${MOOD_EMOJIS.map((e, i) => `<div style="text-align:center;"><div style="font-size:24px;">${e}</div><div style="font-size:13px;font-weight:700;color:var(--accent);">${moodCounts[i]}</div></div>`).join('')}
      </div>
    </div>

    <div class="footer">Daily Planner by Cafe Mocha &mdash; Generated ${new Date().toLocaleDateString()}</div>
  `;

  openPrintWindow('Weekly Report - ' + weekLabel, html);
}

/**
 * Generate and print a Monthly Report PDF
 */
export function exportMonthlyPDF(monthLabel, monthData) {
  const { totalBudget, totalExtraIncome, totalSpent, days, moodCounts, topCategories, achievements } = monthData;
  const maxSpent = Math.max(...days.map(d => d.spent), 1);
  const totalDone = days.reduce((s, d) => s + d.tasksDone, 0);
  const totalTasks = days.reduce((s, d) => s + d.tasksTotal, 0);

  let html = `
    <h1>Monthly Planner Report</h1>
    <div class="subtitle">by Cafe Mocha &mdash; ${esc(monthLabel)}</div>

    <div class="section">
      <div class="section-title">Finance Overview</div>
      <div class="grid-4">
        <div class="stat"><div class="stat-label">Base Budget</div><div class="stat-value">${fmt(totalBudget)}</div></div>
        <div class="stat"><div class="stat-label">+ Extra Income</div><div class="stat-value">${fmt(totalExtraIncome)}</div></div>
        <div class="stat"><div class="stat-label">Total Spent</div><div class="stat-value">${fmt(totalSpent)}</div></div>
        <div class="stat"><div class="stat-label">Tasks Done</div><div class="stat-value">${totalDone}/${totalTasks}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Daily Spending</div>
      <div class="bar-chart">
        ${days.map(d => `<div class="bar-col"><div class="bar-value">${d.spent > 0 ? d.spent.toFixed(0) : ''}</div><div class="bar" style="height:${Math.max((d.spent / maxSpent) * 70, 2)}px;"></div><div class="bar-label">${d.day}</div></div>`).join('')}
      </div>
    </div>

    ${topCategories.length > 0 ? `
    <div class="section">
      <div class="section-title">Top Expense Categories</div>
      <table>
        <thead><tr><th>Category</th><th class="text-right">Total</th><th class="text-right">%</th></tr></thead>
        <tbody>
          ${topCategories.map(c => `<tr><td>${esc(c.category)}</td><td class="text-right">${fmt(c.total)}</td><td class="text-right">${c.pct}%</td></tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <div class="section">
      <div class="section-title">Mood Distribution</div>
      <div style="display:flex;justify-content:center;gap:20px;">
        ${MOOD_EMOJIS.map((e, i) => `<div style="text-align:center;"><div style="font-size:24px;">${e}</div><div style="font-size:13px;font-weight:700;color:var(--accent);">${moodCounts[i]}</div></div>`).join('')}
      </div>
    </div>

    ${achievements.length > 0 ? `
    <div class="section">
      <div class="section-title">Achievements This Month</div>
      <ul class="list">${achievements.map(a => `<li>${a.emoji || ''} ${esc(a.text)} <span style="float:right;font-size:10px;color:var(--text-light);">${esc(a.completedDate)}</span></li>`).join('')}</ul>
    </div>` : ''}

    <div class="footer">Daily Planner by Cafe Mocha &mdash; Generated ${new Date().toLocaleDateString()}</div>
  `;

  openPrintWindow('Monthly Report - ' + monthLabel, html);
}

// ---- Helpers ----

function countTodos(todos) {
  if (!todos || !Array.isArray(todos)) return { done: 0, total: 0 };
  const filled = todos.filter(t => t.text && t.text.trim());
  return { done: filled.filter(t => t.checked).length, total: filled.length };
}

function openPrintWindow(title, bodyHtml) {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this site to export PDF.');
    return;
  }

  win.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>${title}</title><style>${STYLES}</style></head><body>${bodyHtml}</body></html>`);
  win.document.close();

  win.onload = () => {
    setTimeout(() => { win.focus(); win.print(); win.close(); }, 500);
  };
}

// Keep backward compat for the old ref-based export
export function exportToPDF(elementRef, title) {
  if (!elementRef || !elementRef.current) return;
  const html = elementRef.current.innerHTML;
  openPrintWindow(title, `<h1>${title}</h1><div class="subtitle">by Cafe Mocha</div>${html}`);
}
