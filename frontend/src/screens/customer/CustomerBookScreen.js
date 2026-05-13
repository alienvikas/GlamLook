import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { customerBookingAPI } from '../../services/api';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import LocationPickerModal from '../../components/LocationPickerModal';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

export default function CustomerBookScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [customerPhoto, setCustomerPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    customerBookingAPI.getServices().then(setServices).catch(() => {});
  }, []);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo access'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled) setCustomerPhoto(result.assets[0]);
  };

  const handleBook = async () => {
    if (!selectedService) return Alert.alert('Error', 'Please select a service');
    if (date <= new Date()) return Alert.alert('Error', 'Please select a future date and time');
    setLoading(true);
    try {
      let payload;
      if (customerPhoto) {
        const ext = customerPhoto.uri.split('.').pop().toLowerCase();
        const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
        const fd = new FormData();
        fd.append('service_id', String(selectedService.id));
        fd.append('scheduled_at', date.toISOString());
        fd.append('duration', String(selectedService.duration_minutes || 60));
        if (location.trim()) fd.append('location', location.trim());
        if (notes.trim()) fd.append('notes', notes.trim());
        fd.append('customer_photo', { uri: customerPhoto.uri, type: mime, name: 'customer_photo.jpg' });
        payload = fd;
      } else {
        payload = {
          service_id: selectedService.id,
          scheduled_at: date.toISOString(),
          duration: selectedService.duration_minutes || 60,
          location: location.trim() || null,
          notes: notes.trim() || null,
        };
      }
      await customerBookingAPI.book(payload);
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
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

        {/* Location — map picker */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Location (optional)</Text>
        <TouchableOpacity style={styles.locationBtn} onPress={() => setShowMapPicker(true)} activeOpacity={0.7}>
          <Ionicons name="map-outline" size={20} color={Colors.primary} />
          <Text style={[styles.locationBtnText, !location && styles.locationPlaceholder]} numberOfLines={2}>
            {location || 'Tap to pick on map'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
        </TouchableOpacity>
        {location ? (
          <TouchableOpacity onPress={() => setLocation('')} style={styles.clearLocation}>
            <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
            <Text style={styles.clearText}>Clear location</Text>
          </TouchableOpacity>
        ) : null}

        {/* Customer Photo */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Your Photo (optional)</Text>
        <Text style={styles.photoHint}>Help the artist recognize you at the venue</Text>
        <View style={styles.photoRow}>
          <TouchableOpacity style={styles.photoPickerBtn} onPress={pickPhoto} activeOpacity={0.8}>
            {customerPhoto ? (
              <Image source={{ uri: customerPhoto.uri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={32} color={Colors.primary} />
                <Text style={styles.photoPlaceholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          {customerPhoto && (
            <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setCustomerPhoto(null)}>
              <Ionicons name="close-circle" size={22} color={Colors.error} />
              <Text style={styles.removePhotoText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>

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
            {location ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Location</Text>
                <Text style={[styles.summaryValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>{location}</Text>
              </View>
            ) : null}
            <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.summaryLabel}>Price</Text>
              <Text style={[styles.summaryValue, { color: Colors.primary, fontWeight: '800' }]}>₹{selectedService.price}</Text>
            </View>
          </Card>
        )}

        <Button title="Confirm Booking" onPress={handleBook} loading={loading} style={{ marginTop: Spacing.md, marginBottom: 40 }} />
      </ScrollView>

      <LocationPickerModal
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onConfirm={(loc) => setLocation(loc)}
      />
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
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: 14, marginBottom: 6,
  },
  locationBtnText: { flex: 1, fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  locationPlaceholder: { color: Colors.placeholder },
  clearLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  clearText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  photoHint: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: -4 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  photoPickerBtn: {
    width: 110, height: 140, borderRadius: BorderRadius.md, overflow: 'hidden',
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
  },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primaryLight + '30' },
  photoPlaceholderText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  removePhotoBtn: { alignItems: 'center', gap: 4 },
  removePhotoText: { fontSize: FontSize.xs, color: Colors.error, fontWeight: '600' },
  summary: { backgroundColor: Colors.primaryLight + '30' },
  summaryTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: Colors.border },
  summaryLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  summaryValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
});
