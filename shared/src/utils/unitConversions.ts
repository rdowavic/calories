// Weight conversions
export const kgToLb = (kg: number): number => Math.round(kg * 2.20462 * 10) / 10;
export const lbToKg = (lb: number): number => Math.round(lb / 2.20462 * 10) / 10;

// Height conversions
export const cmToInches = (cm: number): number => cm / 2.54;
export const inchesToCm = (inches: number): number => inches * 2.54;

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cmToInches(cm);
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches: inches === 12 ? 0 : inches };
}

export function ftInToCm(feet: number, inches: number): number {
  return Math.round(inchesToCm(feet * 12 + inches) * 10) / 10;
}

// Food weight conversions
export const gToOz = (g: number): number => Math.round(g * 0.035274 * 10) / 10;
export const ozToG = (oz: number): number => Math.round(oz / 0.035274 * 10) / 10;

// Volume conversions
export const mlToCups = (ml: number): number => Math.round(ml / 236.588 * 100) / 100;
export const cupsToMl = (cups: number): number => Math.round(cups * 236.588);

// Display formatters
export function formatWeight(kg: number, unit: 'metric' | 'imperial'): string {
  if (unit === 'imperial') {
    return `${kgToLb(kg)} lb`;
  }
  return `${Math.round(kg * 10) / 10} kg`;
}

export function formatHeight(cm: number, unit: 'metric' | 'imperial'): string {
  if (unit === 'imperial') {
    const { feet, inches } = cmToFtIn(cm);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
}

export function formatFoodWeight(g: number, unit: 'metric' | 'imperial'): string {
  if (unit === 'imperial') {
    return `${gToOz(g)} oz`;
  }
  return `${Math.round(g)} g`;
}
