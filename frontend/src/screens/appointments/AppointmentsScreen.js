import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appointmentAPI } from '../../services/api';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const STATUS_DOT_COLOR = {
  pending: Colors.warning,
  confirmed: Colors.primary,
  completed: Colors.success,
  cancelled: Colors.error,
};

const dateKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// ── Calendar component ───────────────────────────────────────────────────────
function CalendarView({ appointments, navigation }) {
  const today = new Date();
  const [calMonth, setCalMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);

  const byDate = useMemo(() => appointments.reduce((acc, apt) => {
    const k = dateKey(new Date(apt.scheduled_at));
    (acc[k] = acc[k] || []).push(apt);
    return acc;
  }, {}), [appointments]);

  const grid = useMemo(() => {
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    const cells = Array(firstDay).fill(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calMonth]);

  const selectedKey = dateKey(selected);
  const selectedApts = byDate[selectedKey] || [];

  const isToday = (d) =>
    d === today.getDate() &&
    calMonth.getMonth() === today.getMonth() &&
    calMonth.getFullYear() === today.getFullYear();

  const isSelected = (d) =>
    d === selected.getDate() &&
    calMonth.getMonth() === selected.getMonth() &&
    calMonth.getFullYear() === selected.getFullYear();

  const tapDay = (d) =>
    setSelected(new Date(calMonth.getFullYear(), calMonth.getMonth(), d));

  const prevMonth = () =>
    setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));

  const nextMonth = () =>
    setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Month navigator */}
      <View style={cal.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={cal.monthTitle}>
          {MONTH_NAMES[calMonth.getMonth()]} {calMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Day-of-week labels */}
      <View style={cal.dayRow}>
        {DAY_LABELS.map((l) => (
          <Text key={l} style={cal.dayLabel}>{l}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={cal.grid}>
        {grid.map((day, idx) => {
          if (!day) return <View key={`e${idx}`} style={cal.cell} />;
          const k = `${calMonth.getFullYear()}-${calMonth.getMonth()}-${day}`;
          const dots = byDate[k] || [];
          const sel = isSelected(day);
          const tod = isToday(day);
          return (
            <TouchableOpacity key={idx} style={cal.cell} onPress={() => tapDay(day)} activeOpacity={0.7}>
              <View style={[cal.circle, sel && cal.circleSelected, tod && !sel && cal.circleToday]}>
                <Text style={[cal.dayNum, sel && cal.dayNumSelected, tod && !sel && cal.dayNumToday]}>
                  {day}
                </Text>
              </View>
              <View style={cal.dots}>
                {dots.slice(0, 3).map((a, i) => (
                  <View key={i} style={[cal.dot, { backgroundColor: STATUS_DOT_COLOR[a.status] || Colors.primary }]} />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected date header */}
      <View style={cal.dayHeader}>
        <Text style={cal.dayHeaderTitle}>
          {selected.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <Text style={cal.dayHeaderCount}>
          {selectedApts.length} appointment{selectedApts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Appointments for selected day */}
      {selectedApts.length === 0 ? (
        <View style={cal.empty}>
          <Ionicons name="calendar-outline" size={40} color={Colors.primaryLight} />
          <Text style={cal.emptyText}>No appointments this day</Text>
        </View>
      ) : (
        selectedApts.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={{ paddingHorizontal: Spacing.md, marginBottom: 8 }}
            onPress={() => navigation.navigate('AppointmentDetail', { id: item.id })}
          >
            <Card style={cal.aptCard}>
              <View style={cal.aptTimeBlock}>
                <Text style={cal.aptTime}>
                  {new Date(item.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={cal.aptDuration}>{item.duration}m</Text>
              </View>
              <View style={cal.aptInfo}>
                <Text style={cal.aptClient}>{item.client_name}</Text>
                <Text style={cal.aptService}>{item.service_name || 'General Makeup'}</Text>
                {item.total_amount ? (
                  <Text style={cal.aptAmount}>₹{parseFloat(item.total_amount).toLocaleString()}</Text>
                ) : null}
              </View>
              <StatusBadge status={item.status} />
            </Card>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function AppointmentsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('list');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await appointmentAPI.getAll({});
      setAppointments(data);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = useMemo(() => {
    if (filter === 'all') return appointments;
    return appointments.filter((a) => a.status === filter);
  }, [appointments, filter]);

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
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Appointments</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setView((v) => (v === 'list' ? 'calendar' : 'list'))}
          >
            <Ionicons name={view === 'list' ? 'calendar' : 'list'} size={20} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AddAppointment')} style={styles.addBtn}>
            <Ionicons name="add" size={26} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {view === 'calendar' ? (
        <CalendarView appointments={appointments} navigation={navigation} />
      ) : (
        <>
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
            data={filtered}
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
        </>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  viewToggle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  filterRow: { paddingVertical: Spacing.sm, backgroundColor: Colors.white, borderBottomWidth: 1, borderColor: Colors.border },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: BorderRadius.full, backgroundColor: Colors.background,
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

const cal = StyleSheet.create({
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderColor: Colors.border,
  },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  dayRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm, paddingVertical: 8,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  dayLabel: {
    flex: 1, textAlign: 'center',
    fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: Colors.white, paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  cell: { width: '14.285%', alignItems: 'center', paddingVertical: 4 },
  circle: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  circleSelected: { backgroundColor: Colors.primary },
  circleToday: { backgroundColor: Colors.primaryLight },
  dayNum: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  dayNumSelected: { color: Colors.white, fontWeight: '800' },
  dayNumToday: { color: Colors.primary, fontWeight: '800' },
  dots: { flexDirection: 'row', gap: 2, marginTop: 2, height: 6, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  dayHeaderTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  dayHeaderCount: { fontSize: FontSize.sm, color: Colors.textSecondary },
  aptCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aptTimeBlock: {
    width: 52, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm,
    paddingVertical: 8,
  },
  aptTime: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.primary },
  aptDuration: { fontSize: FontSize.xs, color: Colors.primary, marginTop: 2 },
  aptInfo: { flex: 1 },
  aptClient: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  aptService: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  aptAmount: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.success, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 8 },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
