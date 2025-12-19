// screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, StatusBar, SafeAreaView,
  ScrollView, TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';

export default function RegisterScreen({ navigation }: any) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState<any>(null);

  const canSubmit =
    nombre.trim().length > 0 &&
    apellido.trim().length > 0 &&
    dni.length === 8 &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 6;

  const onSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Datos inválidos', 'Revisa los campos del formulario.');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      // JSON en key "data"
      formData.append(
        'body',
        JSON.stringify({
          nombre,
          apellido,
          email,
          descripcion,
          dni,
          password,
          rolId: rol,
        })
      );

      // archivo en key "foto"
      if (foto) {
        formData.append('foto', foto);
      }

      await axios.post(
        'https://geolocalizacion-backend-wtnq.onrender.com/usuarios',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 20000,
        }
      );

      Alert.alert('Éxito', 'Cuenta creada correctamente.', [
        { text: 'OK', onPress: () => navigation.navigate('login') },
      ]);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        'No se pudo crear la cuenta. Intenta más tarde.';
      Alert.alert('Error', msg);
      console.log('register error:', e?.response?.data || e?.message);
    } finally {
      setLoading(false);
    }
  };


  const pickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.7,
        selectionLimit: 1,
      },
      (response) => {
        if (response.didCancel) return;

        if (response.errorCode) {
          Alert.alert('Error', 'No se pudo seleccionar la imagen');
          return;
        }

        const asset = response.assets?.[0];
        if (!asset?.uri) return;

        setFoto({
          uri: asset.uri,
          name: asset.fileName || 'foto.jpg',
          type: asset.type || 'image/jpeg',
        });
      }
    );
  };


  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.logo}>MapsApp</Text>
          <Text style={styles.subtitle}>Crea tu cuenta</Text>

          {/* Nombre */}
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="next"
          />

          {/* Apellido */}
          <TextInput
            value={apellido}
            onChangeText={setApellido}
            placeholder="Apellido"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="next"
          />

          {/* DNI */}
          <TextInput
            value={dni}
            onChangeText={(t) => setDni(t.replace(/[^0-9]/g, '').slice(0, 8))}
            placeholder="DNI (8 dígitos)"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            style={styles.input}
            returnKeyType="next"
          />

          {/* Email */}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            style={styles.input}
            returnKeyType="next"
          />

          {/* Password */}
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña (mín. 6)"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            style={styles.input}
            returnKeyType="done"
          />

          {/* Rol */}
          <View style={styles.segment}>
            <Pressable
              onPress={() => setRol(1)}
              style={[styles.segmentBtn, rol === 1 && styles.segmentActive]}
            >
              <Text style={[styles.segmentTxt, rol === 1 && styles.segmentTxtActive]}>
                Trabajador
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRol(2)}
              style={[styles.segmentBtn, rol === 2 && styles.segmentActive]}
            >
              <Text style={[styles.segmentTxt, rol === 2 && styles.segmentTxtActive]}>
                Empresa
              </Text>
            </Pressable>
          </View>

          {/* Descripción */}
          <TextInput
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Descripción del servicio"
            placeholderTextColor="#9CA3AF"
            style={[styles.input, { height: 90 }]}
            multiline
          />

          <Pressable
            style={[styles.primaryBtn, { backgroundColor: '#4B5563' }]}
            onPress={pickImage}
          >
            <Text style={styles.primaryTxt}>
              {foto ? 'Foto seleccionada' : 'Seleccionar foto'}
            </Text>
          </Pressable>


          {/* Crear cuenta */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && { opacity: 0.9 },
              (!canSubmit || loading) && { opacity: 0.6 },
            ]}
            onPress={onSubmit}
            disabled={!canSubmit || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryTxt}>Crear cuenta</Text>}
          </Pressable>

          {/* Volver / Ya tengo cuenta */}
          <View style={styles.footerRow}>
            <Text style={styles.footerHint}>¿Ya tienes cuenta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('login')}>
              <Text style={styles.footerLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const GREEN = '#16A34A';
const INK = '#111827';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' }, // blanco suave
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 28,
  },

  logo: {
    fontSize: 38,
    color: GREEN,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 22,
    marginTop: 6,
  },

  input: {
    backgroundColor: '#FFFFFF',
    color: INK,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 14,

    // sombra sutil
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  segment: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 10,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  segmentBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  segmentActive: { backgroundColor: '#E6F9EF' },
  segmentTxt: { color: '#6B7280', fontWeight: '800' },
  segmentTxtActive: { color: GREEN },

  primaryBtn: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,

    shadowColor: GREEN,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryTxt: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  footerHint: { color: '#6B7280', fontSize: 15 },
  footerLink: { color: GREEN, fontWeight: '800', marginLeft: 6 },
});
