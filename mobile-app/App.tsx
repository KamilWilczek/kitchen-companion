import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import RecipesScreen from '@app/screens/RecipesScreen';
import NewRecipeScreen from '@app/screens/NewRecipeScreen';
import EditRecipeScreen from '@app/screens/EditRecipeScreen';
import TagsScreen from '@app/screens/TagsScreen';
import ShoppingListScreen from '@app/screens/ShoppingListScreen';

export type RootStackParamList = {
  Recipes: undefined;
  NewRecipe: undefined;
  EditRecipe: { recipe: any };
  Tags: undefined;
  ShoppingList: undefined;
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
              <View style={{ flexDirection: 'row' }}>
                <Pressable
                  onPress={() => navigation.navigate('NewRecipe')}
                  hitSlop={12}
                  style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                >
                  <Ionicons name="add" size={24} color={tintColor ?? '#111827'} />
                </Pressable>
                <Pressable onPress={() => navigation.navigate('Tags')}>
                  <Text style={{ fontSize: 16, paddingHorizontal: 12 }}>{'Tags'}</Text>
                </Pressable>
                <Pressable onPress={() => navigation.navigate('ShoppingList')}>
                  <Text style={{ fontSize: 16, paddingHorizontal: 12 }}>{'List'}</Text>
                </Pressable>
              </View>
            ),
          })}
        />
        <Stack.Screen
          name="NewRecipe"
          component={NewRecipeScreen}
          options={{ title: 'New Recipe'}}
        />
        <Stack.Screen name="EditRecipe" component={EditRecipeScreen} options={{ title: 'Edit Recipe' }} />
        <Stack.Screen name="Tags" component={TagsScreen} options={{ title: 'Manage Tags' }} />
        <Stack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ title: 'Shopping List' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}