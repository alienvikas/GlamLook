import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme/colors';

export default function LocationPickerModal({ visible, onClose, onConfirm }) {
  const [region, setRegion] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);
  const currentCoordsRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setAddress('');
      setRegion(null);
      setLoading(true);
      initLocation();
    }
  }, [visible]);

  const initLocation = async () => {
    let lat = 20.5937, lng = 78.9629, delta = 8;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        delta = 0.015;
      }
    } catch {}
    const r = { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta };
    setRegion(r);
    currentCoordsRef.current = { latitude: lat, longitude: lng };
    setLoading(false);
    doReverseGeocode(lat, lng);
  };

  const doReverseGeocode = async (lat, lng) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (result.length > 0) {
        const r = result[0];
        const parts = [r.name, r.street, r.district, r.city, r.region].filter(Boolean);
        const unique = [...new Set(parts)];
        setAddress(unique.join(', '));
      }
    } catch {}
  };

  const handleRegionChangeComplete = (newRegion) => {
    currentCoordsRef.current = { latitude: newRegion.latitude, longitude: newRegion.longitude };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doReverseGeocode(newRegion.latitude, newRegion.longitude);
    }, 700);
  };

  const handleConfirm = () => {
    const coords = currentCoordsRef.current;
    const loc = address || (coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : '');
    onConfirm(loc);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Choose Location</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Map or loader */}
        {loading || !region ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Getting your location…</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <MapView
              style={styles.map}
              initialRegion={region}
              onRegionChangeComplete={handleRegionChangeComplete}
              showsUserLocation
              showsMyLocationButton
              showsCompass
            />
            {/* Fixed center pin */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={styles.pinWrapper}>
                <Ionicons name="location" size={44} color={Colors.primary} />
                <View style={styles.pinDot} />
              </View>
            </View>
            {/* Drag hint */}
            <View style={styles.hintBadge} pointerEvents="none">
              <Text style={styles.hintText}>Move map to set location</Text>
            </View>
          </View>
        )}

        {/* Bottom bar */}
        <View style={styles.bottom}>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={20} color={Colors.primary} />
            <Text style={styles.addressText} numberOfLines={3}>
              {address || 'Locating address…'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.confirmBtn, (!address && !currentCoordsRef.current) && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
            <Text style={styles.confirmText}>Use This Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'android' ? 44 : 56,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  headerBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  map: { flex: 1 },
  pinWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 44 },
  pinDot: { width: 10, height: 6, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 5, marginTop: -6 },
  hintBadge: {
    position: 'absolute', top: 12, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  hintText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  bottom: {
    backgroundColor: Colors.white, padding: Spacing.md, paddingBottom: 32,
    elevation: 12, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: -2 },
  },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: Spacing.sm, minHeight: 44 },
  addressText: { flex: 1, fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 15,
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
});
