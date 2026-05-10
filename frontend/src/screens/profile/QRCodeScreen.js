import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

// Build a vCard string from artist profile — scannable by any phone camera
function buildVCard(artist) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${artist.name}`,
    `N:${artist.name.split(' ').reverse().join(';')}`,
    'TITLE:Makeup Artist',
  ];
  if (artist.phone) lines.push(`TEL;TYPE=CELL:${artist.phone}`);
  if (artist.email) lines.push(`EMAIL:${artist.email}`);
  if (artist.website) lines.push(`URL:${artist.website}`);
  if (artist.instagram) lines.push(`X-SOCIALPROFILE;type=instagram:${artist.instagram}`);
  if (artist.bio) lines.push(`NOTE:${artist.bio.replace(/\n/g, '\\n')}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

function InfoRow({ icon, value, placeholder }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={Colors.primary} />
      </View>
      <Text style={[styles.infoText, !value && styles.infoPlaceholder]} numberOfLines={1}>
        {value || placeholder}
      </Text>
    </View>
  );
}

export default function QRCodeScreen({ navigation }) {
  const { artist } = useAuth();
  const insets = useSafeAreaInsets();
  const qrRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  const vcard = buildVCard(artist);

  const getQRBase64 = () =>
    new Promise((resolve, reject) => {
      if (!qrRef.current) { reject(new Error('QR not ready')); return; }
      qrRef.current.toDataURL((data) => resolve(data));
    });

  const saveQRToCache = async () => {
    const base64 = await getQRBase64();
    const uri = `${FileSystem.cacheDirectory}glambook_qr.png`;
    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return uri;
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const uri = await saveQRToCache();
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) { Alert.alert('Sharing not available on this device'); return; }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `${artist.name} — GlamBook Contact`,
      });
    } catch (err) {
      Alert.alert('Error', 'Could not share QR code. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleSaveToGallery = async () => {
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow gallery access to save the QR code.');
        return;
      }
      const uri = await saveQRToCache();
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved!', 'QR code saved to your gallery.');
    } catch (err) {
      Alert.alert('Error', 'Could not save QR code to gallery.');
    } finally {
      setSaving(false);
    }
  };

  const initials = artist?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Digital Card</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>

        {/* QR Card */}
        <View style={styles.card}>
          {/* Artist name banner */}
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            style={styles.cardBanner}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <View style={styles.cardAvatar}>
              <Text style={styles.cardAvatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{artist?.name}</Text>
              <Text style={styles.cardTitle}>Makeup Artist  ✨</Text>
            </View>
          </LinearGradient>

          {/* QR Code */}
          <View style={styles.qrWrapper}>
            <QRCode
              value={vcard}
              size={220}
              color={Colors.primaryDark}
              backgroundColor={Colors.white}
              getRef={(ref) => { qrRef.current = ref; }}
              logo={undefined}
              ecl="M"
            />
          </View>

          <Text style={styles.scanHint}>
            <Ionicons name="scan-outline" size={13} color={Colors.textSecondary} />
            {'  '}Scan with any phone camera to save contact
          </Text>

          {/* Contact Info */}
          <View style={styles.contactInfo}>
            <InfoRow icon="call-outline" value={artist?.phone} placeholder="Phone not set" />
            <InfoRow icon="mail-outline" value={artist?.email} placeholder="Email not set" />
            <InfoRow icon="logo-instagram" value={artist?.instagram} placeholder="Instagram not set" />
            <InfoRow icon="globe-outline" value={artist?.website} placeholder="Website not set" />
          </View>
        </View>

        {/* What's inside label */}
        <View style={styles.vcardInfo}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.vcardInfoText}>
            QR code contains your vCard — scanned contacts are saved directly to the phone's address book.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare} disabled={sharing}>
            {sharing ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                <View style={[styles.actionIcon, { backgroundColor: Colors.primaryLight }]}>
                  <Ionicons name="share-social-outline" size={22} color={Colors.primary} />
                </View>
                <Text style={styles.actionLabel}>Share</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleSaveToGallery} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={Colors.secondary} />
            ) : (
              <>
                <View style={[styles.actionIcon, { backgroundColor: Colors.secondaryLight }]}>
                  <Ionicons name="download-outline" size={22} color={Colors.secondary} />
                </View>
                <Text style={styles.actionLabel}>Save to Gallery</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="pencil-outline" size={22} color={Colors.warning} />
            </View>
            <Text style={styles.actionLabel}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>How to use your QR code</Text>
          {[
            { icon: 'phone-portrait-outline', tip: 'Show clients your screen — they scan it with their camera app' },
            { icon: 'share-social-outline', tip: 'Share on WhatsApp, Instagram Bio, or print on business cards' },
            { icon: 'download-outline', tip: 'Save to gallery and set as your WhatsApp status' },
            { icon: 'person-add-outline', tip: 'Scanned contact is auto-saved to the phone\'s address book' },
          ].map((t, i) => (
            <View key={i} style={styles.tip}>
              <Ionicons name={t.icon} size={16} color={Colors.primary} />
              <Text style={styles.tipText}>{t.tip}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FontSize.lg, fontWeight: '800', color: Colors.white },

  content: { padding: Spacing.md, paddingBottom: 60, alignItems: 'center' },

  // Card
  card: {
    width: '100%', backgroundColor: Colors.white,
    borderRadius: 20, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 6,
    marginBottom: Spacing.md,
  },
  cardBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: Spacing.md },
  cardAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardAvatarText: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  cardName: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.white },
  cardTitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  qrWrapper: {
    alignItems: 'center', paddingVertical: Spacing.xl,
    backgroundColor: Colors.white,
  },
  scanHint: {
    textAlign: 'center', fontSize: FontSize.xs,
    color: Colors.textSecondary, paddingBottom: Spacing.md,
  },

  // Contact info inside card
  contactInfo: {
    borderTopWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: 10,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  infoText: { flex: 1, fontSize: FontSize.sm, color: Colors.text, fontWeight: '500' },
  infoPlaceholder: { color: Colors.textLight, fontStyle: 'italic' },

  // vCard info
  vcardInfo: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#E3F2FD', borderRadius: BorderRadius.md,
    padding: Spacing.md, width: '100%', marginBottom: Spacing.md,
  },
  vcardInfoText: { flex: 1, fontSize: FontSize.xs, color: Colors.info, lineHeight: 18 },

  // Action buttons
  actions: {
    flexDirection: 'row', justifyContent: 'space-around',
    width: '100%', marginBottom: Spacing.md,
  },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionIcon: {
    width: 60, height: 60, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.text },

  // Tips
  tipsCard: {
    width: '100%', backgroundColor: Colors.white,
    borderRadius: BorderRadius.md, padding: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  tipsTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  tipText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
