import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ShoppingItemOut } from 'types/types';
import type { RootStackParamList } from 'App';
import { useShoppingListApi } from 'api/shopping_lists';
import UnitSelect from '@app/components/UnitSelect/UnitSelect';
import { useLoadableData } from 'hooks/useLoadableData';
import { s } from './SingleShoppingListScreen.styles';
import { colors } from '@app/styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ShoppingList'>;

export default function SingleShoppingListScreen() {
  const route = useRoute<Props['route']>();
  const { listId } = route.params;
  const insets = useSafeAreaInsets();

  const {
    getShoppingListItems,
    addShoppingItem,
    patchShoppingItem,
    deleteShoppingItem,
    clearShoppingList,
    removeRecipeFromList,
  } = useShoppingListApi();

  const {
    data: items,
    loading,
    refreshing,
    onRefresh,
    setData: setItems,
  } = useLoadableData<ShoppingItemOut[]>({
    fetchFn: () => getShoppingListItems(listId),
    deps: [listId],
    initialData: [],
  });

  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('');

  const [editVisible, setEditVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItemOut | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('1');
  const [editUnit, setEditUnit] = useState('');

  const addItem = async () => {
    const n = name.trim();
    if (!n) return;
    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) return;
    await addShoppingItem(listId, { name: n, quantity: q, unit: unit.trim() });
    setItems(await getShoppingListItems(listId));
    setName('');
    setQty('1');
    setUnit('');
  };

  const toggleChecked = async (id: string, checked: boolean) => {
    await patchShoppingItem(listId, id, { checked });
    setItems(await getShoppingListItems(listId));
  };

  const editItem = async (id: string, by: number, current: number) => {
    const next = Math.max(0, current + by);
    await patchShoppingItem(listId, id, { quantity: next });
    setItems(await getShoppingListItems(listId));
  };

  const removeItem = async (id: string) => {
    await deleteShoppingItem(listId, id);
    setItems(await getShoppingListItems(listId));
  };

  const clearAll = async () => {
    await clearShoppingList(listId, false);
    setItems([]);
  };

  const clearChecked = async () => {
    await clearShoppingList(listId, true);
    setItems(await getShoppingListItems(listId));
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

    if (!n) return;
    if (!Number.isFinite(q) || q <= 0) return;

    await patchShoppingItem(listId, editingItem.id, {
      name: n,
      quantity: q,
      unit: u,
    });

    setItems(await getShoppingListItems(listId));
    closeEditModal();
  };

  const confirmRemoveRecipe = () => {
    if (!editingItem?.recipe_id || !editingItem?.recipe_title) return;

    Alert.alert(
      'Remove recipe items?',
      `Remove all items from "${editingItem.recipe_title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeRecipeFromList(listId, editingItem.recipe_id!);
            setItems(await getShoppingListItems(listId));
            closeEditModal();
          },
        },
      ],
    );
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
        {item.recipe_title && (
          <Text style={[s.source, item.checked && s.strike]}>
            przepis: {item.recipe_title}
          </Text>
        )}
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
        <Text style={{ color: colors.white }}>Del</Text>
      </Pressable>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <View style={s.addRow}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Item"
          style={[s.input, { flex: 2 }]}
        />
        <TextInput
          value={qty}
          onChangeText={setQty}
          placeholder="Qty"
          keyboardType="numeric"
          style={[s.input, { width: 80 }]}
        />
        <UnitSelect
          value={unit}
          onChange={setUnit}
          containerStyle={{ flex: 1 }}
        />
        <Pressable onPress={addItem} style={s.addBtn}>
          <Text style={{ color: colors.white }}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => <Row item={item} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ padding: 12, color: colors.muted }}>
              Your list is empty.
            </Text>
          ) : null
        }
      />

      <View style={[s.footer, { marginBottom: Math.max(8, insets.bottom) }]}>
        <Pressable onPress={clearChecked} style={[s.footerBtn, s.ghost]}>
          <Text>Clear checked</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Alert.alert('Clear all?', 'This will remove all items.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearAll },
            ]);
          }}
          style={[s.footerBtn, s.danger]}
        >
          <Text style={{ color: colors.white }}>Clear all</Text>
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

            <UnitSelect
              value={editUnit}
              onChange={setEditUnit}
              containerStyle={{ marginTop: 4 }}
            />

            {editingItem?.recipe_title && (
              <Pressable onPress={confirmRemoveRecipe} style={s.removeRecipeBtn}>
                <Text style={s.removeRecipeBtnText}>
                  Remove all from "{editingItem.recipe_title}"
                </Text>
              </Pressable>
            )}

            <View style={s.modalActions}>
              <Pressable
                onPress={closeEditModal}
                style={[s.footerBtn, s.ghost]}
              >
                <Text>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveEdit}
                style={[s.footerBtn, s.addBtn]}
              >
                <Text style={{ color: colors.white }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

