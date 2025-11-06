// src/screens/MapsScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text, Platform, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { indriveMapStyle } from '../styles/mapStyle';
import { openSettings, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';

type RootStackParamList = { login: undefined; maps: undefined };
type MapsNav = NativeStackNavigationProp<RootStackParamList, 'maps'>;
type Props = { navigation: MapsNav };

export default function MapsScreen({ navigation }: Props) {
  const mapRef = useRef<MapView>(null);
  const watchIdRef = useRef<number | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [pendingPos, setPendingPos] = useState<GeoPosition | null>(null); // por si llega pos antes del mapa
  const [position, setPosition] = useState<GeoPosition | null>(null);

  const initialRegion: Region = {
    latitude: -12.046374,
    longitude: -77.042793,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const askPermission = async (): Promise<boolean> => {
    const perm = Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

    const res = await request(perm);
    if (res === RESULTS.GRANTED || res === RESULTS.LIMITED) return true;

    if (res === RESULTS.BLOCKED || res === RESULTS.DENIED) {
      Alert.alert('Permiso de ubicación', 'Actívalo para ver tu ubicación.', [
        { text: 'Abrir ajustes', onPress: () => openSettings() },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
    return false;
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const ok = await askPermission();
        if (!mounted) return;
        setHasPermission(ok);
        if (!ok) return;

        // Posición inicial
        Geolocation.getCurrentPosition(
          pos => {
            if (!mounted) return;
            setPosition(pos);
            // Si el mapa aún no está listo, guardamos para animar luego
            if (!mapReady) setPendingPos(pos);
            else animateTo(pos);
          },
          err => {
            console.warn('getCurrentPosition error', err);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );

        // Watch
        watchIdRef.current = Geolocation.watchPosition(
          pos => {
            if (!mounted) return;
            setPosition(pos);
          },
          err => console.warn('watchPosition error', err),
          { enableHighAccuracy: true, distanceFilter: 5, interval: 5000, fastestInterval: 2000 }
        );
      } catch (e) {
        console.warn('init location failed', e);
      }
    })();

    return () => {
      mounted = false;
      if (watchIdRef.current != null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      Geolocation.stopObserving();
    };
  }, [mapReady]); // cuando el mapa pasa a ready, podremos animar si teníamos pendingPos

  const animateTo = (pos: GeoPosition) => {
    try {
      mapRef.current?.animateCamera(
        { center: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }, zoom: 16 },
        { duration: 600 }
      );
    } catch (e) {
      console.warn('animateCamera error', e);
    }
  };

  const onMapReady = () => {
    setMapReady(true);
    // si llegó la posición antes, anímala ahora
    if (pendingPos) {
      animateTo(pendingPos);
      setPendingPos(null);
    }
  };

  const onRecenter = () => {
    if (position && mapReady) animateTo(position);
  };

  const goBack = () => navigation.navigate('login');

  return (
    <View style={styles.container}>
      {/* ⚠️ No renderizar el mapa hasta tener decisión de permiso */}
      {hasPermission === true && (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          customMapStyle={indriveMapStyle}
          showsUserLocation   // opcional, si quieres el punto azul
          onMapReady={onMapReady}
        >
          <Marker
            coordinate={{ latitude: initialRegion.latitude, longitude: initialRegion.longitude }}
            title="Punto inicial"
            description="Ejemplo en Lima"
          />
        </MapView>
      )}

      <Pressable style={styles.fabPrimary} onPress={goBack}>
        <Text style={styles.fabText}>Volver</Text>
      </Pressable>

      <Pressable style={styles.fabSecondary} onPress={onRecenter}>
        <Text style={styles.fabText}>Centrar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fabPrimary: {
    position: 'absolute', right: 16, bottom: 16,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 30,
    backgroundColor: '#00C853', elevation: 6,
  },
  fabSecondary: {
    position: 'absolute', right: 16, bottom: 72,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 30,
    backgroundColor: '#333', elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '700' },
});
