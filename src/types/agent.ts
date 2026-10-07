export interface AgentPersona {
  id: string;
  userId: string;
  name: string;
  role: string;
  avatar: string;
  systemPrompt: string;
  temperature: number;
  tone: 'professional' | 'creative' | 'humorous' | 'technical' | 'friendly' | 'philosophical';
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  userId: string;
  assignedAgentId: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  roomId?: string;
  conversationId: string;
  agentId: string;
  userId: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  provider: 'google' | 'github' | 'email' | 'guest';
  createdAt: number;
}
