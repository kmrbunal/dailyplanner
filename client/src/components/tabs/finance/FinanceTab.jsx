import { useMemo, useCallback } from 'react';
import { useDayContext } from '../../../context/DayContext';
import { useStoreContext } from '../../../context/StoreContext';
import { getDateKey, getMonthKey } from '../../../services/dateUtils';
import MonthlyBudgetCard from './MonthlyBudgetCard';
import SavingsGoalsCard from './SavingsGoalsCard';
import SavingsBreakdownCard from './SavingsBreakdownCard';
import InvestmentBreakdownCard from './InvestmentBreakdownCard';
import cardStyles from '../../common/Card.module.css';
import carouselStyles from '../../common/Carousel.module.css';
import styles from './FinanceTab.module.css';

/**
 * Finance Tab -- container wrapping all finance cards in a carousel layout.
 *
 * Manages the shared monthlyFinance state and coordinates between cards.
 * All savings/investment/goal data lives in monthlyFinance from StoreContext.
 * Daily expenses and finance notes live in dayData from DayContext.
 */
export default function FinanceTab() {
  const { dayData, dispatch, currentDate } = useDayContext();
  const { monthlyFinance, saveMonthlyFinance } = useStoreContext();

  const dateKey = useMemo(() => getDateKey(currentDate), [currentDate]);
  const monthKey = useMemo(() => getMonthKey(dateKey), [dateKey]);

  // ---- Savings goals (monthly) ----
  const savingsGoals = monthlyFinance.savingsGoals || [{ name: '', current: '', target: '' }];

  // Goal names for allocation dropdowns
  const goalNames = useMemo(
    () => savingsGoals.map((g) => g.name?.trim()).filter(Boolean),
    [savingsGoals]
  );

  // ---- Savings breakdown (monthly) ----
  const savingsBreakdown = monthlyFinance.savingsBreakdown || {};
  const savingsAllocations = monthlyFinance.savingsAllocations || {};

  // ---- Investment breakdown (monthly) ----
  const investmentBreakdown = monthlyFinance.investmentBreakdown || {};
  const investAllocations = monthlyFinance.investAllocations || {};

  // ---- Computed totals ----
  const grandTotalSavings = useMemo(() => {
    let sum = 0;
    Object.values(savingsBreakdown).forEach((v) => {
      sum += parseFloat(v) || 0;
    });
    return sum;
  }, [savingsBreakdown]);

  const grandTotalInvestments = useMemo(() => {
    let sum = 0;
    Object.values(investmentBreakdown).forEach((v) => {
      sum += parseFloat(v) || 0;
    });
    return sum;
  }, [investmentBreakdown]);

  const netWorth = grandTotalSavings + grandTotalInvestments;

  // ---- Per-goal totals from breakdown allocations ----
  // Accumulate savings + investment breakdown amounts allocated to each goal.
  const goalTotals = useMemo(() => {
    const totals = {};
    goalNames.forEach((name) => {
      totals[name] = 0;
    });

    // Savings breakdown
    Object.entries(savingsBreakdown).forEach(([type, val]) => {
      const amount = parseFloat(val) || 0;
      const goalName = savingsAllocations[type];
      if (goalName && totals.hasOwnProperty(goalName)) {
        totals[goalName] += amount;
      }
    });

    // Investment breakdown
    Object.entries(investmentBreakdown).forEach(([type, val]) => {
      const amount = parseFloat(val) || 0;
      const goalName = investAllocations[type];
      if (goalName && totals.hasOwnProperty(goalName)) {
        totals[goalName] += amount;
      }
    });

    return totals;
  }, [goalNames, savingsBreakdown, savingsAllocations, investmentBreakdown, investAllocations]);

  // ---- Save helper: persist full monthlyFinance ----
  const persistMonthly = useCallback(
    (updates) => {
      const updated = { ...monthlyFinance, ...updates };
      saveMonthlyFinance(updated, monthKey);
    },
    [monthlyFinance, saveMonthlyFinance, monthKey]
  );

  // ---- Goal handlers ----
  const handleGoalChange = useCallback(
    (index, updates) => {
      const goals = [...savingsGoals];
      goals[index] = { ...goals[index], ...updates };
      persistMonthly({ savingsGoals: goals });
    },
    [savingsGoals, persistMonthly]
  );

  const handleGoalRemove = useCallback(
    (index) => {
      const goals = savingsGoals.filter((_, i) => i !== index);
      persistMonthly({
        savingsGoals: goals.length > 0 ? goals : [{ name: '', current: '', target: '' }],
      });
    },
    [savingsGoals, persistMonthly]
  );

  const handleAddGoal = useCallback(() => {
    persistMonthly({
      savingsGoals: [...savingsGoals, { name: '', current: '', target: '' }],
    });
  }, [savingsGoals, persistMonthly]);

  // ---- Savings breakdown handlers ----
  const handleSavingsBreakdownChange = useCallback(
    (type, value) => {
      persistMonthly({
        savingsBreakdown: { ...savingsBreakdown, [type]: value },
      });
    },
    [savingsBreakdown, persistMonthly]
  );

  const handleSavingsAllocationChange = useCallback(
    (type, goalName) => {
      persistMonthly({
        savingsAllocations: { ...savingsAllocations, [type]: goalName },
      });
    },
    [savingsAllocations, persistMonthly]
  );

  // ---- Investment breakdown handlers ----
  const handleInvestBreakdownChange = useCallback(
    (type, value) => {
      persistMonthly({
        investmentBreakdown: { ...investmentBreakdown, [type]: value },
      });
    },
    [investmentBreakdown, persistMonthly]
  );

  const handleInvestAllocationChange = useCallback(
    (type, goalName) => {
      persistMonthly({
        investAllocations: { ...investAllocations, [type]: goalName },
      });
    },
    [investAllocations, persistMonthly]
  );

  // ---- Close-out: allocations ADD to breakdown values ----
  const handleApplyAllocations = useCallback(
    (allocationMap) => {
      const updatedSavings = { ...savingsBreakdown };
      const updatedInvest = { ...investmentBreakdown };

      Object.entries(allocationMap).forEach(([type, { amount, group }]) => {
        if (group === 'savings') {
          const current = parseFloat(updatedSavings[type]) || 0;
          updatedSavings[type] = (current + amount).toFixed(2);
        } else {
          const current = parseFloat(updatedInvest[type]) || 0;
          updatedInvest[type] = (current + amount).toFixed(2);
        }
      });

      persistMonthly({
        savingsBreakdown: updatedSavings,
        investmentBreakdown: updatedInvest,
      });
    },
    [savingsBreakdown, investmentBreakdown, persistMonthly]
  );

  // ---- Finance notes (per-day) ----
  const handleNotesChange = useCallback(
    (e) => {
      dispatch({ type: 'SET_FIELD', field: 'financeNotes', value: e.target.value });
    },
    [dispatch]
  );

  return (
    <div className={carouselStyles.cardCarousel} data-carousel="finance">
      <div className={carouselStyles.carouselTrack}>
        {/* Slide 1: Monthly Budget Overview */}
        <div className={carouselStyles.carouselSlide}>
          <MonthlyBudgetCard onApplyAllocations={handleApplyAllocations} />
        </div>

        {/* Slide 2: Savings Goals */}
        <div className={carouselStyles.carouselSlide}>
          <SavingsGoalsCard
            goals={savingsGoals}
            onGoalChange={handleGoalChange}
            onGoalRemove={handleGoalRemove}
            onAddGoal={handleAddGoal}
            goalTotals={goalTotals}
          />
        </div>

        {/* Slide 3: Savings Breakdown */}
        <div className={carouselStyles.carouselSlide}>
          <SavingsBreakdownCard
            breakdown={savingsBreakdown}
            allocations={savingsAllocations}
            goalNames={goalNames}
            onBreakdownChange={handleSavingsBreakdownChange}
            onAllocationChange={handleSavingsAllocationChange}
            grandTotal={grandTotalSavings}
          />
        </div>

        {/* Slide 4: Investment Breakdown */}
        <div className={carouselStyles.carouselSlide}>
          <InvestmentBreakdownCard
            breakdown={investmentBreakdown}
            allocations={investAllocations}
            goalNames={goalNames}
            onBreakdownChange={handleInvestBreakdownChange}
            onAllocationChange={handleInvestAllocationChange}
            grandTotal={grandTotalInvestments}
            netWorth={netWorth}
          />
        </div>

        {/* Slide 5: Finance Notes */}
        <div className={carouselStyles.carouselSlide}>
          <div className={cardStyles.card} style={{ gridColumn: 'span 2' }}>
            <div className={cardStyles.cardTitle} style={{ color: 'var(--text-light)' }}>
              <span className="icon" style={{ background: '#eee' }}>
                {'\uD83D\uDCD2'}
              </span>
              Finance Notes
            </div>
            <textarea
              className={styles.notesArea}
              placeholder="Reminders, bills due, subscriptions to cancel..."
              value={dayData.financeNotes || ''}
              onChange={handleNotesChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
