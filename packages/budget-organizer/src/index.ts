import type { Currency, Expense, ExpensePayload } from './types';
import { bot, TelegramMessager } from './telegram';
import { getExpenses, saveExpenses } from './database';
import {
  fromCents,
  getAvailableBudget,
  getBalance,
  getSpentInCurrentInterval,
  toCents,
} from './utils';
import { convertAmount } from './exchange';
import { getCurrentMonth, getToday, getUnixTimestamp } from './dates';

bot.onText(/\/balance/, async (msg) => {
  const messager = new TelegramMessager(msg);
  if (messager.isUserWhitelisted()) {
    console.log(`Message not allowed from ${msg.from?.username}`);
    return;
  }

  const chatId = msg.chat.id;
  const data = getExpenses(chatId);
  if (!data) {
    messager.send(`📭 No expenses found for this chatId\n${chatId}`);
    return;
  }

  const { spent, remaining, diff, term } = getBalance(data);

  const result = `💰 *Total Spent:* ${spent} ${data.budget.symbol}\n💰 *Total Remaining:* ${remaining} ${data.budget.symbol}\n${diff} ${term}`;
  console.log(result);
  messager.send(result);
});

bot.onText(/\/today/, async (msg) => {
  const messager = new TelegramMessager(msg);
  if (messager.isUserWhitelisted()) {
    console.log(`Message not allowed from ${msg.from?.username}`);
    return;
  }

  const today = getToday();
  const chatId = msg.chat.id;
  const data = getExpenses(chatId);

  if (!data || !data.expenses[today] || !data.expenses[today].items.length) {
    messager.send('📭 No expenses found for today');
    return;
  }

  const todayTotal = data.expenses[today].total;
  const remaining = fromCents(data.budget.amount - todayTotal);

  const result = `${data.expenses[today].items
    .map(
      (e) =>
        `💸 ${fromCents(e.to.amount)} ${e.to.symbol} (${fromCents(e.from.amount)} ${e.from.symbol}) - ${e.description}`,
    )
    .join(
      '\n',
    )}\n\n💰 *Today:* ${fromCents(todayTotal)} ${data.budget.symbol}\n🏦 *Available:* ${remaining} ${data.budget.symbol}`;
  console.log(result);
  messager.send(result);
});

bot.onText(/\/month/, async (msg) => {
  const messager = new TelegramMessager(msg);
  if (messager.isUserWhitelisted()) {
    console.log(`Message not allowed from ${msg.from?.username}`);
    return;
  }

  const chatId = msg.chat.id;
  const data = getExpenses(chatId);
  if (!data || !data.expenses) {
    messager.send(`📭 No expenses found for this chatId\n${chatId}`);
    return;
  }

  const currentMonth = getCurrentMonth();
  const currentMonthKeys = Object.keys(data.expenses).filter((date) => {
    return (
      date.startsWith(currentMonth) && Boolean(data.expenses[date].items.length)
    );
  });

  if (!currentMonthKeys.length) {
    messager.send('📭 No expenses found for this month');
    return;
  }

  const expenses = currentMonthKeys.flatMap((date) => {
    const items = data.expenses[date].items;
    return items;
  });

  const totalSpent = currentMonthKeys.reduce((acc, date) => {
    const expenses = data.expenses[date];
    return acc + expenses.total;
  }, 0);

  const availableBudget = getAvailableBudget(data);
  const remaining = fromCents(availableBudget - totalSpent);

  const result = `${expenses
    .map(
      (e) =>
        `💸 ${fromCents(e.to.amount)} ${e.to.symbol} (${fromCents(e.from.amount)} ${e.from.symbol}) - ${e.description}`,
    )
    .join(
      '\n',
    )}\n\n💰 *Month:* ${fromCents(totalSpent)} ${data.budget.symbol}\n🏦 *Available:* ${remaining} ${data.budget.symbol}`;
  console.log(result);
  messager.send(result);
});

bot.onText(/\/undo/, async (msg) => {
  const messager = new TelegramMessager(msg);
  if (messager.isUserWhitelisted()) {
    console.log(`Message not allowed from ${msg.from?.username}`);
    return;
  }

  const chatId = msg.chat.id;
  const today = getToday();
  const data = getExpenses(chatId);

  if (!data || !data.expenses[today]) {
    messager.send('📭 No expenses found for today');
    return;
  }

  // Remove the last expense
  const lastExpense = data.expenses[today].items.pop();

  if (!lastExpense) {
    messager.send('📭 No expenses found for today');
    return;
  }

  // Update the total
  data.expenses[today].total =
    data.expenses[today].total - lastExpense.to.amount;

  if (data.expenses[today].total < 0) {
    // Ensure the total doesn't go negative (in case of bad data)
    data.expenses[today].total = 0;
  }

  saveExpenses(chatId, data);

  // Log
  const { name, spent, remaining } = getSpentInCurrentInterval(data);
  const result = `🗑️ *Removed:* ${lastExpense.description} ${fromCents(lastExpense.to.amount)} ${lastExpense.to.symbol}\n💰 *${name}:* ${spent} ${data.budget.symbol}\n🏦 *Available:* ${remaining} ${data.budget.symbol}`;
  console.log(result);
  messager.send(result);
});

bot.onText(/^(.+?)\s([A-Za-z]{3})(?:\s(.+))?$/, async (msg, match) => {
  const messager = new TelegramMessager(msg);
  if (messager.isUserWhitelisted()) {
    console.log(`Message not allowed from ${msg.from?.username}`);
    return;
  }

  if (!match) return;
  const [, _amount, _symbol, description] = match;
  const symbol = _symbol.toUpperCase() as Currency;
  const amount = Number(_amount.replace(',', '.'));

  const payload: ExpensePayload = {
    amount: Number.isNaN(amount) ? 0 : amount,
    symbol: symbol as Currency,
    description: description || '',
  };
  const today = getToday();

  const chatId = msg.chat.id;
  const data = getExpenses(chatId);

  if (!data) {
    messager.send(`📭 Create the database for this chatId\n${chatId}`);
    return;
  }

  if (!data.expenses || !data.expenses[today]) {
    data.expenses = data.expenses || {};
    data.expenses[today] = {
      items: [],
      total: 0,
    };
  }

  let paid = toCents(payload.amount);
  if (payload.symbol !== data.budget.symbol) {
    const { value } = await convertAmount({
      from: payload.symbol,
      amount: payload.amount,
      to: data.budget.symbol,
    });

    paid = toCents(value);
  }

  // Save expenses
  const expense: Expense = {
    timestamp: getUnixTimestamp(),
    from: {
      symbol: payload.symbol,
      amount: toCents(payload.amount),
    },
    to: {
      symbol: data.budget.symbol,
      amount: paid,
    },
    description: payload.description,
  };
  data.expenses[today].items.push(expense);
  data.expenses[today].total += paid;
  saveExpenses(chatId, data);

  // Log
  const { name, spent, remaining } = getSpentInCurrentInterval(data);
  const result = `💸 *Paid:* ${fromCents(paid)} ${data.budget.symbol}\n💰 *${name}:* ${spent} ${data.budget.symbol}\n🏦 *Available:* ${remaining} ${data.budget.symbol}`;
  console.log(result);
  messager.send(result);
});
