import React from 'react';
import {
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';

import type { ShoppingListOut } from 'types/types';

export default function ShoppingListPickerModal({
  visible,
  loading,
  lists,
  title,
  onClose,
  onPick,
}: {
  visible: boolean;
  loading: boolean;
  lists: ShoppingListOut[];
  title: string;
  onClose: () => void;
  onPick: (listId: string) => void | Promise<void>;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} style={s.modalOverlay}>
        <Pressable onPress={() => {}} style={s.modalCard}>
          <Text style={s.modalTitle}>{title}</Text>

          {loading ? (
            <Text style={s.muted}>Loading…</Text>
          ) : lists.length === 0 ? (
            <Text style={s.muted}>You don’t have any shopping lists yet.</Text>
          ) : (
            <FlatList
              data={lists}
              keyExtractor={(l) => l.id}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => onPick(item.id)}
                  style={s.listRow}
                >
                  <Text style={s.listRowText}>{item.name}</Text>
                </Pressable>
              )}
            />
          )}

          <Pressable onPress={onClose} style={s.modalCancel}>
            <Text style={s.modalCancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}


const s = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 24,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  muted: { color: '#6b7280' },
  listRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    marginBottom: 8,
  },
  listRowText: { fontWeight: '600' },
  modalCancel: { paddingVertical: 10, alignItems: 'center' },
  modalCancelText: { color: '#111827', fontWeight: '600' },
});