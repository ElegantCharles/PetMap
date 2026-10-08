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
import { colors, fonts } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: { backgroundColor: colors.ground },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 18 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.ground },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Iniciar sesión' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Crear cuenta' }}
      />
      <Stack.Screen
        name="Pets"
        component={PetsScreen}
        options={{ title: 'Mis mascotas' }}
      />
      <Stack.Screen
        name="PetForm"
        component={PetFormScreen}
        options={({ route }) => ({
          title: route.params?.petId ? 'Editar mascota' : 'Registrar mascota',
        })}
      />
      <Stack.Screen
        name="PetDetail"
        component={PetDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TreatmentForm"
        component={TreatmentFormScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: 'Calendario de refuerzos' }}
      />
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'Mapa' }}
      />
    </Stack.Navigator>
  );
}

