import {
  View,
  Text,
  SectionList,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ShoppingItemOut, CategoryOut } from 'types/types';
import type { RootStackParamList } from 'App';
import { useShoppingListApi } from 'api/shopping_lists';
import UnitSelect from '@app/components/UnitSelect/UnitSelect';
import { useLoadableData } from 'hooks/useLoadableData';
import { s } from './SingleShoppingListScreen.styles';
import { colors } from '@app/styles/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ShoppingList'>;
type SortMode = 'alpha' | 'category';
type Section = { title: string; icon: string | null; data: ShoppingItemOut[] };

export default function SingleShoppingListScreen() {
  const route = useRoute<Props['route']>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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

  const [sortMode, setSortMode] = useState<SortMode>('category');

  const sections = useMemo<Section[]>(() => {
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, 'pl'));

    if (sortMode === 'alpha') {
      return [{ title: '', icon: null, data: sorted }];
    }

    // Group by category
    const map = new Map<string, { title: string; icon: string | null; data: ShoppingItemOut[] }>();
    const uncategorized: ShoppingItemOut[] = [];

    for (const item of sorted) {
      if (!item.category) {
        uncategorized.push(item);
      } else {
        const key = item.category.id;
        if (!map.has(key)) {
          map.set(key, { title: item.category.name, icon: item.category.icon, data: [] });
        }
        map.get(key)!.data.push(item);
      }
    }

    const result: Section[] = [...map.values()].sort((a, b) =>
      a.title.localeCompare(b.title, 'pl'),
    );

    if (uncategorized.length > 0) {
      result.push({ title: 'Bez kategorii', icon: null, data: uncategorized });
    }

    return result;
  }, [items, sortMode]);

  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('');

  const [editVisible, setEditVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItemOut | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('1');
  const [editUnit, setEditUnit] = useState('');
  const [editCategory, setEditCategory] = useState<CategoryOut | null>(null);

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

  const nudgeQty = async (id: string, by: number, current: number) => {
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
    setEditCategory(item.category ?? null);
    setEditVisible(true);
  };

  const closeEditModal = () => {
    setEditVisible(false);
    setEditingItem(null);
    setEditCategory(null);
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    const n = editName.trim();
    const q = Number(editQty);
    const u = editUnit.trim();
    if (!n || !Number.isFinite(q) || q <= 0) return;

    await patchShoppingItem(listId, editingItem.id, {
      name: n,
      quantity: q,
      unit: u,
      category_id: editCategory?.id ?? null,
    });

    setItems(await getShoppingListItems(listId));
    closeEditModal();
  };

  const openCategoryPicker = (item: ShoppingItemOut) => {
    navigation.navigate('CategoryPicker', {
      selectedId: item.category_id ?? undefined,
      onSelect: async (cat: CategoryOut) => {
        await patchShoppingItem(listId, item.id, { category_id: cat.id });
        setItems(await getShoppingListItems(listId));
      },
    });
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
        <Pressable style={s.categoryChip} onPress={() => openCategoryPicker(item)}>
          <Text style={[s.categoryChipText, !item.category_id && s.categoryChipPlaceholder]}>
            {item.category
              ? `${item.category.icon ?? '📦'} ${item.category.name}`
              : '+ kategoria'}
          </Text>
        </Pressable>
      </View>

      <View style={s.qBtns}>
        <Pressable onPress={() => nudgeQty(item.id, -1, item.quantity)} style={s.smallBtn}>
          <Text>-</Text>
        </Pressable>
        <Pressable onPress={() => nudgeQty(item.id, +1, item.quantity)} style={s.smallBtn}>
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
        <UnitSelect value={unit} onChange={setUnit} containerStyle={{ flex: 1 }} />
        <Pressable onPress={addItem} style={s.addBtn}>
          <Text style={{ color: colors.white }}>Add</Text>
        </Pressable>
      </View>

      <View style={s.sortToggle}>
        <Pressable
          style={[s.sortBtn, sortMode === 'category' && s.sortBtnActive]}
          onPress={() => setSortMode('category')}
        >
          <Text style={[s.sortBtnText, sortMode === 'category' && s.sortBtnTextActive]}>
            Kategoria
          </Text>
        </Pressable>
        <Pressable
          style={[s.sortBtn, sortMode === 'alpha' && s.sortBtnActive]}
          onPress={() => setSortMode('alpha')}
        >
          <Text style={[s.sortBtnText, sortMode === 'alpha' && s.sortBtnTextActive]}>A–Z</Text>
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <View style={s.sectionHeader}>
              <Text style={s.sectionHeaderText}>
                {section.icon ? `${section.icon}  ${section.title}` : section.title}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <Row item={item} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ padding: 12, color: colors.muted }}>Your list is empty.</Text>
          ) : null
        }
        stickySectionHeadersEnabled={false}
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

            <Pressable
              style={s.categoryChip}
              onPress={() => {
                closeEditModal();
                if (editingItem) {
                  navigation.navigate('CategoryPicker', {
                    selectedId: editCategory?.id ?? undefined,
                    onSelect: async (cat: CategoryOut) => {
                      setEditCategory(cat);
                      await patchShoppingItem(listId, editingItem.id, { category_id: cat.id });
                      setItems(await getShoppingListItems(listId));
                    },
                  });
                }
              }}
            >
              <Text style={[s.categoryChipText, !editCategory && s.categoryChipPlaceholder]}>
                {editCategory
                  ? `${editCategory.icon ?? '📦'} ${editCategory.name}`
                  : '+ kategoria'}
              </Text>
            </Pressable>

            {editingItem?.recipe_title && (
              <Pressable onPress={confirmRemoveRecipe} style={s.removeRecipeBtn}>
                <Text style={s.removeRecipeBtnText}>
                  Remove all from "{editingItem.recipe_title}"
                </Text>
              </Pressable>
            )}

            <View style={s.modalActions}>
              <Pressable onPress={closeEditModal} style={[s.footerBtn, s.ghost]}>
                <Text>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveEdit} style={[s.footerBtn, s.addBtn]}>
                <Text style={{ color: colors.white }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
