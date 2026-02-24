import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTagsApi } from 'api/tags';
import type { IngredientIn, RecipeIn, TagOut, IngredientOut, RecipeOut, CategoryOut } from 'types/types';
import type { RootStackParamList } from 'App';
import UnitSelect from '@app/components/UnitSelect/UnitSelect';
import { s } from './RecipeForm.styles';
import { colors } from '@app/styles/colors';

type RecipeFormInitial = Partial<RecipeOut> & { tags?: TagOut[] };

type IngredientSelection = {
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
};

type Props = {
  initial?: Partial<RecipeFormInitial>;
  submitLabel?: string; // optional now (ingredients-only doesn’t need it)
  onSubmit?: (recipe: RecipeIn) => Promise<void> | void; // optional now
  selectIngredients?: IngredientSelection;

  ingredientsReadOnly?: boolean;
  mode?: 'full' | 'ingredients-only';
  onIngredientsChange?: (next: IngredientOut[]) => void;
};

export default function RecipeForm({
  initial,
  submitLabel = 'Save',
  onSubmit,
  selectIngredients,
  ingredientsReadOnly = false,
  mode = 'full',
  onIngredientsChange,
}: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { listTags } = useTagsApi();

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [source, setSource] = useState(initial?.source ?? '');

  const [ingredients, setIngredients] = useState<IngredientOut[]>(
    initial?.ingredients && initial.ingredients.length
      ? initial.ingredients
      : [{ id: '', name: '', quantity: 0, unit: '' }],
  );

  const [allTags, setAllTags] = useState<TagOut[] | null>(null);
  const initialTagIds: string[] =
    initial?.tag_ids ?? (initial?.tags ? initial.tags.map((t) => t.id) : []);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);

  const [saving, setSaving] = useState(false);

  const isFull = mode === 'full';

  useEffect(() => {
    if (!isFull) return;

    let mounted = true;
    (async () => {
      try {
        const tags = await listTags();
        if (mounted) setAllTags(tags);
      } catch {
        if (mounted) setAllTags([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isFull, listTags]);

  useEffect(() => {
    onIngredientsChange?.(ingredients);
  }, [ingredients, onIngredientsChange]);

  const canSave = useMemo(() => {
    if (isFull && !title.trim()) return false;
    return ingredients.every((i) => i.name.trim());
  }, [ingredients, isFull, title]);

  const updateIngredient = (i: number, patch: Partial<IngredientOut>) => {
    if (ingredientsReadOnly) return;
    setIngredients((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)),
    );
  };

  const addRow = () => {
    if (ingredientsReadOnly) return;
    setIngredients((prev) => [...prev, { id: '', name: '', quantity: 0, unit: '' }]);
  };

  const removeRow = (i: number) => {
    if (ingredientsReadOnly) return;
    setIngredients((prev) =>
      prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev,
    );
  };

  const toggleTag = (id: string) =>
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );

  const handleSubmit = async () => {
    if (!onSubmit) return;

    if (!canSave) {
      Alert.alert(
        'Missing info',
        isFull
          ? 'Title and ingredient names are required.'
          : 'Ingredient names are required.',
      );
      return;
    }

    setSaving(true);
    try {
      const payload: RecipeIn = {
        title: title.trim(),
        description: description.trim(),
        source: source.trim() || undefined,
        ingredients: ingredients.map((i) => ({
          id: i.id,
          name: i.name.trim(),
          quantity: Number.isFinite(i.quantity) ? i.quantity : 0,
          unit: i.unit.trim(),
          category_id: i.category_id ?? null,
        })),
        tag_ids: selectedTagIds,
      };
      await onSubmit(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.container}>
      {isFull && (
        <>
          <View style={{ gap: 8 }}>
            <Text style={s.label}>Title</Text>
            <TextInput
              style={s.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Tomato Soup"
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={s.label}>Description</Text>
            <TextInput
              style={[s.input, { minHeight: 80 }]}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={s.label}>Source (URL or book)</Text>
            <TextInput
              style={[s.input, { minHeight: 80 }]}
              value={source}
              onChangeText={setSource}
              placeholder="https://… or 'Cookbook, p. 42'"
            />
          </View>
        </>
      )}

      <View style={{ gap: 8 }}>
        <Text style={s.label}>Ingredients</Text>

        {ingredients.map((item, index) => (
          <View
            key={item.id || `row-${index}`}
            style={{ zIndex: ingredients.length - index, marginBottom: 8 }}
          >
            <View style={s.row}>
              {selectIngredients && item.id ? (
                <Pressable
                  onPress={() => selectIngredients.onToggle(item.id!)}
                  style={[
                    s.checkbox,
                    selectIngredients.selectedIds.has(item.id) && s.checkboxOn,
                  ]}
                >
                  <Text style={s.checkboxText}>
                    {selectIngredients.selectedIds.has(item.id) ? '✓' : ''}
                  </Text>
                </Pressable>
              ) : null}

              <TextInput
                style={[s.input, s.flex2, ingredientsReadOnly && s.readOnly]}
                placeholder="name"
                value={item.name}
                editable={!ingredientsReadOnly}
                onChangeText={(t) => updateIngredient(index, { name: t })}
              />

              <TextInput
                style={[s.input, s.flex1, ingredientsReadOnly && s.readOnly]}
                placeholder="qty"
                keyboardType="numeric"
                value={String(item.quantity ?? 0)}
                editable={!ingredientsReadOnly}
                onChangeText={(t) =>
                  updateIngredient(index, { quantity: Number(t) || 0 })
                }
              />

              <UnitSelect
                value={item.unit}
                onChange={(t) => updateIngredient(index, { unit: t })}
                containerStyle={{ flex: 1 }}
              />

              <Pressable
                onPress={() => removeRow(index)}
                disabled={ingredientsReadOnly}
                style={[s.iconBtn, ingredientsReadOnly && s.disabled]}
              >
                <Text style={s.icon}>✕</Text>
              </Pressable>
            </View>

            <Pressable
              style={[s.categoryChip, ingredientsReadOnly && s.disabled]}
              disabled={ingredientsReadOnly}
              onPress={() =>
                navigation.navigate('CategoryPicker', {
                  selectedId: item.category_id ?? undefined,
                  onSelect: (cat: CategoryOut) =>
                    updateIngredient(index, { category_id: cat.id, category: cat }),
                })
              }
            >
              <Text style={[s.categoryChipText, !item.category_id && s.categoryChipPlaceholder]}>
                {item.category
                  ? `${item.category.icon ?? '📦'} ${item.category.name}`
                  : '+ kategoria'}
              </Text>
            </Pressable>
          </View>
        ))}

        <Pressable
          onPress={addRow}
          disabled={ingredientsReadOnly}
          style={[s.button, s.ghost, ingredientsReadOnly && s.disabled]}
        >
          <Text style={s.buttonText}>+ Add ingredient</Text>
        </Pressable>
      </View>

      {isFull && (
        <>
          <View style={{ gap: 8 }}>
            <Text style={s.label}>Tags</Text>

            {!allTags ? (
              <ActivityIndicator />
            ) : allTags.length === 0 ? (
              <Text style={{ color: colors.muted }}>
                No tags yet. Create some in the Tags screen.
              </Text>
            ) : (
              <View style={s.tagsWrap}>
                {allTags.map((tag) => {
                  const active = selectedTagIds.includes(tag.id);
                  return (
                    <Pressable
                      key={tag.id}
                      onPress={() => toggleTag(tag.id)}
                      style={[s.tag, active && s.tagActive]}
                    >
                      <Text style={[s.tagText, active && s.tagTextActive]}>
                        {tag.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSave || saving}
            style={[s.button, (!canSave || saving) && s.disabled]}
          >
            <Text style={s.buttonText}>
              {saving ? 'Saving…' : submitLabel}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

