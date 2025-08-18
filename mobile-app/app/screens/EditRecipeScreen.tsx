import React from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import RecipeForm from '@app/components/RecipeForm';
import { updateRecipe } from 'api/recipes';
import type { RecipeOut } from 'api/types';
import type { RootStackParamList } from 'App';

type EditRoute = RouteProp<RootStackParamList, 'EditRecipe'>;

export default function EditRecipeScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditRoute>();
  const recipe = route.params.recipe as RecipeOut;

  return (
    <RecipeForm
      initial={recipe}
      submitLabel="Update Recipe"
      onSubmit={async (payload) => {
        await updateRecipe(recipe.id, payload);
        navigation.goBack();
      }}
    />
  );
}