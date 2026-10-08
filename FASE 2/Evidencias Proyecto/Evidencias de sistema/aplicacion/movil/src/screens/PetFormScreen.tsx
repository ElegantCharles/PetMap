import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { PetFormScreenProps } from '../navigation/types';
import {
  Species,
  fetchSpeciesCatalog,
  fetchPetById,
  createPet,
  updatePet,
} from '../services/pets';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export default function PetFormScreen({ navigation, route }: PetFormScreenProps) {
  const petId = route.params?.petId;
  const isEditing = typeof petId === 'number';

  const [catalog, setCatalog] = useState<Species[]>([]);
  const [nombre, setNombre] = useState('');
  const [especieId, setEspecieId] = useState<number | null>(null);
  const [razaId, setRazaId] = useState<number | null>(null);
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState<'macho' | 'hembra'>('macho');
  const [esterilizado, setEsterilizado] = useState(false);
  const [numeroChip, setNumeroChip] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadForm() {
      try {
        const speciesData = await fetchSpeciesCatalog();
        if (!mounted) return;
        setCatalog(speciesData);

        if (isEditing && petId) {
          const pet = await fetchPetById(petId);
          if (!mounted) return;
          setNombre(pet.nombre);
          setEspecieId(pet.especie_id);
          setRazaId(pet.raza_id);
          setFechaNacimiento(pet.fecha_nacimiento);
          setSexo(pet.sexo);
          setEsterilizado(Boolean(pet.esterilizado));
          setNumeroChip(pet.numero_chip || '');
          setFotoUrl(pet.foto_url || '');
        } else if (speciesData.length > 0) {
          const firstSpecies = speciesData[0];
          setEspecieId(firstSpecies.id);
          if (firstSpecies.razas.length > 0) {
            setRazaId(firstSpecies.razas[0].id);
          }
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Error al cargar los datos del formulario'
          );
        }
      } finally {
        if (mounted) {
          setLoadingInitial(false);
        }
      }
    }
    loadForm();
    return () => {
      mounted = false;
    };
  }, [isEditing, petId]);

  const selectedSpecies = catalog.find((sp) => sp.id === especieId) || null;
  const availableBreeds = selectedSpecies ? selectedSpecies.razas : [];

  const handleSelectSpecies = (newSpeciesId: number) => {
    setEspecieId(newSpeciesId);
    const sp = catalog.find((item) => item.id === newSpeciesId);
    if (sp && sp.razas.length > 0) {
      setRazaId(sp.razas[0].id);
    } else {
      setRazaId(null);
    }
  };

  const applyQuickBirthDate = (yearsAgo: number, monthsAgo = 0) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - yearsAgo);
    d.setMonth(d.getMonth() - monthsAgo);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setFechaNacimiento(`${yyyy}-${mm}-${dd}`);
  };

  const handleSave = async () => {
    setErrorMessage(null);

    const trimmedNombre = nombre.trim();
    const trimmedDate = fechaNacimiento.trim();

    if (!trimmedNombre) {
      setErrorMessage('Ingresa el nombre de tu mascota.');
      return;
    }

    if (!especieId) {
      setErrorMessage('Selecciona la especie de tu mascota.');
      return;
    }

    if (!trimmedDate || !DATE_REGEX.test(trimmedDate)) {
      setErrorMessage('Ingresa la fecha de nacimiento en formato AAAA-MM-DD (ej. 2023-05-14).');
      return;
    }

    const [y, m, d] = trimmedDate.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(y, m - 1, d));
    const now = new Date();
    const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

    if (
      parsedDate.getUTCFullYear() !== y ||
      parsedDate.getUTCMonth() !== m - 1 ||
      parsedDate.getUTCDate() !== d
    ) {
      setErrorMessage('La fecha de nacimiento ingresada no existe en el calendario.');
      return;
    }

    if (parsedDate.getTime() > todayUtc) {
      setErrorMessage('La fecha de nacimiento no puede ser una fecha futura.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: trimmedNombre,
        especie_id: especieId,
        raza_id: razaId,
        fecha_nacimiento: trimmedDate,
        sexo,
        esterilizado,
        numero_chip: numeroChip.trim() ? numeroChip.trim() : null,
        foto_url: fotoUrl.trim() ? fotoUrl.trim() : null,
      };

      if (isEditing && petId) {
        await updatePet(petId, payload);
        navigation.replace('PetDetail', { petId });
      } else {
        const created = await createPet(payload);
        navigation.replace('PetDetail', { petId: created.id });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No fue posible guardar la mascota.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0E5A60" />
        <Text style={styles.loadingText}>Cargando formulario...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>
            {isEditing ? 'Editar mascota' : 'Registrar mascota'}
          </Text>
          <Text style={styles.subtitle}>
            Completa los datos básicos para llevar el control sanitario y calendario de tu mascota.
          </Text>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nombre de la mascota *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Pelusa, Max, Luna"
              placeholderTextColor="#8B9899"
              value={nombre}
              onChangeText={setNombre}
              editable={!saving}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Especie *</Text>
            <View style={styles.chipRow}>
              {catalog.map((sp) => {
                const active = sp.id === especieId;
                return (
                  <TouchableOpacity
                    key={sp.id}
                    style={[styles.choiceChip, active && styles.choiceChipActive]}
                    onPress={() => handleSelectSpecies(sp.id)}
                    disabled={saving}
                  >
                    <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>
                      {sp.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Raza</Text>
            <View style={styles.breedGrid}>
              {availableBreeds.map((br) => {
                const active = br.id === razaId;
                return (
                  <TouchableOpacity
                    key={br.id}
                    style={[styles.breedChip, active && styles.breedChipActive]}
                    onPress={() => setRazaId(br.id)}
                    disabled={saving}
                  >
                    <Text style={[styles.breedChipText, active && styles.breedChipTextActive]}>
                      {br.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Fecha de nacimiento (AAAA-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 2023-08-15"
              placeholderTextColor="#8B9899"
              value={fechaNacimiento}
              onChangeText={setFechaNacimiento}
              editable={!saving}
            />
            <View style={styles.quickDatesRow}>
              <TouchableOpacity
                style={styles.quickDateBtn}
                onPress={() => applyQuickBirthDate(0, 3)}
                disabled={saving}
              >
                <Text style={styles.quickDateText}>Hace 3 meses</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickDateBtn}
                onPress={() => applyQuickBirthDate(1, 0)}
                disabled={saving}
              >
                <Text style={styles.quickDateText}>Hace 1 año</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickDateBtn}
                onPress={() => applyQuickBirthDate(3, 0)}
                disabled={saving}
              >
                <Text style={styles.quickDateText}>Hace 3 años</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Sexo *</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.choiceChip, sexo === 'macho' && styles.choiceChipActive]}
                onPress={() => setSexo('macho')}
                disabled={saving}
              >
                <Text style={[styles.choiceChipText, sexo === 'macho' && styles.choiceChipTextActive]}>
                  Macho
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.choiceChip, sexo === 'hembra' && styles.choiceChipActive]}
                onPress={() => setSexo('hembra')}
                disabled={saving}
              >
                <Text style={[styles.choiceChipText, sexo === 'hembra' && styles.choiceChipTextActive]}>
                  Hembra
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>¿Está esterilizado/a?</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.choiceChip, esterilizado && styles.choiceChipActive]}
                onPress={() => setEsterilizado(true)}
                disabled={saving}
              >
                <Text style={[styles.choiceChipText, esterilizado && styles.choiceChipTextActive]}>
                  Sí, esterilizado/a
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.choiceChip, !esterilizado && styles.choiceChipActive]}
                onPress={() => setEsterilizado(false)}
                disabled={saving}
              >
                <Text style={[styles.choiceChipText, !esterilizado && styles.choiceChipTextActive]}>
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Número de microchip (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 900118000123456"
              placeholderTextColor="#8B9899"
              value={numeroChip}
              onChangeText={setNumeroChip}
              editable={!saving}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {isEditing ? 'Guardar cambios' : 'Registrar mascota'}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#F6F3EC',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F6F3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#526466',
  },
  scrollContainer: {
    flexGrow: 1,
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#14282A',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#526466',
    marginBottom: 20,
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
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A3F41',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#D8CFC0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#14282A',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  choiceChip: {
    flex: 1,
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#D8CFC0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  choiceChipActive: {
    backgroundColor: '#E4F0F1',
    borderColor: '#0E5A60',
  },
  choiceChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#526466',
  },
  choiceChipTextActive: {
    color: '#0E5A60',
  },
  breedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  breedChip: {
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  breedChipActive: {
    backgroundColor: '#0E5A60',
    borderColor: '#0E5A60',
  },
  breedChipText: {
    fontSize: 13,
    color: '#2A3F41',
    fontWeight: '500',
  },
  breedChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  quickDatesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickDateBtn: {
    backgroundColor: '#F3E7D3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickDateText: {
    fontSize: 12,
    color: '#0E5A60',
    fontWeight: '600',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#0E5A60',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    width: '100%',
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#526466',
    fontSize: 14,
    fontWeight: '600',
  },
});
