import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView,
  Platform, TouchableOpacity, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { appointmentAPI, clientAPI, serviceAPI } from '../../services/api';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

// ─── Location Picker Modal ────────────────────────────────────────────────────
function LocationPickerModal({ visible, onClose, onConfirm }) {
  const [address, setAddress] = useState('');
  const [locating, setLocating] = useState(false);

  const handleMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is needed to detect your location.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      const res = await Location.reverseGeocodeAsync(coords);
      if (res[0]) {
        const { name, street, district, city, region } = res[0];
        setAddress([name || street, district || city, region].filter(Boolean).join(', '));
      } else {
        setAddress(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
      }
    } catch {
      Alert.alert('Error', 'Could not get your location. Please type it manually.');
    } finally {
      setLocating(false);
    }
  };

  const handleConfirm = () => {
    if (!address.trim()) { Alert.alert('No location', 'Please enter or detect a location first.'); return; }
    onConfirm(address.trim());
    setAddress('');
    onClose();
  };

  const handleClose = () => { setAddress(''); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.locModal}>
        {/* Header */}
        <View style={styles.locHeader}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.locTitle}>Pick Location</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.locBody}>
          {/* GPS Button */}
          <TouchableOpacity style={styles.gpsBtn} onPress={handleMyLocation} disabled={locating}>
            {locating ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="locate" size={22} color={Colors.white} />
                <Text style={styles.gpsBtnText}>Use My GPS Location</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or type manually</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Manual text input */}
          <Text style={styles.locLabel}>Address / Venue</Text>
          <TextInput
            style={styles.locInput}
            placeholder="e.g. Client's home, 123 Main St, Mumbai..."
            placeholderTextColor={Colors.placeholder}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {address.length > 0 && (
            <View style={styles.previewRow}>
              <Ionicons name="location" size={16} color={Colors.primary} />
              <Text style={styles.previewText} numberOfLines={2}>{address}</Text>
            </View>
          )}

          <Button title="Confirm Location" onPress={handleConfirm} style={{ marginTop: Spacing.lg }} />
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AddAppointmentScreen({ navigation, route }) {
  const preselectedClient = route.params?.clientId;

  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // date/time state — store as a single Date object
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [mapVisible, setMapVisible] = useState(false);

  const [form, setForm] = useState({
    client_id: preselectedClient || '',
    service_id: '',
    location: '',
    duration: '60',
    notes: '',
    total_amount: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoadingData(true);
    setFetchError('');
    try {
      const [c, s] = await Promise.all([clientAPI.getAll(), serviceAPI.getAll()]);
      setClients(c);
      setServices(s);
    } catch (err) {
      setFetchError(err?.error || err?.message || 'Could not load clients. Check your connection.');
    } finally {
      setLoadingData(false);
    }
  };

  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  // Auto-fill duration & price when service selected
  const selectedService = services.find((s) => s.id === form.service_id);
  useEffect(() => {
    if (selectedService) {
      setForm((p) => ({ ...p, duration: String(selectedService.duration), total_amount: String(selectedService.price) }));
    }
  }, [form.service_id]);

  // Date picker handlers
  const onDateChange = (event, date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed') { setShowDatePicker(false); return; }
    if (date) {
      const updated = new Date(selectedDateTime);
      updated.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setSelectedDateTime(updated);
    }
  };

  const onTimeChange = (event, time) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed') { setShowTimePicker(false); return; }
    if (time) {
      const updated = new Date(selectedDateTime);
      updated.setHours(time.getHours(), time.getMinutes(), 0, 0);
      setSelectedDateTime(updated);
    }
  };

  const formatDate = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  const formatTime = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const validate = () => {
    const e = {};
    if (!form.client_id) e.client = 'Please select a client';
    if (!form.duration) e.duration = 'Duration is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await appointmentAPI.create({
        client_id: form.client_id,
        service_id: form.service_id || undefined,
        scheduled_at: selectedDateTime.toISOString(),
        duration: parseInt(form.duration),
        location: form.location || undefined,
        notes: form.notes || undefined,
        total_amount: form.total_amount ? parseFloat(form.total_amount) : undefined,
      });
      Alert.alert('Success', 'Appointment booked!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err?.error || 'Failed to book appointment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <Header title="New Appointment" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Select Client ── */}
        <Text style={styles.label}>Select Client *</Text>
        {errors.client ? <Text style={styles.errorText}>{errors.client}</Text> : null}

        {loadingData ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading clients...</Text>
          </View>
        ) : fetchError ? (
          <View style={styles.errorBox}>
            <Ionicons name="wifi-outline" size={18} color={Colors.error} />
            <Text style={styles.errorBoxText}>{fetchError}</Text>
            <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : clients.length === 0 ? (
          <TouchableOpacity style={styles.emptyBox} onPress={() => navigation.navigate('AddClient')}>
            <Ionicons name="person-add-outline" size={22} color={Colors.primary} />
            <Text style={styles.emptyText}>No clients yet — tap to add one</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.chipsWrap}>
            {clients.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => set('client_id')(c.id)}
                style={[styles.chip, form.client_id === c.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, form.client_id === c.id && styles.chipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Select Service ── */}
        <Text style={styles.label}>Service (optional)</Text>
        {services.length === 0 && !loadingData ? (
          <Text style={styles.noServices}>No services added yet</Text>
        ) : (
          <View style={styles.chipsWrap}>
            {services.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => set('service_id')(form.service_id === s.id ? '' : s.id)}
                style={[styles.chip, form.service_id === s.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, form.service_id === s.id && styles.chipTextActive]}>
                  {s.name}  ₹{s.price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Date Picker ── */}
        <Text style={styles.label}>Date *</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar" size={20} color={Colors.primary} />
          <Text style={styles.pickerText}>{formatDate(selectedDateTime)}</Text>
          <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDateTime}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={new Date()}
            onChange={onDateChange}
          />
        )}
        {Platform.OS === 'ios' && showDatePicker && (
          <TouchableOpacity style={styles.doneBtn} onPress={() => setShowDatePicker(false)}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        )}

        {/* ── Time Picker ── */}
        <Text style={[styles.label, { marginTop: Spacing.sm }]}>Time *</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
          <Ionicons name="time" size={20} color={Colors.primary} />
          <Text style={styles.pickerText}>{formatTime(selectedDateTime)}</Text>
          <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={selectedDateTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            is24Hour={false}
            onChange={onTimeChange}
          />
        )}
        {Platform.OS === 'ios' && showTimePicker && (
          <TouchableOpacity style={styles.doneBtn} onPress={() => setShowTimePicker(false)}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        )}

        {/* ── Location ── */}
        <Text style={[styles.label, { marginTop: Spacing.sm }]}>Location</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setMapVisible(true)}>
          <Ionicons name="location" size={20} color={Colors.primary} />
          <Text style={[styles.pickerText, !form.location && { color: Colors.placeholder }]} numberOfLines={1}>
            {form.location || 'Tap to add location'}
          </Text>
          <Ionicons name="map-outline" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
        {form.location ? (
          <TouchableOpacity onPress={() => set('location')('')} style={styles.clearLocation}>
            <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
            <Text style={styles.clearText}>Clear location</Text>
          </TouchableOpacity>
        ) : null}

        {/* ── Other fields ── */}
        <Input
          label="Duration (minutes) *"
          value={form.duration}
          onChangeText={set('duration')}
          placeholder="60"
          keyboardType="numeric"
          leftIcon="hourglass-outline"
          error={errors.duration}
          style={{ marginTop: Spacing.sm }}
        />
        <Input
          label="Total Amount (₹)"
          value={form.total_amount}
          onChangeText={set('total_amount')}
          placeholder="2500"
          keyboardType="numeric"
          leftIcon="cash-outline"
        />
        <Input
          label="Notes"
          value={form.notes}
          onChangeText={set('notes')}
          placeholder="Any special requirements..."
          multiline
          numberOfLines={3}
        />

        <Button title="Book Appointment" onPress={handleSave} loading={saving} style={{ marginTop: Spacing.sm }} />
      </ScrollView>

      {/* ── Location Picker Modal ── */}
      <LocationPickerModal
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onConfirm={(addr) => set('location')(addr)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 80 },

  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  errorText: { fontSize: FontSize.xs, color: Colors.error, marginBottom: 6 },

  // Client / Service chips
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, marginBottom: Spacing.sm },
  loadingText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFEBEE', borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: '#FFCDD2',
  },
  errorBoxText: { flex: 1, color: Colors.error, fontSize: FontSize.sm },
  retryBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.error, borderRadius: BorderRadius.sm },
  retryText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.xs },
  emptyBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderRadius: BorderRadius.md, borderWidth: 1.5,
    borderColor: Colors.primary, borderStyle: 'dashed',
    backgroundColor: Colors.primaryLight + '30',
  },
  emptyText: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.sm },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  noServices: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },

  // Date/Time/Location pickers
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    marginBottom: 8,
  },
  pickerText: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  doneBtn: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8, marginBottom: 8 },
  doneBtnText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.md },
  clearLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  clearText: { fontSize: FontSize.xs, color: Colors.textSecondary },

  // Location Modal
  locModal: { flex: 1, backgroundColor: Colors.white },
  locHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 52 : Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  locTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  locBody: { padding: Spacing.lg, flex: 1 },
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: 16, marginBottom: Spacing.lg,
  },
  gpsBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  locLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  locInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md,
    padding: Spacing.md, fontSize: FontSize.md, color: Colors.text,
    minHeight: 90, backgroundColor: Colors.white,
  },
  previewRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginTop: Spacing.md, backgroundColor: Colors.primaryLight + '40',
    borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  previewText: { flex: 1, fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
});
