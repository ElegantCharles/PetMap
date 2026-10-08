import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import type { PetsScreenProps } from '../navigation/types';
import { API_CONFIG } from '../config/api';
import { getSession, clearSession, AuthUser } from '../services/auth';
import { Pet, fetchPets, formatPetAge } from '../services/pets';

export default function PetsScreen({ navigation }: PetsScreenProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const session = await getSession();
      if (!session?.token) {
        navigation.replace('Login');
        return;
      }
      setUser(session.user);
      const list = await fetchPets();
      setPets(list);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Error al cargar tus mascotas'
      );
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const handleLogout = async () => {
    await clearSession();
    navigation.replace('Login');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.card}>
        <View style={styles.headerTopRow}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>SESIÓN ACTIVA · JWT</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutChip}>
            <Text style={styles.logoutChipText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>
          {user ? `Hola, ${user.nombre_completo}` : 'Mis Mascotas'}
        </Text>
        {user ? <Text style={styles.userEmail}>{user.email}</Text> : null}

        <TouchableOpacity
          style={styles.addPetButton}
          onPress={() => navigation.navigate('PetForm')}
        >
          <Text style={styles.addPetButtonText}>+ Registrar Nueva Mascota</Text>
        </TouchableOpacity>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Cargando tus mascotas...</Text>
          </View>
        ) : pets.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Sin mascotas registradas todavía</Text>
            <Text style={styles.emptyText}>
              Presiona el botón superior para crear la primera ficha médica de tu perro o gato.
            </Text>
          </View>
        ) : (
          <View style={styles.petList}>
            <Text style={styles.sectionHeader}>
              Tus Mascotas ({pets.length})
            </Text>
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={styles.petCard}
                onPress={() => navigation.navigate('PetDetail', { petId: pet.id })}
              >
                <View style={styles.petAvatar}>
                  <Text style={styles.petAvatarText}>
                    {pet.nombre.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.petInfo}>
                  <View style={styles.petNameRow}>
                    <Text style={styles.petName}>{pet.nombre}</Text>
                    <View style={styles.speciesTag}>
                      <Text style={styles.speciesTagText}>{pet.especie_nombre}</Text>
                    </View>
                  </View>
                  <Text style={styles.petBreed}>
                    {pet.raza_nombre || 'Mestizo'} · {pet.sexo === 'macho' ? 'Macho' : 'Hembra'}
                  </Text>
                  <Text style={styles.petAge}>
                    Edad: {formatPetAge(pet.fecha_nacimiento)}
                  </Text>
                </View>
                <View style={styles.viewDetailBadge}>
                  <Text style={styles.viewDetailText}>Ficha →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Text style={styles.mapButtonText}>Explorar Mapa Veterinario</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>API conectada en:</Text>
        <Text style={styles.footerValue}>{API_CONFIG.BASE_URL}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoutChip: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  logoutChipText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 18,
  },
  addPetButton: {
    width: '100%',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 18,
  },
  addPetButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
  },
  emptyBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 18,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
  },
  petList: {
    width: '100%',
    marginBottom: 18,
    gap: 10,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
  },
  petAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  petAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  petInfo: {
    flex: 1,
  },
  petNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  petName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  speciesTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  speciesTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  petBreed: {
    fontSize: 13,
    color: '#4B5563',
  },
  petAge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  viewDetailBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewDetailText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  mapButton: {
    width: '100%',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footerValue: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 2,
  },
});
