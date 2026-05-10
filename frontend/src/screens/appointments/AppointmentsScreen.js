import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appointmentAPI } from '../../services/api';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

export default function AppointmentsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const data = await appointmentAPI.getAll(params);
      setAppointments(data);
    } catch {}
  }, [filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('AppointmentDetail', { id: item.id })}>
      <Card style={styles.item}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateDay}>{new Date(item.scheduled_at).getDate()}</Text>
          <Text style={styles.dateMonth}>
            {new Date(item.scheduled_at).toLocaleString('en', { month: 'short' })}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.clientName}>{item.client_name}</Text>
          <Text style={styles.serviceName}>{item.service_name || 'General Makeup'}</Text>
          <Text style={styles.time}>
            {new Date(item.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            {' · '}{item.duration} min
          </Text>
        </View>
        <View style={styles.right}>
          <StatusBadge status={item.status} />
          {item.total_amount && (
            <Text style={styles.amount}>₹{parseFloat(item.total_amount).toLocaleString()}</Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Appointments</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddAppointment')} style={styles.addBtn}>
          <Ionicons name="add" size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i}
          contentContainerStyle={{ gap: 8, paddingHorizontal: Spacing.md }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item)}
              style={[styles.filterChip, filter === item && styles.filterActive]}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={56} color={Colors.primaryLight} />
            <Text style={styles.emptyTitle}>No appointments</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  filterRow: { paddingVertical: Spacing.sm, backgroundColor: Colors.white, borderBottomWidth: 1, borderColor: Colors.border },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  list: { padding: Spacing.md, paddingBottom: 100 },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dateBlock: {
    width: 48, height: 56, borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  dateDay: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  dateMonth: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },
  info: { flex: 1 },
  clientName: { fontWeight: '700', fontSize: FontSize.md, color: Colors.text },
  serviceName: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  time: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },
  right: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.success },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
});
