// screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    TouchableOpacity,
    Image,
} from 'react-native';

export default function LoginScreen({ navigation }) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // 👉 Función para manejar "Entrar"
    const handleLoginPress = () => {
        console.log('Entrar presionado');
        navigation.navigate('Map');
    };

    // 👉 Función para manejar "Continuar con Google"
    const handleGoogleLogin = () => {
        console.log('Login con Google presionado');
        navigation.navigate('Map'); // o podrías usar otra ruta, según prefieras
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            {/* Header decorativo */}
            <View style={styles.header}>
                <View style={styles.bubbleXL} />
                <View style={styles.bubbleSM} />
                <Text style={styles.brand}>MapsApp</Text>
                <Text style={styles.subtitle}>Bienvenido 👋</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.select({ ios: 'padding', android: undefined })}
                style={styles.flex}
            >
                <View style={styles.card}>
                    <Text style={styles.title}>Iniciar sesión</Text>

                    {/* Email */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Correo</Text>
                        <TextInput
                            placeholder="tucorreo@ejemplo.com"
                            placeholderTextColor="#9AA3AF"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            textContentType="emailAddress"
                            style={styles.input}
                        />
                    </View>

                    {/* Password */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Contraseña</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                placeholder="••••••••"
                                placeholderTextColor="#9AA3AF"
                                secureTextEntry={!isPasswordVisible}
                                autoComplete="password"
                                textContentType="password"
                                style={[styles.input, styles.inputPassword]}
                            />
                            <Pressable
                                onPress={() => setIsPasswordVisible(v => !v)}
                                accessibilityRole="button"
                                accessibilityLabel={
                                    isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'
                                }
                                style={styles.eyeBtn}
                            >
                                <Text style={styles.eyeTxt}>{isPasswordVisible ? '🙈' : '👁️'}</Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Recordarme + Olvidé */}
                    <View style={styles.rowBetween}>
                        <Pressable style={styles.rememberWrap}>
                            <View style={styles.checkbox} />
                            <Text style={styles.rememberTxt}>Recuérdame</Text>
                        </Pressable>
                        <TouchableOpacity>
                            <Text>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>
                    </View>

                    <Pressable
                        style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                        onPress={handleLoginPress}
                    >
                        <Text style={styles.primaryTxt}>Entrar</Text>
                    </Pressable>

                    <View style={styles.dividerRow}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerTxt}>o</Text>
                        <View style={styles.divider} />
                    </View>

                    {/* Google */}
                    <Pressable style={({ pressed }) => [styles.oauthBtn, pressed && styles.pressed]} onPress={handleGoogleLogin}>
                        <View style={styles.oauthIconWrap}>
                            {/* Si no tienes un logo, este círculo con “G” funciona como placeholder */}
                            {/* También puedes usar una imagen si tienes el asset: */}
                            {/* <Image source={require('../assets/google.png')} style={{ width: 18, height: 18 }} /> */}
                            <View style={styles.gLogoCircle}>
                                <Text style={styles.gLogoText}>G</Text>
                            </View>
                        </View>
                        <Text style={styles.oauthTxt}>Continuar con Google</Text>
                        <View style={{ width: 24 }} />
                    </Pressable>

                    {/* Registrar */}
                    <View style={styles.signupRow}>
                        <Text style={styles.signupHint}>¿No tienes cuenta?</Text>
                        <TouchableOpacity>
                            <Text style={styles.signupLink}>Crear una cuenta</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0F172A' }, // Slate-900
    flex: { flex: 1 },
    header: {
        height: 180,
        paddingHorizontal: 24,
        paddingTop: 24,
        justifyContent: 'flex-end',
    },
    brand: {
        color: 'white',
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    subtitle: { color: '#94A3B8', marginTop: 4, marginBottom: 8, fontSize: 14 },
    bubbleXL: {
        position: 'absolute',
        right: -30,
        top: -40,
        width: 180,
        height: 180,
        borderRadius: 999,
        backgroundColor: '#1E293B',
        opacity: 0.5,
    },
    bubbleSM: {
        position: 'absolute',
        left: -20,
        top: 20,
        width: 90,
        height: 90,
        borderRadius: 999,
        backgroundColor: '#334155',
        opacity: 0.45,
    },

    card: {
        marginHorizontal: 16,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 18,
        gap: 12,
        // sombra iOS
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        // sombra Android
        elevation: 6,
        transform: [{ translateY: -24 }],
    },
    title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },

    field: { marginTop: 6 },
    label: { color: '#334155', marginBottom: 6, fontWeight: '600' },
    input: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: '#0F172A',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    passwordRow: { position: 'relative', justifyContent: 'center' },
    inputPassword: { paddingRight: 44 },
    eyeBtn: {
        position: 'absolute',
        right: 6,
        height: 40,
        width: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    eyeTxt: { fontSize: 18 },

    rowBetween: {
        marginTop: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rememberWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
    },
    rememberTxt: { color: '#475569' },

    primaryBtn: {
        marginTop: 10,
        backgroundColor: '#4F46E5', // Indigo-600
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    primaryTxt: { color: 'white', fontWeight: '700', fontSize: 16 },

    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginVertical: 8,
    },
    divider: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
    dividerTxt: { color: '#94A3B8', fontSize: 12 },

    oauthBtn: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#FFFFFF',
    },
    oauthIconWrap: { position: 'absolute', left: 14, height: 24, width: 24, alignItems: 'center', justifyContent: 'center' },
    oauthTxt: { fontWeight: '600', color: '#0F172A' },

    gLogoCircle: {
        width: 24,
        height: 24,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    gLogoText: { fontWeight: '800', color: '#0F172A' },

    pressed: { opacity: 0.8 },

    signupRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginTop: 10,
    },
    signupHint: { color: '#64748B' },
    signupLink: { color: '#4F46E5', fontWeight: '700' },
});
