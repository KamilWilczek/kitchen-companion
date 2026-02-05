import { StyleSheet } from 'react-native';
import { colors } from '@app/styles/colors';

export const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: colors.screenBg,
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  secondary: {
    backgroundColor: '#4B5563',
  },
  buttonText: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: '500',
  },
  error: {
    color: colors.dangerDark,
    marginBottom: 8,
  },
});
