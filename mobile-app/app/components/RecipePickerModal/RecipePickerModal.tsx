import React, { useState, useMemo } from 'react';
import { Modal, View, Text, TextInput, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RecipeOut } from 'types/types';
import { colors } from '@app/styles/colors';
import { s } from './RecipePickerModal.styles';

type Props = {
  visible: boolean;
  recipes: RecipeOut[];
  onSelect: (recipe: RecipeOut) => void;
  onClose: () => void;
};

export default function RecipePickerModal({ visible, recipes, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? recipes.filter(r => r.title.toLowerCase().includes(q)) : recipes;
  }, [recipes, search]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Pick a recipe</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.secondary} />
          </Pressable>
        </View>

        <TextInput
          style={s.search}
          placeholder="Search..."
          value={search}
          onChangeText={setSearch}
          autoFocus
          clearButtonMode="while-editing"
        />

        <FlatList
          data={filtered}
          keyExtractor={r => r.id}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable style={s.item} onPress={() => { onSelect(item); onClose(); }}>
              <Text style={s.itemTitle}>{item.title}</Text>
              {item.ingredients.length > 0 && (
                <Text style={s.itemMeta}>
                  {item.ingredients.length} ingredient{item.ingredients.length !== 1 ? 's' : ''}
                </Text>
              )}
            </Pressable>
          )}
          ListEmptyComponent={<Text style={s.empty}>No recipes found.</Text>}
        />
      </View>
    </Modal>
  );
}
