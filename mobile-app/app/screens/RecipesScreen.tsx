import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { fetchRecipes } from '../../api/recipes';

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    fetchRecipes().then(setRecipes);
  }, []);

  return (
    <View>
      <Text>🍳 Recipes</Text>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
            <Text>{item.description}</Text>
          </View>
        )}
      />
    </View>
  );
}