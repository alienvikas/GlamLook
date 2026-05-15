import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Image, Modal, FlatList,
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

// ── Service Dropdown ─────────────────────────────────────────────────────────
function ServiceDropdown({ services, selected, onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.dropdown, open && styles.dropdownOpen]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="sparkles-outline" size={18} color={Colors.primary} />
        <Text style={[styles.dropdownText, !selected && styles.dropdownPlaceholder]} numberOfLines={1}>
          {selected ? selected.name : 'Select a service'}
        </Text>
        {selected && (
          <Text style={styles.dropdownMeta}>
            {selected.duration_minutes} min · ₹{selected.price}
          </Text>
        )}
        <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Choose a Service</Text>
            <FlatList
              data={services}
              keyExtractor={(s) => String(s.id)}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                const isActive = selected?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.serviceOption, isActive && styles.serviceOptionActive]}
                    onPress={() => { onSelect(item); setOpen(false); }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.serviceOptionLeft}>
                      <Text style={[styles.serviceOptionName, isActive && styles.serviceOptionNameActive]}>
                        {item.name}
                      </Text>
                      <Text style={styles.serviceOptionMeta}>
                        {item.duration_minutes} min · ₹{item.price}
                      </Text>
                      {item.description ? (
                        <Text style={styles.serviceOptionDesc} numberOfLines={2}>{item.description}</Text>
                      ) : null}
                    </View>
                    {isActive && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.noServices}>No services available yet</Text>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function CustomerBookScreen({ route, navigation }) {
  const artist = route.params?.artist || null;
  const preselectedService = route.params?.preselectedService || null;

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(preselectedService);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [customerPhoto, setCustomerPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    customerBookingAPI.getServices(artist?.id).then(setServices).catch(() => {});
  }, [artist?.id]);

  const pickPhoto = () => {
    Alert.alert('Add Photo', 'Choose how to add your photo', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow camera access'); return; }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          });
          if (!result.canceled) setCustomerPhoto(result.assets[0]);
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo access'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
          });
          if (!result.canceled) setCustomerPhoto(result.assets[0]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleBook = async () => {
    if (!selectedService) return Alert.alert('Error', 'Please select a service');
    if (date <= new Date()) return Alert.alert('Error', 'Please select a future date and time');
    const artistId = artist?.id || selectedService?.artist_id;
    if (!artistId) return Alert.alert('Error', 'Could not determine the artist. Please go back and select an artist.');
    setLoading(true);
    try {
      let payload;
      if (customerPhoto) {
        const ext = customerPhoto.uri.split('.').pop().toLowerCase();
        const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
        const fd = new FormData();
        fd.append('artist_id', String(artistId));
        fd.append('service_id', String(selectedService.id));
        fd.append('scheduled_at', date.toISOString());
        fd.append('duration', String(selectedService.duration_minutes || 60));
        if (location.trim()) fd.append('location', location.trim());
        if (notes.trim()) fd.append('notes', notes.trim());
        fd.append('customer_photo', { uri: customerPhoto.uri, type: mime, name: 'customer_photo.jpg' });
        payload = fd;
      } else {
        payload = {
          artist_id: artistId,
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
      <Header title={artist ? `Book with ${artist.name.split(' ')[0]}` : 'Book Appointment'} onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Service dropdown */}
        <Text style={styles.label}>Service *</Text>
        <ServiceDropdown services={services} selected={selectedService} onSelect={setSelectedService} />

        {/* Date & Time */}
        <Text style={[styles.label, { marginTop: Spacing.lg }]}>Date & Time *</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            <Text style={styles.dateBtnText}>
              {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowTimePicker(true)}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
            <Text style={styles.dateBtnText}>
              {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker value={date} mode="date" minimumDate={new Date()} onChange={(e, d) => { setShowDatePicker(false); if (d) setDate((prev) => { const nd = new Date(prev); nd.setFullYear(d.getFullYear(), d.getMonth(), d.getDate()); return nd; }); }} />
        )}
        {showTimePicker && (
          <DateTimePicker value={date} mode="time" onChange={(e, d) => { setShowTimePicker(false); if (d) setDate((prev) => { const nd = new Date(prev); nd.setHours(d.getHours(), d.getMinutes()); return nd; }); }} />
        )}

        {/* Location */}
        <Text style={[styles.label, { marginTop: Spacing.lg }]}>Location (optional)</Text>
        <TouchableOpacity style={styles.locationBtn} onPress={() => setShowMapPicker(true)} activeOpacity={0.7}>
          <Ionicons name="map-outline" size={20} color={Colors.primary} />
          <Text style={[styles.locationBtnText, !location && styles.locationPlaceholder]} numberOfLines={2}>
            {location || 'Tap to pick on map'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
        </TouchableOpacity>
        {location ? (
          <TouchableOpacity onPress={() => setLocation('')} style={styles.clearRow}>
            <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
            <Text style={styles.clearText}>Clear location</Text>
          </TouchableOpacity>
        ) : null}

        {/* Customer Photo */}
        <Text style={[styles.label, { marginTop: Spacing.lg }]}>Your Photo (optional)</Text>
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
              <Text style={styles.summaryValue}>
                {date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </Text>
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
              <Text style={[styles.summaryValue, { color: Colors.primary, fontWeight: '800' }]}>
                ₹{selectedService.price}
              </Text>
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
  label: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text, marginBottom: 8 },

  // Dropdown
  dropdown: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 14,
  },
  dropdownOpen: { borderColor: Colors.primary },
  dropdownText: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  dropdownPlaceholder: { color: Colors.placeholder, fontWeight: '400' },
  dropdownMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },

  // Dropdown modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '70%', paddingBottom: 32,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: Colors.border,
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  sheetTitle: {
    fontSize: FontSize.lg, fontWeight: '800', color: Colors.text,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  separator: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  serviceOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
  },
  serviceOptionActive: { backgroundColor: Colors.primaryLight + '40' },
  serviceOptionLeft: { flex: 1 },
  serviceOptionName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  serviceOptionNameActive: { color: Colors.primary },
  serviceOptionMeta: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  serviceOptionDesc: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 4 },
  noServices: { textAlign: 'center', color: Colors.textSecondary, padding: Spacing.xl },

  // Date
  dateRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  dateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: 12,
  },
  dateBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },

  // Location
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: 14, marginBottom: 6,
  },
  locationBtnText: { flex: 1, fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  locationPlaceholder: { color: Colors.placeholder, fontWeight: '400' },
  clearRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  clearText: { fontSize: FontSize.xs, color: Colors.textSecondary },

  // Photo
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

  // Summary
  summary: { backgroundColor: Colors.primaryLight + '30' },
  summaryTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderColor: Colors.border,
  },
  summaryLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  summaryValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
});
