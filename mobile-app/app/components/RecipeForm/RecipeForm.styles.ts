import { StyleSheet } from 'react-native';
import { colors } from '@app/styles/colors';

export const s = StyleSheet.create({
  container: { gap: 16 },

  label: { fontSize: 16, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: colors.white,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    position: 'relative',
  },

  flex1: { flex: 1 },
  flex2: { flex: 2 },

  iconBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  icon: { fontSize: 18 },

  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  ghost: { backgroundColor: colors.ghostBg },

  disabled: { opacity: 0.5 },
  readOnly: { opacity: 0.85 },

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

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: colors.placeholder,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxText: { color: colors.white, fontWeight: '900' },
});
