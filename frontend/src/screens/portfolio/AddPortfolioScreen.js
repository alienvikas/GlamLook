import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { portfolioAPI, clientAPI } from '../../services/api';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

export default function AddPortfolioScreen({ navigation }) {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ client_id: '', title: '', description: '', tags: '', is_public: true });
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    clientAPI.getAll().then(setClients).catch(() => {});
  }, []);

  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  const pickImage = async (setter) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo access'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setter(result.assets[0]);
  };

  const handleSave = async () => {
    if (!afterImage) { Alert.alert('Error', 'After photo is required'); return; }
    setLoading(true);
    try {
      const getMime = (uri) => {
        const ext = uri.split('.').pop().toLowerCase();
        return ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
      };
      const fd = new FormData();
      fd.append('after', { uri: afterImage.uri, type: getMime(afterImage.uri), name: 'after.jpg' });
      if (beforeImage) fd.append('before', { uri: beforeImage.uri, type: getMime(beforeImage.uri), name: 'before.jpg' });
      if (form.client_id) fd.append('client_id', form.client_id);
      if (form.title) fd.append('title', form.title);
      if (form.description) fd.append('description', form.description);
      if (form.tags) fd.append('tags', form.tags);
      fd.append('is_public', form.is_public ? 'true' : 'false');
      await portfolioAPI.create(fd);
      Alert.alert('Success', 'Portfolio item added!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.error || 'Failed to upload');
    } finally {
      setLoading(false);
    }
  };

  const ImagePicker2 = ({ label, image, onPick }) => (
    <TouchableOpacity style={styles.imagePick} onPress={onPick}>
      {image ? (
        <Image source={{ uri: image.uri }} style={styles.preview} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="camera-outline" size={32} color={Colors.primary} />
          <Text style={styles.imageLabel}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <Header title="Add to Portfolio" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Photos</Text>
        <View style={styles.imagesRow}>
          <ImagePicker2 label="Before (optional)" image={beforeImage} onPick={() => pickImage(setBeforeImage)} />
          <ImagePicker2 label="After *" image={afterImage} onPick={() => pickImage(setAfterImage)} />
        </View>

        <Input label="Title" value={form.title} onChangeText={set('title')} placeholder="Bridal look - Priya's wedding" leftIcon="text-outline" />
        <Input label="Description" value={form.description} onChangeText={set('description')} placeholder="Full HD bridal makeup with airbrush foundation..." multiline numberOfLines={3} />
        <Input label="Tags (comma separated)" value={form.tags} onChangeText={set('tags')} placeholder="bridal, HD, airbrush" leftIcon="pricetag-outline" />

        <Text style={styles.label}>Client (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
          {clients.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => set('client_id')(form.client_id === c.id ? '' : c.id)}
              style={[styles.chip, form.client_id === c.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, form.client_id === c.id && styles.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.toggleRow} onPress={() => set('is_public')(!form.is_public)}>
          <Ionicons name={form.is_public ? 'eye' : 'eye-off'} size={20} color={Colors.primary} />
          <Text style={styles.toggleText}>{form.is_public ? 'Public (visible to clients)' : 'Private'}</Text>
        </TouchableOpacity>

        <Button title="Upload to Portfolio" onPress={handleSave} loading={loading} style={{ marginTop: Spacing.md }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 60 },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  imagesRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  imagePick: { flex: 1, height: 160, borderRadius: BorderRadius.md, overflow: 'hidden', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' },
  preview: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primaryLight + '40' },
  imageLabel: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600', textAlign: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border },
  toggleText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
});
