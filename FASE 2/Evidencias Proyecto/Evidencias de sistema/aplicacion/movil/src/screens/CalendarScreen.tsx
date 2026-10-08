import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import type { CalendarScreenProps } from '../navigation/types';
import {
  CalendarEventItem,
  fetchCalendar,
  formatCategoryLabel,
} from '../services/treatments';

export default function CalendarScreen({ navigation }: CalendarScreenProps) {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'vencido' | 'proximo' | 'al_dia'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const list = await fetchCalendar();
      setEvents(list);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Error al cargar calendario de refuerzos'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalendar();
    const unsubscribe = navigation.addListener('focus', () => {
      loadCalendar();
    });
    return unsubscribe;
  }, [navigation, loadCalendar]);

  const countVencidos = events.filter((e) => e.estado === 'vencido').length;
  const countProximos = events.filter((e) => e.estado === 'proximo').length;
  const countAlDia = events.filter((e) => e.estado === 'al_dia').length;

  const filteredEvents =
    statusFilter === 'all'
      ? events
      : events.filter((e) => e.estado === statusFilter);

  const renderStatusLabel = (item: CalendarEventItem) => {
    if (item.estado === 'vencido') {
      return `Vencido (${Math.abs(item.dias_restantes)} d)`;
    }
    if (item.estado === 'proximo') {
      return item.dias_restantes === 0
        ? 'Vence hoy'
        : `Próximo (${item.dias_restantes} d)`;
    }
    return `Al día (${item.dias_restantes} d)`;
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.card}>
        <Text style={styles.title}>Calendario de refuerzos</Text>
        <Text style={styles.subtitle}>
          Próximas vacunas y desparasitaciones de todas tus mascotas ordenadas por urgencia.
        </Text>

        <View style={styles.summaryRow}>
          <TouchableOpacity
            style={[
              styles.summaryBox,
              styles.summaryVencido,
              statusFilter === 'vencido' && styles.summaryActiveBorder,
            ]}
            onPress={() =>
              setStatusFilter(statusFilter === 'vencido' ? 'all' : 'vencido')
            }
          >
            <Text style={styles.summaryCountVencido}>{countVencidos}</Text>
            <Text style={styles.summaryLabelVencido}>Vencidos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.summaryBox,
              styles.summaryProximo,
              statusFilter === 'proximo' && styles.summaryActiveBorder,
            ]}
            onPress={() =>
              setStatusFilter(statusFilter === 'proximo' ? 'all' : 'proximo')
            }
          >
            <Text style={styles.summaryCountProximo}>{countProximos}</Text>
            <Text style={styles.summaryLabelProximo}>Próximos ≤30d</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.summaryBox,
              styles.summaryAlDia,
              statusFilter === 'al_dia' && styles.summaryActiveBorder,
            ]}
            onPress={() =>
              setStatusFilter(statusFilter === 'al_dia' ? 'all' : 'al_dia')
            }
          >
            <Text style={styles.summaryCountAlDia}>{countAlDia}</Text>
            <Text style={styles.summaryLabelAlDia}>Al día</Text>
          </TouchableOpacity>
        </View>

        {statusFilter !== 'all' ? (
          <TouchableOpacity
            style={styles.clearFilterBtn}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={styles.clearFilterText}>Mostrar todos ({events.length})</Text>
          </TouchableOpacity>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0E5A60" />
            <Text style={styles.loadingText}>Consultando calendario sanitario...</Text>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              {events.length === 0
                ? 'Sin refuerzos programados'
                : 'No hay registros con este estado'}
            </Text>
            <Text style={styles.emptyText}>
              {events.length === 0
                ? 'Cuando registres una vacuna o desparasitación en la ficha de una mascota, su próximo refuerzo aparecerá aquí.'
                : 'Cambia el filtro superior para ver el resto de tus recordatorios.'}
            </Text>
          </View>
        ) : (
          <View style={styles.eventList}>
            {filteredEvents.map((ev) => (
              <View key={ev.id} style={styles.eventCard}>
                <View style={styles.eventTopRow}>
                  <View style={styles.badgesGroup}>
                    <View
                      style={[
                        styles.catBadge,
                        ev.tratamiento_categoria === 'vacuna'
                          ? styles.catVacuna
                          : ev.tratamiento_categoria === 'desparasitacion_interna'
                          ? styles.catInterna
                          : styles.catExterna,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catBadgeText,
                          ev.tratamiento_categoria === 'vacuna'
                            ? styles.catVacunaText
                            : ev.tratamiento_categoria === 'desparasitacion_interna'
                            ? styles.catInternaText
                            : styles.catExternaText,
                        ]}
                      >
                        {formatCategoryLabel(ev.tratamiento_categoria)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        ev.estado === 'vencido'
                          ? styles.statusVencido
                          : ev.estado === 'proximo'
                          ? styles.statusProximo
                          : styles.statusAlDia,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          ev.estado === 'vencido'
                            ? styles.statusVencidoText
                            : ev.estado === 'proximo'
                            ? styles.statusProximoText
                            : styles.statusAlDiaText,
                        ]}
                      >
                        {renderStatusLabel(ev)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.petChip}>
                    {ev.mascota_nombre} ({ev.especie_nombre})
                  </Text>
                </View>

                <Text style={styles.treatmentTitle}>{ev.tratamiento_nombre}</Text>

                <View style={styles.datesRow}>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateLabel}>Próximo refuerzo</Text>
                    <Text style={styles.datePrimary}>{ev.fecha_proximo_refuerzo}</Text>
                  </View>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateLabel}>Última aplicación</Text>
                    <Text style={styles.dateSecondary}>{ev.fecha_aplicacion}</Text>
                  </View>
                </View>

                {ev.veterinaria_nombre ? (
                  <Text style={styles.vetText}>Clínica: {ev.veterinaria_nombre}</Text>
                ) : null}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.openPetBtn}
                    onPress={() =>
                      navigation.navigate('PetDetail', { petId: ev.mascota_id })
                    }
                  >
                    <Text style={styles.openPetBtnText}>
                      Ver carnet de {ev.mascota_nombre}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Pets')}
        >
          <Text style={styles.backButtonText}>Volver a Mis mascotas</Text>
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
  title: {
    fontSize: 24,
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
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  summaryBox: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  summaryActiveBorder: {
    borderColor: '#0E5A60',
  },
  summaryVencido: {
    backgroundColor: '#FDE8E8',
  },
  summaryProximo: {
    backgroundColor: '#FEF3C7',
  },
  summaryAlDia: {
    backgroundColor: '#DCFCE7',
  },
  summaryCountVencido: {
    fontSize: 20,
    fontWeight: '800',
    color: '#A61B1B',
  },
  summaryLabelVencido: {
    fontSize: 11,
    fontWeight: '700',
    color: '#881313',
    marginTop: 2,
  },
  summaryCountProximo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#9A4A06',
  },
  summaryLabelProximo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A3A04',
    marginTop: 2,
  },
  summaryCountAlDia: {
    fontSize: 20,
    fontWeight: '800',
    color: '#14532D',
  },
  summaryLabelAlDia: {
    fontSize: 11,
    fontWeight: '700',
    color: '#14532D',
    marginTop: 2,
  },
  clearFilterBtn: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E5A60',
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
  eventList: {
    gap: 12,
    marginBottom: 18,
  },
  eventCard: {
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    borderRadius: 12,
    padding: 14,
  },
  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    paddingVertical: 3,
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
  petChip: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A3F41',
  },
  treatmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14282A',
    marginBottom: 8,
  },
  datesRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4DDD0',
    padding: 10,
    marginBottom: 8,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#526466',
  },
  datePrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14282A',
    marginTop: 2,
  },
  dateSecondary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A3F41',
    marginTop: 2,
  },
  vetText: {
    fontSize: 12,
    color: '#526466',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  openPetBtn: {
    backgroundColor: '#E4F0F1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  openPetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E5A60',
  },
  backButton: {
    width: '100%',
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E4DDD0',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#526466',
    fontSize: 14,
    fontWeight: '600',
  },
});
