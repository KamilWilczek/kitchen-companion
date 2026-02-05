import { StyleSheet } from 'react-native';
import { colors } from '@app/styles/colors';

export const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.screenBg,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
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
    marginTop: 4,
  },
  buttonText: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: '500',
  },
  planRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  planButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  planButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  planButtonText: {
    fontWeight: '500',
    color: colors.secondary,
  },
  planButtonTextActive: {
    color: colors.white,
  },
  success: {
    color: '#16a34a',
    marginBottom: 8,
  },
  error: {
    color: colors.dangerDark,
    marginBottom: 8,
  },
  logoutButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    padding: 8,
  },
  logoutText: {
    fontSize: 14,
    color: colors.dangerText,
  },
});
