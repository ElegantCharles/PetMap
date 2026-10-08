import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import type { MapScreenProps } from '../navigation/types';
import { API_CONFIG } from '../config/api';

export default function MapScreen({ navigation }: MapScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Mapa veterinario</Text>
        <Text style={styles.infoText}>
          Búsqueda de clínicas, laboratorios, peluquerías y tiendas sobre OpenStreetMap.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Pets')}
        >
          <Text style={styles.buttonText}>Ir a Mis mascotas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryButtonText}>Volver a inicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F3EC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4DDD0',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#14282A',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#526466',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#0E5A60',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#526466',
    fontSize: 14,
    fontWeight: '600',
  },
});
