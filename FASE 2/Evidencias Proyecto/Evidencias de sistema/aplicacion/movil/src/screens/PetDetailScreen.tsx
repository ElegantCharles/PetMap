import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import type { PetDetailScreenProps } from '../navigation/types';
import {
  Pet,
  fetchPetById,
  deletePet,
  addPetTutor,
  formatPetAge,
} from '../services/pets';

export default function PetDetailScreen({ navigation, route }: PetDetailScreenProps) {
  const { petId } = route.params;

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [coTutorEmail, setCoTutorEmail] = useState('');
  const [addingTutor, setAddingTutor] = useState(false);
  const [tutorFeedback, setTutorFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadPet = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchPetById(petId);
      setPet(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Error al cargar la ficha de la mascota'
      );
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadPet();
  }, [loadPet]);

  const handleAddTutor = async () => {
    setTutorFeedback(null);
    const trimmed = coTutorEmail.trim().toLowerCase();
    if (!trimmed) {
      setTutorFeedback({ type: 'err', text: 'Ingresa el correo del cotutor registrado.' });
      return;
    }

    setAddingTutor(true);
    try {
      const updated = await addPetTutor(petId, trimmed);
      setPet(updated);
      setCoTutorEmail('');
      setTutorFeedback({ type: 'ok', text: 'Cotutor asociado correctamente.' });
    } catch (error) {
      setTutorFeedback({
        type: 'err',
        text: error instanceof Error ? error.message : 'No se pudo agregar al cotutor.',
      });
    } finally {
      setAddingTutor(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePet(petId);
      navigation.replace('Pets');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo eliminar la mascota'
      );
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Cargando ficha de mascota...</Text>
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.card}>
          <Text style={styles.errorTitle}>{errorMessage || 'Mascota no encontrada'}</Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.replace('Pets')}
          >
            <Text style={styles.secondaryButtonText}>Volver a Mis Mascotas</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {pet.nombre.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.speciesBadge}>
              <Text style={styles.speciesBadgeText}>
                {pet.especie_nombre.toUpperCase()} · {pet.raza_nombre || 'MESTIZO'}
              </Text>
            </View>
            <Text style={styles.petName}>{pet.nombre}</Text>
            <Text style={styles.ageHighlight}>{formatPetAge(pet.fecha_nacimiento)}</Text>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Fecha de nacimiento</Text>
            <Text style={styles.infoValue}>{pet.fecha_nacimiento}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Sexo</Text>
            <Text style={styles.infoValue}>
              {pet.sexo === 'macho' ? 'Macho' : 'Hembra'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Esterilización</Text>
            <Text style={styles.infoValue}>
              {pet.esterilizado ? 'Esterilizado/a' : 'Sin esterilizar'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Microchip</Text>
            <Text style={styles.infoValue}>
              {pet.numero_chip || 'No registrado'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Tutores y Cotutores</Text>
          {pet.tutores && pet.tutores.length > 0 ? (
            pet.tutores.map((t) => (
              <View key={t.id} style={styles.tutorRow}>
                <View style={styles.tutorInfo}>
                  <Text style={styles.tutorName}>{t.nombre_completo}</Text>
                  <Text style={styles.tutorEmail}>{t.email}</Text>
                </View>
                <View
                  style={[
                    styles.roleBadge,
                    t.es_tutor_principal ? styles.primaryRoleBadge : styles.coRoleBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleBadgeText,
                      t.es_tutor_principal ? styles.primaryRoleText : styles.coRoleText,
                    ]}
                  >
                    {t.es_tutor_principal ? 'Principal' : 'Cotutor'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptySmall}>Tutor registrado.</Text>
          )}

          <View style={styles.addTutorRow}>
            <TextInput
              style={styles.tutorInput}
              placeholder="Correo de familiar registrado..."
              placeholderTextColor="#9CA3AF"
              value={coTutorEmail}
              onChangeText={setCoTutorEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity
              style={styles.addTutorBtn}
              onPress={handleAddTutor}
              disabled={addingTutor}
            >
              {addingTutor ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.addTutorBtnText}>Asociar</Text>
              )}
            </TouchableOpacity>
          </View>

          {tutorFeedback ? (
            <Text
              style={
                tutorFeedback.type === 'ok' ? styles.feedbackOk : styles.feedbackErr
              }
            >
              {tutorFeedback.text}
            </Text>
          ) : null}
        </View>

        <View style={styles.actionsColumn}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('PetForm', { petId: pet.id })}
          >
            <Text style={styles.editButtonText}>Editar Datos de la Mascota</Text>
          </TouchableOpacity>

          {!confirmingDelete ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setConfirmingDelete(true)}
            >
              <Text style={styles.deleteButtonText}>Eliminar Mascota</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>
                ¿Confirmas que deseas eliminar la ficha de {pet.nombre}?
              </Text>
              <View style={styles.confirmBtnsRow}>
                <TouchableOpacity
                  style={styles.confirmYesBtn}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmYesText}>Sí, eliminar</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmNoBtn}
                  onPress={() => setConfirmingDelete(false)}
                  disabled={deleting}
                >
                  <Text style={styles.confirmNoText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Pets')}
          >
            <Text style={styles.secondaryButtonText}>Volver a Mis Mascotas</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B5563',
  },
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  headerInfo: {
    flex: 1,
  },
  speciesBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 4,
  },
  speciesBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  petName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
  },
  ageHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
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
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B91C1C',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  infoItem: {
    width: '47%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  tutorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tutorInfo: {
    flex: 1,
  },
  tutorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  tutorEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  primaryRoleBadge: {
    backgroundColor: '#D1FAE5',
  },
  coRoleBadge: {
    backgroundColor: '#E0E7FF',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  primaryRoleText: {
    color: '#065F46',
  },
  coRoleText: {
    color: '#3730A3',
  },
  emptySmall: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  addTutorRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  tutorInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  addTutorBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTutorBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  feedbackOk: {
    marginTop: 8,
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  feedbackErr: {
    marginTop: 8,
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
  },
  actionsColumn: {
    gap: 10,
  },
  editButton: {
    width: '100%',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteButton: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 14,
  },
  confirmText: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmBtnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmYesBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmYesText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmNoBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmNoText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
});
