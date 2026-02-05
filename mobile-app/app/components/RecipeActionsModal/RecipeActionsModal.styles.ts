import { StyleSheet } from 'react-native';
import { colors } from '@app/styles/colors';

export const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: colors.secondary },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.white,
    fontSize: 16,
  },

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  tagActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tagText: { color: colors.primary },
  tagTextActive: { color: colors.white },

  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  actionBtn: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 10 },
  actionText: { fontWeight: '600' },
  ghost: { backgroundColor: colors.ghostBg },
  primary: { backgroundColor: colors.primary },
  disabled: { opacity: 0.5 },

  deleteBtn: {
    marginTop: 6,
    backgroundColor: colors.dangerLight,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteText: { color: colors.dangerDark, fontWeight: '700' },

  shareSection: {
    marginTop: 12,
    gap: 8,
  },
  shareBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  sharedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  sharedText: {
    fontSize: 14,
    color: colors.primary,
  },
  unshareBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.dangerLight,
  },
});
