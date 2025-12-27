import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { config } from './config';

dayjs.extend(utc);
dayjs.extend(timezone);

const getNow = () => {
  return dayjs().tz(config.timezone);
};

export const getStartOf = (date: dayjs.ConfigType, unit: dayjs.OpUnitType) => {
  return dayjs.tz(date, config.timezone).startOf(unit);
};

export const getToday = () => {
  return getNow().format('YYYY-MM-DD');
};

export const getCurrentMonth = () => {
  return getNow().format('YYYY-MM');
};

export const getUnixTimestamp = () => {
  return getNow().unix();
};

export const getDaysInMonth = () => {
  return getNow().daysInMonth();
};
