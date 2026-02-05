import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from 'App';
import type { ShoppingListOut } from 'types/types';
import { useShoppingListApi } from 'api/shopping_lists';
import { useLoadableData } from 'hooks/useLoadableData';
import { s } from './ShoppingListsScreen.styles';
import { colors } from '@app/styles/colors';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'ShoppingLists'>;

export default function ShoppingListsScreen() {
  const navigation = useNavigation<NavProp>();

  const {
    getShoppingLists,
    createShoppingList,
    deleteShoppingList,
    updateShoppingList,
    shareShoppingList,
    unshareShoppingList,
  } = useShoppingListApi();

  const {
    data: lists,
    loading,
    refreshing,
    onRefresh,
    reload,
    setData: setLists,
  } = useLoadableData<ShoppingListOut[]>({
    fetchFn: getShoppingLists,
    initialData: [],
  });

  const [newName, setNewName] = useState('');

  const [editVisible, setEditVisible] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingListOut | null>(null);
  const [editName, setEditName] = useState('');
  const [shareTarget, setShareTarget] = useState('');

  const addList = async () => {
    const name = newName.trim();
    if (!name) return;
    await createShoppingList({ name });
    setNewName('');
    reload();
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
            reload();
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
    reload();
  };

  const handleShare = async () => {
    if (!editingList) return;
    const email = shareTarget.trim();
    if (!email) return;

    await shareShoppingList(editingList.id, email);
    setShareTarget('');
    const refreshedLists = await getShoppingLists();
    setLists(refreshedLists);
    const updatedList = refreshedLists.find((l) => l.id === editingList.id);
    if (updatedList) {
      setEditingList(updatedList);
    }
  };

  const handleUnshare = async (userId: string) => {
    if (!editingList) return;
    await unshareShoppingList(editingList.id, userId);
    const refreshedLists = await getShoppingLists();
    setLists(refreshedLists);
    const updatedList = refreshedLists.find((l) => l.id === editingList.id);
    if (updatedList) {
      setEditingList(updatedList);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <View style={s.addRow}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="New list name"
          style={[s.input, { flex: 1 }]}
        />
        <Pressable onPress={addList} style={s.addBtn}>
          <Text style={{ color: colors.white }}>Add</Text>
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
            style={s.card}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{item.name}</Text>
              <Text style={s.counter}>
                {item.total_items >0 ? `${item.checked_items}/${item.total_items}` : '0/0'}
              </Text>
            </View>
            <Pressable
              onPress={() => confirmDelete(item.id)}
              style={s.deleteBtn}
            >
              <Text style={{ color: colors.white }}>Del</Text>
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={{ padding: 12, color: colors.muted }}>
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
        <Pressable style={s.modalOverlay} onPress={closeEditModal}>
          <Pressable style={s.modalCard} onPress={() => {}}>
            <Text style={s.modalTitle}>Rename list</Text>

            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="List name"
              style={s.input}
            />

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
            <View style={{ marginTop: 12}}>
              <Text style={s.sectionLabel}>Share</Text>
              <TextInput
                value={shareTarget}
                onChangeText={setShareTarget}
                placeholder="Email"
                style={s.input}
              />
              <Pressable
                onPress={handleShare}
                style={s.shareBtn}
              >
                <Text style={{ color: colors.white, fontWeight: '600' }}>Share List</Text>
              </Pressable>
              {editingList?.shared_with_users && editingList.shared_with_users.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={s.sectionLabel}>Shared with:</Text>
                  {editingList.shared_with_users.map((user) => (
                    <View
                      key={user.id}
                      style={s.sharedRow}>
                        <Text style={s.sharedText}>
                          {user.email}
                        </Text>
                        <Pressable
                          onPress={() => handleUnshare(user.id)}
                          style={s.unshareBtn}
                        >
                          <Text style={{ color: colors.dangerDark }}>Unshare</Text>
                        </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
