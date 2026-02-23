import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  captionBold: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  small: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  smallBold: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  label: { fontSize: 11, fontWeight: '500', lineHeight: 16, letterSpacing: 0.5, textTransform: 'uppercase' },
  number: { fontSize: 40, fontWeight: '700', lineHeight: 48 },
  numberSmall: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
};
