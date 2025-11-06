// screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, StatusBar, SafeAreaView,
  ScrollView, TouchableOpacity, Alert
} from 'react-native';
import axios from 'axios';

export default function RegisterScreen({ navigation }: any) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tipo, setTipo] = useState<'trabajador' | 'cliente'>('trabajador');
  const [loading, setLoading] = useState(false);

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
      await axios.post(
        'https://geolocalizacion-backend-wtnq.onrender.com/usuarios',
        { nombre, apellido, dni, email, password, tipo },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
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
            placeholderTextColor="#94A3B8"
            style={styles.input}
            autoCapitalize="words"
          />

          {/* Apellido */}
          <TextInput
            value={apellido}
            onChangeText={setApellido}
            placeholder="Apellido"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            autoCapitalize="words"
          />

          {/* DNI */}
          <TextInput
            value={dni}
            onChangeText={(t) => setDni(t.replace(/[^0-9]/g, '').slice(0, 8))}
            placeholder="DNI (8 dígitos)"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            style={styles.input}
          />

          {/* Email */}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            style={styles.input}
          />

          {/* Password */}
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña (mín. 6)"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            style={styles.input}
          />

          {/* Tipo */}
          <View style={styles.segment}>
            <Pressable
              onPress={() => setTipo('trabajador')}
              style={[styles.segmentBtn, tipo === 'trabajador' && styles.segmentActive]}
            >
              <Text style={[styles.segmentTxt, tipo === 'trabajador' && styles.segmentTxtActive]}>
                Trabajador
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTipo('cliente')}
              style={[styles.segmentBtn, tipo === 'cliente' && styles.segmentActive]}
            >
              <Text style={[styles.segmentTxt, tipo === 'cliente' && styles.segmentTxtActive]}>
                Cliente
              </Text>
            </Pressable>
          </View>

          {/* Crear cuenta */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && { opacity: 0.85 },
              (!canSubmit || loading) && { opacity: 0.5 },
            ]}
            onPress={onSubmit}
            disabled={!canSubmit || loading}
          >
            <Text style={styles.primaryTxt}>{loading ? 'Creando…' : 'Crear cuenta'}</Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'stretch',
  },

  logo: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 4,
  },

  input: {
    backgroundColor: '#1E293B',
    color: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 14,
  },

  segment: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 6,
  },
  segmentBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  segmentActive: { backgroundColor: '#22C55E22' },
  segmentTxt: { color: '#94A3B8', fontWeight: '800' },
  segmentTxtActive: { color: '#22C55E' },

  primaryBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryTxt: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  footerHint: { color: '#94A3B8' },
  footerLink: { color: '#22C55E', fontWeight: '800', marginLeft: 6 },
});
