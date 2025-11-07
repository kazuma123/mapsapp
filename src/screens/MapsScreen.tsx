// src/screens/MapsScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text, PermissionsAndroid, Platform, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';

const initialRegion: Region = {
  latitude: -12.046374,
  longitude: -77.042793,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

async function ensureLocationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      const fine = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permiso de ubicación',
          message: 'Necesitamos tu ubicación para centrar el mapa.',
          buttonPositive: 'OK',
        }
      );
      return fine === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      // iOS: pide autorización al framework de ubicación
      const res = await Geolocation.requestAuthorization('whenInUse');
      return res === 'granted';
    }
  } catch (e) {
    console.warn('ensureLocationPermission error', e);
    return false;
  }
}

export default function MapsScreen() {
  const mapRef = useRef<MapView>(null);
  const watchIdRef = useRef<number | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState(false);
  const [position, setPosition] = useState<GeoPosition | null>(null);

  // 1) Pedir permiso y empezar a leer ubicación
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const ok = await ensureLocationPermission();
      if (cancelled) return;

      setHasPermission(ok);
      if (!ok) {
        Alert.alert('Permiso de ubicación', 'Actívalo en ajustes para ver tu ubicación.');
        return;
      }

      // Posición inicial
      Geolocation.getCurrentPosition(
        pos => {
          if (cancelled) return;
          setPosition(pos);
        },
        err => {
          console.warn('getCurrentPosition error', err);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );

      // Watch en segundo plano
      watchIdRef.current = Geolocation.watchPosition(
        pos => {
          if (cancelled) return;
          setPosition(pos);
        },
        err => console.warn('watchPosition error', err),
        { enableHighAccuracy: true, distanceFilter: 5, interval: 5000, fastestInterval: 2000 }
      );
    })();

    return () => {
      cancelled = true;
      if (watchIdRef.current != null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      Geolocation.stopObserving?.();
    };
  }, []);

  // 2) Cuando haya posición y el mapa esté listo, animar cámara
  useEffect(() => {
    if (!mapReady || !position) return;
    try {
      mapRef.current?.animateCamera(
        {
          center: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          zoom: 16,
        },
        { duration: 600 }
      );
    } catch (e) {
      console.warn('animateCamera error', e);
    }
  }, [mapReady, position]);

  const onMapReady = () => setMapReady(true);

  return (
    <View style={styles.container}>
      {/* No renderizamos el mapa hasta que el permiso sea verdadero */}
      {hasPermission && (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          onMapReady={onMapReady}
          showsUserLocation={true}           // ya es seguro porque hasPermission === true
          showsMyLocationButton={Platform.OS === 'android'}
        >
          {/* Marcador de ejemplo mientras llega la posición real */}
          {!position && (
            <Marker
              coordinate={{ latitude: initialRegion.latitude, longitude: initialRegion.longitude }}
              title="Punto inicial"
              description="Ejemplo en Lima"
            />
          )}
        </MapView>
      )}

      <Pressable
        style={[styles.fab, styles.fabCenter]}
        onPress={() => {
          if (position && mapReady) {
            mapRef.current?.animateCamera(
              {
                center: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                },
                zoom: 16,
              },
              { duration: 500 }
            );
          }
        }}
      >
        <Text style={styles.fabText}>Centrar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 6,
    backgroundColor: '#00C853',
  },
  fabCenter: { bottom: 16 },
  fabText: { color: '#fff', fontWeight: '700' },
});
