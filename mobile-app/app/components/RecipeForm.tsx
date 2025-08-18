import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert, Platform, KeyboardAvoidingView, ActivityIndicator, ScrollView } from 'react-native';
import { listTags } from 'api/tags';
import type { Ingredient, RecipeIn, TagOut } from 'api/types';

type RecipeFormInitial = Partial<RecipeIn> & { tags?: TagOut[] };
type Props = {
  initial?: Partial<RecipeFormInitial>;
  submitLabel: string;
  onSubmit: (recipe: RecipeIn) => Promise<void> | void;
};



export default function RecipeForm({ initial, submitLabel, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [source, setSource] = useState(initial?.source ?? '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial?.ingredients && initial.ingredients.length
      ? initial.ingredients
      : [{ name: '', quantity: 0, unit: '' }]
  );

  const [allTags, setAllTags] = useState<TagOut[] | null>(null);
  const initialTagIds: string[] = (initial?.tag_ids ?? (initial?.tags ? initial.tags.map(t => t.id) : []));
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tags = await listTags();
        if (mounted) setAllTags(tags);
      } catch (e) {
        if (mounted) setAllTags([]);
      }
    })();
    return () => { mounted = false; }
  }, []);

  const canSave = title.trim() && ingredients.every(i => i.name.trim());

  const updateIngredient = (i: number, patch: Partial<Ingredient>) =>
    setIngredients(prev => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const addRow = () => setIngredients(prev => [...prev, { name: '', quantity: 0, unit: '' }]);
  const removeRow = (i: number) => setIngredients(prev => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const toggleTag = (id: string) => setSelectedTagIds(prev => (prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]));

  const handleSubmit = async () => {
    if (!canSave) {
      Alert.alert('Missing info', 'Title and ingredient names are required.');
      return;
    }
    setSaving(true);
    try {
      const payload: RecipeIn = {
        title: title.trim(),
        description: description.trim(),
        source: source.trim() || undefined,
        ingredients: ingredients.map(i => ({
          name: i.name.trim(),
          quantity: Number.isFinite(i.quantity) ? i.quantity : 0,
          unit: i.unit.trim(),
        })),
        tag_ids: selectedTagIds,
      };
      await onSubmit(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
      <View style={{ padding: 16, gap: 16 }}>
        <View style={{ gap: 8 }}>
          <Text style={s.label}>Title</Text>
          <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="e.g., Tomato Soup" />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={s.label}>Description</Text>
          <TextInput style={[s.input, { minHeight: 80 }]} value={description} onChangeText={setDescription} multiline />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={s.label}>Source (URL or book)</Text>
          <TextInput style={[s.input, { minHeight: 80 }]} value={source} onChangeText={setSource} placeholder="https://… or 'Cookbook, p. 42'" />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={s.label}>Ingredients</Text>
          <FlatList
            data={ingredients}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item, index }) => (
              <View style={s.row}>
                <TextInput
                  style={[s.input, s.flex2]}
                  placeholder="name"
                  value={item.name}
                  onChangeText={t => updateIngredient(index, { name: t })}
                />
                <TextInput
                  style={[s.input, s.flex1]}
                  placeholder="qty"
                  keyboardType="numeric"
                  value={String(item.quantity ?? 0)}
                  onChangeText={t => updateIngredient(index, { quantity: Number(t) || 0 })}
                />
                <TextInput
                  style={[s.input, s.flex1]}
                  placeholder="unit"
                  value={item.unit}
                  onChangeText={t => updateIngredient(index, { unit: t })}
                />
                <Pressable onPress={() => removeRow(index)} style={s.iconBtn}><Text style={s.icon}>✕</Text></Pressable>
              </View>
            )}
            ListFooterComponent={
              <Pressable onPress={addRow} style={[s.button, s.ghost]}>
                <Text style={s.buttonText}>+ Add ingredient</Text>
              </Pressable>
            }
          />
        </View>

        <View style={{ gap:8 }}>
          <Text style={s.label}>Tags</Text>
            {!allTags ? (
              <ActivityIndicator />
            ) : allTags.length === 0 ? (
              <Text style={{ color: '#6b7280' }}>No tags yet. Create some in the Tags screen.</Text>
            ) : (
              <View style={s.tagsWrap}>
                {allTags.map(tag => {
                  const active = selectedTagIds.includes(tag.id);
                  return (
                    <Pressable key={tag.id} onPress={() => toggleTag(tag.id)} style={[s.tag, active && s.tagActive]}>
                      <Text style={[s.tagText, active && s.tagTextActive]}>{tag.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
        </View>

        <Pressable onPress={handleSubmit} disabled={!canSave || saving} style={[s.button, (!canSave || saving) && s.disabled]}>
          <Text style={s.buttonText}>{saving ? 'Saving…' : submitLabel}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 16, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  flex1: { flex: 1 }, flex2: { flex: 2 },
  iconBtn: { paddingHorizontal: 10, paddingVertical: 8 }, icon: { fontSize: 18 },
  button: { backgroundColor: '#111827', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  ghost: { backgroundColor: '#31382f' },
  disabled: { opacity: 0.5 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { borderWidth: 1, borderColor: '#d1d5db', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  tagActive: { backgroundColor: '#111827', borderColor: '#111827' },
  tagText: { color: '#111827' },
  tagTextActive: { color: '#fff' },
});