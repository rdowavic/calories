import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemePreference, UnitPreference } from '@calories/shared';

interface SettingsState {
  theme: ThemePreference;
  unitPreference: UnitPreference;
  notificationsEnabled: boolean;
  lunchNudgeTime: string;
  dinnerNudgeTime: string;
  setTheme: (theme: ThemePreference) => void;
  setUnitPreference: (unit: UnitPreference) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNudgeTimes: (lunch: string, dinner: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      unitPreference: 'metric',
      notificationsEnabled: true,
      lunchNudgeTime: '13:00',
      dinnerNudgeTime: '19:00',

      setTheme: (theme) => set({ theme }),
      setUnitPreference: (unitPreference) => set({ unitPreference }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setNudgeTimes: (lunchNudgeTime, dinnerNudgeTime) => set({ lunchNudgeTime, dinnerNudgeTime }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
