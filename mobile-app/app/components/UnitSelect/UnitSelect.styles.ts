import { StyleSheet } from 'react-native';
import { colors } from '@app/styles/colors';

export const s = StyleSheet.create({
  unitSelectContainer: {
    position: 'relative',
  },
  unitSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.white,
    minHeight: 42,
  },
  unitSelectText: { color: colors.primary },
  unitSelectChevron: { marginLeft: 6, color: colors.muted },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },

  unitOptions: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
    elevation: 30,
  },
  unitOption: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  unitOptionClear: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
