import { StyleSheet } from 'react-native';
import { colors } from '@app/styles/colors';

export const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: colors.white,
    fontSize: 16,
  },
  tagsRow: { marginBottom: 12, flexGrow: 0 },
  tagsRowContent: { gap: 8, alignItems: 'center' },
  tag: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  tagSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  tagText: { color: colors.primary, fontSize: 12 },
  tagTextSelected: { color: colors.white },
  card: { padding: 12, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 10, marginBottom: 10, backgroundColor: colors.white },
  title: { fontWeight: '700', fontSize: 16, marginBottom: 2 },
  ingredientCount: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  source: { color: colors.secondary },
  link: { color: colors.link, textDecorationLine: 'underline' },
  emptyText: { padding: 12, color: colors.muted },
});
