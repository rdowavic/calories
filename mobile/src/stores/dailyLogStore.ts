import { create } from 'zustand';
import { FoodLog, DailyTotals } from '@calories/shared';

interface DailyLogState {
  selectedDate: string;
  logs: FoodLog[];
  totals: DailyTotals;
  dailyGoal: number;
  setSelectedDate: (date: string) => void;
  setLogs: (logs: FoodLog[]) => void;
  setTotals: (totals: DailyTotals) => void;
  setDailyGoal: (goal: number) => void;
  addLogOptimistic: (log: FoodLog) => void;
  removeLogOptimistic: (logId: string) => void;
  updateLogOptimistic: (logId: string, updates: Partial<FoodLog>) => void;
}

function computeTotals(logs: FoodLog[]): DailyTotals {
  return logs.reduce(
    (acc, log) => ({
      calories: acc.calories + Number(log.calories),
      protein_g: acc.protein_g + Number(log.protein_g),
      carbs_g: acc.carbs_g + Number(log.carbs_g),
      fat_g: acc.fat_g + Number(log.fat_g),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

export const useDailyLogStore = create<DailyLogState>((set) => ({
  selectedDate: new Date().toISOString().split('T')[0],
  logs: [],
  totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  dailyGoal: 2000,

  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setLogs: (logs) => set({ logs, totals: computeTotals(logs) }),
  setTotals: (totals) => set({ totals }),
  setDailyGoal: (dailyGoal) => set({ dailyGoal }),

  addLogOptimistic: (log) => set((state) => {
    const logs = [...state.logs, log];
    return { logs, totals: computeTotals(logs) };
  }),

  removeLogOptimistic: (logId) => set((state) => {
    const logs = state.logs.filter((l) => l.id !== logId);
    return { logs, totals: computeTotals(logs) };
  }),

  updateLogOptimistic: (logId, updates) => set((state) => {
    const logs = state.logs.map((l) => l.id === logId ? { ...l, ...updates } : l);
    return { logs, totals: computeTotals(logs) };
  }),
}));
