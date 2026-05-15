import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, RefreshControl, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { customerBookingAPI } from '../../services/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

function StarRating({ rating, size = 13 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

export default function ArtistListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [artists, setArtists] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await customerBookingAPI.getArtists();
      setArtists(data);
      setFiltered(data);
    } catch {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const onSearch = (text) => {
    setSearch(text);
    const q = text.toLowerCase().trim();
    setFiltered(q ? artists.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      (a.specialties || '').toLowerCase().includes(q)
    ) : artists);
  };

  const renderArtist = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('ArtistProfile', { artist: item })}
    >
      <View style={styles.cardInner}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={32} color={Colors.primaryLight} />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.artistName}>{item.name}</Text>
          {item.specialties ? (
            <Text style={styles.specialties} numberOfLines={1}>{item.specialties}</Text>
          ) : null}
          <View style={styles.ratingRow}>
            <StarRating rating={Number(item.avg_rating)} />
            <Text style={styles.ratingText}>
              {Number(item.avg_rating) > 0 ? item.avg_rating : 'New'}
              {item.total_reviews > 0 ? ` (${item.total_reviews})` : ''}
            </Text>
          </View>
          <Text style={styles.serviceCount}>{item.service_count} service{item.service_count !== 1 ? 's' : ''}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <LinearGradient colors={['#9C27B0', '#C2185B']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Find an Artist</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or specialty..."
            placeholderTextColor={Colors.placeholder}
            value={search}
            onChangeText={onSearch}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => onSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        renderItem={renderArtist}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Ionicons name="person-outline" size={56} color={Colors.primaryLight} />
              <Text style={styles.emptyTitle}>{search ? 'No results' : 'No artists yet'}</Text>
              <Text style={styles.emptyText}>{search ? 'Try a different search' : 'Check back soon'}</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '800' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  list: { padding: Spacing.md, gap: 10, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
  },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: { backgroundColor: Colors.primaryLight + '40', alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, gap: 4 },
  artistName: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text },
  specialties: { fontSize: FontSize.sm, color: Colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  serviceCount: { fontSize: FontSize.xs, color: Colors.textLight },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
