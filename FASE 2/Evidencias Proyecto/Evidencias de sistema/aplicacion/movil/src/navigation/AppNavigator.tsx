import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';
import PetsScreen from '../screens/PetsScreen';
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
        options={{ title: 'Acceso' }}
      />
      <Stack.Screen
        name="Pets"
        component={PetsScreen}
        options={{ title: 'Mis Mascotas' }}
      />
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'Mapa' }}
      />
    </Stack.Navigator>
  );
}
