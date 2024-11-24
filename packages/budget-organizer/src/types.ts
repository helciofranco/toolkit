export const symbols = ['BRL', 'USD', 'THB'] as const;
export type Currency = (typeof symbols)[number];

export enum BudgetInterval {
  Daily = 'daily',
  Monthly = 'monthly',
}

export type ExpensePayload = {
  symbol: Currency;
  amount: number;
  description: string;
};

export type CurrencyBeaconData = {
  from: Currency;
  to: Currency;
  amount: number;
  value: number;
};

export type Expense = {
  timestamp: number;
  from: {
    symbol: Currency;
    amount: number;
  };
  to: {
    symbol: Currency;
    amount: number;
  };
  description: string;
};

export type ExpensesData = {
  chatId: number;
  budget: {
    symbol: Currency;
    amount: number;
    interval: BudgetInterval;
  };
  expenses: {
    [date: string]: {
      items: Expense[];
      total: number;
    };
  };
};
