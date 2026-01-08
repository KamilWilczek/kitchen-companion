import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import type { RecipeOut, TagOut } from 'types/types';
import { useRecipesApi } from 'api/recipes';
import { useTagsApi } from 'api/tags';

type Props = {
  visible: boolean;
  recipe: RecipeOut;

  onClose: () => void;

  onPatched: (updated: RecipeOut) => void;

  onDeleted?: () => void;
};

export default function RecipeActionsModal({
  visible,
  recipe,
  onClose,
  onPatched,
  onDeleted,
}: Props) {
  const { patchRecipe, deleteRecipe } = useRecipesApi();
  const { listTags } = useTagsApi();

  const [title, setTitle] = useState(recipe.title ?? '');
  const [description, setDescription] = useState(recipe.description ?? '');
  const [source, setSource] = useState(recipe.source ?? '');

  const initialTagIds = useMemo<string[]>(() => {
    if (Array.isArray(recipe.tag_ids)) return recipe.tag_ids;
    if (Array.isArray(recipe.tags)) return recipe.tags.map((t: any) => t.id);
    return [];
  }, [recipe]);

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);

  const [allTags, setAllTags] = useState<TagOut[] | null>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(recipe.title ?? '');
    setDescription(recipe.description ?? '');
    setSource(recipe.source ?? '');
    setSelectedTagIds(initialTagIds);
  }, [visible, recipe, initialTagIds]);

  useEffect(() => {
    if (!visible) return;

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
  }, [visible, listTags]);

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const hasChanges = useMemo(() => {
    const t = title.trim();
    const d = description.trim();
    const s = source.trim();

    const tagsA = [...initialTagIds].sort().join(',');
    const tagsB = [...selectedTagIds].sort().join(',');

    return (
      t !== (recipe.title ?? '').trim() ||
      d !== (recipe.description ?? '').trim() ||
      s !== (recipe.source ?? '').trim() ||
      tagsA !== tagsB
    );
  }, [title, description, source, selectedTagIds, initialTagIds, recipe]);

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  const handleSave = async () => {
    if (!canSave) {
      Alert.alert('Missing info', 'Title is required.');
      return;
    }

    setSaving(true);
    try {
      const patch = {
        title: title.trim(),
        description: description.trim(),
        source: source.trim() || undefined,
        tag_ids: selectedTagIds,
      };

      const updated = await patchRecipe(recipe.id, patch);
      onPatched(updated);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete recipe?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecipe(recipe.id);
            onClose();
            onDeleted?.();
          } catch (e: any) {
            Alert.alert('Error', e?.message ?? 'Could not delete recipe.');
          }
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.card} onPress={() => {}}>
          <Text style={s.title}>Recipe actions</Text>

          <ScrollView
            style={{ maxHeight: 520 }}
            contentContainerStyle={{ gap: 12 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ gap: 6 }}>
              <Text style={s.label}>Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={s.input}
                placeholder="Recipe title"
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={s.label}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={[s.input, { minHeight: 80 }]}
                multiline
                placeholder="Optional"
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={s.label}>Source</Text>
              <TextInput
                value={source}
                onChangeText={setSource}
                style={s.input}
                placeholder="URL or 'Book, p. 42'"
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={s.label}>Tags</Text>

              {!allTags ? (
                <ActivityIndicator />
              ) : allTags.length === 0 ? (
                <Text style={{ color: '#6b7280' }}>
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

            <Pressable onPress={confirmDelete} style={s.deleteBtn}>
              <Text style={s.deleteText}>Delete recipe</Text>
            </Pressable>
          </ScrollView>

          <View style={s.actions}>
            <Pressable onPress={onClose} style={[s.actionBtn, s.ghost]}>
              <Text style={s.actionText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={!hasChanges || saving || !canSave}
              style={[
                s.actionBtn,
                s.primary,
                (!hasChanges || saving || !canSave) && s.disabled,
              ]}
            >
              <Text style={[s.actionText, { color: '#fff' }]}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },

  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  tagActive: { backgroundColor: '#111827', borderColor: '#111827' },
  tagText: { color: '#111827' },
  tagTextActive: { color: '#fff' },

  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  actionBtn: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 10 },
  actionText: { fontWeight: '600' },
  ghost: { backgroundColor: '#f3f4f6' },
  primary: { backgroundColor: '#111827' },
  disabled: { opacity: 0.5 },

  deleteBtn: {
    marginTop: 6,
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteText: { color: '#b91c1c', fontWeight: '700' },
});
