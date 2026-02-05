import { StyleSheet } from 'react-native';
import { colors } from '@app/styles/colors';

export const s = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    padding: 24,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  muted: { color: colors.muted },
  listRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    marginBottom: 8,
  },
  listRowText: { fontWeight: '600' },
  modalCancel: { paddingVertical: 10, alignItems: 'center' },
  modalCancelText: { color: colors.primary, fontWeight: '600' },
});
