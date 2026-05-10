import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { paymentAPI } from '../../services/api';
import Header from '../../components/Header';
import Card from '../../components/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

const METHOD_ICONS = { cash: 'cash', card: 'card', upi: 'phone-portrait', bank_transfer: 'business', other: 'help-circle' };

export default function PaymentsScreen({ navigation }) {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([paymentAPI.getAll(), paymentAPI.getSummary()]);
      setPayments(p);
      setSummary(s);
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title="Payments" onBack={() => navigation.goBack()} />

      <FlatList
        data={payments}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListHeaderComponent={
          summary && (
            <View style={styles.summary}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryVal}>₹{parseFloat(summary.total_earned).toLocaleString()}</Text>
                <Text style={styles.summaryLabel}>Total Earned</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryVal}>₹{parseFloat(summary.this_month).toLocaleString()}</Text>
                <Text style={styles.summaryLabel}>This Month</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryVal}>₹{parseFloat(summary.this_week).toLocaleString()}</Text>
                <Text style={styles.summaryLabel}>This Week</Text>
              </View>
            </View>
          )
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.payItem}>
            <View style={[styles.methodIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name={`${METHOD_ICONS[item.method] || 'help-circle'}-outline`} size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{item.client_name}</Text>
              <Text style={styles.serviceName}>{item.service_name || 'General'}</Text>
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <Text style={styles.amount}>₹{parseFloat(item.amount).toLocaleString()}</Text>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cash-outline" size={56} color={Colors.primaryLight} />
            <Text style={styles.emptyTitle}>No payments yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.md, paddingBottom: 60 },
  summary: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  summaryCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  summaryVal: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  payItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  methodIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  clientName: { fontWeight: '700', fontSize: FontSize.md, color: Colors.text },
  serviceName: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  date: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 2 },
  amount: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.success },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
});
