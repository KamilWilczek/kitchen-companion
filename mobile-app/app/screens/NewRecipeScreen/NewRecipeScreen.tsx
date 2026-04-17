import React, { useRef, useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RecipeForm, { type RecipeFormHandle } from '@app/components/RecipeForm/RecipeForm';
import { useRecipesApi } from 'api/recipes';
import { s } from './NewRecipeScreen.styles';

export default function NewRecipeScreen() {
  const { createRecipe } = useRecipesApi();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const formRef = useRef<RecipeFormHandle>(null);
  const [canSave, setCanSave] = useState(false);

  return (
    <View style={s.screen}>
      <KeyboardAwareScrollView
        contentContainerStyle={s.content}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
      >
        <RecipeForm
          ref={formRef}
          mode="full"
          hideSubmitButton
          onCanSaveChange={setCanSave}
          onSubmit={async (payload) => {
            await createRecipe(payload);
            navigation.goBack();
          }}
        />
      </KeyboardAwareScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(12, insets.bottom) }]}>
        <Pressable
          onPress={() => formRef.current?.submit()}
          disabled={!canSave}
          style={[s.saveBtn, !canSave && s.disabled]}
        >
          <Text style={s.saveBtnText}>Save Recipe</Text>
        </Pressable>
      </View>
    </View>
  );
}