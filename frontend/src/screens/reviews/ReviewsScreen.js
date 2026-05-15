import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { feedbackAPI } from '../../services/api';
import Card from '../../components/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

function StarRow({ rating, size = 16 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= rating ? 'star' : 'star-outline'}
          size={size}
          color={s <= rating ? '#F59E0B' : Colors.border}
        />
      ))}
    </View>
  );
}

export default function ReviewsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState({ reviews: [], averageRating: null, totalReviews: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setData(await feedbackAPI.getAll()); } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderReview = ({ item }) => {
    const date = new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const apptDate = item.scheduled_at
      ? new Date(item.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : null;
    return (
      <Card style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.customer_name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{item.customer_name}</Text>
            {item.service_name ? <Text style={styles.serviceName}>{item.service_name}</Text> : null}
          </View>
          <Text style={styles.reviewDate}>{date}</Text>
        </View>
        <StarRow rating={item.rating} size={18} />
        {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
        {apptDate ? <Text style={styles.apptDate}>Appointment: {apptDate}</Text> : null}
      </Card>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Reviews & Ratings</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{data.averageRating || '—'}</Text>
            <StarRow rating={Math.round(data.averageRating || 0)} size={14} />
            <Text style={styles.summaryLabel}>Average Rating</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{data.totalReviews}</Text>
            <Text style={styles.summaryLabel}>Total Reviews</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={data.reviews}
        keyExtractor={(item) => item.id}
        renderItem={renderReview}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="star-outline" size={56} color={Colors.primaryLight} />
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptyText}>Reviews from customers will appear here after their appointments are completed.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  headerTitle: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '800', marginBottom: Spacing.md },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryNum: { color: Colors.white, fontSize: 32, fontWeight: '900' },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.xs, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
  list: { padding: Spacing.md, paddingBottom: 40 },
  reviewCard: { marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  customerName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  serviceName: { fontSize: FontSize.sm, color: Colors.textSecondary },
  reviewDate: { fontSize: FontSize.xs, color: Colors.textLight },
  comment: { marginTop: Spacing.sm, fontSize: FontSize.md, color: Colors.text, lineHeight: 22 },
  apptDate: { marginTop: 6, fontSize: FontSize.xs, color: Colors.textLight },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: Spacing.xl, gap: 10 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
