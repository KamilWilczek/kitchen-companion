import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from 'App';
import type { ShoppingListOut } from 'types/types';
import { useShoppingListApi } from 'api/shopping_lists';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'ShoppingLists'>;

export default function ShoppingListsScreen() {
  const navigation = useNavigation<NavProp>();
  const [lists, setLists] = useState<ShoppingListOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const {
    getShoppingLists,
    createShoppingList,
    deleteShoppingList,
    updateShoppingList,
    shareShoppingList,
    unshareShoppingList,
  } = useShoppingListApi();

  const [newName, setNewName] = useState('');

  const [editVisible, setEditVisible] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingListOut | null>(null);
  const [editName, setEditName] = useState('');
  const [shareTarget, setShareTarget] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setLists(await getShoppingLists());
    } catch (e: any) {
      console.log('Fetch shopping lists error:', e?.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setLists(await getShoppingLists());
    } finally {
      setRefreshing(false);
    }
  }, []);

  const addList = async () => {
    const name = newName.trim();
    if (!name) return;
    await createShoppingList({ name });
    setNewName('');
    load();
  };

  const confirmDelete = (id: string) => {
    const list = lists.find((l) => l.id === id);
    Alert.alert(
      'Delete list?',
      `This will delete "${list?.name ?? 'this list'}" and all its items.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteShoppingList(id);
            load();
          },
        },
      ],
    );
  };

  const openEditModal = (list: ShoppingListOut) => {
    setEditingList(list);
    setEditName(list.name);
    setEditVisible(true);
  };

  const closeEditModal = () => {
    setEditVisible(false);
    setEditingList(null);
  };

  const saveEdit = async () => {
    if (!editingList) return;
    const name = editName.trim();
    if (!name) return;
    await updateShoppingList(editingList.id, { name });
    closeEditModal();
    load();
  };

  const handleShare = async () => {
    if (!editingList) return;
    const email = shareTarget.trim();
    if (!email) return;

    await shareShoppingList(editingList.id, email);
    setShareTarget('');
    closeEditModal();
    load();
  };

  const handleUnshare = async (userId: string) => {
    if (!editingList) return;
    await unshareShoppingList(editingList.id, userId);
    load();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <View style={styles.addRow}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="New list name"
          style={[styles.input, { flex: 1 }]}
        />
        <Pressable onPress={addList} style={styles.addBtn}>
          <Text style={{ color: '#fff' }}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('ShoppingList', {
                listId: item.id,
                listName: item.name,
              })
            }
            onLongPress={() => openEditModal(item)}
            style={styles.card}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.counter}>
                {item.total_items >0 ? `${item.checked_items}/${item.total_items}` : '0/0'}
              </Text>
            </View>
            <Pressable
              onPress={() => confirmDelete(item.id)}
              style={styles.deleteBtn}
            >
              <Text style={{ color: '#fff' }}>Del</Text>
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={{ padding: 12, color: '#6b7280' }}>
            No shopping lists yet. Add one above.
          </Text>
        }
      />

      <Modal
        visible={editVisible}
        animationType="slide"
        transparent
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename list</Text>

            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="List name"
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={closeEditModal}
                style={[styles.footerBtn, styles.ghost]}
              >
                <Text>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveEdit}
                style={[styles.footerBtn, styles.addBtn]}
              >
                <Text style={{ color: '#fff' }}>Save</Text>
              </Pressable>
            </View>
            <View style={{ marginTop: 12}}>
              <Text style={styles.sectionLabel}>Share</Text>
              <TextInput
                value={shareTarget}
                onChangeText={setShareTarget}
                placeholder="Email"
                style={styles.input}
              />
              <Pressable
                onPress={handleShare}
                style={styles.shareBtn}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Share List</Text>
              </Pressable>
              {editingList?.shared_with_users && editingList.shared_with_users.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.sectionLabel}>Shared with:</Text>
                  {editingList.shared_with_users.map((user) => (
                    <View
                      key={user.id}
                      style={styles.sharedRow}>
                        <Text style={styles.sharedText}>
                          {user.email}
                        </Text>
                        <Pressable
                          onPress={() => handleUnshare(user.id)}
                          style={styles.unshareBtn}
                        >
                          <Text style={{ color: '#b91c1c' }}>Unshare</Text>
                        </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  addBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    gap: 8,
  },
  title: { fontWeight: '700', fontSize: 16 },
  counter: {
    marginTop: 2,
    fontSize: 13,
    color: '#6b7280',
  },
  deleteBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  footerBtn: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 10 },
  ghost: { backgroundColor: '#f3f4f6' },
    sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
    marginTop: 4,
  },
  shareBtn: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  sharedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  sharedText: {
    fontSize: 14,
    color: '#111827',
  },
  unshareBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
});