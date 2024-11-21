import type { ExpenseByCurrency, ExpensesData } from './types';
import path from 'node:path';
import fs from 'node:fs';

export const roundAmount = (amount: number): number => {
  return Math.trunc(amount * 100) / 100;
};

export const formatAmountsToMessage = (data: ExpenseByCurrency) => {
  return Object.entries(data)
    .map(([currency, amount]) => `${roundAmount(amount)} ${currency}`)
    .join('\n');
};

const FILE = path.join(__dirname, '../expenses.json');

export const getExpenses = (): ExpensesData => {
  if (fs.existsSync(FILE)) {
    const data = fs.readFileSync(FILE, 'utf-8');
    return JSON.parse(data);
  }
  return {};
};

export const saveExpenses = (expenses: ExpensesData) => {
  fs.writeFileSync(FILE, JSON.stringify(expenses, null, 2), 'utf-8');
};
