import { StyleSheet } from 'react-native';
import { colors } from '@app/styles/colors';

export const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    justifyContent: 'center',
    backgroundColor: colors.screenBg,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1C1917',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
    backgroundColor: colors.white,
    fontSize: 16,
    color: '#1C1917',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 8,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  buttonText: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  error: {
    color: colors.dangerDark,
    marginBottom: 8,
    fontSize: 14,
  },
  success: {
    color: '#16a34a',
    marginBottom: 8,
    fontSize: 14,
  },
  forgotLink: {
    marginTop: 14,
    alignSelf: 'center',
  },
  forgotLinkText: {
    color: colors.muted,
    fontSize: 14,
  },
  switchLink: {
    marginTop: 12,
  },
  switchLinkText: {
    color: colors.primary,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});
