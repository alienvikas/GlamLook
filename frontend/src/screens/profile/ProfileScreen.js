import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Modal, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

const API_BASE = 'https://glambook-backend-zqzt.onrender.com';

// ── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ visible, onClose }) {
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const handleChange = async () => {
    if (!form.current || !form.newPass) return Alert.alert('Error', 'All fields required');
    if (form.newPass !== form.confirm) return Alert.alert('Error', 'Passwords do not match');
    if (form.newPass.length < 6) return Alert.alert('Error', 'Minimum 6 characters');
    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: form.current, newPassword: form.newPass });
      Alert.alert('Success', 'Password changed!');
      setForm({ current: '', newPass: '', confirm: '' });
      onClose();
    } catch (err) {
      Alert.alert('Error', err.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Change Password</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <Input label="Current Password" value={form.current} onChangeText={set('current')} secureTextEntry leftIcon="lock-closed-outline" />
          <Input label="New Password" value={form.newPass} onChangeText={set('newPass')} secureTextEntry leftIcon="lock-open-outline" />
          <Input label="Confirm New Password" value={form.confirm} onChangeText={set('confirm')} secureTextEntry leftIcon="lock-open-outline" />
          <Button title="Change Password" onPress={handleChange} loading={loading} style={{ marginTop: Spacing.sm }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { artist, logout, updateArtist } = useAuth();
  const insets = useSafeAreaInsets();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: artist?.name || '',
    phone: artist?.phone || '',
    bio: artist?.bio || '',
    instagram: artist?.instagram || '',
    website: artist?.website || '',
  });
  const [localAvatar, setLocalAvatar] = useState(null); // picked but not yet uploaded
  const [loading, setLoading] = useState(false);
  const [pwdModal, setPwdModal] = useState(false);

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  // ── Pick avatar from gallery ──────────────────────────────────────────────
  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],  // square crop
      quality: 0.8,
    });
    if (!result.canceled) {
      setLocalAvatar(result.assets[0].uri);
      if (!editing) setEditing(true); // auto-open edit mode so they can save
    }
  };

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    setLoading(true);
    try {
      let updated;
      if (localAvatar) {
        // send as multipart/form-data when there's an image
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v !== undefined) fd.append(k, v); });
        const filename = localAvatar.split('/').pop();
        const ext = filename.split('.').pop();
        fd.append('avatar', { uri: localAvatar, name: filename, type: `image/${ext}` });
        updated = await authAPI.updateProfile(fd);
      } else {
        updated = await authAPI.updateProfile(form);
      }
      updateArtist(updated);
      setLocalAvatar(null);
      setEditing(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (err) {
      Alert.alert('Error', err.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setLocalAvatar(null);
    setForm({
      name: artist?.name || '',
      phone: artist?.phone || '',
      bio: artist?.bio || '',
      instagram: artist?.instagram || '',
      website: artist?.website || '',
    });
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = artist?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const avatarUri = localAvatar || (artist?.avatar_url ? `${API_BASE}${artist.avatar_url}` : null);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={[styles.headerGrad, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            onPress={editing ? handleCancelEdit : () => setEditing(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={editing ? 'close-circle' : 'pencil'} size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85}>
            <View style={styles.avatarWrapper}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
              {/* Camera badge */}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color={Colors.white} />
              </View>
            </View>
          </TouchableOpacity>

          {localAvatar && (
            <View style={styles.newPhotoBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.newPhotoText}>New photo selected — save to apply</Text>
            </View>
          )}

          <Text style={styles.artistName}>{artist?.name}</Text>
          <Text style={styles.artistEmail}>{artist?.email}</Text>

          <TouchableOpacity style={styles.qrBtn} onPress={() => navigation.navigate('QRCode')}>
            <Ionicons name="qr-code-outline" size={16} color={Colors.white} />
            <Text style={styles.qrBtnText}>View My QR Card</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Scrollable Content ── */}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {editing ? (
          /* ── Edit Mode ── */
          <Card style={styles.editCard}>
            <Text style={styles.editTitle}>Edit Profile</Text>

            <Input
              label="Full Name"
              value={form.name}
              onChangeText={set('name')}
              leftIcon="person-outline"
              returnKeyType="next"
              autoCapitalize="words"
            />
            <Input
              label="Phone"
              value={form.phone}
              onChangeText={set('phone')}
              keyboardType="phone-pad"
              leftIcon="call-outline"
              returnKeyType="next"
            />
            <Input
              label="Bio"
              value={form.bio}
              onChangeText={set('bio')}
              placeholder="Tell clients about yourself..."
              multiline
              numberOfLines={3}
              returnKeyType="next"
            />
            <Input
              label="Instagram"
              value={form.instagram}
              onChangeText={set('instagram')}
              placeholder="@yourusername"
              leftIcon="logo-instagram"
              autoCapitalize="none"
              returnKeyType="next"
            />
            <Input
              label="Website"
              value={form.website}
              onChangeText={set('website')}
              placeholder="https://yoursite.com"
              leftIcon="globe-outline"
              autoCapitalize="none"
              keyboardType="url"
              returnKeyType="done"
            />

            {/* Photo picker shortcut inside form */}
            <TouchableOpacity style={styles.photoRow} onPress={pickAvatar}>
              <View style={styles.photoRowIcon}>
                <Ionicons name="camera-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.photoRowLabel}>Profile Photo</Text>
                <Text style={styles.photoRowSub}>
                  {localAvatar ? 'New photo ready — will upload on save' : 'Tap to change your photo'}
                </Text>
              </View>
              {localAvatar && (
                <Image source={{ uri: localAvatar }} style={styles.photoThumb} />
              )}
              <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
            </TouchableOpacity>

            <View style={styles.editActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={handleCancelEdit}
                style={styles.cancelBtn}
              />
              <Button
                title="Save Changes"
                onPress={handleSave}
                loading={loading}
                style={styles.saveBtn}
              />
            </View>
          </Card>
        ) : (
          /* ── View Mode ── */
          <>
            <Card>
              <Text style={styles.sectionTitle}>About</Text>
              {[
                { icon: 'call-outline', label: artist?.phone || 'Not set' },
                { icon: 'logo-instagram', label: artist?.instagram || 'Not set' },
                { icon: 'globe-outline', label: artist?.website || 'Not set' },
              ].map((r, i) => (
                <View key={i} style={styles.infoRow}>
                  <Ionicons name={r.icon} size={18} color={Colors.primary} />
                  <Text style={styles.infoText}>{r.label}</Text>
                </View>
              ))}
              {artist?.bio ? <Text style={styles.bio}>{artist.bio}</Text> : null}
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>Account</Text>
              {[
                { icon: 'qr-code-outline', label: 'My Digital Card (QR)', onPress: () => navigation.navigate('QRCode') },
                { icon: 'pricetag-outline', label: 'My Services', onPress: () => navigation.navigate('Services') },
                { icon: 'wallet-outline', label: 'Payment History', onPress: () => navigation.navigate('Payments') },
                { icon: 'lock-closed-outline', label: 'Change Password', onPress: () => setPwdModal(true) },
              ].map((item, i) => (
                <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress}>
                  <Ionicons name={item.icon} size={20} color={Colors.primary} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
                </TouchableOpacity>
              ))}
            </Card>

            <Button
              title="Logout"
              variant="danger"
              onPress={handleLogout}
              style={{ marginBottom: Spacing.xl }}
            />
          </>
        )}
      </ScrollView>

      <ChangePasswordModal visible={pwdModal} onClose={() => setPwdModal(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Header
  headerGrad: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },

  // Avatar
  avatarSection: { alignItems: 'center' },
  avatarWrapper: { marginBottom: 12, position: 'relative' },
  avatarImage: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarFallback: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.white },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    borderWidth: 2, borderColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  newPhotoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
  },
  newPhotoText: { fontSize: FontSize.xs, color: Colors.white, fontWeight: '600' },
  artistName: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  artistEmail: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  qrBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  qrBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },

  // Scroll content
  content: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.md },

  // Edit card
  editCard: { gap: 0 },
  editTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },

  // Photo row inside edit form
  photoRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 14, borderTopWidth: 1, borderColor: Colors.border,
    marginTop: Spacing.sm,
  },
  photoRowIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  photoRowLabel: { fontWeight: '600', fontSize: FontSize.md, color: Colors.text },
  photoRowSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  photoThumb: {
    width: 40, height: 40, borderRadius: 8,
    borderWidth: 1.5, borderColor: Colors.primary,
  },

  // Edit actions
  editActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cancelBtn: { flex: 1 },
  saveBtn: { flex: 2 },

  // View mode
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 10, borderBottomWidth: 1, borderColor: Colors.border,
  },
  infoText: { fontSize: FontSize.md, color: Colors.text },
  bio: { marginTop: Spacing.sm, color: Colors.textSecondary, lineHeight: 22, fontSize: FontSize.md },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: 14, borderBottomWidth: 1, borderColor: Colors.border,
  },
  menuLabel: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.text },

  // Modal
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, borderBottomWidth: 1, borderColor: Colors.border,
    paddingTop: Platform.OS === 'ios' ? 52 : Spacing.lg,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
});
