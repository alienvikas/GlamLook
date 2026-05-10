import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing } from '../theme/colors';

export default function Header({ title, onBack, rightAction, rightIcon, rightLabel }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {rightAction ? (
          <TouchableOpacity onPress={rightAction} style={styles.rightBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {rightIcon ? (
              <Ionicons name={rightIcon} size={24} color={Colors.white} />
            ) : (
              <Text style={styles.rightLabel}>{rightLabel}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.rightBtn} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
  rightBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  rightLabel: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },
});
