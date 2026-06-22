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
import AccountScreen from '@app/screens/AccountScreen/AccountScreen';
import CategoryPickerScreen from '@app/screens/CategoryPickerScreen/CategoryPickerScreen';
import { useAuth, AuthProvider } from 'auth/AuthProvider';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '@app/styles/colors';
import type { CategoryOut } from 'types/types';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Account: undefined;
  Recipes: undefined;
  NewRecipe: undefined;
  EditRecipe: { recipe: any };
  Tags: undefined;
  ShoppingLists: undefined;
  ShoppingList: { listId: string, listName: string};
  MealPlanner: undefined;
  CategoryPicker: { onSelect: (category: CategoryOut) => void; selectedId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Home'>) {
  const { plan } = useAuth();

  const menuCard = {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 12, backgroundColor: colors.screenBg }}>
      <Text style={{ fontSize: 26, fontWeight: '800', marginBottom: 16, color: '#1C1917', letterSpacing: -0.5 }}>
        Kitchen Companion
      </Text>

      <Pressable onPress={() => navigation.navigate('Recipes')} style={menuCard}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1917' }}>Recipes</Text>
        <Text style={{ color: colors.muted, marginTop: 3 }}>Browse and edit your recipes.</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('ShoppingLists')} style={menuCard}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1917' }}>Shopping lists</Text>
        <Text style={{ color: colors.muted, marginTop: 3 }}>Manage your lists for different stores or weeks.</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Tags')} style={menuCard}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1917' }}>Tags</Text>
        <Text style={{ color: colors.muted, marginTop: 3 }}>Organize recipes with tags.</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          if (plan === 'free') {
            Alert.alert('Premium feature', 'Upgrade your plan to access Meal Planner.');
            return;
          }
          navigation.navigate('MealPlanner');
        }}
        style={[menuCard, plan === 'free' && { opacity: 0.5 }]}
      >
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1917' }}>
          Meal planner {plan === 'free' ? '(Premium)' : ''}
        </Text>
        <Text style={{ color: colors.muted, marginTop: 3 }}>Plan your weekly meals.</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Account')} style={menuCard}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1917' }}>Account</Text>
        <Text style={{ color: colors.muted, marginTop: 3 }}>Manage your plan, password, and settings.</Text>
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
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: '#1C1917', fontWeight: '700' },
        contentStyle: { backgroundColor: colors.screenBg },
      }}
    >
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
          <Stack.Screen
            name="Account"
            component={AccountScreen}
            options={{ title: 'Account' }}
          />
          <Stack.Screen
            name="CategoryPicker"
            component={CategoryPickerScreen}
            options={{ title: 'Wybierz kategorię' }}
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