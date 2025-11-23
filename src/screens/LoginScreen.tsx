// screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, StatusBar, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

export default function LoginScreen({ navigation }: any) {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = dni.length === 8 && password.length >= 6;

  const handleLoginPress = async () => {
    if (!canSubmit) {
      Alert.alert('Completa los campos', 'DNI de 8 dígitos y contraseña (>=6).');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', { dni, password });
      const token = res.data?.token || res.data?.accessToken || res.data?.jwt;
      if (token) await AsyncStorage.setItem('auth_token', String(token));
      if (res.data?.user) await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      Alert.alert('Bienvenido', 'Inicio de sesión exitoso.');
      navigation.navigate('maps', res.data?.user);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        'No se pudo iniciar sesión. Verifica tus credenciales.';
      Alert.alert('Error', msg);
      console.log('login error:', e?.response?.data || e?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Text style={styles.logo}>MapsApp</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

          {/* DNI */}
          <TextInput
            value={dni}
            onChangeText={(t) => setDni(t.replace(/[^0-9]/g, '').slice(0, 8))}
            placeholder="DNI"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            style={styles.input}
          />

          {/* Contraseña */}
          <View style={styles.passwordWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!isPasswordVisible}
              style={[styles.input, { paddingRight: 44 }]}
            />
            <Pressable
              onPress={() => setIsPasswordVisible((v) => !v)}
              style={styles.eyeBtn}
            >
              <Text style={{ fontSize: 18 }}>{isPasswordVisible ? '🙈' : '👁️'}</Text>
            </Pressable>
          </View>

          {/* Botón principal */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && { opacity: 0.9 },
              (!canSubmit || loading) && { opacity: 0.6 },
            ]}
            onPress={handleLoginPress}
            disabled={!canSubmit || loading}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.primaryTxt}>Entrar</Text>}
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerTxt}>o</Text>
            <View style={styles.divider} />
          </View>

          {/* Google */}
          <Pressable
            style={({ pressed }) => [styles.oauthBtn, pressed && { opacity: 0.85 }]}
            onPress={() => Alert.alert('Google', 'Integrar OAuth próximamente')}
          >
            <Text style={styles.oauthTxt}>Continuar con Google</Text>
          </Pressable>

          {/* Crear cuenta */}
          <View style={styles.signupRow}>
            <Text style={styles.signupHint}>¿No tienes cuenta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('register')}>
              <Text style={styles.signupLink}>Crear una cuenta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB', // blanco suave
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 42,
    color: '#16A34A', // verde moderno
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#FFFFFF',
    color: '#111827',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  passwordWrap: { position: 'relative', justifyContent: 'center' },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#16A34A',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryTxt: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerTxt: { color: '#9CA3AF', marginHorizontal: 12, fontSize: 13 },
  oauthBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  oauthTxt: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  signupHint: { color: '#6B7280', fontSize: 15 },
  signupLink: {
    color: '#16A34A',
    fontWeight: '800',
    marginLeft: 6,
  },
});
