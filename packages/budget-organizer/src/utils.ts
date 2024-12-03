import { BudgetInterval, type ExpensesData } from './types';
import { getCurrentMonth, getDaysInMonth, getStartOf, getToday } from './dates';
import { nameByInterval } from './labels';

export const roundAmount = (amount: number): number => {
  return Math.trunc(amount * 100) / 100;
};

export const getAvailableBudget = (data: ExpensesData): number => {
  if (data.budget.interval === BudgetInterval.Monthly) {
    return data.budget.amount;
  }

  const daysInCurrentMonth = getDaysInMonth();
  return data.budget.amount * daysInCurrentMonth;
};

export const getBalance = (data: ExpensesData) => {
  const firstDay = Object.keys(data.expenses)[0];
  const spent = Object.values(data.expenses).reduce((acc, expense) => {
    return acc + expense.total;
  }, 0);

  if (data.budget.interval === BudgetInterval.Daily) {
    // Daily interval
    const now = getStartOf(getToday(), 'day');
    const past = getStartOf(firstDay, 'day');
    const diff = now.diff(past, 'day') + 1;

    const available = diff * data.budget.amount;
    const remaining = roundAmount(available - spent);

    return {
      spent,
      remaining,
      diff,
      term: 'days',
    };
  }

  // Monthly interval
  const now = getStartOf(getToday(), 'month');
  const past = getStartOf(firstDay, 'month');
  const diff = now.diff(past, 'month') + 1;

  const available = diff * data.budget.amount;
  const remaining = roundAmount(available - spent);

  return {
    spent,
    remaining,
    diff,
    term: 'months',
  };
};

export const getSpentInCurrentInterval = (data: ExpensesData) => {
  // Get available based on budget interval (daily)
  if (data.budget.interval === BudgetInterval.Daily) {
    const today = getToday();

    const spent = data.expenses[today].total;
    const remaining = data.budget.amount - spent;

    return {
      name: nameByInterval[data.budget.interval],
      spent: roundAmount(spent),
      remaining: roundAmount(remaining),
    };
  }

  // Monthly
  const currentMonth = getCurrentMonth();
  const currentMonthKeys = Object.keys(data.expenses).filter((date) => {
    return date.startsWith(currentMonth);
  });

  const spent = currentMonthKeys.reduce((acc, date) => {
    const expenses = data.expenses[date];
    return acc + expenses.total;
  }, 0);

  const remaining = data.budget.amount - spent;

  return {
    name: nameByInterval[data.budget.interval],
    spent: roundAmount(spent),
    remaining: roundAmount(remaining),
  };
};
