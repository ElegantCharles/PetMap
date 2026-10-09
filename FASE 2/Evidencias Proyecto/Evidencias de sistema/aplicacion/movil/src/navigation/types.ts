import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Pets: undefined;
  PetForm: { petId?: number } | undefined;
  PetDetail: { petId: number };
  TreatmentForm: {
    petId: number;
    petName: string;
    especieId: number;
    recordId?: number;
  };
  Calendar: undefined;
  Map: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type PetsScreenProps = NativeStackScreenProps<RootStackParamList, 'Pets'>;
export type PetFormScreenProps = NativeStackScreenProps<RootStackParamList, 'PetForm'>;
export type PetDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'PetDetail'>;
export type TreatmentFormScreenProps = NativeStackScreenProps<RootStackParamList, 'TreatmentForm'>;
export type CalendarScreenProps = NativeStackScreenProps<RootStackParamList, 'Calendar'>;
export type MapScreenProps = NativeStackScreenProps<RootStackParamList, 'Map'>;
