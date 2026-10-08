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

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2563EB',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Iniciar Sesión' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Crear Cuenta' }}
      />
      <Stack.Screen
        name="Pets"
        component={PetsScreen}
        options={{ title: 'Mis Mascotas' }}
      />
      <Stack.Screen
        name="PetForm"
        component={PetFormScreen}
        options={({ route }) => ({
          title: route.params?.petId ? 'Editar Mascota' : 'Registrar Mascota',
        })}
      />
      <Stack.Screen
        name="PetDetail"
        component={PetDetailScreen}
        options={{ title: 'Ficha de Mascota' }}
      />
      <Stack.Screen
        name="TreatmentForm"
        component={TreatmentFormScreen}
        options={({ route }) => ({
          title: route.params?.recordId ? 'Editar Dosis' : 'Registrar Dosis',
        })}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: 'Calendario Sanitario' }}
      />
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'Mapa' }}
      />
    </Stack.Navigator>
  );
}
