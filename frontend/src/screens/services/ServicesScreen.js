import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Modal, ScrollView, KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { serviceAPI } from '../../services/api';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

const CATEGORIES = ['Bridal', 'Party', 'Editorial', 'Natural', 'Special FX', 'Other'];

function ServiceModal({ visible, onClose, onSave, editService }) {
  const [form, setForm] = useState({ name: '', description: '', duration: '', price: '', category: '' });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (editService) {
      setForm({
        name: editService.name,
        description: editService.description || '',
        duration: String(editService.duration),
        price: String(editService.price),
        category: editService.category || '',
      });
    } else {
      setForm({ name: '', description: '', duration: '', price: '', category: '' });
    }
  }, [editService, visible]);

  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.name || !form.duration || !form.price) {
      Alert.alert('Error', 'Name, duration and price are required');
      return;
    }
    setLoading(true);
    try {
      await onSave({ ...form, duration: parseInt(form.duration), price: parseFloat(form.price) });
      onClose();
    } catch (err) {
      Alert.alert('Error', err.error || 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{editService ? 'Edit Service' : 'Add Service'}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <Input label="Service Name *" value={form.name} onChangeText={set('name')} placeholder="Bridal Makeup" leftIcon="sparkles-outline" />
          <Input label="Description" value={form.description} onChangeText={set('description')} placeholder="Full bridal look with HD makeup..." multiline numberOfLines={3} />
          <Input label="Duration (minutes) *" value={form.duration} onChangeText={set('duration')} placeholder="120" keyboardType="numeric" leftIcon="hourglass-outline" />
          <Input label="Price (₹) *" value={form.price} onChangeText={set('price')} placeholder="5000" keyboardType="numeric" leftIcon="cash-outline" />
          <Text style={styles.label}>Category</Text>
          <View style={styles.categories}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => set('category')(form.category === c ? '' : c)}
                style={[styles.catChip, form.category === c && styles.catActive]}
              >
                <Text style={[styles.catText, form.category === c && styles.catTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button title={editService ? 'Update Service' : 'Add Service'} onPress={handleSave} loading={loading} style={{ marginTop: Spacing.md }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ServicesScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editService, setEditService] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setServices(await serviceAPI.getAll()); } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleSave = async (data) => {
    if (editService) {
      await serviceAPI.update(editService.id, data);
    } else {
      await serviceAPI.create(data);
    }
    load();
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Service', 'Remove this service?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await serviceAPI.remove(id); load(); } },
    ]);
  };

  const grouped = services.reduce((acc, s) => {
    const cat = s.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header
        title="My Services"
        onBack={() => navigation.goBack()}
        rightIcon="add"
        rightAction={() => { setEditService(null); setModalVisible(true); }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {Object.keys(grouped).length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="pricetag-outline" size={56} color={Colors.primaryLight} />
            <Text style={styles.emptyTitle}>No services yet</Text>
            <Text style={styles.emptyText}>Add your makeup services and pricing</Text>
            <Button title="Add First Service" onPress={() => setModalVisible(true)} style={{ marginTop: Spacing.lg }} />
          </View>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <View key={cat}>
              <Text style={styles.catHeader}>{cat}</Text>
              {items.map((s) => (
                <Card key={s.id} style={styles.serviceCard}>
                  <View style={styles.serviceRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceName}>{s.name}</Text>
                      {s.description && <Text style={styles.serviceDesc} numberOfLines={2}>{s.description}</Text>}
                      <View style={styles.serviceMeta}>
                        <Ionicons name="hourglass-outline" size={13} color={Colors.textSecondary} />
                        <Text style={styles.metaText}>{s.duration} min</Text>
                      </View>
                    </View>
                    <View style={styles.serviceRight}>
                      <Text style={styles.price}>₹{parseFloat(s.price).toLocaleString()}</Text>
                      <View style={styles.actionBtns}>
                        <TouchableOpacity onPress={() => { setEditService(s); setModalVisible(true); }} style={styles.iconBtn}>
                          <Ionicons name="pencil" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(s.id)} style={styles.iconBtn}>
                          <Ionicons name="trash-outline" size={16} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <ServiceModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        editService={editService}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.md, paddingBottom: 60 },
  catHeader: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
  serviceCard: {},
  serviceRow: { flexDirection: 'row', alignItems: 'flex-start' },
  serviceName: { fontWeight: '700', fontSize: FontSize.md, color: Colors.text },
  serviceDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, marginBottom: 6 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  serviceRight: { alignItems: 'flex-end', gap: 8 },
  price: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  actionBtns: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6, backgroundColor: Colors.background, borderRadius: 8 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  modalContent: { padding: Spacing.lg },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border },
  catActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  catTextActive: { color: Colors.white },
});
