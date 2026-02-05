import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, Pressable, Linking, TextInput, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from 'App';

import type { RecipeOut } from 'types/types';
import { useRecipesApi } from 'api/recipes';
import RecipeActionsModal from '@app/components/RecipeActionsModal/RecipeActionsModal';
import { useLoadableData } from 'hooks/useLoadableData';
import { s } from './RecipesScreen.styles';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Recipes'>;

export default function RecipesScreen() {
  const navigation = useNavigation<NavProp>();
  const { fetchRecipes } = useRecipesApi();

  const {
    data: recipes,
    loading,
    refreshing,
    onRefresh,
    setData: setRecipes,
  } = useLoadableData<RecipeOut[]>({
    fetchFn: fetchRecipes,
    initialData: [],
  });

  const [actionsVisible, setActionsVisible] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState<RecipeOut | null>(null);
  const [search, setSearch] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Extract unique tags from all recipes
  const allTags = useMemo(() => {
    const tagMap = new Map<string, { id: string; name: string }>();
    recipes.forEach((r) => {
      r.tags?.forEach((t) => tagMap.set(t.id, t));
    });
    return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    let result = recipes;
    if (search.trim()) {
      result = result.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (selectedTagId) {
      result = result.filter((r) =>
        r.tags?.some((t) => t.id === selectedTagId)
      );
    }
    return result;
  }, [recipes, search, selectedTagId]);

const openActions = (recipe: RecipeOut) => {
    setActiveRecipe(recipe);
    setActionsVisible(true);
  };

  const closeActions = () => {
    setActionsVisible(false);
    setActiveRecipe(null);
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
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search recipes..."
        style={s.searchInput}
      />
      {allTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.tagsRow}
          contentContainerStyle={s.tagsRowContent}
        >
          {allTags.map((tag) => {
            const isSelected = selectedTagId === tag.id;
            return (
              <Pressable
                key={tag.id}
                onPress={() => setSelectedTagId(isSelected ? null : tag.id)}
                style={[s.tag, isSelected && s.tagSelected]}
              >
                <Text style={[s.tagText, isSelected && s.tagTextSelected]}>
                  {tag.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          const isUrl = item.source?.match(/^https?:\/\//i);
          return (
            <Pressable
              onPress={() => navigation.navigate('EditRecipe', { recipe: item })}
              onLongPress={() => openActions(item)}
              style={s.card}
            >
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.ingredientCount}>
                {item.ingredients.length} {item.ingredients.length === 1 ? 'ingredient' : 'ingredients'}
              </Text>
              {!!item.source && (
                isUrl ? (
                  <Text
                    style={s.link}
                    onPress={() => Linking.openURL(item.source!)}
                  >
                    {item.source}
                  </Text>
                ) : (
                  <Text style={s.source}>{item.source}</Text>
                )
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={s.emptyText}>
            {search.trim() || selectedTagId ? 'No recipes found.' : 'No recipes yet. Tap "＋" to add one.'}
          </Text>
        }
      />

      {activeRecipe && (
        <RecipeActionsModal
          visible={actionsVisible}
          recipe={activeRecipe}
          onClose={closeActions}
          onPatched={(updated) => {
            setRecipes((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r)),
            );
            closeActions();
          }}
          onDeleted={() => {
            setRecipes((prev) => prev.filter((r) => r.id !== activeRecipe.id));
            closeActions();
          }}
          onShared={async () => {
            // Refresh recipes to get updated shared_with_users with proper IDs
            try {
              const refreshed = await fetchRecipes();
              setRecipes(refreshed);
              const updatedRecipe = refreshed.find((r) => r.id === activeRecipe.id);
              if (updatedRecipe) {
                setActiveRecipe(updatedRecipe);
              }
            } catch (e) {
              console.log('Refresh recipes error:', e);
            }
          }}
        />
      )}
    </View>
  );
}

