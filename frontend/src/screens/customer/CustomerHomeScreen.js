import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { customerBookingAPI } from '../../services/api';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

const STATUS_COLOR = { scheduled: Colors.info, completed: Colors.success, cancelled: Colors.error };

export default function CustomerHomeScreen({ navigation }) {
  const { customer, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState([]);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [appts, reviewed] = await Promise.all([
        customerBookingAPI.getMyAppointments(),
        customerBookingAPI.getMyFeedback(),
      ]);
      setAppointments(appts);
      setReviewedIds(new Set(reviewed));
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleLogout = () => Alert.alert('Logout', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Logout', style: 'destructive', onPress: logout },
  ]);

  const upcoming = appointments.filter((a) => a.status !== 'cancelled' && new Date(a.scheduled_at) >= new Date());
  const past = appointments.filter((a) => a.status === 'completed' || new Date(a.scheduled_at) < new Date());

  const renderAppt = ({ item }) => {
    const isCompleted = item.status === 'completed';
    const alreadyReviewed = reviewedIds.has(item.id);
    return (
      <Card style={styles.apptCard}>
        <View style={styles.apptRow}>
          <View style={styles.apptDateBox}>
            <Text style={styles.apptDay}>{new Date(item.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric' })}</Text>
            <Text style={styles.apptMonth}>{new Date(item.scheduled_at).toLocaleDateString('en-IN', { month: 'short' })}</Text>
          </View>
          <View style={styles.apptInfo}>
            <Text style={styles.apptService}>{item.service_name || 'Appointment'}</Text>
            {item.artist_name ? <Text style={styles.apptArtist}><Ionicons name="person-outline" size={11} /> {item.artist_name}</Text> : null}
            <Text style={styles.apptTime}>{new Date(item.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
            {item.location ? <Text style={styles.apptLoc} numberOfLines={1}><Ionicons name="location-outline" size={12} /> {item.location}</Text> : null}
          </View>
          <View style={styles.rightCol}>
            <StatusBadge status={item.status} />
            {isCompleted && !alreadyReviewed && (
              <TouchableOpacity
                style={styles.rateBtn}
                onPress={() => navigation.navigate('CustomerFeedback', { appointment: item })}
                activeOpacity={0.8}
              >
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.rateBtnText}>Rate</Text>
              </TouchableOpacity>
            )}
            {isCompleted && alreadyReviewed && (
              <View style={styles.ratedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                <Text style={styles.ratedText}>Rated</Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <LinearGradient colors={['#9C27B0', '#C2185B']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{customer?.name?.split(' ')[0]} ✨</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{upcoming.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{appointments.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{past.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Book button */}
      <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('ArtistList')} activeOpacity={0.85}>
        <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.bookBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Ionicons name="search" size={22} color={Colors.white} />
          <Text style={styles.bookBtnText}>Find an Artist & Book</Text>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      </TouchableOpacity>

      <FlatList
        data={appointments}
        keyExtractor={(i) => i.id}
        renderItem={renderAppt}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListHeaderComponent={appointments.length > 0 ? <Text style={styles.listTitle}>My Appointments</Text> : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={56} color={Colors.primaryLight} />
            <Text style={styles.emptyTitle}>No appointments yet</Text>
            <Text style={styles.emptyText}>Book your first glam session!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm },
  name: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '800' },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.md, padding: Spacing.sm },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.xs, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
  bookBtn: { margin: Spacing.md, borderRadius: BorderRadius.lg, overflow: 'hidden', elevation: 4, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 },
  bookBtnGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, gap: 8 },
  bookBtnText: { flex: 1, color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 40 },
  listTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  apptCard: { marginBottom: 10 },
  apptRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  apptDateBox: { alignItems: 'center', backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm, padding: 8, minWidth: 46 },
  apptDay: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  apptMonth: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  apptInfo: { flex: 1 },
  apptService: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  apptArtist: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600', marginTop: 1 },
  apptTime: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  apptLoc: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  rateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3C7', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#F59E0B',
  },
  rateBtnText: { fontSize: FontSize.xs, color: '#D97706', fontWeight: '700' },
  ratedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratedText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
