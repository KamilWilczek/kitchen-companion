import { StyleSheet } from 'react-native';
import { colors } from '@app/styles/colors';

export const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Week nav
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  navBtn: {
    padding: 4,
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1917',
  },

  // Day cards
  scroll: {
    padding: 14,
    gap: 12,
  },
  dayCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dayLabelToday: {
    color: colors.primary,
  },

  // Slot rows
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 8,
  },
  slotIcon: {
    width: 18,
  },
  slotLabel: {
    fontSize: 14,
    color: colors.muted,
    width: 72,
  },

  // Assigned recipe
  assignedRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recipeChip: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  recipeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  removeBtn: {
    padding: 2,
  },

  // Add button
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  addBtnText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
});
