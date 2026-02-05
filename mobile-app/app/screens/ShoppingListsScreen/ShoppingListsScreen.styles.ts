import { StyleSheet } from 'react-native';
import { colors } from '@app/styles/colors';

export const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: colors.white,
    gap: 8,
  },
  title: { fontWeight: '700', fontSize: 16 },
  counter: {
    marginTop: 2,
    fontSize: 13,
    color: colors.muted,
  },
  deleteBtn: {
    backgroundColor: colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  footerBtn: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 10 },
  ghost: { backgroundColor: colors.ghostBg },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
    marginBottom: 4,
    marginTop: 4,
  },
  shareBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
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
