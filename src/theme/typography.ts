import { TextStyle } from 'react-native';

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: -1,
  } as TextStyle,
  h2: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  } as TextStyle,
  h3: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  } as TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: '#B7BBC4',
  } as TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#9A9FAA',
    letterSpacing: 0.5,
  } as TextStyle,
  price: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#F97316',
  } as TextStyle,
};
