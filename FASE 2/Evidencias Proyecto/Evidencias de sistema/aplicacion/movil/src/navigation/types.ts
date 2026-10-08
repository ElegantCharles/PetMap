import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Pets: undefined;
  Map: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type PetsScreenProps = NativeStackScreenProps<RootStackParamList, 'Pets'>;
export type MapScreenProps = NativeStackScreenProps<RootStackParamList, 'Map'>;
