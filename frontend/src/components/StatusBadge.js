import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, FontSize } from '../theme/colors';

const STATUS_COLORS = {
  pending: { bg: '#FFF3E0', text: Colors.warning },
  confirmed: { bg: '#E3F2FD', text: Colors.info },
  completed: { bg: '#E8F5E9', text: Colors.success },
  cancelled: { bg: '#FFEBEE', text: Colors.error },
  no_show: { bg: '#F3E5F5', text: Colors.secondary },
};

export default function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || { bg: Colors.border, text: Colors.textSecondary };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {status?.replace('_', ' ').toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: { fontSize: FontSize.xs, fontWeight: '700' },
});
