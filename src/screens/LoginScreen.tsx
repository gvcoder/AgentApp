import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, signInWithGitHub, signInAsGuest, loading } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      
      {/* Decorative gradient glow backgrounds */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.content}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="robot-excited-outline" size={44} color="#6366F1" />
          </View>
          <Text style={styles.title}>PersonaForge AI</Text>
          <Text style={styles.subtitle}>
            Architect, customize, and converse with specialized AI Chat Agents synced to Firebase Cloud.
          </Text>
        </View>

        {/* Feature Highlights */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#10B981" />
            <Text style={styles.featureText}>Custom Prompt & Personality Engine</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="cloud-sync" size={20} color="#3B82F6" />
            <Text style={styles.featureText}>Real-time Firebase Firestore Persistence</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="shield-account" size={20} color="#F59E0B" />
            <Text style={styles.featureText}>User-isolated Chat Agent Records</Text>
          </View>
        </View>

        {/* Social Login Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={signInWithGoogle}
            disabled={loading}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="google" size={18} color="#EA4335" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.githubButton]}
            onPress={signInWithGitHub}
            disabled={loading}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="github" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Continue with GitHub</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={signInAsGuest}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.guestButtonText}>Try as Guest Explorer</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          By continuing, you agree to our Terms of Service & Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#6366F1',
    opacity: 0.15,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -120,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#3B82F6',
    opacity: 0.12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 36,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  features: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 7,
  },
  featureText: {
    color: '#CBD5E1',
    fontSize: 13.5,
    marginLeft: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
  },
  githubButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 12,
    marginHorizontal: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  guestButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  guestButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footerNote: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
});
