import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { aiAPI } from '../../services/api';

const SUGGESTIONS = [
  "How many clients do I have?",
  "What's my revenue this month?",
  "Show my upcoming appointments",
  "Give me bridal makeup tips",
  "How can I grow my client base?",
];

function MessageBubble({ item }) {
  const isUser = item.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarText}>✨</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
          {item.content}
        </Text>
      </View>
    </View>
  );
}

export default function AIAssistantScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm GlamAI, your personal business assistant. I can see your clients, appointments, and revenue in real time. Ask me anything about your business or get makeup tips!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    scrollToBottom();

    try {
      const history = newMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
      const data = await aiAPI.chat(msg, history);
      const aiMsg = { role: 'assistant', content: data.reply };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errText = err?.error || 'Sorry, something went wrong. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: errText }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [input, messages, loading]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>GlamAI Assistant</Text>
          <Text style={styles.headerSub}>Powered by Claude AI</Text>
        </View>
        <View style={styles.headerDot}>
          <View style={styles.onlineDot} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <MessageBubble item={item} />}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading ? (
              <View style={styles.typingRow}>
                <View style={styles.aiAvatar}>
                  <Text style={styles.aiAvatarText}>✨</Text>
                </View>
                <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.typingText}>GlamAI is thinking...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Suggestions */}
        {messages.length === 1 && (
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsLabel}>Try asking:</Text>
            <View style={styles.suggestionsRow}>
              {SUGGESTIONS.map((s, i) => (
                <TouchableOpacity key={i} style={styles.chip} onPress={() => sendMessage(s)}>
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your business..."
            placeholderTextColor={Colors.placeholder}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 44 : 14,
    elevation: 4,
    shadowColor: Colors.primaryDark,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerCenter: { flex: 1 },
  headerTitle: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  headerSub: { color: Colors.primaryLight, fontSize: 12, marginTop: 1 },
  headerDot: { alignItems: 'center', justifyContent: 'center', width: 32 },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: Colors.white },

  messageList: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },

  bubbleRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAI: { justifyContent: 'flex-start' },

  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  aiAvatarText: { fontSize: 16 },

  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextUser: { color: Colors.white },
  bubbleTextAI: { color: Colors.text },

  typingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 16 },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { color: Colors.textSecondary, fontSize: 13, marginLeft: 6 },

  suggestions: { paddingHorizontal: 16, paddingBottom: 8 },
  suggestionsLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { color: Colors.primary, fontSize: 12, fontWeight: '500' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.textLight },
});
