import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Colors, Spacing, FontSize } from '../../theme/colors';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone, password: form.password });
    } catch (err) {
      Alert.alert('Registration Failed', err.error || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.gradient}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="sparkles" size={36} color={Colors.white} />
          </View>
          <Text style={styles.appName}>GlamBook</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join thousands of makeup artists</Text>

        <Input label="Full Name" value={form.name} onChangeText={set('name')} placeholder="Jane Doe" leftIcon="person-outline" error={errors.name} />
        <Input label="Email" value={form.email} onChangeText={set('email')} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" error={errors.email} />
        <Input label="Phone (optional)" value={form.phone} onChangeText={set('phone')} placeholder="+91 9999999999" keyboardType="phone-pad" leftIcon="call-outline" />
        <Input label="Password" value={form.password} onChangeText={set('password')} placeholder="Min 6 characters" secureTextEntry leftIcon="lock-closed-outline" error={errors.password} />
        <Input label="Confirm Password" value={form.confirm} onChangeText={set('confirm')} placeholder="Repeat password" secureTextEntry leftIcon="lock-closed-outline" error={errors.confirm} />

        <Button title="Create Account" onPress={handleRegister} loading={loading} style={{ marginTop: Spacing.sm }} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradient: { paddingTop: 52, paddingBottom: 36, paddingHorizontal: Spacing.lg },
  back: { marginBottom: 12 },
  logoArea: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  appName: { fontSize: 28, fontWeight: '800', color: Colors.white },
  form: { flex: 1, backgroundColor: Colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20 },
  formContent: { padding: Spacing.lg, paddingTop: Spacing.xl },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xl },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl, paddingBottom: Spacing.xl },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.md },
  link: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.md },
});
