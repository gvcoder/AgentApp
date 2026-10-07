import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { createAgent } from '../services/agentService';
import { AgentPersona } from '../types/agent';

interface CreateAgentModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (agent: AgentPersona) => void;
}

const AVATAR_OPTIONS = ['⚛️', '🏃‍♂️', '🎶', '🤖', '💻', '🧠', '⚡', '🌌', '🏛️', '🎨', '🚀', '🔮'];
const TONES: Array<AgentPersona['tone']> = [
  'professional',
  'technical',
  'creative',
  'humorous',
  'friendly',
  'philosophical',
];

interface PersonaTemplate {
  name: string;
  role: string;
  avatar: string;
  tone: AgentPersona['tone'];
  systemPrompt: string;
  tags: string;
}

const PRESET_TEMPLATES: PersonaTemplate[] = [
  {
    name: 'Prof. Newton',
    role: 'Physics Teacher',
    avatar: '⚛️',
    tone: 'technical',
    systemPrompt: 'You are an engaging high-school and university level physics teacher. You explain classical mechanics, quantum physics, thermodynamics, and electromagnetism using intuitive real-world analogies, step-by-step math breakdowns, and thought experiments. Always respond in English and avoid explicit or harmful topics.',
    tags: 'Physics, Science, Education, STEM',
  },
  {
    name: 'ScrumCoach Jira-X',
    role: 'Agile & Scrum Expert',
    avatar: '🏃‍♂️',
    tone: 'professional',
    systemPrompt: 'You are a veteran Agile Coach and Certified Scrum Master (PSM III). You assist product teams with sprint ceremonies, backlog grooming, user story estimation (Fibonacci/T-shirt), resolving sprint bottlenecks, and building high-trust agile velocity. Respond in English only.',
    tags: 'Agile, Scrum, Sprint, Product, Management',
  },
  {
    name: 'Guru Vaggeyakara',
    role: 'Carnatic Music Expert',
    avatar: '🎶',
    tone: 'friendly',
    systemPrompt: 'You are a master of Indian Carnatic Classical Music. You explain Ragas, Talas (Adi, Rupaka, Misra Chapu), Arohana/Avarohana scales, compositions by the Trinity (Tyagaraja, Muthuswami Dikshitar, Syama Sastri), and Gamaka nuances clearly in English.',
    tags: 'Music, Carnatic, Raga, Tala, Classical',
  },
];

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
  visible,
  onClose,
  onCreated,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [tone, setTone] = useState<AgentPersona['tone']>('technical');
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const applyTemplate = (tpl: PersonaTemplate) => {
    setName(tpl.name);
    setRole(tpl.role);
    setAvatar(tpl.avatar);
    setTone(tpl.tone);
    setSystemPrompt(tpl.systemPrompt);
    setTagInput(tpl.tags);
  };

  if (!visible) return null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a name for your AI Agent.');
      return;
    }
    if (!role.trim()) {
      Alert.alert('Required Field', 'Please specify a role (e.g. Android Lead Architect).');
      return;
    }
    if (!systemPrompt.trim()) {
      Alert.alert('Required Field', 'Please provide instructions/system prompt for this persona.');
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      const tags = tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const created = await createAgent({
        userId: user.uid,
        name: name.trim(),
        role: role.trim(),
        avatar,
        systemPrompt: systemPrompt.trim(),
        temperature: tone === 'creative' ? 0.9 : tone === 'technical' ? 0.3 : 0.7,
        tone,
        tags: tags.length ? tags : ['Custom AI'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      onCreated(created);
      onClose();
      // Reset form
      setName('');
      setRole('');
      setSystemPrompt('');
      setTagInput('');
    } catch (e: any) {
      Alert.alert('Creation Failed', e.message || 'Unable to save agent to Firebase.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.modalOverlay}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#94A3B8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Architect New Agent</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
          {/* Quick Persona Inspiration Chips */}
          <Text style={styles.sectionLabel}>Quick Persona Templates</Text>
          <View style={styles.templateRow}>
            {PRESET_TEMPLATES.map((tpl) => (
              <TouchableOpacity
                key={tpl.name}
                style={styles.templateChip}
                onPress={() => applyTemplate(tpl)}
                activeOpacity={0.7}
              >
                <Text style={styles.templateEmoji}>{tpl.avatar}</Text>
                <Text style={styles.templateChipText}>{tpl.role}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Avatar Selector */}
          <Text style={styles.sectionLabel}>Select Agent Avatar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarRow}>
            {AVATAR_OPTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => setAvatar(emoji)}
                style={[styles.avatarOption, avatar === emoji && styles.avatarSelected]}
              >
                <Text style={styles.avatarEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Agent Name */}
          <Text style={styles.fieldLabel}>Agent Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Nexus-7 Developer"
            placeholderTextColor="#475569"
            value={name}
            onChangeText={setName}
          />

          {/* Role */}
          <Text style={styles.fieldLabel}>Role / Specialty</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Senior Mobile DevOps & Cloud Engineer"
            placeholderTextColor="#475569"
            value={role}
            onChangeText={setRole}
          />

          {/* Tone Selector */}
          <Text style={styles.fieldLabel}>Personality Tone</Text>
          <View style={styles.toneGrid}>
            {TONES.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTone(t)}
                style={[styles.toneChip, tone === t && styles.toneChipActive]}
              >
                <Text style={[styles.toneText, tone === t && styles.toneTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* System Prompt / Persona Instructions */}
          <Text style={styles.fieldLabel}>Custom Persona Instructions (System Prompt)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Explain how this agent should think, speak, and what guidelines to follow..."
            placeholderTextColor="#475569"
            multiline
            numberOfLines={4}
            value={systemPrompt}
            onChangeText={setSystemPrompt}
            textAlignVertical="top"
          />

          {/* Tags */}
          <Text style={styles.fieldLabel}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. React Native, Firebase, Architecture"
            placeholderTextColor="#475569"
            value={tagInput}
            onChangeText={setTagInput}
          />

          {/* Create Button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="plus-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.createButtonText}>Create Agent in Firebase</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#090D16',
    zIndex: 100,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  formContent: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  templateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  templateEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  templateChipText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  avatarRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatarOption: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#131B2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    color: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
  },
  toneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  toneChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  toneChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#6366F1',
  },
  toneText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  toneTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: '#4F46E5',
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
