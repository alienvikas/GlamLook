import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dashboardAPI, appointmentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

function StatCard({ icon, label, value, color }) {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

export default function DashboardScreen({ navigation }) {
  const { artist } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState(null);
  const [newBookings, setNewBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [data, unseen] = await Promise.all([
        dashboardAPI.getStats(),
        appointmentAPI.getUnseen(),
      ]);
      setStats(data);
      setNewBookings(unseen);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.artistName}>{artist?.name?.split(' ')[0]} ✨</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Payments')}>
            <View style={styles.headerIcon}>
              <Ionicons name="wallet-outline" size={24} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        <View style={styles.statsGrid}>
          <StatCard icon="people" label="Clients" value={stats?.total_clients ?? '—'} color={Colors.primary} />
          <StatCard icon="calendar" label="Today" value={stats?.today_appointments ?? '—'} color={Colors.info} />
          <StatCard icon="cash" label="This Month" value={stats ? `₹${parseFloat(stats.monthly_revenue).toLocaleString()}` : '—'} color={Colors.success} />
          <StatCard icon="star" label="Services" value="Active" color={Colors.gold} />
        </View>

        {/* New customer bookings notification */}
        {newBookings.length > 0 && (
          <TouchableOpacity
            style={styles.notifCard}
            activeOpacity={0.85}
            onPress={() => {
              appointmentAPI.markSeen().catch(() => {});
              setNewBookings([]);
              navigation.navigate('Appointments');
            }}
          >
            <View style={styles.notifIcon}>
              <Ionicons name="notifications" size={22} color={Colors.white} />
            </View>
            <View style={styles.notifInfo}>
              <Text style={styles.notifTitle}>
                {newBookings.length} New Booking{newBookings.length > 1 ? 's' : ''}!
              </Text>
              <Text style={styles.notifSub} numberOfLines={1}>
                {newBookings[0].client_name} — {newBookings[0].service_name || 'Appointment'}
                {newBookings.length > 1 ? ` +${newBookings.length - 1} more` : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* GlamAI Banner */}
        <TouchableOpacity style={styles.aiBanner} onPress={() => navigation.navigate('AIAssistant')} activeOpacity={0.85}>
          <LinearGradient colors={['#9C27B0', '#C2185B']} style={styles.aiBannerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={styles.aiBannerLeft}>
              <Text style={styles.aiBannerTitle}>✨ GlamAI Assistant</Text>
              <Text style={styles.aiBannerSub}>Ask about clients, revenue & get makeup tips</Text>
            </View>
            <Ionicons name="chatbubble-ellipses" size={32} color="rgba(255,255,255,0.8)" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {stats?.upcoming_appointments?.length ? (
            stats.upcoming_appointments.map((appt) => (
              <TouchableOpacity key={appt.id} onPress={() => navigation.navigate('AppointmentDetail', { id: appt.id })}>
                <Card style={styles.apptCard}>
                  <View style={styles.apptRow}>
                    <View style={styles.apptTime}>
                      <Text style={styles.apptDate}>
                        {new Date(appt.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                      <Text style={styles.apptHour}>
                        {new Date(appt.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={styles.apptInfo}>
                      <Text style={styles.apptClient}>{appt.client_name}</Text>
                      <Text style={styles.apptService}>{appt.service_name || 'General'}</Text>
                    </View>
                    <StatusBadge status={appt.status} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <Card>
              <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={40} color={Colors.primaryLight} />
                <Text style={styles.emptyText}>No upcoming appointments</Text>
              </View>
            </Card>
          )}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {[
              { icon: 'person-add', label: 'New Client', screen: 'AddClient' },
              { icon: 'calendar-outline', label: 'New Appointment', screen: 'AddAppointment' },
              { icon: 'pricetag', label: 'Services', screen: 'Services' },
              { icon: 'images', label: 'Portfolio', screen: 'Portfolio' },
            ].map((a) => (
              <TouchableOpacity key={a.screen} style={styles.actionBtn} onPress={() => navigation.navigate(a.screen)}>
                <View style={styles.actionIcon}>
                  <Ionicons name={a.icon} size={22} color={Colors.primary} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.md },
  artistName: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '800', marginTop: 2 },
  headerIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: Spacing.md, paddingBottom: 100 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: { width: '47%', alignItems: 'center', paddingVertical: Spacing.md },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  section: { marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  seeAll: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.sm },
  apptCard: { marginBottom: 8 },
  apptRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  apptTime: { alignItems: 'center', minWidth: 50 },
  apptDate: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  apptHour: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  apptInfo: { flex: 1 },
  apptClient: { fontWeight: '700', color: Colors.text, fontSize: FontSize.md },
  apptService: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textSecondary, marginTop: Spacing.sm },
  quickActions: { marginBottom: Spacing.lg },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn: { width: '22%', alignItems: 'center' },
  actionIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  actionLabel: { fontSize: 10, color: Colors.text, textAlign: 'center', fontWeight: '600' },

  notifCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderLeftWidth: 4, borderLeftColor: Colors.primary,
    elevation: 3, shadowColor: Colors.primary, shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  notifIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  notifInfo: { flex: 1 },
  notifTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text },
  notifSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  aiBanner: { marginBottom: Spacing.md, borderRadius: BorderRadius.lg, overflow: 'hidden', elevation: 3, shadowColor: Colors.secondary, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 },
  aiBannerGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 14 },
  aiBannerLeft: { flex: 1 },
  aiBannerTitle: { color: Colors.white, fontWeight: '800', fontSize: FontSize.md },
  aiBannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.xs, marginTop: 2 },
});
