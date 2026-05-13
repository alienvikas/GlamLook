import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { customerBookingAPI } from '../../services/api';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

export default function CustomerBookScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    customerBookingAPI.getServices().then(setServices).catch(() => {});
  }, []);

  const handleBook = async () => {
    if (!selectedService) return Alert.alert('Error', 'Please select a service');
    const now = new Date();
    if (date <= now) return Alert.alert('Error', 'Please select a future date and time');
    setLoading(true);
    try {
      await customerBookingAPI.book({
        service_id: selectedService.id,
        scheduled_at: date.toISOString(),
        duration: selectedService.duration_minutes || 60,
        location: location.trim() || null,
        notes: notes.trim() || null,
      });
      Alert.alert('Booked! ✅', 'Your appointment has been confirmed. The artist will be notified.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.error || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Book Appointment" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Service selection */}
        <Text style={styles.sectionTitle}>Choose a Service *</Text>
        {services.length === 0 ? (
          <Card><Text style={styles.empty}>No services available yet</Text></Card>
        ) : (
          services.map((svc) => (
            <TouchableOpacity key={svc.id} onPress={() => setSelectedService(svc)}>
              <Card style={[styles.serviceCard, selectedService?.id === svc.id && styles.serviceCardActive]}>
                <View style={styles.serviceRow}>
                  <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceName, selectedService?.id === svc.id && styles.serviceNameActive]}>{svc.name}</Text>
                    <Text style={styles.serviceMeta}>{svc.duration_minutes} min • ₹{svc.price}</Text>
                    {svc.description ? <Text style={styles.serviceDesc}>{svc.description}</Text> : null}
                  </View>
                  {selectedService?.id === svc.id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* Date & Time */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Date & Time *</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            <Text style={styles.dateBtnText}>{date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowTimePicker(true)}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
            <Text style={styles.dateBtnText}>{date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker value={date} mode="date" minimumDate={new Date()} onChange={(e, d) => { setShowDatePicker(false); if (d) setDate((prev) => { const nd = new Date(prev); nd.setFullYear(d.getFullYear(), d.getMonth(), d.getDate()); return nd; }); }} />
        )}
        {showTimePicker && (
          <DateTimePicker value={date} mode="time" onChange={(e, d) => { setShowTimePicker(false); if (d) setDate((prev) => { const nd = new Date(prev); nd.setHours(d.getHours(), d.getMinutes()); return nd; }); }} />
        )}

        {/* Location */}
        <Input
          label="Location (optional)"
          value={location}
          onChangeText={setLocation}
          placeholder="Your address or venue"
          leftIcon="location-outline"
        />

        {/* Notes */}
        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any special requests..."
          multiline
          numberOfLines={3}
        />

        {/* Summary */}
        {selectedService && (
          <Card style={styles.summary}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>{selectedService.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date & Time</Text>
              <Text style={styles.summaryValue}>{date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{selectedService.duration_minutes} min</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.summaryLabel}>Price</Text>
              <Text style={[styles.summaryValue, { color: Colors.primary, fontWeight: '800' }]}>₹{selectedService.price}</Text>
            </View>
          </Card>
        )}

        <Button title="Confirm Booking" onPress={handleBook} loading={loading} style={{ marginTop: Spacing.md, marginBottom: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  empty: { color: Colors.textSecondary, textAlign: 'center', padding: Spacing.md },
  serviceCard: { marginBottom: 8 },
  serviceCardActive: { borderWidth: 2, borderColor: Colors.primary },
  serviceRow: { flexDirection: 'row', alignItems: 'center' },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  serviceNameActive: { color: Colors.primary },
  serviceMeta: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  serviceDesc: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 4 },
  dateRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  dateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: 12 },
  dateBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  summary: { backgroundColor: Colors.primaryLight + '30' },
  summaryTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: Colors.border },
  summaryLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  summaryValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
});
