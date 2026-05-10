import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clientAPI } from '../../services/api';
import Card from '../../components/Card';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

function Avatar({ name, size = 44 }) {
  const initials = name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

export default function ClientsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await clientAPI.getAll({ search });
      setClients(data);
    } catch {}
  }, [search]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('ClientDetail', { id: item.id })}>
      <Card style={styles.item}>
        <Avatar name={item.name} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSub}>{item.phone || item.email || 'No contact'}</Text>
          {item.skin_type && <Text style={styles.tag}>{item.skin_type}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>My Clients</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddClient')} style={styles.addBtn}>
          <Ionicons name="add" size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor={Colors.placeholder}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={clients}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={56} color={Colors.primaryLight} />
            <Text style={styles.emptyTitle}>No clients yet</Text>
            <Text style={styles.emptyText}>Add your first client to get started</Text>
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
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: Spacing.md, backgroundColor: Colors.white,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: FontSize.md, color: Colors.text },
  list: { padding: Spacing.md, paddingTop: 4, paddingBottom: 100 },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.primary, fontWeight: '800', fontSize: FontSize.md },
  itemInfo: { flex: 1 },
  itemName: { fontWeight: '700', fontSize: FontSize.md, color: Colors.text },
  itemSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  tag: {
    alignSelf: 'flex-start', marginTop: 4,
    backgroundColor: Colors.secondaryLight, color: Colors.secondary,
    fontSize: FontSize.xs, fontWeight: '600',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
