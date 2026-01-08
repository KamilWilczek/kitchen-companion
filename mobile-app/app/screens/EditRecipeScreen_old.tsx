import React, { useCallback, useMemo, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
  ScrollView
} from 'react-native';

import RecipeForm from '@app/components/RecipeForm';
import ShoppingListPickerModal from '@app/components/ShoppingListPickerModal';
import type { RecipeOut, RecipeIn, ShoppingListOut } from 'types/types';
import type { RootStackParamList } from 'App';
import { useRecipesApi } from 'api/recipes';
import { useShoppingListApi } from 'api/shopping_lists';

type EditRoute = RouteProp<RootStackParamList, 'EditRecipe'>;
type AddMode = 'all' | 'selected';

export default function EditRecipeScreen() {
  const { updateRecipe, addFromRecipe, addSelectedIngredientsToList } = useRecipesApi();
  const { getShoppingLists } = useShoppingListApi();

  const navigation = useNavigation();
  const route = useRoute<EditRoute>();
  const recipe = route.params.recipe as RecipeOut;

  const [pickVisible, setPickVisible] = useState(false);
  const [lists, setLists] = useState<ShoppingListOut[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const [selectedIngIds, setSelectedIngIds] = useState<Set<string>>(new Set());
  const [addMode, setAddMode] = useState<AddMode | null>(null);

  const selectedCount = selectedIngIds.size;

  const toggleIng = useCallback((id: string) => {
    setSelectedIngIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleUpdateRecipe = useCallback(
    async (payload: RecipeIn) => {
      await updateRecipe(recipe.id, payload);
      navigation.goBack();
    },
    [navigation, recipe.id, updateRecipe],
  );

  const ensureListsLoaded = useCallback(async () => {
    if (lists.length > 0 || loadingLists) return;
    setLoadingLists(true);
    try {
      const data = await getShoppingLists();
      setLists(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not load shopping lists.');
      setPickVisible(false);
    } finally {
      setLoadingLists(false);
    }
  }, [getShoppingLists, lists.length, loadingLists]);

  const openPickerFor = useCallback(
    async (mode: AddMode) => {
      if (mode === 'selected' && selectedIngIds.size === 0) {
        Alert.alert('Nothing selected', 'Select ingredients first.');
        return;
      }
      setAddMode(mode);
      setPickVisible(true);
      await ensureListsLoaded();
    },
    [ensureListsLoaded, selectedIngIds],
  );

  const pickerTitle = useMemo(() => {
    if (addMode === 'selected') return `Add selected (${selectedCount}) to…`;
    if (addMode === 'all') return 'Add ALL ingredients to…';
    return 'Choose a list';
  }, [addMode, selectedCount]);

  const closePicker = useCallback(() => {
    setPickVisible(false);
    setAddMode(null);
  }, []);

  const onPickList = useCallback(
    async (listId: string) => {
      if (!addMode) return;

      try {
        setPickVisible(false);

        if (addMode === 'all') {
          const added = await addFromRecipe(listId, recipe.id);
          Alert.alert('Added', `Added ${added.length} item(s).`);
          return;
        }

        const ids = Array.from(selectedIngIds);
        const added = await addSelectedIngredientsToList(recipe.id, listId, ids);
        Alert.alert('Added', `Added ${added.length} item(s).`);
        setSelectedIngIds(new Set());
      } catch (e: any) {
        Alert.alert('Error', e?.message ?? 'Could not add ingredients.');
      } finally {
        setAddMode(null);
      }
    },
    [
      addFromRecipe,
      addMode,
      addSelectedIngredientsToList,
      recipe.id,
      selectedIngIds,
    ],
  );

  return (
    <View style={s.screen}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <RecipeForm
          initial={recipe}
          submitLabel="Update Recipe"
          onSubmit={handleUpdateRecipe}
          selectIngredients={{
            selectedIds: selectedIngIds,
            onToggle: toggleIng,
          }}
        />
        <View style={{ height: 120 }}/>
      </ScrollView>

      <View
        style={s.footer}
      >
        <Pressable onPress={() => openPickerFor('all')} style={s.primaryBtn}>
          <Text style={s.primaryBtnText}>Add ALL ingredients</Text>
        </Pressable>

        <Pressable
          onPress={() => openPickerFor('selected')}
          style={[s.secondaryBtn, selectedCount === 0 && s.disabled]}
        >
          <Text style={s.secondaryBtnText}>
            Add selected ({selectedCount})
          </Text>
        </Pressable>

        <Pressable style={s.primaryBtn}>
          <Text style={s.primaryBtnText}>Share recipe</Text>
        </Pressable>
      </View>

      <ShoppingListPickerModal
        visible={pickVisible}
        loading={loadingLists}
        lists={lists}
        title={pickerTitle}
        onClose={closePicker}
        onPick={onPickList}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 12 },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
    gap: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  secondaryBtn: {
    marginTop: 10,
    backgroundColor: '#374151',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
