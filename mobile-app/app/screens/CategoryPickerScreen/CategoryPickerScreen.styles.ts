import { StyleSheet } from 'react-native';
import { colors } from '@app/styles/colors';

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 32 },

  // Section header
  sectionHeader: {
    backgroundColor: colors.ghostBg,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Category row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowSelected: {
    backgroundColor: colors.ghostBg,
  },
  icon: { fontSize: 22, width: 28, textAlign: 'center' },
  name: { flex: 1, fontSize: 16, color: colors.primary },
  nameSelected: { fontWeight: '600' },

  // "Add own category" row
  ownSection: {
    marginTop: 8,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  addRowText: { fontSize: 16, color: colors.link },

  // Add modal
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    gap: 14,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.primary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.ghostBg,
  },
  cancelText: { fontSize: 15, color: colors.secondary },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: colors.white },
  disabled: { opacity: 0.5 },
});
