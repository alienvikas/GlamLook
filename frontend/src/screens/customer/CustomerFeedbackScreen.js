import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { customerBookingAPI } from '../../services/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme/colors';

export default function CustomerFeedbackScreen({ route, navigation }) {
  const { appointment } = route.params;
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert('Please select a rating'); return; }
    try {
      setSubmitting(true);
      await customerBookingAPI.submitFeedback({
        appointment_id: appointment.id,
        rating,
        comment: comment.trim() || undefined,
      });
      Alert.alert('Thank you!', 'Your review has been submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const serviceName = appointment.service_name || 'Appointment';
  const dateStr = new Date(appointment.scheduled_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Appointment info */}
        <View style={styles.apptCard}>
          <Ionicons name="sparkles" size={28} color={Colors.primary} />
          <Text style={styles.apptService}>{serviceName}</Text>
          <Text style={styles.apptDate}>{dateStr}</Text>
        </View>

        {/* Stars */}
        <Text style={styles.label}>How would you rate this service?</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={44}
                color={star <= rating ? '#F59E0B' : Colors.border}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingLabel}>
          {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : rating === 5 ? 'Excellent!' : ''}
        </Text>

        {/* Comment */}
        <Text style={styles.label}>Share your experience (optional)</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Tell us about your experience..."
          placeholderTextColor={Colors.textLight}
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{comment.length}/500</Text>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting || rating === 0}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.submitText}>Submit Review</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { flex: 1, color: Colors.white, fontSize: FontSize.lg, fontWeight: '700', textAlign: 'center' },
  content: { padding: Spacing.lg, gap: 12 },
  apptCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    marginBottom: 8,
  },
  apptService: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  apptDate: { fontSize: FontSize.sm, color: Colors.textSecondary },
  label: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginTop: 8 },
  starsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginVertical: 8 },
  ratingLabel: { textAlign: 'center', fontSize: FontSize.md, color: '#F59E0B', fontWeight: '700', minHeight: 22 },
  commentInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 100,
    marginTop: 4,
  },
  charCount: { fontSize: FontSize.xs, color: Colors.textLight, textAlign: 'right' },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  submitBtnDisabled: { backgroundColor: Colors.border },
  submitText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '800' },
});
