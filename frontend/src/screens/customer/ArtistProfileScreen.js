import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, FlatList, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { customerBookingAPI } from '../../services/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

const { width } = Dimensions.get('window');
const PORTFOLIO_COLS = 3;
const PORTFOLIO_IMG_SIZE = (width - Spacing.md * 2 - 4) / PORTFOLIO_COLS;

function StarRating({ rating, size = 16 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
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

export default function ArtistProfileScreen({ route, navigation }) {
  const { artist } = route.params;
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [activeTab, setActiveTab] = useState('services');

  useEffect(() => {
    customerBookingAPI.getServices(artist.id).then(setServices).catch(() => {});
    customerBookingAPI.getArtistPortfolio(artist.id).then(setPortfolio).catch(() => {});
  }, [artist.id]);

  const handleBook = (service) => {
    navigation.navigate('CustomerBook', { artist, preselectedService: service });
  };

  const avg = Number(artist.avg_rating);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView stickyHeaderIndices={[]} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={['#9C27B0', '#C2185B']} style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            {artist.avatar_url ? (
              <Image source={{ uri: artist.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={48} color="rgba(255,255,255,0.6)" />
              </View>
            )}
            <Text style={styles.artistName}>{artist.name}</Text>
            {artist.specialties ? (
              <Text style={styles.specialties}>{artist.specialties}</Text>
            ) : null}

            <View style={styles.ratingRow}>
              <StarRating rating={avg} />
              <Text style={styles.ratingText}>
                {avg > 0 ? avg.toFixed(1) : 'New'}{artist.total_reviews > 0 ? ` · ${artist.total_reviews} review${artist.total_reviews !== 1 ? 's' : ''}` : ''}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{artist.service_count}</Text>
                <Text style={styles.statLabel}>Services</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>{artist.total_reviews}</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Bio */}
        {artist.bio ? (
          <View style={styles.bioBox}>
            <Text style={styles.bioLabel}>About</Text>
            <Text style={styles.bioText}>{artist.bio}</Text>
          </View>
        ) : null}

        {/* Social links */}
        {(artist.instagram || artist.facebook || artist.website) ? (
          <View style={styles.socialRow}>
            {artist.instagram ? (
              <View style={styles.socialChip}>
                <Ionicons name="logo-instagram" size={16} color="#E1306C" />
                <Text style={styles.socialText} numberOfLines={1}>{artist.instagram}</Text>
              </View>
            ) : null}
            {artist.facebook ? (
              <View style={styles.socialChip}>
                <Ionicons name="logo-facebook" size={16} color="#1877F2" />
                <Text style={styles.socialText} numberOfLines={1}>{artist.facebook}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {['services', 'portfolio'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'services' ? `Services (${services.length})` : `Portfolio (${portfolio.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Services tab */}
        {activeTab === 'services' && (
          <View style={styles.section}>
            {services.length === 0 ? (
              <Text style={styles.empty}>No services listed yet</Text>
            ) : (
              services.map((svc) => (
                <View key={svc.id} style={styles.serviceCard}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{svc.name}</Text>
                    {svc.description ? (
                      <Text style={styles.serviceDesc} numberOfLines={2}>{svc.description}</Text>
                    ) : null}
                    <Text style={styles.serviceMeta}>{svc.duration_minutes} min · ₹{svc.price}</Text>
                  </View>
                  <TouchableOpacity style={styles.bookBtn} onPress={() => handleBook(svc)} activeOpacity={0.85}>
                    <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.bookBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={styles.bookBtnText}>Book</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Portfolio tab */}
        {activeTab === 'portfolio' && (
          <View style={styles.section}>
            {portfolio.length === 0 ? (
              <Text style={styles.empty}>No portfolio items yet</Text>
            ) : (
              <View style={styles.portfolioGrid}>
                {portfolio.map((item) => (
                  <View key={item.id} style={styles.portfolioItem}>
                    <Image source={{ uri: item.image_url }} style={styles.portfolioImg} />
                    {item.title ? (
                      <Text style={styles.portfolioTitle} numberOfLines={1}>{item.title}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Fixed Book Now CTA */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CustomerBook', { artist })}
        >
          <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.ctaBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="calendar" size={20} color={Colors.white} />
            <Text style={styles.ctaBtnText}>Book with {artist.name.split(' ')[0]}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  heroContent: { alignItems: 'center', gap: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarPlaceholder: { backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  artistName: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '800', textAlign: 'center' },
  specialties: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingText: { color: 'rgba(255,255,255,0.9)', fontSize: FontSize.sm, fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.md, paddingVertical: 10, paddingHorizontal: Spacing.xl, gap: Spacing.xl, marginTop: 4 },
  stat: { alignItems: 'center' },
  statNum: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.xs },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },

  bioBox: { margin: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, elevation: 1 },
  bioLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 4 },
  bioText: { fontSize: FontSize.md, color: Colors.text, lineHeight: 22 },

  socialRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm, flexWrap: 'wrap' },
  socialChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.white, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, elevation: 1 },
  socialText: { fontSize: FontSize.xs, color: Colors.text, maxWidth: 140 },

  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.md, marginBottom: Spacing.sm, backgroundColor: Colors.white, borderRadius: BorderRadius.md, overflow: 'hidden', elevation: 1 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },

  section: { paddingHorizontal: Spacing.md, gap: 10 },
  empty: { textAlign: 'center', color: Colors.textSecondary, paddingVertical: Spacing.xl },

  serviceCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    elevation: 1,
  },
  serviceInfo: { flex: 1, gap: 3 },
  serviceName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  serviceDesc: { fontSize: FontSize.xs, color: Colors.textSecondary },
  serviceMeta: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  bookBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  bookBtnGrad: { paddingHorizontal: 16, paddingVertical: 8 },
  bookBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },

  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  portfolioItem: { width: PORTFOLIO_IMG_SIZE },
  portfolioImg: { width: PORTFOLIO_IMG_SIZE, height: PORTFOLIO_IMG_SIZE },
  portfolioTitle: { fontSize: 10, color: Colors.textSecondary, paddingHorizontal: 2, paddingBottom: 2 },

  ctaBar: { backgroundColor: Colors.white, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderColor: Colors.border, elevation: 8 },
  ctaBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  ctaBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  ctaBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '800' },
});
