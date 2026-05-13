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

export default function LoginScreen({ navigation }) {
  const { login, customerLogin } = useAuth();
  const [role, setRole] = useState('admin'); // 'admin' | 'customer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) return Alert.alert('Error', 'Email and password are required');
    setLoading(true);
    try {
      if (role === 'admin') await login(email.trim().toLowerCase(), password);
      else await customerLogin(email.trim().toLowerCase(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.error || 'Check your credentials and try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.gradient}>
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="sparkles" size={40} color={Colors.white} />
          </View>
          <Text style={styles.appName}>GlamBook</Text>
          <Text style={styles.tagline}>Beauty at your fingertips</Text>
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
        <Text style={styles.welcome}>Welcome back!</Text>
        <Text style={styles.subtitle}>Sign in as {role === 'admin' ? 'Artist' : 'Customer'}</Text>

        <Input label="Email" value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" />
        <Input label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry leftIcon="lock-closed-outline" />

        <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.btn} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register', { role })}>
            <Text style={styles.link}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradient: { paddingTop: 56, paddingBottom: 36, alignItems: 'center' },
  logoArea: { alignItems: 'center' },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  appName: { fontSize: 34, fontWeight: '800', color: Colors.white, letterSpacing: 1 },
  tagline: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  roleTabs: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderColor: Colors.border },
  roleTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13 },
  roleTabActive: { borderBottomWidth: 3, borderBottomColor: Colors.primary },
  roleTabText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  roleTabTextActive: { color: Colors.primary },
  form: { flex: 1, backgroundColor: Colors.background },
  formContent: { padding: Spacing.lg, paddingTop: Spacing.md },
  welcome: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.lg },
  btn: { marginTop: Spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.md },
  link: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.md },
});
