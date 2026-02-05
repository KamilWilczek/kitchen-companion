import React from 'react';
import {
  Text,
  Pressable,
  Modal,
  FlatList,
} from 'react-native';

import type { ShoppingListOut } from 'types/types';
import { s } from './ShoppingListPickerModal.styles';

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