import { View, Text, FlatList, StyleSheet, Pressable, TextInput, Alert, RefreshControl, Modal } from 'react-native';
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

  const [editVisible, setEditVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItemOut | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('1');
  const [editUnit, setEditUnit] = useState('');

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

  const openEditModal = (item: ShoppingItemOut) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditQty(String(item.quantity));
    setEditUnit(item.unit ?? '');
    setEditVisible(true);
  };

  const closeEditModal = () => {
    setEditVisible(false);
    setEditingItem(null);
  };

  const saveEdit = async () => {
    if (!editingItem) return;

    const n = editName.trim();
    const q = Number(editQty);
    const u = editUnit.trim();

    if (!n) return;                      // or show some validation
    if (!Number.isFinite(q) || q <= 0) return;

    await patchShoppingItem(editingItem.id, {
      name: n,
      quantity: q,
      unit: u,
    });

    setItems(await getShoppingList());
    closeEditModal();
  };

  const Row = ({ item }: { item: ShoppingItemOut }) => (
    <Pressable onLongPress={() => openEditModal(item)} style={s.row}>
      <Pressable
        onPress={() => toggleChecked(item.id, !item.checked)}
        style={[s.checkbox, item.checked && s.checkboxOn]}
      >
        <Text style={[s.checkboxText, item.checked && s.checkboxTextOn]}>
          {item.checked ? '✓' : ''}
        </Text>
      </Pressable>

      <View style={{ flex: 1 }}>
        <Text style={[s.name, item.checked && s.strike]}>{item.name}</Text>
        <Text style={[s.meta, item.checked && s.strike]}>
          {item.quantity} {item.unit}
        </Text>
      </View>

      <View style={s.qBtns}>
        <Pressable
          onPress={() => editItem(item.id, -1, item.quantity)}
          style={s.smallBtn}
        >
          <Text>-</Text>
        </Pressable>
        <Pressable
          onPress={() => editItem(item.id, +1, item.quantity)}
          style={s.smallBtn}
        >
          <Text>+</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => removeItem(item.id)} style={s.deleteBtn}>
        <Text style={{ color: '#fff' }}>Del</Text>
      </Pressable>
    </Pressable>
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
      <Modal
        visible={editVisible}
        animationType="slide"
        transparent
        onRequestClose={closeEditModal}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Edit item</Text>

            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Item"
              style={s.input}
            />

            <TextInput
              value={editQty}
              onChangeText={setEditQty}
              placeholder="Qty"
              keyboardType="numeric"
              style={s.input}
            />

            <TextInput
              value={editUnit}
              onChangeText={setEditUnit}
              placeholder="Unit"
              style={s.input}
            />

            <View style={s.modalActions}>
              <Pressable onPress={closeEditModal} style={[s.footerBtn, s.ghost]}>
                <Text>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveEdit} style={[s.footerBtn, s.addBtn]}>
                <Text style={{ color: '#fff' }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
});