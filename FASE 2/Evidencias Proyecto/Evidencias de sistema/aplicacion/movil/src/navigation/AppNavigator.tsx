import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PetsScreen from '../screens/PetsScreen';
import PetFormScreen from '../screens/PetFormScreen';
import PetDetailScreen from '../screens/PetDetailScreen';
import TreatmentFormScreen from '../screens/TreatmentFormScreen';
import CalendarScreen from '../screens/CalendarScreen';
import MapScreen from '../screens/MapScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Todas las pantallas dibujan su propia barra superior (TopBar) o cabecera,
// así que la cabecera nativa va oculta en el stack completo.
export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.ground },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Pets" component={PetsScreen} />
      <Stack.Screen name="PetForm" component={PetFormScreen} />
      <Stack.Screen name="PetDetail" component={PetDetailScreen} />
      <Stack.Screen name="TreatmentForm" component={TreatmentFormScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
    </Stack.Navigator>
  );
}
