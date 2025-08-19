import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, StyleSheet, Alert, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from 'App';

import { fetchRecipes, deleteRecipe } from 'api/recipes';
import type { RecipeOut } from 'types/types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Recipes'>;

export default function RecipesScreen() {
  const navigation = useNavigation<NavProp>();
  const [recipes, setRecipes] = useState<RecipeOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const confirmDelete = (id: string) => {
    Alert.alert('Delete recipe?', 'This cannot be undone.', [
    	{ text: 'Cancel', style: 'cancel' },
    	{ text: 'Delete', style: 'destructive', onPress: async () => {
        	await deleteRecipe(id);
        	load();
        } 
      },
    ]);
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
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('EditRecipe', { recipe: item })}
            onLongPress={() => confirmDelete(item.id)}
            style={styles.card}
          >
            <Text style={styles.title}>{item.title}</Text>
            {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
          </Pressable>
        )}
        ListEmptyComponent={<Text>No recipes yet. Tap “＋” to add one.</Text>}

      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, marginBottom: 10, backgroundColor: '#fff' },
  title: { fontWeight: '700', fontSize: 16, marginBottom: 4 },
  desc: { color: '#374151' },
});
