import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Alert, Dimensions, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { portfolioAPI } from '../../services/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

const API_BASE = 'https://glambook-backend-zqzt.onrender.com';
const resolveUrl = (url) => (!url ? null : url.startsWith('http') ? url : `${API_BASE}${url}`);

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - Spacing.md * 2 - Spacing.sm) / 2;

export default function PortfolioScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await portfolioAPI.getAll()); } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove this portfolio item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await portfolioAPI.remove(id); load(); } },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.gridItem}>
      <Image
        source={{ uri: resolveUrl(item.after_url) }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        {item.title && <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>}
        {item.client_name && <Text style={styles.itemClient} numberOfLines={1}>{item.client_name}</Text>}
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
        <Ionicons name="trash" size={14} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Portfolio</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddPortfolio')} style={styles.addBtn}>
          <Ionicons name="add" size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={{ gap: Spacing.sm }}
        contentContainerStyle={styles.grid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={56} color={Colors.primaryLight} />
            <Text style={styles.emptyTitle}>No portfolio items</Text>
            <Text style={styles.emptyText}>Showcase your best makeup work</Text>
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
  grid: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.sm },
  gridItem: {
    width: ITEM_SIZE, height: ITEM_SIZE * 1.2,
    borderRadius: BorderRadius.md, overflow: 'hidden',
    backgroundColor: Colors.border,
  },
  image: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
  },
  itemTitle: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },
  itemClient: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.xs },
  deleteBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(229,57,53,0.85)',
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
