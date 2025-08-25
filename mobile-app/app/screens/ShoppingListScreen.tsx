import { View, Text, FlatList, StyleSheet, Pressable, TextInput, Alert, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import type { ShoppingItemOut } from 'types/types';
import { useFocusEffect } from '@react-navigation/native';
import { useShoppingListApi } from 'api/shopping_lists';

export default function ShoppingListScreen() {
  const [items, setItems] = useState<ShoppingItemOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getShoppingList, addShoppingItem, patchShoppingItem, deleteShoppingItem, clearShoppingList } = useShoppingListApi();

  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getShoppingList();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { setItems(await getShoppingList()); }
    finally { setRefreshing(false); }
  }, []);

  const addItem = async () => {
    const n = name.trim();
    if (!n) return;
    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) return;
    const created = await addShoppingItem({ name: n, quantity: q, unit: unit.trim() });
    setItems(await getShoppingList());
    setName(''); setQty('1'); setUnit('');
  };

  const toggleChecked = async (id: string, checked: boolean) => {
    await patchShoppingItem(id, { checked });
    setItems(await getShoppingList());
  };

  const editItem = async (id: string, by: number, current: number) => {
    const next = Math.max(0, current + by);
    await patchShoppingItem(id, { quantity: next });
    setItems(await getShoppingList());
  };

  const removeItem = async (id: string) => {
    await deleteShoppingItem(id);
    setItems(await getShoppingList());
  };

  const clearAll = async () => {
    await clearShoppingList(false);
    setItems([]);
  };

  const clearChecked = async () => {
    await clearShoppingList(true);
    setItems(await getShoppingList());
  };

  const Row = ({ item }: { item: ShoppingItemOut }) => (
    <View style={s.row}>
      <Pressable onPress={() => toggleChecked(item.id, !item.checked)} style={[s.checkbox, item.checked && s.checkboxOn]}>
        <Text style={[s.checkboxText, item.checked && s.checkboxTextOn]}>{item.checked ? '✓' : ''}</Text>
      </Pressable>

      <View style={{ flex: 1 }}>
        <Text style={[s.name, item.checked && s.strike]}>{item.name}</Text>
        <Text style={[s.meta, item.checked && s.strike]}>{item.quantity} {item.unit}</Text>
      </View>

      <View style={s.qBtns}>
        <Pressable onPress={() => editItem
    (item.id, -1, item.quantity)} style={s.smallBtn}><Text>-</Text></Pressable>
        <Pressable onPress={() => editItem
    (item.id, +1, item.quantity)} style={s.smallBtn}><Text>+</Text></Pressable>
      </View>

      <Pressable onPress={() => removeItem(item.id)} style={s.deleteBtn}><Text style={{ color: '#fff' }}>Del</Text></Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <View style={s.addRow}>
        <TextInput value={name} onChangeText={setName} placeholder="Item" style={[s.input, { flex: 2 }]} />
        <TextInput value={qty} onChangeText={setQty} placeholder="Qty" keyboardType="numeric" style={[s.input, { width: 80 }]} />
        <TextInput value={unit} onChangeText={setUnit} placeholder="Unit" style={[s.input, { flex: 1 }]} />
        <Pressable onPress={addItem} style={s.addBtn}><Text style={{ color: '#fff' }}>Add</Text></Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => <Row item={item} />}
        ListEmptyComponent={!loading ? <Text style={{ padding: 12, color: '#6b7280' }}>Your list is empty.</Text> : null}
      />

      <View style={s.footer}>
        <Pressable onPress={clearChecked} style={[s.footerBtn, s.ghost]}><Text>Clear checked</Text></Pressable>
        <Pressable onPress={() => {
          Alert.alert('Clear all?', 'This will removeItem all items.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: clearAll },
          ]);
        }} style={[s.footerBtn, s.danger]}>
          <Text style={{ color: '#fff' }}>Clear all</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#fff' },
  addBtn: { backgroundColor: '#111827', paddingHorizontal: 14, justifyContent: 'center', borderRadius: 8 },

  row: { flexDirection: 'row', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, marginBottom: 8, backgroundColor: '#fff', gap: 10 },
  checkbox: { width: 24, height: 24, borderWidth: 1.5, borderColor: '#9ca3af', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: '#111827', borderColor: '#111827' },
  checkboxText: { color: '#111827' },
  checkboxTextOn: { color: '#fff' },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { color: '#374151' },
  strike: { textDecorationLine: 'line-through', color: '#9ca3af' },
  qBtns: { flexDirection: 'row', gap: 8 },
  smallBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  deleteBtn: { backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },

  footer: { flexDirection: 'row', gap: 10, justifyContent: 'space-between', marginTop: 8 },
  footerBtn: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 10 },
  ghost: { backgroundColor: '#f3f4f6' },
  danger: { backgroundColor: '#dc2626' },
});