import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colors, ColorScheme } from './colors';
import { typography } from './typography';
import { spacing, borderRadius } from './spacing';
import { useSettingsStore } from '../stores/settingsStore';

interface Theme {
  colors: ColorScheme;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  isDark: boolean;
}

const ThemeContext = createContext<Theme>({
  colors: colors.light,
  typography,
  spacing,
  borderRadius,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const themePref = useSettingsStore((s) => s.theme);

  const isDark = useMemo(() => {
    if (themePref === 'system') return systemScheme === 'dark';
    return themePref === 'dark';
  }, [themePref, systemScheme]);

  const theme = useMemo<Theme>(() => ({
    colors: isDark ? colors.dark : colors.light,
    typography,
    spacing,
    borderRadius,
    isDark,
  }), [isDark]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { typography, spacing, borderRadius };
