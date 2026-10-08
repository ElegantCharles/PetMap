import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import type { TreatmentFormScreenProps } from '../navigation/types';
import {
  TreatmentCatalogItem,
  TreatmentCategory,
  fetchTreatmentCatalog,
  fetchPetTreatments,
  createPetTreatment,
  updatePetTreatment,
  formatCategoryLabel,
  getTodayIsoDate,
  computeSuggestedBoosterDate,
} from '../services/treatments';

export default function TreatmentFormScreen({
  navigation,
  route,
}: TreatmentFormScreenProps) {
  const { petId, petName, especieId, recordId } = route.params;
  const isEditing = Boolean(recordId);

  const [catalog, setCatalog] = useState<TreatmentCatalogItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<TreatmentCategory | 'all'>('all');
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<number | null>(null);
  const [fechaAplicacion, setFechaAplicacion] = useState<string>(getTodayIsoDate());
  const [fechaProximoRefuerzo, setFechaProximoRefuerzo] = useState<string>('');
  const [manualBoosterEdited, setManualBoosterEdited] = useState<boolean>(false);
  const [loteProducto, setLoteProducto] = useState<string>('');
  const [veterinariaNombre, setVeterinariaNombre] = useState<string>('');
  const [notas, setNotas] = useState<string>('');

  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadInitial() {
      try {
        const items = await fetchTreatmentCatalog(especieId);
        if (!mounted) return;
        setCatalog(items);

        if (recordId) {
          const records = await fetchPetTreatments(petId);
          if (!mounted) return;
          const existing = records.find((r) => r.id === recordId);
          if (existing) {
            setSelectedTreatmentId(existing.tratamiento_id);
            setFechaAplicacion(existing.fecha_aplicacion);
            setFechaProximoRefuerzo(existing.fecha_proximo_refuerzo || '');
            setManualBoosterEdited(true);
            setLoteProducto(existing.lote_producto || '');
            setVeterinariaNombre(existing.veterinaria_nombre || '');
            setNotas(existing.notas || '');
          }
        } else if (items.length > 0) {
          const first = items[0];
          setSelectedTreatmentId(first.id);
          const suggested = computeSuggestedBoosterDate(
            getTodayIsoDate(),
            first.intervalo_refuerzo_dias
          );
          setFechaProximoRefuerzo(suggested);
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Error al cargar catálogo de tratamientos'
          );
        }
      } finally {
        if (mounted) {
          setInitialLoading(false);
        }
      }
    }
    loadInitial();
    return () => {
      mounted = false;
    };
  }, [especieId, petId, recordId]);

  const selectedTreatment =
    catalog.find((item) => item.id === selectedTreatmentId) || null;

  const handleSelectTreatment = (item: TreatmentCatalogItem) => {
    setSelectedTreatmentId(item.id);
    const suggested = computeSuggestedBoosterDate(
      fechaAplicacion,
      item.intervalo_refuerzo_dias
    );
    setFechaProximoRefuerzo(suggested);
    setManualBoosterEdited(false);
  };

  const handleChangeFechaAplicacion = (value: string) => {
    setFechaAplicacion(value);
    if (!manualBoosterEdited && selectedTreatment) {
      const suggested = computeSuggestedBoosterDate(
        value,
        selectedTreatment.intervalo_refuerzo_dias
      );
      if (suggested) {
        setFechaProximoRefuerzo(suggested);
      }
    }
  };

  const handleChangeBoosterManual = (value: string) => {
    setFechaProximoRefuerzo(value);
    setManualBoosterEdited(true);
  };

  const handleRecalculateSuggestion = () => {
    if (!selectedTreatment) return;
    const suggested = computeSuggestedBoosterDate(
      fechaAplicacion,
      selectedTreatment.intervalo_refuerzo_dias
    );
    setFechaProximoRefuerzo(suggested);
    setManualBoosterEdited(false);
  };

  const filteredCatalog =
    categoryFilter === 'all'
      ? catalog
      : catalog.filter((item) => item.categoria === categoryFilter);

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!selectedTreatmentId) {
      setErrorMessage('Selecciona una vacuna o desparasitación del catálogo.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaAplicacion.trim())) {
      setErrorMessage('La fecha de aplicación debe tener formato AAAA-MM-DD.');
      return;
    }

    if (
      fechaProximoRefuerzo.trim().length > 0 &&
      !/^\d{4}-\d{2}-\d{2}$/.test(fechaProximoRefuerzo.trim())
    ) {
      setErrorMessage('La fecha de próximo refuerzo debe tener formato AAAA-MM-DD.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        tratamiento_id: selectedTreatmentId,
        fecha_aplicacion: fechaAplicacion.trim(),
        fecha_proximo_refuerzo:
          fechaProximoRefuerzo.trim().length > 0
            ? fechaProximoRefuerzo.trim()
            : null,
        lote_producto: loteProducto.trim().length > 0 ? loteProducto.trim() : null,
        veterinaria_nombre:
          veterinariaNombre.trim().length > 0 ? veterinariaNombre.trim() : null,
        notas: notas.trim().length > 0 ? notas.trim() : null,
      };

      if (isEditing && recordId) {
        await updatePetTreatment(petId, recordId, payload);
      } else {
        await createPetTreatment(petId, payload);
      }

      navigation.navigate('PetDetail', { petId });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo guardar el registro'
      );
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E5A60" />
        <Text style={styles.loadingText}>Cargando catálogo sanitario...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.card}>
        <Text style={styles.petContext}>Carnet de {petName}</Text>
        <Text style={styles.title}>
          {isEditing ? 'Editar dosis registrada' : 'Registrar vacuna o desparasitación'}
        </Text>
        <Text style={styles.subtitle}>
          Selecciona el tratamiento aplicado; calcularemos automáticamente la fecha sugerida del próximo refuerzo.
        </Text>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Filtrar por categoría</Text>
          <View style={styles.filterRow}>
            {(
              [
                { key: 'all', label: 'Todas' },
                { key: 'vacuna', label: 'Vacuna' },
                { key: 'desparasitacion_interna', label: 'Desp. Interna' },
                { key: 'desparasitacion_externa', label: 'Desp. Externa' },
              ] as const
            ).map((f) => {
              const active = categoryFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setCategoryFilter(f.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Vacuna o antiparasitario *</Text>
          <View style={styles.treatmentList}>
            {filteredCatalog.map((item) => {
              const selected = item.id === selectedTreatmentId;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.treatmentOption,
                    selected && styles.treatmentOptionSelected,
                  ]}
                  onPress={() => handleSelectTreatment(item)}
                >
                  <View style={styles.treatmentHeader}>
                    <Text
                      style={[
                        styles.treatmentName,
                        selected && styles.treatmentNameSelected,
                      ]}
                    >
                      {item.nombre}
                    </Text>
                    <View
                      style={[
                        styles.catBadge,
                        item.categoria === 'vacuna'
                          ? styles.catVacuna
                          : item.categoria === 'desparasitacion_interna'
                          ? styles.catInterna
                          : styles.catExterna,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catBadgeText,
                          item.categoria === 'vacuna'
                            ? styles.catVacunaText
                            : item.categoria === 'desparasitacion_interna'
                            ? styles.catInternaText
                            : styles.catExternaText,
                        ]}
                      >
                        {formatCategoryLabel(item.categoria)}
                      </Text>
                    </View>
                  </View>
                  {item.descripcion ? (
                    <Text style={styles.treatmentDesc}>{item.descripcion}</Text>
                  ) : null}
                  {item.intervalo_refuerzo_dias ? (
                    <Text style={styles.treatmentInterval}>
                      Refuerzo sugerido cada {item.intervalo_refuerzo_dias} días
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Fecha de aplicación (AAAA-MM-DD) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. 2026-10-08"
            placeholderTextColor="#8B9899"
            value={fechaAplicacion}
            onChangeText={handleChangeFechaAplicacion}
          />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.boosterLabelRow}>
            <Text style={styles.label}>Fecha próximo refuerzo (AAAA-MM-DD)</Text>
            {selectedTreatment?.intervalo_refuerzo_dias ? (
              <TouchableOpacity onPress={handleRecalculateSuggestion}>
                <Text style={styles.recalcLink}>Recalcular (+{selectedTreatment.intervalo_refuerzo_dias}d)</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Calculada automáticamente o edítala"
            placeholderTextColor="#8B9899"
            value={fechaProximoRefuerzo}
            onChangeText={handleChangeBoosterManual}
          />
          <Text style={styles.helperText}>
            Se sugiere automáticamente según el tratamiento; puedes modificarla si tu veterinario indicó otra fecha.
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Veterinaria o clínica (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Clínica Veterinaria Providencia"
            placeholderTextColor="#8B9899"
            value={veterinariaNombre}
            onChangeText={setVeterinariaNombre}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Lote o marca del producto (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Nobivac Lote A492"
            placeholderTextColor="#8B9899"
            value={loteProducto}
            onChangeText={setLoteProducto}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Notas u observaciones (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ej. Sin reacciones adversas, peso control 12.4 kg"
            placeholderTextColor="#8B9899"
            value={notas}
            onChangeText={setNotas}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isEditing ? 'Guardar cambios' : 'Registrar en el carnet'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
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
  petContext: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E5A60',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#14282A',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#526466',
    marginBottom: 18,
    lineHeight: 19,
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
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A3F41',
    marginBottom: 6,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D8CFC0',
    backgroundColor: '#FAF8F4',
  },
  filterChipActive: {
    borderColor: '#0E5A60',
    backgroundColor: '#E4F0F1',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#526466',
  },
  filterChipTextActive: {
    color: '#0E5A60',
  },
  treatmentList: {
    gap: 8,
  },
  treatmentOption: {
    borderWidth: 1,
    borderColor: '#E4DDD0',
    backgroundColor: '#FAF8F4',
    borderRadius: 10,
    padding: 12,
  },
  treatmentOptionSelected: {
    borderColor: '#0E5A60',
    backgroundColor: '#E4F0F1',
  },
  treatmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  treatmentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14282A',
    flex: 1,
  },
  treatmentNameSelected: {
    color: '#0E5A60',
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catVacuna: {
    backgroundColor: '#FFFFFF',
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
  treatmentDesc: {
    fontSize: 12,
    color: '#526466',
    marginBottom: 2,
  },
  treatmentInterval: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0E5A60',
  },
  input: {
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#D8CFC0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#14282A',
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  boosterLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recalcLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E5A60',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 11,
    color: '#526466',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#0E5A60',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E4DDD0',
  },
  cancelButtonText: {
    color: '#526466',
    fontSize: 14,
    fontWeight: '600',
  },
});
