import React from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { View, Text, Pressable, Alert } from 'react-native';
import RecipeForm from '@app/components/RecipeForm';
import { updateRecipe } from 'api/recipes';
import type { RecipeOut, RecipeIn } from 'types/types';
import type { RootStackParamList } from 'App';
import { addFromRecipe } from 'api/shopping_lists';

type EditRoute = RouteProp<RootStackParamList, 'EditRecipe'>;

export default function EditRecipeScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditRoute>();
  const recipe = route.params.recipe as RecipeOut;

  async function handleUpdateRecipe(payload: RecipeIn) {
    await updateRecipe(recipe.id, payload);
    navigation.goBack();
  }

  async function handleAddIngredients() {
    try {
      await addFromRecipe(recipe.id);
      Alert.alert("Added", "Ingredients added to your shopping list.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not add ingredients.");
    }
  }

  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 12 }}>
      <RecipeForm
        initial={recipe}
        submitLabel="Update Recipe"
        onSubmit={handleUpdateRecipe}
      />

      <Pressable
        onPress={handleAddIngredients}
        style={{
          marginTop: 20,
          backgroundColor: "#111827",
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          Add ingredients to shopping list
        </Text>
      </Pressable>
    </View>
  );
}