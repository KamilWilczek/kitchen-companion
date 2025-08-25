import React from 'react';
import { useNavigation } from '@react-navigation/native';
import RecipeForm from '@app/components/RecipeForm';
import { useRecipesApi } from 'api/recipes';

export default function NewRecipeScreen() {
  const { createRecipe } = useRecipesApi();
  const navigation = useNavigation();
  return (
    <RecipeForm
      submitLabel="Save Recipe"
      onSubmit={async (payload) => {
        await createRecipe(payload);
        navigation.goBack();
      }}
    />
  );
}