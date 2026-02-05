import { StyleSheet } from 'react-native';
import { colors } from '@app/styles/colors';

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },

  headerCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { marginTop: 4, color: colors.secondary },
  headerHint: { marginTop: 8, fontSize: 12, color: colors.muted },

  footer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
    gap: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },

  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.white, fontWeight: '600' },

  secondaryBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.white, fontWeight: '600' },

  ghostBtn: {
    backgroundColor: colors.ghostBg,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  ghostBtnText: { color: colors.primary, fontWeight: '600' },

  disabled: { opacity: 0.5 },
});
