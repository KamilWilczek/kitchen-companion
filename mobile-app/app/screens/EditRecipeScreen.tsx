import React, { useCallback, useState } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from 'App';
import type { RecipeOut, ShoppingListOut } from 'types/types';
import { useRecipesApi } from 'api/recipes';
import { useShoppingListApi } from 'api/shopping_lists';

import RecipeForm from '@app/components/RecipeForm';
import ShoppingListPickerModal from '@app/components/ShoppingListPickerModal';

type RouteT = RouteProp<RootStackParamList, 'EditRecipe'>;


export default function EditRecipeScreen() {
  const route = useRoute<RouteT>();
  const initialRecipe = route.params.recipe as RecipeOut;
  const insets = useSafeAreaInsets();

  const { patchRecipe, addFromRecipe, addSelectedIngredientsToList } =
    useRecipesApi();
  const { getShoppingLists } = useShoppingListApi();

  const [recipe, setRecipe] = useState(initialRecipe);
  const [ingredientsDraft, setIngredientsDraft] = useState(
    recipe.ingredients ?? []
  );

  const [selectedIngIds, setSelectedIngIds] = useState<Set<string>>(new Set());
  const selectedCount = selectedIngIds.size;

  const toggleIng = useCallback((id: string) => {
    setSelectedIngIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const [saving, setSaving] = useState(false);
  const saveIngredients = async () => {
    try {
      setSaving(true);
      const updated = await patchRecipe(recipe.id, {
        ingredients: ingredientsDraft,
      });
      setRecipe(updated);
      setIngredientsDraft(updated.ingredients ?? []);
      Alert.alert('Saved', 'Ingredients updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save ingredients.');
    } finally {
      setSaving(false);
    }
  };

  const [pickVisible, setPickVisible] = useState(false);
  const [lists, setLists] = useState<ShoppingListOut[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [addMode, setAddMode] = useState<'all' | 'selected' | null>(null);

  const ensureListsLoaded = async () => {
    if (lists.length || loadingLists) return;
    setLoadingLists(true);
    try {
      setLists(await getShoppingLists());
    } finally {
      setLoadingLists(false);
    }
  };

  const openPickerFor = async (mode: 'all' | 'selected') => {
    if (mode === 'selected' && selectedCount === 0) {
      Alert.alert('Nothing selected');
      return;
    }
    setAddMode(mode);
    setPickVisible(true);
    await ensureListsLoaded();
  };

  const onPickList = async (listId: string) => {
    try {
      setPickVisible(false);
      if (addMode === 'all') {
        await addFromRecipe(listId, recipe.id);
      } else if (addMode === 'selected') {
        await addSelectedIngredientsToList(
          recipe.id,
          listId,
          Array.from(selectedIngIds),
        );
        setSelectedIngIds(new Set());
      }
      Alert.alert('Added');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not add ingredients.');
    } finally {
      setAddMode(null);
    }
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior="padding">
      <ScrollView contentContainerStyle={s.scrollContent}>
        <View style={s.headerCard}>
          <Text style={s.headerTitle}>{recipe.title}</Text>
          {!!recipe.source && <Text style={s.headerSub}>{recipe.source}</Text>}
          {!!recipe.description && (
            <Text style={s.headerHint}>{recipe.description}</Text>
          )}
          {!!recipe.tags && recipe.tags.length > 0 && (
            <Text style={s.headerHint}>
              Tags: {recipe.tags.map((t) => t.name).join(', ')}
            </Text>
          )}
        </View>

        <RecipeForm
          mode="ingredients-only"
          initial={recipe}
          onIngredientsChange={setIngredientsDraft}
          selectIngredients={{
            selectedIds: selectedIngIds,
            onToggle: toggleIng,
          }}
        />

        <Pressable
          onPress={saveIngredients}
          disabled={saving}
          style={[s.primaryBtn, saving && s.disabled]}
        >
          <Text style={s.primaryBtnText}>
            {saving ? 'Saving…' : 'Save ingredients'}
          </Text>
        </Pressable>

        <View style={{ height: 220 }} />
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(12, insets.bottom) }]}>
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
      </View>

      <ShoppingListPickerModal
        visible={pickVisible}
        loading={loadingLists}
        lists={lists}
        title="Add to shopping list"
        onClose={() => setPickVisible(false)}
        onPick={onPickList}
      />
    </KeyboardAvoidingView>
  );
}


const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },

  headerCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { marginTop: 4, color: '#374151' },
  headerHint: { marginTop: 8, fontSize: 12, color: '#6b7280' },

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
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },

  secondaryBtn: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#fff', fontWeight: '600' },

  ghostBtn: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  ghostBtnText: { color: '#111827', fontWeight: '600' },

  disabled: { opacity: 0.5 },
});
