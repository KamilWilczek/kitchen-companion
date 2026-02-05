import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const shared = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.white,
    fontSize: 16,
  },

  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: colors.white,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },

  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: '600',
  },
  ghostBtn: {
    backgroundColor: colors.ghostBg,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerBtn: {
    backgroundColor: colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  footerBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },

  disabled: {
    opacity: 0.5,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: colors.placeholder,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
