import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import RecipeForm from '@app/components/RecipeForm/RecipeForm';
import { useRecipesApi } from 'api/recipes';
import { s } from './NewRecipeScreen.styles';

export default function NewRecipeScreen() {
  const { createRecipe } = useRecipesApi();
  const navigation = useNavigation();

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <RecipeForm
          mode="full"
          submitLabel="Save Recipe"
          onSubmit={async (payload) => {
            await createRecipe(payload);
            navigation.goBack();
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}