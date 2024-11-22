export const symbols = ['BRL', 'USD', 'THB'] as const;
export type Currency = (typeof symbols)[number];

export type ExpenseData = {
  symbol: Currency;
  amount: number;
};

export type CurrencyBeaconData = {
  from: Currency;
  to: Currency;
  amount: number;
  value: number;
};

export type ExpensesData = {
  [date: string]: {
    expenses: number[];
    total: number;
  };
};
