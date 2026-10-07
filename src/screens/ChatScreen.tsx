import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AgentPersona, ChatMessage } from '../types/agent';
import { subscribeToMessages, saveMessage, generateAgentResponse } from '../services/agentService';
import { useAuth } from '../context/AuthContext';

interface ChatScreenProps {
  agent: AgentPersona;
  roomId?: string;
  roomName?: string;
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ 
  agent, 
  roomId = `room_${agent.id}`, 
  roomName = `${agent.role} Room`,
  onBack 
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToMessages(
      user.uid,
      agent.id,
      (loadedMessages) => {
        setMessages(loadedMessages);
      },
      roomId
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user, agent.id, roomId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !user || isTyping) return;

    setInputText('');

    // Save User message in room
    const userMsg = await saveMessage({
      roomId,
      conversationId: `${user.uid}_${agent.id}`,
      agentId: agent.id,
      userId: user.uid,
      sender: 'user',
      text,
      timestamp: Date.now(),
    });

    setIsTyping(true);

    try {
      // Simulate/Generate AI persona response
      const responseText = await generateAgentResponse(agent, text, [...messages, userMsg]);
      await saveMessage({
        conversationId: `${user.uid}_${agent.id}`,
        agentId: agent.id,
        userId: user.uid,
        sender: 'agent',
        text: responseText,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.warn('Agent response error:', e);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageBubbleWrapper, isUser ? styles.userRow : styles.agentRow]}>
        {!isUser && (
          <View style={styles.agentAvatarIcon}>
            <Text style={{ fontSize: 18 }}>{agent.avatar}</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.agentBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.agentMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.timestampText, isUser ? styles.userTimestamp : styles.agentTimestamp]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#F8FAFC" />
        </TouchableOpacity>

        <View style={styles.agentInfo}>
          <Text style={styles.agentAvatarTop}>{agent.avatar}</Text>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.agentName}>{agent.name}</Text>
            <Text style={styles.agentRole}>{agent.role}</Text>
          </View>
        </View>

        <View style={styles.badgeTone}>
          <Text style={styles.badgeToneText}>{agent.tone}</Text>
        </View>
      </View>

      {/* Room and Persona Banner */}
      <View style={styles.promptBanner}>
        <View style={styles.roomBadge}>
          <MaterialCommunityIcons name="door-open" size={13} color="#10B981" />
          <Text style={styles.roomBadgeText}>{roomName}</Text>
        </View>
        <Text style={styles.promptBannerText} numberOfLines={1}>
          Persona: {agent.systemPrompt}
        </Text>
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>{agent.avatar}</Text>
              <Text style={styles.emptyTitle}>Chat with {agent.name}</Text>
              <Text style={styles.emptySubtitle}>
                This agent responds based on its unique custom system prompt and {agent.tone} tone.
              </Text>
            </View>
          }
        />

        {isTyping && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#6366F1" />
            <Text style={styles.typingText}>{agent.name} is thinking...</Text>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={`Message ${agent.name}...`}
            placeholderTextColor="#64748B"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0E1322',
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  agentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentAvatarTop: {
    fontSize: 28,
  },
  agentName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  agentRole: {
    color: '#94A3B8',
    fontSize: 12,
  },
  badgeTone: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  badgeToneText: {
    color: '#818CF8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  promptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131B2E',
    paddingHorizontal: 16,
    paddingVertical: 7,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 4,
  },
  roomBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  promptBannerText: {
    color: '#94A3B8',
    fontSize: 11,
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  agentRow: {
    justifyContent: 'flex-start',
  },
  agentAvatarIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  agentBubble: {
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  messageText: {
    fontSize: 14.5,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  agentMessageText: {
    color: '#E2E8F0',
  },
  timestampText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  agentTimestamp: {
    color: '#64748B',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  typingText: {
    color: '#818CF8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0E1322',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#172033',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14.5,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#263048',
  },
});
