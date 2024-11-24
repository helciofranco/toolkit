import type { ExpensesData } from './types';
import path from 'node:path';
import fs from 'node:fs';

const getFilename = (chatId: number) => {
  return path.join(__dirname, `../database/expenses_${chatId}.json`);
};

export const getExpenses = (chatId: number): ExpensesData | null => {
  const filename = getFilename(chatId);
  if (fs.existsSync(filename)) {
    const data = fs.readFileSync(filename, 'utf-8');
    return JSON.parse(data);
  }
  return null;
};

export const saveExpenses = (chatId: number, expenses: ExpensesData) => {
  const filename = getFilename(chatId);
  fs.writeFileSync(filename, JSON.stringify(expenses, null, 2), 'utf-8');
};
