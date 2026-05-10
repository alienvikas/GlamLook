import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { appointmentAPI, paymentAPI } from '../../services/api';
import Header from '../../components/Header';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Colors, Spacing, FontSize } from '../../theme/colors';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

export default function AppointmentDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const [appt, setAppt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payLoading, setPayLoading] = useState(false);

  const load = useCallback(async () => {
    try { setAppt(await appointmentAPI.getOne(id)); } catch {}
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const updateStatus = async (status) => {
    try {
      await appointmentAPI.update(id, { status });
      load();
    } catch (err) {
      Alert.alert('Error', err.error || 'Failed to update status');
    }
  };

  const handlePayment = async () => {
    if (!payAmount) return Alert.alert('Error', 'Enter payment amount');
    setPayLoading(true);
    try {
      await paymentAPI.create({ appointment_id: id, amount: parseFloat(payAmount), method: payMethod });
      Alert.alert('Success', 'Payment recorded!');
      setPayAmount('');
      load();
    } catch (err) {
      Alert.alert('Error', err.error || 'Failed to record payment');
    } finally {
      setPayLoading(false);
    }
  };

  if (!appt) return null;

  const METHODS = ['cash', 'card', 'upi', 'bank_transfer'];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title="Appointment" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        <Card style={styles.mainCard}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{appt.client_name}</Text>
              <Text style={styles.serviceName}>{appt.service_name || 'General Makeup'}</Text>
            </View>
            <StatusBadge status={appt.status} />
          </View>
          <View style={styles.divider} />
          <View style={styles.details}>
            {[
              { icon: 'calendar', label: new Date(appt.scheduled_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
              { icon: 'time', label: new Date(appt.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
              { icon: 'hourglass', label: `${appt.duration} minutes` },
              appt.location && { icon: 'location', label: appt.location },
              appt.total_amount && { icon: 'cash', label: `₹${parseFloat(appt.total_amount).toLocaleString()}` },
            ].filter(Boolean).map((d, i) => (
              <View key={i} style={styles.detailRow}>
                <Ionicons name={`${d.icon}-outline`} size={16} color={Colors.primary} />
                <Text style={styles.detailText}>{d.label}</Text>
              </View>
            ))}
          </View>
          {appt.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{appt.notes}</Text>
            </View>
          )}
        </Card>

        {appt.payment_status !== 'completed' && appt.status !== 'cancelled' && (
          <Card>
            <Text style={styles.sectionTitle}>Record Payment</Text>
            <Input
              label="Amount (₹)"
              value={payAmount}
              onChangeText={setPayAmount}
              placeholder={appt.total_amount ? String(appt.total_amount) : '0'}
              keyboardType="numeric"
              leftIcon="cash-outline"
            />
            <Text style={styles.methodLabel}>Payment Method</Text>
            <View style={styles.methods}>
              {METHODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setPayMethod(m)}
                  style={[styles.methodChip, payMethod === m && styles.methodActive]}
                >
                  <Text style={[styles.methodText, payMethod === m && styles.methodTextActive]}>
                    {m.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Record Payment" onPress={handlePayment} loading={payLoading} style={{ marginTop: Spacing.sm }} />
          </Card>
        )}

        {appt.payment_status === 'completed' && (
          <Card style={styles.paidCard}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <Text style={styles.paidText}>
              Paid ₹{parseFloat(appt.paid_amount).toLocaleString()} via {appt.payment_method}
            </Text>
          </Card>
        )}

        <Card>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.statusBtns}>
            {STATUSES.filter((s) => s !== appt.status).map((s) => (
              <Button
                key={s}
                title={s.replace('_', ' ')}
                variant={s === 'cancelled' ? 'danger' : 'outline'}
                onPress={() => updateStatus(s)}
                style={styles.statusBtn}
                textStyle={{ fontSize: FontSize.sm, textTransform: 'capitalize' }}
              />
            ))}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.md, paddingBottom: 60, gap: Spacing.md },
  mainCard: {},
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  clientName: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
  serviceName: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  details: { gap: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailText: { fontSize: FontSize.md, color: Colors.text },
  notesBox: { marginTop: Spacing.md, backgroundColor: Colors.background, borderRadius: 8, padding: Spacing.sm },
  notesLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, marginBottom: 4 },
  notesText: { fontSize: FontSize.md, color: Colors.text },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  methodLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.sm },
  methodChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border },
  methodActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  methodTextActive: { color: Colors.white },
  paidCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: '#E8F5E9' },
  paidText: { fontWeight: '700', color: Colors.success, fontSize: FontSize.md },
  statusBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { flex: 0 },
});
