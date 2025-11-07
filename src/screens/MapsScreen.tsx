// src/screens/MapsScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text, Platform, Alert, StyleSheet as RNStyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import { PERMISSIONS, request, RESULTS, openSettings } from 'react-native-permissions';

export default function MapsScreen({ navigation }: any) {
  const mapRef = useRef<MapView>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [position, setPosition] = useState<GeoPosition | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const firstFixDoneRef = useRef(false);

  const initialRegion: Region = {
    latitude: -12.046374,
    longitude: -77.042793,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const askPermission = async (): Promise<boolean> => {
    const perm =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

    const res = await request(perm);
    if (res === RESULTS.GRANTED || res === RESULTS.LIMITED) return true;

    if (res === RESULTS.DENIED || res === RESULTS.BLOCKED) {
      Alert.alert(
        'Permiso de ubicación',
        'Actívalo para ver tu ubicación.',
        [
          { text: 'Abrir ajustes', onPress: openSettings },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
    }
    return false;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await askPermission();
      if (!mounted) return;
      setHasPermission(ok);
    })();
    return () => { mounted = false; };
  }, []);

  // ⚠️ Opciones: forzamos LocationManager (evita Play Services/Fused)
  const geoOpts = {
    // Importante en EMULADOR ANDROID: mejor false para evitar cierres
    enableHighAccuracy: Platform.OS === 'ios',
    distanceFilter: 10,
    interval: 6000,
    fastestInterval: 3000,
    timeout: 20000,
    maximumAge: 30000,

    // 👉 clave para evitar el crash del proveedor Fused:
    forceLocationManager: true,

    // Evita diálogos nativos en AVD
    showLocationDialog: false,

    // Algunas builds necesitan esto para reintentar
    forceRequestLocation: true,
  } as const;

  useEffect(() => {
    if (hasPermission !== true || !mapReady) return;

    let canceled = false;

    // Solo WATCH (no usamos getCurrentPosition)
    watchIdRef.current = Geolocation.watchPosition(
      (pos) => {
        if (canceled) return;
        setPosition(pos);

        // Animar solo la primera lectura
        if (!firstFixDoneRef.current && mapRef.current) {
          firstFixDoneRef.current = true;
          try {
            mapRef.current.animateCamera(
              {
                center: {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                },
                zoom: 16,
              },
              { duration: 600 }
            );
          } catch (e) {
            // Si algo fallara al animar, no tumbes la app
            console.warn('animateCamera error', e);
          }
        }
      },
      (err) => {
        console.warn('watchPosition error', err);
        // En emulador, recuerda: ⋮ More → Location → Set location
      },
      geoOpts
    );

    return () => {
      canceled = true;
      if (watchIdRef.current != null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      Geolocation.stopObserving();
    };
  }, [hasPermission, mapReady]);

  const onMapReady = () => setMapReady(true);

  const onRecenter = () => {
    if (!mapRef.current || !position) return;
    mapRef.current.animateCamera(
      {
        center: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        zoom: 16,
      },
      { duration: 600 }
    );
  };

  const goBack = () => navigation.navigate('login');

  return (
    <View style={styles.container}>
      {hasPermission === true && (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          onMapReady={onMapReady}
          // Mantenemos este ON ahora que solo renderizamos con permiso:
          showsUserLocation
          showsMyLocationButton={false}
        >
          {/* Marcador de ejemplo */}
          <Marker
            coordinate={{ latitude: initialRegion.latitude, longitude: initialRegion.longitude }}
            title="Punto inicial"
            description="Ejemplo en Lima"
          />
        </MapView>
      )}

      {/* FABs */}
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
