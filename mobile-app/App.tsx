import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert, Pressable, View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import RecipesScreen from '@app/screens/RecipesScreen/RecipesScreen';
import NewRecipeScreen from '@app/screens/NewRecipeScreen/NewRecipeScreen';
import EditRecipeScreen from '@app/screens/EditRecipeScreen/EditRecipeScreen';
import TagsScreen from '@app/screens/TagsScreen/TagsScreen';
import ShoppingListsScreen from '@app/screens/ShoppingListsScreen/ShoppingListsScreen';
import SingleShoppingListScreen from '@app/screens/SingleShoppingListScreen/SingleShoppingListScreen';
import AuthScreen from '@app/screens/AuthScreen/AuthScreen';
import MealPlannerScreen from '@app/screens/MealPlannerScreen/MealPlannerScreen';
import { useAuth, AuthProvider } from 'auth/AuthProvider';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '@app/styles/colors';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Recipes: undefined;
  NewRecipe: undefined;
  EditRecipe: { recipe: any };
  Tags: undefined;
  ShoppingLists: undefined;
  ShoppingList: { listId: string, listName: string};
  MealPlanner: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Home'>) {
  const { logout, plan } = useAuth();

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 24 }}>
        What do you want to work on?
      </Text>

      <Pressable
        onPress={() => navigation.navigate('Recipes')}
        style={{
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.borderLight,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '500' }}>Recipes</Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          Browse and edit your recipes.
        </Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('ShoppingLists')}
        style={{
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.borderLight,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '500' }}>Shopping lists</Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          Manage your multiple lists for different stores or weeks.
        </Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Tags')}
        style={{
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.borderLight,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '500' }}>Tags</Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          Organize recipes with tags.
        </Text>
      </Pressable>

      <Pressable
        onPress={() => {
          if (plan === 'free') {
            Alert.alert('Premium feature', 'Upgrade your plan to access Meal Planner.');
            return;
          }
          navigation.navigate('MealPlanner');
        }}
        style={{
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.borderLight,
          opacity: plan === 'free' ? 0.5 : 1,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '500' }}>
          Meal planner {plan === 'free' ? '(Premium)' : ''}
        </Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          Plan your weekly meals.
        </Text>
      </Pressable>

      <Pressable
        onPress={logout}
        style={{ marginTop: 16, alignSelf: 'flex-start', padding: 8 }}
      >
        <Text style={{ fontSize: 14, color: colors.dangerText }}>Logout</Text>
      </Pressable>
    </View>
  );
}

function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {token == null ? (
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Kitchen Companion' }}
          />

          <Stack.Screen
            name="Recipes"
            component={RecipesScreen}
            options={({ navigation }) => ({
              title: 'Recipes',
              headerRight: ({ tintColor }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Pressable
                    onPress={() => navigation.navigate('NewRecipe')}
                    hitSlop={12}
                    style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                  >
                    <Ionicons name="add" size={24} color={tintColor ?? colors.primary} />
                  </Pressable>
                </View>
              ),
            })}
          />

          <Stack.Screen
            name="NewRecipe"
            component={NewRecipeScreen}
            options={{ title: 'New Recipe' }}
          />
          <Stack.Screen
            name="EditRecipe"
            component={EditRecipeScreen}
            options={{ title: 'Edit Recipe' }}
          />
          <Stack.Screen
            name="Tags"
            component={TagsScreen}
            options={{ title: 'Manage Tags' }}
          />
          <Stack.Screen
            name="ShoppingLists"
            component={ShoppingListsScreen}
            options={{ title: 'Shopping List' }}
          />
          <Stack.Screen
            name="ShoppingList"
            component={SingleShoppingListScreen}
            options={({ route }) => ({ title: route.params.listName || 'Shopping List' })}
          />
          <Stack.Screen
            name="MealPlanner"
            component={MealPlannerScreen}
            options={{ title: 'Meal Planner' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}