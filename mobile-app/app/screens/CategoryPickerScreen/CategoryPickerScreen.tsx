import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  SectionList,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCategoriesApi } from 'api/categories';
import { useLoadableData } from 'hooks/useLoadableData';
import type { CategoryOut } from 'types/types';
import type { RootStackParamList } from 'App';
import { colors } from '@app/styles/colors';
import { s } from './CategoryPickerScreen.styles';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'CategoryPicker'>;
type RouteT = RouteProp<RootStackParamList, 'CategoryPicker'>;

type Section = { title: string; data: CategoryOut[] };

export default function CategoryPickerScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteT>();
  const { onSelect, selectedId } = route.params;

  const { listCategories, createCategory } = useCategoriesApi();

  const { data: categories, loading, reload } = useLoadableData<CategoryOut[]>({
    fetchFn: listCategories,
    initialData: [],
  });

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [saving, setSaving] = useState(false);

  const sections: Section[] = [
    {
      title: 'Systemowe',
      data: categories.filter((c) => c.is_system),
    },
    {
      title: 'Własne',
      data: categories.filter((c) => !c.is_system),
    },
  ].filter((s) => s.data.length > 0 || !s.title.includes('Systemowe'));

  const handleSelect = (category: CategoryOut) => {
    onSelect(category);
    navigation.goBack();
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      await createCategory({ name, icon: newIcon.trim() || null });
      setNewName('');
      setNewIcon('');
      setAddModalVisible(false);
      await reload();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not create category');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        renderSectionHeader={({ section }) => (
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderSectionFooter={({ section }) => {
          if (section.title !== 'Własne') return null;
          return (
            <Pressable style={s.addRow} onPress={() => setAddModalVisible(true)}>
              <Ionicons name="add-circle-outline" size={20} color={colors.link} />
              <Text style={s.addRowText}>Dodaj własną kategorię</Text>
            </Pressable>
          );
        }}
        ListFooterComponent={
          sections.every((s) => s.title !== 'Własne') ? (
            <View style={s.ownSection}>
              <Text style={s.sectionTitle}>Własne</Text>
              <Pressable style={s.addRow} onPress={() => setAddModalVisible(true)}>
                <Ionicons name="add-circle-outline" size={20} color={colors.link} />
                <Text style={s.addRowText}>Dodaj własną kategorię</Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const selected = item.id === selectedId;
          return (
            <Pressable
              style={[s.row, selected && s.rowSelected]}
              onPress={() => handleSelect(item)}
            >
              <Text style={s.icon}>{item.icon ?? '📦'}</Text>
              <Text style={[s.name, selected && s.nameSelected]}>{item.name}</Text>
              {selected && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </Pressable>
          );
        }}
      />

      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <Pressable style={s.overlay} onPress={() => setAddModalVisible(false)}>
          <Pressable style={s.card} onPress={() => {}}>
            <Text style={s.cardTitle}>Nowa kategoria</Text>

            <TextInput
              style={s.input}
              placeholder="Nazwa kategorii"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <TextInput
              style={s.input}
              placeholder="Ikona (emoji, np. 🥦)"
              value={newIcon}
              onChangeText={setNewIcon}
            />

            <View style={s.cardActions}>
              <Pressable
                style={s.cancelBtn}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={s.cancelText}>Anuluj</Text>
              </Pressable>
              <Pressable
                style={[s.saveBtn, (!newName.trim() || saving) && s.disabled]}
                onPress={handleAdd}
                disabled={!newName.trim() || saving}
              >
                <Text style={s.saveBtnText}>{saving ? 'Zapisuję…' : 'Dodaj'}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
