import { format, isToday, isYesterday } from 'date-fns';

export function formatCalories(cal: number): string {
  if (cal >= 1000) {
    return `${(cal / 1000).toFixed(1)}k`;
  }
  return Math.round(cal).toString();
}

export function formatMacro(grams: number): string {
  if (grams >= 100) return Math.round(grams).toString();
  return (Math.round(grams * 10) / 10).toString();
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d');
}

export function formatTime(dateStr: string): string {
  return format(new Date(dateStr), 'h:mm a');
}
