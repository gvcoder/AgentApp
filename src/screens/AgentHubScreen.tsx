import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { AgentPersona } from '../types/agent';
import { subscribeToUserAgents, deleteAgent } from '../services/agentService';
import { CreateAgentModal } from '../components/CreateAgentModal';

interface AgentHubScreenProps {
  onSelectAgent: (agent: AgentPersona) => void;
}

export const AgentHubScreen: React.FC<AgentHubScreenProps> = ({ onSelectAgent }) => {
  const { user, signOutUser } = useAuth();
  const [agents, setAgents] = useState<AgentPersona[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserAgents(user.uid, (list) => {
      setAgents(list);
      setRefreshing(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user]);

  const handleDelete = (agent: AgentPersona) => {
    Alert.alert(
      'Delete Agent',
      `Are you sure you want to delete ${agent.name}? Their chat records and persona will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (user) {
              await deleteAgent(user.uid, agent.id);
            }
          },
        },
      ]
    );
  };

  const renderAgentCard = ({ item }: { item: AgentPersona }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onSelectAgent(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardAvatar}>
          <Text style={{ fontSize: 26 }}>{item.avatar}</Text>
        </View>
        <View style={styles.cardTitleBox}>
          <Text style={styles.agentName}>{item.name}</Text>
          <Text style={styles.agentRole}>{item.role}</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      <Text style={styles.promptSnippet} numberOfLines={2}>
        "{item.systemPrompt}"
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.toneTag}>
          <Text style={styles.toneTagText}>{item.tone}</Text>
        </View>

        <View style={styles.tagsRow}>
          {item.tags?.slice(0, 2).map((t, idx) => (
            <View key={idx} style={styles.subTag}>
              <Text style={styles.subTagText}>#{t}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chatActionBtn}>
          <Text style={styles.chatActionText}>Chat</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#818CF8" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />

      {/* Top Navbar */}
      <View style={styles.navbar}>
        <View style={styles.userProfile}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.displayName || 'Agent Architect'}</Text>
          </View>
        </View>

        <View style={styles.navActions}>
          <TouchableOpacity onPress={signOutUser} style={styles.iconBtn}>
            <MaterialCommunityIcons name="logout" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hub Banner & Stats */}
      <View style={styles.hubBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hubTitle}>AI Agent Collective</Text>
          <Text style={styles.hubSubtitle}>
            {agents.length} persona{agents.length === 1 ? '' : 's'} linked to your Firebase profile
          </Text>
        </View>
        <TouchableOpacity
          style={styles.newAgentBtn}
          onPress={() => setIsModalOpen(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.newAgentBtnText}>New Agent</Text>
        </TouchableOpacity>
      </View>

      {/* Agents List */}
      <FlatList
        data={agents}
        keyExtractor={(item) => item.id}
        renderItem={renderAgentCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => setRefreshing(true)}
            tintColor="#6366F1"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="robot-off-outline" size={48} color="#475569" />
            <Text style={styles.emptyTitle}>No AI Agents Yet</Text>
            <Text style={styles.emptySub}>
              Tap "New Agent" to design a customized persona with its own instructions and system prompt!
            </Text>
          </View>
        }
      />

      {/* Agent Creation Modal */}
      <CreateAgentModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={(newAgent) => {
          setAgents((prev) => [newAgent, ...prev.filter((a) => a.id !== newAgent.id)]);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  welcomeText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  userName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  hubTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  hubSubtitle: {
    color: '#94A3B8',
    fontSize: 12.5,
    marginTop: 2,
  },
  newAgentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    elevation: 3,
  },
  newAgentBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#131B2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleBox: {
    flex: 1,
    marginLeft: 12,
  },
  agentName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  agentRole: {
    color: '#818CF8',
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 1,
  },
  deleteButton: {
    padding: 6,
  },
  promptSnippet: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 10,
    marginTop: 2,
  },
  toneTag: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  toneTagText: {
    color: '#818CF8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  subTag: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subTagText: {
    color: '#64748B',
    fontSize: 11,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatActionText: {
    color: '#818CF8',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
  },
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
