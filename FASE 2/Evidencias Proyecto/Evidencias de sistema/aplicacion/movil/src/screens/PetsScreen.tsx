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
          <View style={styles.greetingBlock}>
            <Text style={styles.title}>
              {user ? `Hola, ${user.nombre_completo}` : 'Mis mascotas'}
            </Text>
            {user ? <Text style={styles.userEmail}>{user.email}</Text> : null}
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutChip}>
            <Text style={styles.logoutChipText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addPetButton}
          onPress={() => navigation.navigate('PetForm')}
        >
          <Text style={styles.addPetButtonText}>+ Registrar nueva mascota</Text>
        </TouchableOpacity>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0E5A60" />
            <Text style={styles.loadingText}>Cargando tus mascotas...</Text>
          </View>
        ) : pets.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Sin mascotas registradas todavía</Text>
            <Text style={styles.emptyText}>
              Crea la primera ficha médica de tu perro o gato para llevar su carnet de vacunas y recordatorios.
            </Text>
          </View>
        ) : (
          <View style={styles.petList}>
            <Text style={styles.sectionHeader}>
              Tus mascotas ({pets.length})
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
                    {pet.raza_nombre || 'Mestizo'}, {pet.sexo === 'macho' ? 'macho' : 'hembra'}
                  </Text>
                  <Text style={styles.petAge}>
                    {formatPetAge(pet.fecha_nacimiento)}
                  </Text>
                </View>
                <View style={styles.viewDetailBadge}>
                  <Text style={styles.viewDetailText}>Ver ficha</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => navigation.navigate('Calendar')}
        >
          <Text style={styles.calendarButtonText}>
            Calendario de vacunas y refuerzos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Text style={styles.mapButtonText}>Explorar mapa veterinario</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#F6F3EC',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4DDD0',
    padding: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 12,
  },
  greetingBlock: {
    flex: 1,
  },
  logoutChip: {
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutChipText: {
    color: '#526466',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#14282A',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#526466',
  },
  addPetButton: {
    width: '100%',
    backgroundColor: '#0E5A60',
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
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#F5C2C0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#A61B1B',
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
    color: '#526466',
  },
  emptyBox: {
    width: '100%',
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 18,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#14282A',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#526466',
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
    color: '#2A3F41',
    marginBottom: 4,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    borderRadius: 12,
    padding: 14,
  },
  petAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E6CFA8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  petAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0E5A60',
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
    color: '#14282A',
  },
  speciesTag: {
    backgroundColor: '#E4F0F1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  speciesTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0E5A60',
  },
  petBreed: {
    fontSize: 13,
    color: '#526466',
  },
  petAge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E5A60',
    marginTop: 2,
  },
  viewDetailBadge: {
    backgroundColor: '#E4F0F1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewDetailText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E5A60',
  },
  calendarButton: {
    width: '100%',
    backgroundColor: '#F3E7D3',
    borderWidth: 1,
    borderColor: '#E2C9A0',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  calendarButtonText: {
    color: '#0E5A60',
    fontSize: 15,
    fontWeight: '700',
  },
  mapButton: {
    width: '100%',
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#2A3F41',
    fontSize: 14,
    fontWeight: '600',
  },
});
