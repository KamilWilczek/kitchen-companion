import { StyleSheet } from 'react-native';
import { colors } from '@app/styles/colors';

export const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1917',
  },
  search: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: colors.white,
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1917',
  },
  itemMeta: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 40,
    fontSize: 15,
  },
});
