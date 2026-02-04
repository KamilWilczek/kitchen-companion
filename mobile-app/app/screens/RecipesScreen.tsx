import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, StyleSheet, Pressable, Linking, TextInput, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from 'App';

import type { RecipeOut } from 'types/types';
import { useRecipesApi } from 'api/recipes';
import RecipeActionsModal from '@app/components/RecipeActionsModal';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Recipes'>;

export default function RecipesScreen() {
  const navigation = useNavigation<NavProp>();
  const [recipes, setRecipes] = useState<RecipeOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { fetchRecipes } = useRecipesApi();

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

const load = async () => {
  setLoading(true);
  try {
    setRecipes(await fetchRecipes());
  } catch (e: any) {
    console.log('Fetch recipes error:', e?.message);
  } finally {
    setLoading(false);
  }
};

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setRecipes(await fetchRecipes());
    } finally {
      setRefreshing(false);
    }
  }, []);

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
      <View style={styles.center}>
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
        style={styles.searchInput}
      />
      {allTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsRow}
          contentContainerStyle={styles.tagsRowContent}
        >
          {allTags.map((tag) => {
            const isSelected = selectedTagId === tag.id;
            return (
              <Pressable
                key={tag.id}
                onPress={() => setSelectedTagId(isSelected ? null : tag.id)}
                style={[styles.tag, isSelected && styles.tagSelected]}
              >
                <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
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
              style={styles.card}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.ingredientCount}>
                {item.ingredients.length} {item.ingredients.length === 1 ? 'ingredient' : 'ingredients'}
              </Text>
              {!!item.source && (
                isUrl ? (
                  <Text
                    style={styles.link}
                    onPress={() => Linking.openURL(item.source!)}
                  >
                    {item.source}
                  </Text>
                ) : (
                  <Text style={styles.source}>{item.source}</Text>
                )
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
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

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  tagsRow: { marginBottom: 12, flexGrow: 0 },
  tagsRowContent: { gap: 8, alignItems: 'center' },
  tag: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  tagSelected: { backgroundColor: '#111827', borderColor: '#111827' },
  tagText: { color: '#111827', fontSize: 12 },
  tagTextSelected: { color: '#fff' },
  card: { padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, marginBottom: 10, backgroundColor: '#fff' },
  title: { fontWeight: '700', fontSize: 16, marginBottom: 2 },
  ingredientCount: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  source: { color: '#374151' },
  link: { color: '#2563eb', textDecorationLine: 'underline' },
  emptyText: { padding: 12, color: '#6b7280' },
});
