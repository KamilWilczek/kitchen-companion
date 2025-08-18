import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { listTags, createTag, renameTag, deleteTag } from 'api/tags';
import type { TagOut } from 'api/types';
import { useFocusEffect } from '@react-navigation/native';


export default function TagsScreen() {
  const [tags, setTags] = useState<TagOut[] | null>(null);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const load = async () => {
    setTags(null);
    try {
      setTags(await listTags());
    } catch {
      setTags([]);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    await createTag(name);
    setNewName('');
    await load();
  };

  const startEdit = (t: TagOut) => {
    setEditingId(t.id);
    setEditingName(t.name);
  };

  const saveEdit = async () => {
    const name = editingName.trim();
    if (!editingId || !name) { setEditingId(null); return; }
    await renameTag(editingId, name);
    setEditingId(null);
    setEditingName('');
    await load();
  };

  const onDelete = async (id: string) => {
    try {
      await deleteTag(id);
      await load();
    } catch (e: any) {
      Alert.alert('Cannot delete', e?.message ?? 'This tag is in use by one or more recipes.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={s.row}>
        <TextInput
          placeholder="New tag name"
          value={newName}
          onChangeText={setNewName}
          style={[s.input, { flex: 1 }]}
        />
        <Pressable onPress={onAdd} style={s.button}><Text style={s.buttonText}>Add</Text></Pressable>
      </View>

      {!tags ? (
        <View style={s.center}><ActivityIndicator /></View>
      ) : (
        <FlatList
          data={tags}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <View style={s.tagRow}>
              {editingId === item.id ? (
                <>
                  <TextInput
                    value={editingName}
                    onChangeText={setEditingName}
                    style={[s.input, { flex: 1 }]}
                  />
                  <Pressable onPress={saveEdit} style={s.smallBtn}><Text style={s.smallBtnText}>Save</Text></Pressable>
                  <Pressable onPress={() => { setEditingId(null); setEditingName(''); }} style={s.smallGhost}><Text>Cancel</Text></Pressable>
                </>
              ) : (
                <>
                  <Text style={{ flex: 1, fontSize: 16 }}>{item.name}</Text>
                  <Pressable onPress={() => startEdit(item)} style={s.smallGhost}><Text>Edit</Text></Pressable>
                  <Pressable onPress={() => onDelete(item.id)} style={s.smallDanger}><Text style={{ color: '#fff' }}>Delete</Text></Pressable>
                </>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: '#6b7280' }}>No tags yet. Add one above.</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  button: { backgroundColor: '#111827', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  smallBtn: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  smallBtnText: { color: '#fff' },
  smallGhost: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f3f4f6' },
  smallDanger: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#dc2626' },
});