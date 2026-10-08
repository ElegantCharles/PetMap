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
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ALERTAS SANITARIAS · S9</Text>
        </View>
        <Text style={styles.title}>Calendario de Refuerzos</Text>
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
            <ActivityIndicator size="large" color="#2563EB" />
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
                      Ir al Carnet de {ev.mascota_nombre} →
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
          <Text style={styles.backButtonText}>Volver a Mis Mascotas</Text>
        </TouchableOpacity>
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
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  badgeText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
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
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  summaryActiveBorder: {
    borderColor: '#111827',
  },
  summaryVencido: {
    backgroundColor: '#FEE2E2',
  },
  summaryProximo: {
    backgroundColor: '#FEF3C7',
  },
  summaryAlDia: {
    backgroundColor: '#D1FAE5',
  },
  summaryCountVencido: {
    fontSize: 20,
    fontWeight: '800',
    color: '#B91C1C',
  },
  summaryLabelVencido: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
    marginTop: 2,
  },
  summaryCountProximo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#B45309',
  },
  summaryLabelProximo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 2,
  },
  summaryCountAlDia: {
    fontSize: 20,
    fontWeight: '800',
    color: '#047857',
  },
  summaryLabelAlDia: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    marginTop: 2,
  },
  clearFilterBtn: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
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
  eventList: {
    gap: 12,
    marginBottom: 18,
  },
  eventCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    borderRadius: 999,
  },
  catVacuna: {
    backgroundColor: '#DBEAFE',
  },
  catInterna: {
    backgroundColor: '#F3E8FF',
  },
  catExterna: {
    backgroundColor: '#CCFBF1',
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  catVacunaText: {
    color: '#1D4ED8',
  },
  catInternaText: {
    color: '#6B21A8',
  },
  catExternaText: {
    color: '#0F766E',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusVencido: {
    backgroundColor: '#FEE2E2',
  },
  statusProximo: {
    backgroundColor: '#FEF3C7',
  },
  statusAlDia: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusVencidoText: {
    color: '#B91C1C',
  },
  statusProximoText: {
    color: '#B45309',
  },
  statusAlDiaText: {
    color: '#065F46',
  },
  petChip: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  treatmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  datesRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
    marginBottom: 8,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  datePrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  dateSecondary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 2,
  },
  vetText: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  openPetBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  openPetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  backButton: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
});
