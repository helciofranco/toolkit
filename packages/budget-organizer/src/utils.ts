export const roundAmount = (amount: number): number => {
  return Math.trunc(amount * 100) / 100;
};
