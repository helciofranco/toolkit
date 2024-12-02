import {
  BudgetInterval,
  type Currency,
  type Expense,
  type ExpensePayload,
} from './types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { config } from './config';
import { bot, sendTelegramMessage } from './telegram';
import { getExpenses, saveExpenses } from './database';
import { roundAmount } from './utils';
import { convertAmount } from './exchange';

dayjs.extend(utc);
dayjs.extend(timezone);

bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  if (
    msg.from?.username &&
    !config.telegram.whiteList.includes(msg.from.username)
  ) {
    console.log(`Message not allowed from ${msg.from.username}`);
    return;
  }

  const data = getExpenses(chatId);
  if (!data) {
    sendTelegramMessage(
      chatId,
      `📭 No expenses found for this chatId\n${chatId}`,
      {
        parse_mode: 'Markdown',
      },
    );
    return;
  }

  const firstDay = Object.keys(data.expenses)[0];
  const totalSpent = Object.values(data.expenses).reduce((acc, expense) => {
    return acc + expense.total;
  }, 0);

  // Daily interval
  if (data.budget.interval === BudgetInterval.Daily) {
    const now = dayjs().tz(config.timezone).startOf('day');
    const past = dayjs.tz(firstDay, config.timezone).startOf('day');
    const diff = now.diff(past, 'day') + 1;

    const totalLimit = diff * data.budget.amount;
    const totalRemaining = roundAmount(totalLimit - totalSpent);

    const result = `💰 *Total Spent:* ${roundAmount(totalSpent)} ${data.budget.symbol}\n💰 *Total Remaining:* ${totalRemaining} ${data.budget.symbol}\n${diff} days`;
    console.log(result);
    sendTelegramMessage(chatId, result, {
      parse_mode: 'Markdown',
    });
  }

  // Monthly interval
  if (data.budget.interval === BudgetInterval.Monthly) {
    const now = dayjs().tz(config.timezone).startOf('month');
    const past = dayjs.tz(firstDay, config.timezone).startOf('month');
    const diff = now.diff(past, 'month') + 1;

    const totalLimit = diff * data.budget.amount;
    const totalRemaining = roundAmount(totalLimit - totalSpent);

    const result = `;💰 *Total Spent:* ${roundAmount(totalSpent)} ${data.budget.symbol}\n💰 *Total Remaining:* ${totalRemaining} ${data.budget.symbol}\n${diff} months`;
    console.log(result);
    sendTelegramMessage(chatId, result, {
      parse_mode: 'Markdown',
    });
  }
});

bot.onText(/\/today/, async (msg) => {
  const chatId = msg.chat.id;
  if (
    msg.from?.username &&
    !config.telegram.whiteList.includes(msg.from.username)
  ) {
    console.log(`Message not allowed from ${msg.from.username}`);
    return;
  }

  const today = dayjs().tz(config.timezone).format('YYYY-MM-DD');
  const data = getExpenses(chatId);

  if (!data || !data.expenses[today] || !data.expenses[today].items.length) {
    sendTelegramMessage(chatId, '📭 No expenses found for today');
    return;
  }

  const todayTotal = data.expenses[today].total;
  const remaining = roundAmount(data.budget.amount - todayTotal);

  const result = `${data.expenses[today].items
    .map(
      (e) =>
        `💸 ${e.to.amount} ${e.to.symbol} (${e.from.amount} ${e.from.symbol}) - ${e.description}`,
    )
    .join(
      '\n',
    )}\n\n💰 *Today:* ${todayTotal} ${data.budget.symbol}\n🏦 *Available:* ${remaining} ${data.budget.symbol}`;
  console.log(result);
  sendTelegramMessage(chatId, result, {
    parse_mode: 'Markdown',
  });
});

bot.onText(/\/undo/, async (msg) => {
  const chatId = msg.chat.id;
  if (
    msg.from?.username &&
    !config.telegram.whiteList.includes(msg.from.username)
  ) {
    console.log(`Message not allowed from ${msg.from.username}`);
    return;
  }

  const today = dayjs().tz(config.timezone).format('YYYY-MM-DD');
  const data = getExpenses(chatId);

  if (!data || !data.expenses[today]) {
    sendTelegramMessage(chatId, '📭 No expenses found for today');
    return;
  }

  // Remove the last expense
  const lastExpense = data.expenses[today].items.pop();

  if (!lastExpense) {
    sendTelegramMessage(chatId, '📭 No expenses found for today');
    return;
  }

  // Update the total
  data.expenses[today].total = roundAmount(
    data.expenses[today].total - lastExpense.to.amount,
  );

  // Ensure the total doesn't go negative (in case of bad data)
  if (data.expenses[today].total < 0) {
    data.expenses[today].total = 0;
  }

  saveExpenses(chatId, data);

  const remaining = roundAmount(
    data.budget.amount - data.expenses[today].total,
  );

  const result = `🗑️ *Removed:* ${lastExpense.description} ${lastExpense.to.amount} ${lastExpense.to.symbol}\n💰 *Today:* ${data.expenses[today].total} ${data.budget.symbol}\n🏦 *Available:* ${remaining} ${data.budget.symbol}`;
  console.log(result);
  sendTelegramMessage(chatId, result, {
    parse_mode: 'Markdown',
  });
});

bot.onText(/^(.+?)\s([A-Za-z]{3})(?:\s(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (
    msg.from?.username &&
    !config.telegram.whiteList.includes(msg.from.username)
  ) {
    console.log(`Message not allowed from ${msg.from.username}`);
    return;
  }

  if (!match) return;
  const [, amount, _symbol, description] = match;
  const symbol = _symbol.toUpperCase() as Currency;

  const payload: ExpensePayload = {
    amount: roundAmount(Number(amount)),
    symbol: symbol as Currency,
    description: description || '',
  };
  const today = dayjs().tz(config.timezone).format('YYYY-MM-DD');
  const data = getExpenses(chatId);

  if (!data) {
    sendTelegramMessage(
      chatId,
      `📭 Create the database for this chatId\n${chatId}`,
    );
    return;
  }

  if (!data.expenses || !data.expenses[today]) {
    data.expenses = data.expenses || {};
    data.expenses[today] = {
      items: [],
      total: 0,
    };
  }

  let paid = payload.amount;
  if (payload.symbol !== data.budget.symbol) {
    const { value } = await convertAmount({
      from: payload.symbol,
      amount: payload.amount,
      to: data.budget.symbol,
    });

    paid = roundAmount(value);
  }

  // Save expenses
  const expense: Expense = {
    timestamp: dayjs().unix(),
    from: {
      symbol: payload.symbol,
      amount: payload.amount,
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

  // Get available based on budget interval (daily or monthly)
  if (data.budget.interval === BudgetInterval.Daily) {
    const remaining = roundAmount(
      data.budget.amount - data.expenses[today].total,
    );
    const result = `💸 *Paid:* ${paid} ${data.budget.symbol}\n💰 *Today:* ${data.expenses[today].total} ${data.budget.symbol}\n🏦 *Available:* ${remaining} ${data.budget.symbol}`;
    console.log(result);
    sendTelegramMessage(chatId, result, {
      parse_mode: 'Markdown',
    });
    return;
  }

  // Monthly
  if (data.budget.interval === BudgetInterval.Monthly) {
    const currentMonth = dayjs().tz(config.timezone).format('YYYY-MM');
    const currentMonthKeys = Object.keys(data.expenses).filter((date) =>
      date.startsWith(currentMonth),
    );

    const totalSpent = currentMonthKeys.reduce((acc, date) => {
      const expenses = data.expenses[date];
      return acc + expenses.total;
    }, 0);

    const remaining = roundAmount(data.budget.amount - totalSpent);

    const result = `💸 *Paid:* ${paid} ${data.budget.symbol}\n💰 *Month:* ${roundAmount(totalSpent)} ${data.budget.symbol}\n🏦 *Available:* ${remaining} ${data.budget.symbol}`;
    console.log(result);
    sendTelegramMessage(chatId, result, {
      parse_mode: 'Markdown',
    });
    return;
  }

  sendTelegramMessage(
    chatId,
    `📭 Interval not supported: ${data.budget.interval}`,
  );
});
