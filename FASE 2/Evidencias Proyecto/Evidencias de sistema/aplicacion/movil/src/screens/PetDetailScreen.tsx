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
import {
  PetTreatmentRecord,
  fetchPetTreatments,
  deletePetTreatment,
  formatCategoryLabel,
  getBoosterStatus,
} from '../services/treatments';

export default function PetDetailScreen({ navigation, route }: PetDetailScreenProps) {
  const { petId } = route.params;

  const [pet, setPet] = useState<Pet | null>(null);
  const [treatments, setTreatments] = useState<PetTreatmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [coTutorEmail, setCoTutorEmail] = useState('');
  const [addingTutor, setAddingTutor] = useState(false);
  const [tutorFeedback, setTutorFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null);

  const loadPet = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [data, records] = await Promise.all([
        fetchPetById(petId),
        fetchPetTreatments(petId),
      ]);
      setPet(data);
      setTreatments(records);
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
    const unsubscribe = navigation.addListener('focus', () => {
      loadPet();
    });
    return unsubscribe;
  }, [navigation, loadPet]);

  const handleDeleteTreatment = async (recordId: number) => {
    setDeletingRecordId(recordId);
    setErrorMessage(null);
    try {
      await deletePetTreatment(petId, recordId);
      setTreatments((prev) => prev.filter((item) => item.id !== recordId));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo eliminar el registro sanitario'
      );
    } finally {
      setDeletingRecordId(null);
    }
  };

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
        <ActivityIndicator size="large" color="#0E5A60" />
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
            <Text style={styles.secondaryButtonText}>Volver a Mis mascotas</Text>
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
            <Text style={styles.speciesSubtitle}>
              {pet.especie_nombre}, {pet.raza_nombre || 'Mestizo'}
            </Text>
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
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitleNoMargin}>
              Carnet sanitario ({treatments.length})
            </Text>
            <TouchableOpacity
              style={styles.addDoseButton}
              onPress={() =>
                navigation.navigate('TreatmentForm', {
                  petId: pet.id,
                  petName: pet.nombre,
                  especieId: pet.especie_id,
                })
              }
            >
              <Text style={styles.addDoseButtonText}>+ Registrar dosis</Text>
            </TouchableOpacity>
          </View>

          {treatments.length === 0 ? (
            <Text style={styles.emptySmall}>
              Aún no hay vacunas ni desparasitaciones registradas para {pet.nombre}.
            </Text>
          ) : (
            treatments.map((rec) => {
              const boosterInfo = getBoosterStatus(rec.fecha_proximo_refuerzo);
              return (
                <View key={rec.id} style={styles.doseCard}>
                  <View style={styles.doseTopRow}>
                    <View
                      style={[
                        styles.catBadge,
                        rec.tratamiento_categoria === 'vacuna'
                          ? styles.catVacuna
                          : rec.tratamiento_categoria === 'desparasitacion_interna'
                          ? styles.catInterna
                          : styles.catExterna,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catBadgeText,
                          rec.tratamiento_categoria === 'vacuna'
                            ? styles.catVacunaText
                            : rec.tratamiento_categoria === 'desparasitacion_interna'
                            ? styles.catInternaText
                            : styles.catExternaText,
                        ]}
                      >
                        {formatCategoryLabel(rec.tratamiento_categoria)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        boosterInfo.status === 'vencido'
                          ? styles.statusVencido
                          : boosterInfo.status === 'proximo'
                          ? styles.statusProximo
                          : boosterInfo.status === 'al_dia'
                          ? styles.statusAlDia
                          : styles.statusSinFecha,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          boosterInfo.status === 'vencido'
                            ? styles.statusVencidoText
                            : boosterInfo.status === 'proximo'
                            ? styles.statusProximoText
                            : boosterInfo.status === 'al_dia'
                            ? styles.statusAlDiaText
                            : styles.statusSinFechaText,
                        ]}
                      >
                        {boosterInfo.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.doseTitle}>{rec.tratamiento_nombre}</Text>

                  <View style={styles.doseDatesRow}>
                    <Text style={styles.doseDateText}>
                      Aplicada: {rec.fecha_aplicacion}
                    </Text>
                    {rec.fecha_proximo_refuerzo ? (
                      <Text style={styles.doseDateText}>
                        Refuerzo: {rec.fecha_proximo_refuerzo}
                      </Text>
                    ) : null}
                  </View>

                  {rec.veterinaria_nombre ? (
                    <Text style={styles.doseMetaText}>
                      Clínica: {rec.veterinaria_nombre}
                    </Text>
                  ) : null}
                  {rec.lote_producto ? (
                    <Text style={styles.doseMetaText}>
                      Lote: {rec.lote_producto}
                    </Text>
                  ) : null}
                  {rec.notas ? (
                    <Text style={styles.doseMetaText}>Notas: {rec.notas}</Text>
                  ) : null}

                  <View style={styles.doseActionsRow}>
                    <TouchableOpacity
                      style={styles.doseEditBtn}
                      onPress={() =>
                        navigation.navigate('TreatmentForm', {
                          petId: pet.id,
                          petName: pet.nombre,
                          especieId: pet.especie_id,
                          recordId: rec.id,
                        })
                      }
                    >
                      <Text style={styles.doseEditBtnText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.doseDeleteBtn}
                      onPress={() => handleDeleteTreatment(rec.id)}
                      disabled={deletingRecordId === rec.id}
                    >
                      <Text style={styles.doseDeleteBtnText}>
                        {deletingRecordId === rec.id ? 'Eliminando...' : 'Eliminar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          <TouchableOpacity
            style={styles.calendarLinkBtn}
            onPress={() => navigation.navigate('Calendar')}
          >
            <Text style={styles.calendarLinkText}>
              Ver calendario general de refuerzos
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Tutores y cotutores</Text>
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
              placeholderTextColor="#8B9899"
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
            <Text style={styles.editButtonText}>Editar datos de la mascota</Text>
          </TouchableOpacity>

          {!confirmingDelete ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setConfirmingDelete(true)}
            >
              <Text style={styles.deleteButtonText}>Eliminar mascota</Text>
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
            <Text style={styles.secondaryButtonText}>Volver a Mis mascotas</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: '#F6F3EC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#526466',
  },
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#E6CFA8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0E5A60',
  },
  headerInfo: {
    flex: 1,
  },
  speciesSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#526466',
    marginBottom: 2,
  },
  petName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#14282A',
    letterSpacing: -0.3,
  },
  ageHighlight: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E5A60',
    marginTop: 2,
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
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A61B1B',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FAF8F4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4DDD0',
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  infoItem: {
    width: '47%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#526466',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14282A',
  },
  sectionBox: {
    backgroundColor: '#FAF8F4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4DDD0',
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14282A',
    marginBottom: 12,
  },
  tutorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E4DDD0',
  },
  tutorInfo: {
    flex: 1,
  },
  tutorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14282A',
  },
  tutorEmail: {
    fontSize: 12,
    color: '#526466',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  primaryRoleBadge: {
    backgroundColor: '#E4F0F1',
  },
  coRoleBadge: {
    backgroundColor: '#F3E7D3',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  primaryRoleText: {
    color: '#0E5A60',
  },
  coRoleText: {
    color: '#7A541E',
  },
  emptySmall: {
    fontSize: 13,
    color: '#526466',
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
    borderColor: '#D8CFC0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#14282A',
  },
  addTutorBtn: {
    backgroundColor: '#0E5A60',
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
    color: '#0E5A60',
    fontWeight: '600',
  },
  feedbackErr: {
    marginTop: 8,
    fontSize: 12,
    color: '#A61B1B',
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleNoMargin: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14282A',
  },
  addDoseButton: {
    backgroundColor: '#0E5A60',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addDoseButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  doseCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  doseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catVacuna: {
    backgroundColor: '#E4F0F1',
  },
  catInterna: {
    backgroundColor: '#F3E7D3',
  },
  catExterna: {
    backgroundColor: '#E8F3E8',
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  catVacunaText: {
    color: '#0E5A60',
  },
  catInternaText: {
    color: '#7A541E',
  },
  catExternaText: {
    color: '#1E5E3A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusVencido: {
    backgroundColor: '#FDE8E8',
  },
  statusProximo: {
    backgroundColor: '#FEF3C7',
  },
  statusAlDia: {
    backgroundColor: '#DCFCE7',
  },
  statusSinFecha: {
    backgroundColor: '#EFECE6',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusVencidoText: {
    color: '#A61B1B',
  },
  statusProximoText: {
    color: '#9A4A06',
  },
  statusAlDiaText: {
    color: '#14532D',
  },
  statusSinFechaText: {
    color: '#526466',
  },
  doseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14282A',
    marginBottom: 6,
  },
  doseDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  doseDateText: {
    fontSize: 12,
    color: '#2A3F41',
    fontWeight: '500',
  },
  doseMetaText: {
    fontSize: 12,
    color: '#526466',
    marginTop: 2,
  },
  doseActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  doseEditBtn: {
    backgroundColor: '#E4F0F1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  doseEditBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E5A60',
  },
  doseDeleteBtn: {
    backgroundColor: '#FDF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  doseDeleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A61B1B',
  },
  calendarLinkBtn: {
    marginTop: 4,
    paddingVertical: 8,
    alignItems: 'center',
  },
  calendarLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E5A60',
  },
  actionsColumn: {
    gap: 10,
  },
  editButton: {
    width: '100%',
    backgroundColor: '#0E5A60',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    width: '100%',
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#F5C2C0',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#A61B1B',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBox: {
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#F5C2C0',
    borderRadius: 10,
    padding: 14,
  },
  confirmText: {
    fontSize: 13,
    color: '#881313',
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
    backgroundColor: '#A61B1B',
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
    borderColor: '#D8CFC0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmNoText: {
    color: '#2A3F41',
    fontSize: 13,
    fontWeight: '600',
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
