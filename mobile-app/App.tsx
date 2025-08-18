import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import RecipesScreen from '@app/screens/RecipesScreen';
import NewRecipeScreen from '@app/screens/NewRecipeScreen'
import EditRecipeScreen from '@app/screens/EditRecipeScreen'

export type RootStackParamList = {
  Recipes: undefined;
  NewRecipe: undefined;
  EditRecipe: { recipe: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Recipes">
        <Stack.Screen
          name="Recipes"
          component={RecipesScreen}
          options={({ navigation }) => ({
            title: 'Recipes',
            headerRight: ({ tintColor }) => (
              <Pressable
                onPress={() => navigation.navigate('NewRecipe')}
                hitSlop={12}
                style={{ paddingHorizontal: 8, paddingVertical: 4 }}
              >
                <Ionicons name="add" size={24} color={tintColor ?? '#111827'} />
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="NewRecipe"
          component={NewRecipeScreen}
          options={{ title: 'New Recipe'}}
        />
        <Stack.Screen name="EditRecipe" component={EditRecipeScreen} options={{ title: 'Edit Recipe' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}