import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMealPlanApi } from 'api/meal_plan';
import { useRecipesApi } from 'api/recipes';
import RecipePickerModal from '@app/components/RecipePickerModal/RecipePickerModal';
import type { MealPlanEntry, MealSlot, RecipeOut } from 'types/types';
import { colors } from '@app/styles/colors';
import { s } from './MealPlannerScreen.styles';

// ── helpers ──────────────────────────────────────────────

function getWeekStart(weekOffset: number): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + weekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${weekStart.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
}

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

// ── slot config ───────────────────────────────────────────

const SLOTS: { key: MealSlot; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
  { key: 'lunch',     label: 'Lunch',     icon: 'partly-sunny-outline' },
  { key: 'dinner',    label: 'Dinner',    icon: 'restaurant-outline' },
  { key: 'supper',    label: 'Supper',    icon: 'moon-outline' },
];

// ── component ────────────────────────────────────────────

export default function MealPlannerScreen() {
  const { getWeek, assignRecipe, removeRecipe } = useMealPlanApi();
  const { fetchRecipes } = useRecipesApi();

  const [weekOffset, setWeekOffset] = useState(0);
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [recipes, setRecipes] = useState<RecipeOut[]>([]);
  const [loading, setLoading] = useState(true);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ date: string; slot: MealSlot } | null>(null);

  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  // index entries by "date|slot" for O(1) lookup
  const entryMap = useMemo(() => {
    const map: Record<string, MealPlanEntry> = {};
    entries.forEach(e => { map[`${e.date}|${e.meal_slot}`] = e; });
    return map;
  }, [entries]);

  const loadWeek = useCallback(async (start: Date) => {
    setLoading(true);
    try {
      const data = await getWeek(toDateStr(start));
      setEntries(data);
    } catch {
      // silently fail — user sees empty slots
    } finally {
      setLoading(false);
    }
  }, [getWeek]);

  useEffect(() => { loadWeek(weekStart); }, [weekStart]);

  useEffect(() => {
    fetchRecipes().then(setRecipes).catch(() => {});
  }, []);

  function openPicker(date: string, slot: MealSlot) {
    setPendingSlot({ date, slot });
    setPickerVisible(true);
  }

  async function handleSelect(recipe: RecipeOut) {
    if (!pendingSlot) return;
    const { date, slot } = pendingSlot;
    try {
      const entry = await assignRecipe(date, slot, recipe.id);
      setEntries(prev => {
        const filtered = prev.filter(e => !(e.date === date && e.meal_slot === slot));
        return [...filtered, entry];
      });
    } catch {}
  }

  async function handleRemove(date: string, slot: MealSlot) {
    try {
      await removeRecipe(date, slot);
      setEntries(prev => prev.filter(e => !(e.date === date && e.meal_slot === slot)));
    } catch {}
  }

  return (
    <View style={s.screen}>
      {/* Week navigation */}
      <View style={s.weekNav}>
        <Pressable onPress={() => setWeekOffset(o => o - 1)} hitSlop={12} style={s.navBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={s.weekLabel}>{formatWeekRange(weekStart)}</Text>
        <Pressable onPress={() => setWeekOffset(o => o + 1)} hitSlop={12} style={s.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          {weekDays.map(day => {
            const dateStr = toDateStr(day);
            const isToday = toDateStr(new Date()) === dateStr;
            return (
              <View key={dateStr} style={s.dayCard}>
                <Text style={[s.dayLabel, isToday && s.dayLabelToday]}>
                  {formatDayLabel(day)}
                  {isToday ? '  •  Today' : ''}
                </Text>

                {SLOTS.map(({ key, label, icon }) => {
                  const entry = entryMap[`${dateStr}|${key}`];
                  return (
                    <View key={key} style={s.slotRow}>
                      <Ionicons name={icon} size={16} color={colors.muted} style={s.slotIcon} />
                      <Text style={s.slotLabel}>{label}</Text>
                      {entry ? (
                        <View style={s.assignedRow}>
                          <Pressable style={s.recipeChip} onPress={() => openPicker(dateStr, key)}>
                            <Text style={s.recipeChipText} numberOfLines={1}>{entry.recipe.title}</Text>
                          </Pressable>
                          <Pressable onPress={() => handleRemove(dateStr, key)} hitSlop={10} style={s.removeBtn}>
                            <Ionicons name="close-circle" size={18} color={colors.muted} />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable style={s.addBtn} onPress={() => openPicker(dateStr, key)}>
                          <Ionicons name="add" size={16} color={colors.primary} />
                          <Text style={s.addBtnText}>Add</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      )}

      <RecipePickerModal
        visible={pickerVisible}
        recipes={recipes}
        onSelect={handleSelect}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}
