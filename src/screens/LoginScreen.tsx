// screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, Pressable,
    KeyboardAvoidingView, Platform, StatusBar, TouchableOpacity,
    SafeAreaView, ScrollView, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api'; // 👈 ajusta la ruta si cambió

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
            const res = await api.post('/auth/login', {
                dni,
                password,
            });

            // Asumimos que el backend devuelve { token, user, ... }.
            // Si el nombre de la propiedad difiere, ajusta aquí:
            const token = res.data?.token || res.data?.accessToken || res.data?.jwt;

            if (token) {
                await AsyncStorage.setItem('auth_token', String(token));
            }
            // Puedes guardar también el usuario si el backend lo envía:
            if (res.data?.user) {
                await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
            }

            Alert.alert('Bienvenido', 'Inicio de sesión exitoso.');
            navigation.navigate('maps');
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

    const handleGoogleLogin = () => {
        // Placeholder, tu flujo OAuth iría aquí
        Alert.alert('Google', 'Integrar OAuth más adelante.');
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
                <View style={styles.container}>
                    <Text style={styles.logo}>MapsApp</Text>
                    <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

                    {/* DNI */}
                    <TextInput
                        value={dni}
                        onChangeText={(t) => setDni(t.replace(/[^0-9]/g, '').slice(0, 8))}
                        placeholder="DNI"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        style={styles.input}
                    />

                    {/* Contraseña */}
                    <View style={styles.passwordWrap}>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Contraseña"
                            placeholderTextColor="#94A3B8"
                            secureTextEntry={!isPasswordVisible}
                            style={[styles.input, { paddingRight: 44 }]}
                        />
                        <Pressable
                            onPress={() => setIsPasswordVisible((v) => !v)}
                            style={styles.eyeBtn}
                            accessibilityRole="button"
                        >
                            <Text style={{ fontSize: 18 }}>{isPasswordVisible ? '🙈' : '👁️'}</Text>
                        </Pressable>
                    </View>

                    {/* Botón principal */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.primaryBtn,
                            pressed && { opacity: 0.8 },
                            (!canSubmit || loading) && { opacity: 0.5 },
                        ]}
                        onPress={handleLoginPress}
                        disabled={!canSubmit || loading}
                    >
                        <Text style={styles.primaryTxt}>{loading ? 'Ingresando…' : 'Entrar'}</Text>
                    </Pressable>

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerTxt}>o</Text>
                        <View style={styles.divider} />
                    </View>

                    {/* Google */}
                    <Pressable
                        style={({ pressed }) => [styles.oauthBtn, pressed && { opacity: 0.8 }]}
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
    safe: { flex: 1, backgroundColor: '#0F172A' },
    container: {
        flex: 1,
        paddingHorizontal: 28,
        alignItems: 'stretch',
        justifyContent: 'center',
    },

    logo: {
        fontSize: 38,
        color: '#FFFFFF',
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        color: '#94A3B8',
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 28,
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
        marginBottom: 16,
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
        backgroundColor: '#22C55E',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 4,
    },
    primaryTxt: {
        color: 'white',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.3,
    },

    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    divider: { flex: 1, height: 1, backgroundColor: '#334155' },
    dividerTxt: { color: '#64748B', marginHorizontal: 12, fontSize: 13 },

    oauthBtn: {
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#334155',
        paddingVertical: 13,
        alignItems: 'center',
    },
    oauthTxt: {
        color: '#E2E8F0',
        fontWeight: '700',
        fontSize: 15,
    },

    signupRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    signupHint: { color: '#94A3B8' },
    signupLink: {
        color: '#22C55E',
        fontWeight: '800',
        marginLeft: 6,
    },
});