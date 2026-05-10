import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, FontSize, Spacing } from '../theme/colors';

export default function Button({ title, onPress, loading, variant = 'primary', style, textStyle, disabled }) {
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';

  if (isOutline) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={loading || disabled}
        style={[styles.outline, style]}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Text style={[styles.outlineText, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={loading || disabled} style={[styles.wrapper, style]} activeOpacity={0.85}>
      <LinearGradient
        colors={isDanger ? [Colors.error, '#C62828'] : [Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, (loading || disabled) && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={[styles.text, textStyle]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  gradient: { paddingVertical: 14, paddingHorizontal: Spacing.lg, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.6 },
  text: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700', letterSpacing: 0.3 },
  outline: {
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  outlineText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
});
