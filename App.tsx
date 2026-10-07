import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { AgentHubScreen } from './src/screens/AgentHubScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { AgentPersona } from './src/types/agent';
import { StatusBar } from 'expo-status-bar';

function MainNavigator() {
  const { user, loading } = useAuth();
  const [activeAgent, setActiveAgent] = useState<AgentPersona | null>(null);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (activeAgent) {
    return (
      <ChatScreen
        agent={activeAgent}
        onBack={() => setActiveAgent(null)}
      />
    );
  }

  return (
    <AgentHubScreen
      onSelectAgent={(agent) => setActiveAgent(agent)}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <MainNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#090D16',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
