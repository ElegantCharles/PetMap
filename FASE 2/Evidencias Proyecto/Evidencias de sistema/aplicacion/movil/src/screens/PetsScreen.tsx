import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import type { PetsScreenProps } from '../navigation/types';
import { API_CONFIG } from '../config/api';
import { getSession, clearSession, AuthUser } from '../services/auth';

export default function PetsScreen({ navigation }: PetsScreenProps) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      const session = await getSession();
      if (mounted && session?.user) {
        setUser(session.user);
      }
    }
    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await clearSession();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>SESIÓN ACTIVA · JWT VERIFICADO</Text>
        </View>

        <Text style={styles.title}>
          {user ? `Hola, ${user.nombre_completo}` : 'Mis Mascotas'}
        </Text>

        {user ? (
          <Text style={styles.userEmail}>{user.email}</Text>
        ) : null}

        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Sin mascotas registradas aún</Text>
          <Text style={styles.emptyText}>
            Tu cuenta de tutor está activa. En el siguiente módulo podrás registrar a tus mascotas y su esquema de vacunas.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Text style={styles.buttonText}>Explorar Mapa Veterinario</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>API conectada en:</Text>
        <Text style={styles.footerValue}>{API_CONFIG.BASE_URL}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  statusBadgeText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
  },
  emptyBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
  primaryButton: {
    width: '100%',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    width: '100%',
    backgroundColor: '#FEE2E2',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
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
