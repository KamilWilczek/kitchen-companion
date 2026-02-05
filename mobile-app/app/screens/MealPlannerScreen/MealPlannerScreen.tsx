import { View, Text } from 'react-native';
import { colors } from '@app/styles/colors';

export default function MealPlannerScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 8 }}>Meal Planner</Text>
      <Text style={{ color: colors.muted, textAlign: 'center' }}>
        Plan your weekly meals here. Coming soon!
      </Text>
    </View>
  );
}
