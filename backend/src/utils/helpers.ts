import { v4 as uuidv4 } from 'uuid';

export function generateVerifyCode(): string {
  return uuidv4().substring(0, 8).toUpperCase();
}

export function formatDate(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isExpired(endDate: string): boolean {
  return new Date(endDate) < new Date();
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}
