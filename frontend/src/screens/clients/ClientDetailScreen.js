import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { clientAPI } from '../../services/api';
import Header from '../../components/Header';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

export default function ClientDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const [client, setClient] = useState(null);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, h] = await Promise.all([clientAPI.getOne(id), clientAPI.getHistory(id)]);
      setClient(c);
      setHistory(h);
    } catch {}
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = () => {
    Alert.alert('Remove Client', 'Are you sure you want to remove this client?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await clientAPI.remove(id);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!client) return null;

  const totalSpent = history.reduce((sum, h) => sum + (parseFloat(h.paid_amount) || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header
        title="Client Details"
        onBack={() => navigation.goBack()}
        rightIcon="pencil"
        rightAction={() => navigation.navigate('AddClient', { client })}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {client.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{client.name}</Text>
          {client.phone && (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.contact}>{client.phone}</Text>
            </View>
          )}
          {client.email && (
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.contact}>{client.email}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{history.length}</Text>
            <Text style={styles.statLabel}>Appointments</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>₹{totalSpent.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>

        {(client.skin_type || client.allergies) && (
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={styles.sectionTitle}>Skin Profile</Text>
            {client.skin_type && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Skin Type:</Text>
                <Text style={styles.infoValue}>{client.skin_type}</Text>
              </View>
            )}
            {client.allergies && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Allergies:</Text>
                <Text style={styles.infoValue}>{client.allergies}</Text>
              </View>
            )}
          </Card>
        )}

        {client.notes && (
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{client.notes}</Text>
          </Card>
        )}

        <Text style={styles.sectionTitle}>Appointment History</Text>
        {history.length ? (
          history.map((h) => (
            <Card key={h.id} style={styles.histItem}>
              <View style={styles.histRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.histService}>{h.service_name || 'General'}</Text>
                  <Text style={styles.histDate}>
                    {new Date(h.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <StatusBadge status={h.status} />
                  {h.paid_amount && (
                    <Text style={styles.amount}>₹{parseFloat(h.paid_amount).toLocaleString()}</Text>
                  )}
                </View>
              </View>
            </Card>
          ))
        ) : (
          <Card>
            <Text style={styles.noHistory}>No appointments yet</Text>
          </Card>
        )}

        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
          <Text style={styles.deleteText}>Remove Client</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.md, paddingBottom: 60 },
  profileCard: { alignItems: 'center', marginBottom: Spacing.md, paddingVertical: Spacing.lg, backgroundColor: Colors.white, borderRadius: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.primary },
  name: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  contact: { fontSize: FontSize.md, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 16, marginBottom: Spacing.md, padding: Spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  infoRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: 4 },
  infoLabel: { fontWeight: '600', color: Colors.textSecondary, width: 90 },
  infoValue: { flex: 1, color: Colors.text },
  notes: { color: Colors.textSecondary, lineHeight: 20 },
  histItem: { marginBottom: 8 },
  histRow: { flexDirection: 'row', alignItems: 'center' },
  histService: { fontWeight: '700', color: Colors.text, marginBottom: 2 },
  histDate: { fontSize: FontSize.sm, color: Colors.textSecondary },
  amount: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.success },
  noHistory: { color: Colors.textSecondary, textAlign: 'center', padding: Spacing.md },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: Spacing.xl, padding: Spacing.md },
  deleteText: { color: Colors.error, fontWeight: '700', fontSize: FontSize.md },
});
