import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { clientAPI } from '../../services/api';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Colors, Spacing, FontSize } from '../../theme/colors';

const SKIN_TYPES = ['Normal', 'Oily', 'Dry', 'Combination', 'Sensitive'];

export default function AddClientScreen({ navigation, route }) {
  const editClient = route.params?.client;
  const [form, setForm] = useState({
    name: editClient?.name || '',
    email: editClient?.email || '',
    phone: editClient?.phone || '',
    skin_type: editClient?.skin_type || '',
    allergies: editClient?.allergies || '',
    notes: editClient?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Client name is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (editClient) {
        await clientAPI.update(editClient.id, form);
        Alert.alert('Success', 'Client updated!');
      } else {
        await clientAPI.create(form);
        Alert.alert('Success', 'Client added!');
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.error || 'Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title={editClient ? 'Edit Client' : 'Add Client'} onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label="Full Name *" value={form.name} onChangeText={set('name')} placeholder="Jane Smith" leftIcon="person-outline" error={errors.name} />
        <Input label="Email" value={form.email} onChangeText={set('email')} placeholder="client@email.com" keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" />
        <Input label="Phone" value={form.phone} onChangeText={set('phone')} placeholder="+91 9999999999" keyboardType="phone-pad" leftIcon="call-outline" />

        <Text style={styles.label}>Skin Type</Text>
        <View style={styles.chips}>
          {SKIN_TYPES.map((s) => (
            <Button
              key={s}
              title={s}
              variant={form.skin_type === s ? 'primary' : 'outline'}
              onPress={() => set('skin_type')(form.skin_type === s ? '' : s)}
              style={styles.chip}
              textStyle={{ fontSize: FontSize.sm }}
            />
          ))}
        </View>

        <Input label="Allergies / Sensitivities" value={form.allergies} onChangeText={set('allergies')} placeholder="e.g. fragrance, latex..." leftIcon="warning-outline" />
        <Input label="Notes" value={form.notes} onChangeText={set('notes')} placeholder="Any additional notes..." multiline numberOfLines={3} style={{ marginBottom: Spacing.xl }} />

        <Button title={editClient ? 'Update Client' : 'Add Client'} onPress={handleSave} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 60 },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  chip: { paddingVertical: 8, paddingHorizontal: 14, flex: 0 },
});
