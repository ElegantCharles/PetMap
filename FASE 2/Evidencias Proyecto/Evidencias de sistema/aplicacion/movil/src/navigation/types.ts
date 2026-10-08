import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Pets: undefined;
  PetForm: { petId?: number } | undefined;
  PetDetail: { petId: number };
  Map: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type PetsScreenProps = NativeStackScreenProps<RootStackParamList, 'Pets'>;
export type PetFormScreenProps = NativeStackScreenProps<RootStackParamList, 'PetForm'>;
export type PetDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'PetDetail'>;
export type MapScreenProps = NativeStackScreenProps<RootStackParamList, 'Map'>;
