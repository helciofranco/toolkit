export const symbols = ['BRL', 'USD', 'THB'] as const;
export type Currency = (typeof symbols)[number];

export type ExpenseData = {
  symbol: Currency;
  amount: number;
};

export type CurrencyBeaconData = {
  base: Currency;
  rates: Record<Currency, number>;
};

export type ExpenseByCurrency = Record<Currency, number>;

export type ExpensesData = {
  [date: string]: {
    expenses: ExpenseByCurrency[];
    totals: ExpenseByCurrency;
  };
};
