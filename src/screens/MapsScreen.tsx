// src/screens/MapsScreen.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Text, TextInput, Platform, Alert, Image, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { fetchNearby, NearbyItem } from '../services/nearby';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from "socket.io-client";
import axios from 'axios';

interface Role {
  id: number;
  nombre: string;
}
interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  tipo: string;
  foto_url?: string;
  roles: Role[];
}

export default function MapsScreen({ navigation }: any) {
  const mapRef = useRef<MapView>(null);
  const lastSentRef = useRef<number>(0);
  const [hasProfile, setHasProfile] = useState(false);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [position, setPosition] = useState<GeoPosition | null>(null);

  const [nearby, setNearby] = useState<NearbyItem[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });

  const watchIdRef = useRef<number | null>(null);
  const firstFixDoneRef = useRef(false);
  const regionRef = useRef<Region | null>(null);
  const debounceTimerRef = useRef<any | null>(null);

  const initialRegion: Region = {
    latitude: -12.046374,
    longitude: -77.042793,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    tituloProfesional: '',
    descripcionProfesional: '',
  });
  const [publicacion, setPublicacion] = useState({
    titulo: '',
    descripcion: '',
  });

  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          console.log('Usuario cargado desde AsyncStorage:', JSON.parse(userString));
          setUser(JSON.parse(userString));
        }
      } catch (error) {
        console.log('Error cargando usuario:', error);
      }
    };

    loadUser();
  }, []);

  const askPermission = async (): Promise<boolean> => {
    const perm =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

    const res = await request(perm);
    if (res === RESULTS.GRANTED || res === RESULTS.LIMITED) return true;

    if (res === RESULTS.DENIED || res === RESULTS.BLOCKED) {
      Alert.alert('Permiso de ubicación', 'Actívalo para ver tu ubicación.');
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

  // ⚠️ Opciones: forzamos LocationManager (estable en emulador)
  const geoOpts = {
    enableHighAccuracy: Platform.OS === 'ios',
    distanceFilter: 10,
    interval: 6000,
    fastestInterval: 3000,
    timeout: 20000,
    maximumAge: 30000,
    forceLocationManager: true,
    showLocationDialog: false,
    forceRequestLocation: true,
  } as const;

  useEffect(() => {
    if (hasPermission !== true || !mapReady) return;

    let canceled = false;

    watchIdRef.current = Geolocation.watchPosition(
      (pos) => {
        if (canceled) return;
        setPosition(pos);

        console.log(
          '📍 GPS:',
          pos.coords.latitude.toFixed(6),
          pos.coords.longitude.toFixed(6),
          'Vel:', pos.coords.speed,
          'Acc:', pos.coords.accuracy
        );

        // ⭐ SOLO ENVIAR SI HAN PASADO 5 SEGUNDOS
        const now = Date.now();
        if (now - lastSentRef.current >= 5000) {
          if (user?.id) {
            console.log("Enviando ubicación de user id:", user?.roles);
            if (user?.roles[0]?.id === 1) {
              {
                socket.emit("enviarUbicacion", {
                  userId: user.id,
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude
                });
              }
            }
            if (user?.roles[0]?.id === 2) {
              socket.emit(
                "buscarCercanosTiempoReal",
                {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                  radio: 5, // km
                },
                (resp: any) => {
                  console.log("👥 Cercanos RT:", resp);
                }
              );
            }
          }

          lastSentRef.current = now;
          console.log("📡 Ubicación enviada al socket");
        }

        if (!firstFixDoneRef.current && mapRef.current) {
          firstFixDoneRef.current = true;
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

          loadNearbyByCenter(
            pos.coords.latitude,
            pos.coords.longitude,
            5
          );
        }
      },
      (err) => {
        console.warn('watchPosition error', err);
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

  useEffect(() => {
    // Conectar cuando se monta la pantalla
    socket.connect();

    const handleConnect = () => {
      console.log("🔌 Socket conectado:", socket.id);
    };

    const handleDisconnect = () => {
      console.log("❌ Socket desconectado");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Listeners de datos
    const handleUbicacionActualizada = (data: any) => {
      console.log("📡 Ubicación nueva recibida:", data);
    };

    const handleCercanosActualizados = (lista: any) => {
      console.log("👥 Cercanos actualizados:", lista);
    };

    socket.on("ubicacionActualizada", handleUbicacionActualizada);
    socket.on("cercanosActualizados", handleCercanosActualizados);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("ubicacionActualizada", handleUbicacionActualizada);
      socket.off("cercanosActualizados", handleCercanosActualizados);
      socket.disconnect(); // cerramos al salir de la pantalla
    };
  }, []);


  const onMapReady = () => setMapReady(true);

  // Servicio: pedir cercanos
  const loadNearbyByCenter = useCallback(async (lat: number, lng: number, radioKm = 5) => {
    // simple “cancelation” flag para evitar race conditions de estado
    abortRef.current.aborted = false;
    try {
      setLoadingNearby(true);
      const items = await fetchNearby(lat, lng, radioKm);
      if (!abortRef.current.aborted) setNearby(items);
    } catch (e) {
      if (!abortRef.current.aborted) {
        console.warn('fetchNearby error', e);
        // Puedes mostrar toast si quieres
      }
    } finally {
      if (!abortRef.current.aborted) setLoadingNearby(false);
    }
  }, []);

  // Debounce al mover el mapa
  const onRegionChangeComplete = (r: Region) => {
    regionRef.current = r;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      loadNearbyByCenter(r.latitude, r.longitude, 5);
    }, 600);
  };

  // Recentrar en mi ubicación
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
    loadNearbyByCenter(position.coords.latitude, position.coords.longitude, 5);
  };

  const goBack = () => {
    socket.disconnect();
    navigation.navigate('login')
  };

  useEffect(() => {
    return () => {
      // cancelar pendientes
      abortRef.current.aborted = true;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const fetchProfile = async () => {
    if (!user?.id) {
      console.log('No hay user.id aún, no se puede pedir el perfil');
      return;
    }

    try {
      const url =
        'https://geolocalizacion-backend-wtnq.onrender.com/perfil-profesional/' + user.id;

      console.log('GET perfil:', url);

      const res = await fetch(url);
      console.log('Status GET:', res.status);

      if (!res.ok) {
        if (res.status === 404) {
          console.log('Usuario sin perfil, inicializando vacío');
          setHasProfile(false);   // 👈 no tiene perfil aún
          setFormData({
            tituloProfesional: '',
            descripcionProfesional: '',
          });
          return;
        }

        const errText = await res.text();
        console.log('Error body:', errText);
        return;
      }

      const text = await res.text();
      console.log('Respuesta cruda GET:', text);

      if (!text.trim()) {
        console.log('Respuesta vacía');
        setHasProfile(false);
        return;
      }

      const data = JSON.parse(text);

      setFormData({
        tituloProfesional: data.tituloProfesional ?? '',
        descripcionProfesional: data.descripcionProfesional ?? '',
      });

      setHasProfile(true);   // 👈 ya tiene perfil

    } catch (error) {
      console.log('Error al obtener perfil:', error);
    }
  };



  const toggleMenu = () => {
    const next = !menuOpen;
    setMenuOpen(next);
    if (next) {
      fetchProfile(); // cada vez que lo abras, actualiza desde el backend
    }
  };
  const saveProfile = async () => {
    if (!user?.id) {
      alert('Usuario no cargado, no se puede guardar el perfil.');
      return;
    }

    console.log('Guardando perfil para usuario id:', user.id, formData);

    try {
      setSaving(true);

      const res = await fetch(
        'https://geolocalizacion-backend-wtnq.onrender.com/perfil-profesional/' + user.id,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tituloProfesional: formData.tituloProfesional,
            descripcionProfesional: formData.descripcionProfesional,
            usuario: { id: user.id }, // asocia al usuario
          }),
        }
      );

      console.log('Status POST:', res.status);
      const text = await res.text();
      console.log('Respuesta POST:', text);

      if (!res.ok) {
        alert('Error al guardar el perfil: ' + res.status);
        return;
      }

      alert('Perfil guardado correctamente');
      setHasProfile(true);
      fetchProfile(); // refresca datos

    } catch (error) {
      console.log('Error al guardar perfil:', error);
      alert('Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = async () => {
    if (!user?.id) {
      alert('Usuario no cargado, no se puede actualizar el perfil.');
      return;
    }

    console.log('Actualizando perfil para usuario id:', user.id, formData);

    try {
      setSaving(true);

      const res = await fetch(
        'https://geolocalizacion-backend-wtnq.onrender.com/perfil-profesional/' + user.id,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tituloProfesional: formData.tituloProfesional,
            descripcionProfesional: formData.descripcionProfesional,
            usuario: { id: user.id }, // por si tu backend lo requiere también
          }),
        }
      );

      console.log('Status PATCH:', res.status);
      const text = await res.text();
      console.log('Respuesta PATCH:', text);

      if (!res.ok) {
        alert('Error al actualizar el perfil: ' + res.status);
        return;
      }

      alert('Perfil actualizado correctamente');
      fetchProfile(); // refresca datos

    } catch (error) {
      console.log('Error al actualizar perfil:', error);
      alert('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const savePublicacion = async () => {
    try {
      setSaving(true);

      await axios.post(
        'https://geolocalizacion-backend-wtnq.onrender.com/publicacion',
        {
          titulo: publicacion.titulo,
          descripcion: publicacion.descripcion,
          usuarioId: user?.id,
        },
        { timeout: 15000 }
      );

      Alert.alert('Éxito', 'Publicación creada correctamente');
      setHasProfile(true);
    } catch (error: any) {
      console.log(error?.response?.data || error.message);
      Alert.alert('Error', 'No se pudo crear la publicación');
    } finally {
      setSaving(false);
    }
  };


  return (
    <View style={styles.container}>
      {hasPermission === true && (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          onMapReady={onMapReady}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {/* Marcadores de cercanos */}
          {nearby.map((item) => {
            // BACKEND: coordinates = [lng, lat]
            const [lng, lat] = item.location.coordinates;
            const title = `${item.name ?? ''}${item.last_name ? ' ' + item.last_name : ''}`;
            const desc = item.description ?? '';

            return (
              <Marker
                key={item._id}
                coordinate={{ latitude: lat, longitude: lng }}
                title={title}
                description={desc}
              >
                {/* Icono circular con foto si existe */}
                <View style={styles.pinWrap}>
                  {item.photo_url ? (
                    <Image
                      source={{ uri: item.photo_url }}
                      style={styles.pinImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.pinFallback}>
                      <Text style={styles.pinFallbackTxt}>
                        {(item.name?.[0] ?? 'U').toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </Marker>
            );
          })}
        </MapView>
      )}

      {/* FABs */}
      <Pressable style={styles.fabPrimary} onPress={goBack}>
        <Text style={styles.fabText}>Volver</Text>
      </Pressable>

      <Pressable style={styles.fabSecondary} onPress={onRecenter}>
        <Text style={styles.fabText}>{loadingNearby ? 'Cargando…' : 'Centrar'}</Text>
      </Pressable>

      {/* MENÚ SUPERIOR */}
      <View style={styles.topMenu}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuBtn}>
          <Text style={styles.menuBtnText}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* FORMULARIO DESPLEGABLE */}
      {menuOpen && (
        <View style={styles.dropdown}>
          {/* PERFIL PROFESIONAL */}
          <Text style={styles.dropdownTitle}>Perfil profesional</Text>

          <TextInput
            placeholder="Título profesional"
            style={styles.input}
            value={formData.tituloProfesional}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, tituloProfesional: text }))
            }
          />

          <TextInput
            placeholder="Descripción profesional"
            style={styles.input}
            multiline
            value={formData.descripcionProfesional}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, descripcionProfesional: text }))
            }
          />

          <Pressable
            style={styles.submitBtn}
            onPress={hasProfile ? updateProfile : saveProfile}
            disabled={saving}
          >
            <Text style={styles.submitTxt}>
              {saving
                ? hasProfile
                  ? 'Actualizando perfil...'
                  : 'Guardando perfil...'
                : hasProfile
                  ? 'Actualizar perfil'
                  : 'Guardar perfil'}
            </Text>
          </Pressable>

          {/* PUBLICACIÓN */}
          <Text style={styles.dropdownTitle}>Publicación</Text>

          <TextInput
            placeholder="Título"
            style={styles.input}
            value={publicacion.titulo}
            onChangeText={(text) =>
              setPublicacion((prev) => ({ ...prev, titulo: text }))
            }
          />

          <TextInput
            placeholder="Descripción"
            style={styles.input}
            multiline
            value={publicacion.descripcion}
            onChangeText={(text) =>
              setPublicacion((prev) => ({ ...prev, descripcion: text }))
            }
          />

          <Pressable
            style={styles.submitBtn}
            onPress={savePublicacion}
            disabled={saving}
          >
            <Text style={styles.submitTxt}>
              Actualizar publicación
            </Text>
          </Pressable>
        </View>
      )}


      {/* FABs */}
      <Pressable style={styles.fabPrimary} onPress={goBack}>
        <Text style={styles.fabText}>Volver</Text>
      </Pressable>

      <Pressable style={styles.fabSecondary} onPress={onRecenter}>
        <Text style={styles.fabText}>{loadingNearby ? 'Cargando…' : 'Centrar'}</Text>
      </Pressable>
    </View>
  );
}

// Conexión global al socket
const socket = io("https://geolocalizacion-backend-wtnq.onrender.com", {
  transports: ["websocket"],
  autoConnect: false, // lo manejamos manualmente
});

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Pin con foto circular
  pinWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#16A34A',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinImg: { width: 38, height: 38 },
  pinFallback: {
    width: 38, height: 38, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#DCFCE7',
  },
  pinFallbackTxt: { color: '#065F46', fontWeight: '900' },

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




  topMenu: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 20,
  },

  menuBtn: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    elevation: 4,
  },

  menuBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  dropdown: {
    position: 'absolute',
    top: 70,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    elevation: 6,
    zIndex: 50,
  },

  dropdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  input: {
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  submitBtn: {
    backgroundColor: '#0A84FF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  submitTxt: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },


});
