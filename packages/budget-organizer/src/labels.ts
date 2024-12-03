import { BudgetInterval } from './types';

export const nameByInterval: Record<BudgetInterval, string> = {
  [BudgetInterval.Daily]: 'Day',
  [BudgetInterval.Monthly]: 'Month',
};
