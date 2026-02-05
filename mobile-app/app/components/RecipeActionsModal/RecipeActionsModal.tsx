import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import type { RecipeOut, TagOut } from 'types/types';
import { useRecipesApi } from 'api/recipes';
import { useTagsApi } from 'api/tags';
import { s } from './RecipeActionsModal.styles';
import { colors } from '@app/styles/colors';

type Props = {
  visible: boolean;
  recipe: RecipeOut;

  onClose: () => void;

  onPatched: (updated: RecipeOut) => void;

  onDeleted?: () => void;

  onShared?: () => void | Promise<void>;
};

export default function RecipeActionsModal({
  visible,
  recipe,
  onClose,
  onPatched,
  onDeleted,
  onShared,
}: Props) {
  const { patchRecipe, deleteRecipe, shareRecipe, unshareRecipe } = useRecipesApi();
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

  const [shareEmail, setShareEmail] = useState('');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(recipe.title ?? '');
    setDescription(recipe.description ?? '');
    setSource(recipe.source ?? '');
    setSelectedTagIds(initialTagIds);
    setShareEmail('');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

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

  const handleShare = async () => {
    const email = shareEmail.trim();
    if (!email) {
      Alert.alert('Missing info', 'Please enter an email address.');
      return;
    }

    setSharing(true);
    try {
      await shareRecipe(recipe.id, email);
      setShareEmail('');
      await onShared?.();
      Alert.alert('Shared', `Recipe shared with ${email}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not share recipe.');
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async (userId: string, userEmail: string) => {
    setSharing(true);
    try {
      await unshareRecipe(recipe.id, userId);
      await onShared?.();
      Alert.alert('Unshared', `Recipe unshared from ${userEmail}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not unshare recipe.');
    } finally {
      setSharing(false);
    }
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

            <Pressable onPress={confirmDelete} style={s.deleteBtn}>
              <Text style={s.deleteText}>Delete recipe</Text>
            </Pressable>

            <View style={s.shareSection}>
              <Text style={s.label}>Share recipe</Text>
              <TextInput
                value={shareEmail}
                onChangeText={setShareEmail}
                style={s.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!sharing}
              />
              <Pressable
                onPress={handleShare}
                disabled={sharing || !shareEmail.trim()}
                style={[s.shareBtn, (sharing || !shareEmail.trim()) && s.disabled]}
              >
                <Text style={{ color: colors.white, fontWeight: '600' }}>
                  {sharing ? 'Sharing...' : 'Share'}
                </Text>
              </Pressable>

              {recipe.shared_with_users && recipe.shared_with_users.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={s.label}>Shared with:</Text>
                  {recipe.shared_with_users.map((user) => (
                    <View key={user.id} style={s.sharedRow}>
                      <Text style={s.sharedText}>{user.email}</Text>
                      <Pressable
                        onPress={() => handleUnshare(user.id, user.email)}
                        disabled={sharing}
                        style={[s.unshareBtn, sharing && s.disabled]}
                      >
                        <Text style={{ color: colors.dangerDark }}>Unshare</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
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
              <Text style={[s.actionText, { color: colors.white }]}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

