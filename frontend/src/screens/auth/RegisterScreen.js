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

export default function RegisterScreen({ navigation, route }) {
  const { register, customerRegister } = useAuth();
  const [role, setRole] = useState(route?.params?.role || 'admin');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  const handleRegister = async () => {
    if (!form.name.trim()) return Alert.alert('Error', 'Name is required');
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return Alert.alert('Error', 'Valid email required');
    if (form.password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
    if (form.password !== form.confirm) return Alert.alert('Error', 'Passwords do not match');
    setLoading(true);
    try {
      const data = { name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone, password: form.password };
      if (role === 'admin') await register(data);
      else await customerRegister(data);
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

      {/* Role tabs */}
      <View style={styles.roleTabs}>
        {[
          { key: 'admin', label: 'Artist / Admin', icon: 'brush' },
          { key: 'customer', label: 'Customer', icon: 'person' },
        ].map((r) => (
          <TouchableOpacity key={r.key} style={[styles.roleTab, role === r.key && styles.roleTabActive]} onPress={() => setRole(r.key)}>
            <Ionicons name={r.icon} size={16} color={role === r.key ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.roleTabText, role === r.key && styles.roleTabTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Signing up as {role === 'admin' ? 'Artist / Admin' : 'Customer'}</Text>

        <Input label="Full Name" value={form.name} onChangeText={set('name')} placeholder="Jane Doe" leftIcon="person-outline" />
        <Input label="Email" value={form.email} onChangeText={set('email')} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" />
        <Input label="Phone (optional)" value={form.phone} onChangeText={set('phone')} placeholder="+91 9999999999" keyboardType="phone-pad" leftIcon="call-outline" />
        <Input label="Password" value={form.password} onChangeText={set('password')} placeholder="Min 6 characters" secureTextEntry leftIcon="lock-closed-outline" />
        <Input label="Confirm Password" value={form.confirm} onChangeText={set('confirm')} placeholder="Repeat password" secureTextEntry leftIcon="lock-closed-outline" />

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
  gradient: { paddingTop: 52, paddingBottom: 32, paddingHorizontal: Spacing.lg },
  back: { marginBottom: 12 },
  logoArea: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 28, fontWeight: '800', color: Colors.white },
  roleTabs: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderColor: Colors.border },
  roleTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13 },
  roleTabActive: { borderBottomWidth: 3, borderBottomColor: Colors.primary },
  roleTabText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  roleTabTextActive: { color: Colors.primary },
  form: { flex: 1, backgroundColor: Colors.background },
  formContent: { padding: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 40 },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.lg },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.md },
  link: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.md },
});
