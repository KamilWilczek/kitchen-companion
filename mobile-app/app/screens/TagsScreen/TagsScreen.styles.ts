import { StyleSheet } from 'react-native';
import { colors } from '@app/styles/colors';

export const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  button: { backgroundColor: colors.primary, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  buttonText: { color: colors.white, fontWeight: '600' },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  smallBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  smallBtnText: { color: colors.white },
  smallGhost: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.ghostBg },
  smallDanger: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.danger },
});
