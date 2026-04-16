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
import IngredientModal from '@app/components/IngredientModal/IngredientModal';
import { s } from './RecipeForm.styles';
import { colors } from '@app/styles/colors';

type RecipeFormInitial = Partial<RecipeOut> & { tags?: TagOut[] };

type IngredientSelection = {
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
};

type Props = {
  initial?: Partial<RecipeFormInitial>;
  submitLabel?: string;
  onSubmit?: (recipe: RecipeIn) => Promise<void> | void;
  selectIngredients?: IngredientSelection;
  ingredientsReadOnly?: boolean;
  mode?: 'full' | 'ingredients-only';
  onIngredientsChange?: (next: IngredientOut[]) => void;
};

const EMPTY_INGREDIENT: IngredientOut = { id: '', name: '', quantity: 0, unit: '' };

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
      : [],
  );

  const [allTags, setAllTags] = useState<TagOut[] | null>(null);
  const initialTagIds: string[] =
    initial?.tag_ids ?? (initial?.tags ? initial.tags.map((t) => t.id) : []);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);

  const [saving, setSaving] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<IngredientOut>(EMPTY_INGREDIENT);

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
  }, [isFull]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onIngredientsChange?.(ingredients);
  }, [ingredients, onIngredientsChange]);

  const canSave = useMemo(() => {
    if (isFull && !title.trim()) return false;
    return ingredients.every((i) => i.name.trim());
  }, [ingredients, isFull, title]);

  const openAdd = () => {
    setDraft(EMPTY_INGREDIENT);
    setEditingIndex(null);
    setModalVisible(true);
  };

  const openEdit = (index: number) => {
    setDraft(ingredients[index]);
    setEditingIndex(index);
    setModalVisible(true);
  };

  const handleModalSave = () => {
    setIngredients((prev) => {
      if (editingIndex === null) return [...prev, draft];
      return prev.map((ing, i) => (i === editingIndex ? draft : ing));
    });
    setModalVisible(false);
  };

  const handleModalDelete = () => {
    if (editingIndex !== null) {
      setIngredients((prev) => prev.filter((_, i) => i !== editingIndex));
    }
    setModalVisible(false);
  };

  const handleCategoryPress = () => {
    setModalVisible(false);
    navigation.navigate('CategoryPicker', {
      selectedId: draft.category_id ?? undefined,
      onSelect: (cat: CategoryOut) => {
        setDraft((prev) => ({ ...prev, category_id: cat.id, category: cat }));
        setModalVisible(true);
      },
    });
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

        {ingredients.length === 0 && (
          <Text style={s.emptyIngredients}>No ingredients yet.</Text>
        )}

        {ingredients.map((item, index) => {
          const qtyUnit = [
            item.quantity > 0 ? String(item.quantity) : null,
            item.unit || null,
          ].filter(Boolean).join(' ');
          const categoryLabel = item.category
            ? `${item.category.icon ?? '📦'} ${item.category.name}`
            : null;
          const meta = [qtyUnit, categoryLabel].filter(Boolean).join('  •  ');

          return (
            <Pressable
              key={item.id || `row-${index}`}
              onPress={() => !ingredientsReadOnly && openEdit(index)}
              style={s.ingredientCard}
            >
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

              <View style={s.ingredientCardContent}>
                <Text style={s.ingredientName}>{item.name}</Text>
                {!!meta && <Text style={s.ingredientMeta}>{meta}</Text>}
                {!!item.note && <Text style={s.ingredientNote}>{item.note}</Text>}
              </View>

              {!ingredientsReadOnly && <Text style={s.ingredientChevron}>›</Text>}
            </Pressable>
          );
        })}

        {!ingredientsReadOnly && (
          <Pressable onPress={openAdd} style={s.button}>
            <Text style={s.buttonText}>+ Add ingredient</Text>
          </Pressable>
        )}
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

      <IngredientModal
        visible={modalVisible}
        value={draft}
        onChange={setDraft}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
        onClose={() => setModalVisible(false)}
        onCategoryPress={handleCategoryPress}
        isEditing={editingIndex !== null}
      />
    </View>
  );
}
