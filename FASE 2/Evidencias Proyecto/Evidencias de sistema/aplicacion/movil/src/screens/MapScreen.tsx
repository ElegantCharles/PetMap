import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { MapScreenProps } from '../navigation/types';
import { IconMapPin, PrimaryButton, TopBar } from '../components';
import { colors, radii, type as t } from '../theme';

// Pantalla provisoria: el mapa real (MapLibre + geolocalización) llega en una fase posterior.
export default function MapScreen({ navigation }: MapScreenProps) {
  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.column}>
        <TopBar title="Mapa veterinario" onBack={goBack} />

        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.icon}>
              <IconMapPin size={30} color={colors.teal} />
            </View>
            <Text style={[t.cardTitle, { color: colors.ink, textAlign: 'center' }]}>
              El mapa llega pronto
            </Text>
            <Text style={[t.body, { color: colors.inkSoft, textAlign: 'center' }]}>
              Vas a poder buscar clínicas, laboratorios, peluquerías y tiendas para tu mascota cerca de ti.
            </Text>
            <PrimaryButton
              label="Ver mis mascotas"
              onPress={() => navigation.navigate('Pets')}
              style={{ alignSelf: 'stretch', marginTop: 8 }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
