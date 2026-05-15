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
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

export default function CustomerAuthScreen() {
  const { customerLogin, customerRegister } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.email || !form.password) return Alert.alert('Error', 'Email and password are required');
    if (mode === 'register') {
      if (!form.name) return Alert.alert('Error', 'Name is required');
      if (form.password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
      if (form.password !== form.confirm) return Alert.alert('Error', 'Passwords do not match');
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await customerLogin(form.email.trim().toLowerCase(), form.password);
      } else {
        await customerRegister({ name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone, password: form.password });
      }
    } catch (err) {
      Alert.alert('Error', err.error || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <LinearGradient colors={['#9C27B0', '#C2185B']} style={styles.gradient}>
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="person" size={36} color={Colors.white} />
          </View>
          <Text style={styles.appName}>GlamBook</Text>
          <Text style={styles.tagline}>Book your glam session</Text>
        </View>
      </LinearGradient>

      <View style={styles.tabs}>
        {['login', 'register'].map((m) => (
          <TouchableOpacity key={m} style={[styles.tab, mode === m && styles.tabActive]} onPress={() => setMode(m)}>
            <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
        {mode === 'register' && (
          <Input label="Full Name" value={form.name} onChangeText={set('name')} placeholder="Your name" leftIcon="person-outline" />
        )}
        <Input label="Email" value={form.email} onChangeText={set('email')} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" />
        {mode === 'register' && (
          <Input label="Phone" value={form.phone} onChangeText={set('phone')} placeholder="+91 9999999999" keyboardType="phone-pad" leftIcon="call-outline" />
        )}
        <Input label="Password" value={form.password} onChangeText={set('password')} placeholder="Password" secureTextEntry leftIcon="lock-closed-outline" />
        {mode === 'register' && (
          <Input label="Confirm Password" value={form.confirm} onChangeText={set('confirm')} placeholder="Repeat password" secureTextEntry leftIcon="lock-closed-outline" />
        )}

        <Button
          title={mode === 'login' ? 'Sign In' : 'Create Account'}
          onPress={handleSubmit}
          loading={loading}
          style={{ marginTop: Spacing.sm }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradient: { paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  logoArea: { alignItems: 'center' },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  appName: { fontSize: 30, fontWeight: '800', color: Colors.white },
  tagline: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: Colors.primary },
  tabText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  form: { flex: 1, backgroundColor: Colors.background },
  formContent: { padding: Spacing.lg, paddingTop: Spacing.md },
});
