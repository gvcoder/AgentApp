import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  updateDoc,
  addDoc
} from './firebase';
import { AgentPersona, ChatMessage } from '../types/agent';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_AGENTS_KEY = '@local_agents_cache';
const LOCAL_MESSAGES_KEY = '@local_messages_cache_';

// Real-time listener for user agents (with local offline fallback)
export function subscribeToUserAgents(
  userId: string,
  onUpdate: (agents: AgentPersona[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const agentsRef = collection(db, 'agents');
    const q = query(agentsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const agents: AgentPersona[] = [];
        snapshot.forEach((docSnapshot) => {
          agents.push({ id: docSnapshot.id, ...docSnapshot.data() } as AgentPersona);
        });
        // Cache locally for offline reliability
        AsyncStorage.setItem(LOCAL_AGENTS_KEY + '_' + userId, JSON.stringify(agents)).catch(() => {});
        onUpdate(agents);
      },
      async (error) => {
        // Fallback to local storage if Firestore permissions or demo credentials are used
        console.warn('Firestore subscription fallback to local cache:', error.message);
        const cached = await AsyncStorage.getItem(LOCAL_AGENTS_KEY + '_' + userId);
        if (cached) {
          onUpdate(JSON.parse(cached));
        } else {
          onUpdate(getDefaultStarterAgents(userId));
        }
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.warn('subscribeToUserAgents error:', err);
    // Instant fallback
    AsyncStorage.getItem(LOCAL_AGENTS_KEY + '_' + userId).then((data) => {
      onUpdate(data ? JSON.parse(data) : getDefaultStarterAgents(userId));
    });
    return () => {};
  }
}

// Create new Agent linked to the user
export async function createAgent(agent: Omit<AgentPersona, 'id'>): Promise<AgentPersona> {
  const newId = 'agent_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newAgent: AgentPersona = {
    ...agent,
    id: newId,
  };

  try {
    // Attempt Firestore persistence
    const agentDoc = doc(db, 'agents', newId);
    await setDoc(agentDoc, newAgent);
  } catch (error) {
    console.warn('Saving agent to Firestore failed, storing locally:', error);
  }

  // Update local storage
  try {
    const key = LOCAL_AGENTS_KEY + '_' + agent.userId;
    const existing = await AsyncStorage.getItem(key);
    const list: AgentPersona[] = existing ? JSON.parse(existing) : [];
    list.unshift(newAgent);
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.error('Local storage agent save error', e);
  }

  return newAgent;
}

// Delete agent
export async function deleteAgent(userId: string, agentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'agents', agentId));
  } catch (e) {
    console.warn('Firestore delete error:', e);
  }

  try {
    const key = LOCAL_AGENTS_KEY + '_' + userId;
    const existing = await AsyncStorage.getItem(key);
    if (existing) {
      const list: AgentPersona[] = JSON.parse(existing);
      const filtered = list.filter((a) => a.id !== agentId);
      await AsyncStorage.setItem(key, JSON.stringify(filtered));
    }
  } catch (e) {}
}

// Subscribe to messages in an Agent conversation or room
export function subscribeToMessages(
  userId: string,
  agentId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  roomId?: string
) {
  try {
    const messagesRef = collection(db, 'chats');
    const q = roomId
      ? query(messagesRef, where('roomId', '==', roomId), orderBy('timestamp', 'asc'))
      : query(
          messagesRef,
          where('userId', '==', userId),
          where('agentId', '==', agentId),
          orderBy('timestamp', 'asc')
        );

    return onSnapshot(
      q,
      (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((d) => {
          msgs.push({ id: d.id, ...d.data() } as ChatMessage);
        });
        const cacheKey = roomId ? LOCAL_MESSAGES_KEY + 'room_' + roomId : LOCAL_MESSAGES_KEY + agentId;
        AsyncStorage.setItem(cacheKey, JSON.stringify(msgs)).catch(() => {});
        onUpdate(msgs);
      },
      async () => {
        const cacheKey = roomId ? LOCAL_MESSAGES_KEY + 'room_' + roomId : LOCAL_MESSAGES_KEY + agentId;
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) onUpdate(JSON.parse(cached));
      }
    );
  } catch (err) {
    const cacheKey = roomId ? LOCAL_MESSAGES_KEY + 'room_' + roomId : LOCAL_MESSAGES_KEY + agentId;
    AsyncStorage.getItem(cacheKey).then((data) => {
      if (data) onUpdate(JSON.parse(data));
    });
    return () => {};
  }
}

// Save message
export async function saveMessage(message: Omit<ChatMessage, 'id'>): Promise<ChatMessage> {
  const id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const fullMsg: ChatMessage = { ...message, id };

  try {
    await setDoc(doc(db, 'chats', id), fullMsg);
  } catch (err) {
    console.warn('Firestore save message fallback to local:', err);
  }

  try {
    const key = message.roomId
      ? LOCAL_MESSAGES_KEY + 'room_' + message.roomId
      : LOCAL_MESSAGES_KEY + message.agentId;
    const existing = await AsyncStorage.getItem(key);
    const msgs: ChatMessage[] = existing ? JSON.parse(existing) : [];
    msgs.push(fullMsg);
    await AsyncStorage.setItem(key, JSON.stringify(msgs));
  } catch (e) {}

  return fullMsg;
}

// Safety Guardrails: explicit words, adult content, hateful patterns
const FORBIDDEN_PATTERNS = [
  /\b(hate|kill|murder|violence|terror|bomb|nazi|racist)\b/i,
  /\b(porn|nsfw|sex|erotic|nude|naked|adult-content)\b/i,
  /\b(f\*\*k|b\*tch|a\*\*hole)\b/i,
];

export function checkSafetyGuardrails(text: string): { safe: boolean; reason?: string } {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        reason: 'Message violates safety guardrails (avoid explicit discussions, hateful comments, or adult content).',
      };
    }
  }
  return { safe: true };
}

// Simulated persona response generation based on Persona Prompt & Tone
export async function generateAgentResponse(
  persona: AgentPersona,
  userMessage: string,
  history: ChatMessage[]
): Promise<string> {
  // Step 1: Safety Guardrails Check
  const safety = checkSafetyGuardrails(userMessage);
  if (!safety.safe) {
    return `🛡️ [Guardrail Warning]: ${safety.reason}\n\nI am configured with strict safety policies to keep all discussions educational, constructive, and respectful.`;
  }

  // Simulate network/AI server-side processing latency
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));

  const roleLower = persona.role.toLowerCase();
  const qLower = userMessage.toLowerCase();

  // Persona-tailored responses for demonstration
  if (roleLower.includes('physics')) {
    return `⚛️ [${persona.name} - Physics]:\n\nRegarding "${userMessage}":\nFrom first principles, let's break this down. In classical mechanics and quantum behavior, we observe conservation laws: energy and momentum dictate the outcome. To visualize this, imagine particles exchanging bosons or a harmonic oscillator reaching equilibrium.\n\nKey formula to recall: F = dp/dt or E = mc².\nDoes that give you an intuitive conceptual grasp?`;
  }

  if (roleLower.includes('scrum') || roleLower.includes('agile')) {
    return `🏃‍♂️ [${persona.name} - Agile Coach]:\n\nAddressing "${userMessage}":\nFrom a Scrum framework perspective, our priority is sprint transparency, inspection, and adaptation. Let's inspect the Definition of Done (DoD) and story point commitments in our sprint backlog.\n\nActionable recommendation:\n1. Surface blockers during daily standup.\n2. Re-estimate spike tasks if uncertainty is high.\n3. Keep the increment potentially releasable.`;
  }

  if (roleLower.includes('carnatic') || roleLower.includes('music')) {
    return `🎶 [${persona.name} - Carnatic Expert]:\n\nNamaskaram! Exploring "${userMessage}":\nIn the realm of Carnatic Sangeetham, melody is woven through Ragas (scales & microtonal gamakas) and rhythmic Talas (like Adi Tala: 8 aksharas, 4+2+2 structure).\n\nNotice the bhavam in classic compositions by Tyagaraja or Dikshitar. The swaras (Sa, Ri, Ga, Ma, Pa, Dha, Ni) resonate with precise shruti alignment. Would you like to analyze the Arohana/Avarohana or Tala structure?`;
  }

  // Custom tone flavors
  if (persona.tone === 'humorous') {
    return `🤖 [${persona.name}]: Ha! That's quite a twist. Look at it this way: ${getDynamicAnswer(userMessage, persona)} (And don't worry, the robots haven't taken over yet! 🍕)`;
  } else if (persona.tone === 'technical') {
    return `⚙️ [${persona.name} Technical Analysis]:\n\nDirect assessment: ${getDynamicAnswer(userMessage, persona)}\nParameters: temp=${persona.temperature}, role=${persona.role}.\nRecommended next action: Verify the execution logs and validate edge conditions.`;
  } else if (persona.tone === 'philosophical') {
    return `🌌 [${persona.name}]: Consider the deeper question behind "${userMessage}". In essence: ${getDynamicAnswer(userMessage, persona)}. Everything is connected in the flow of knowledge.`;
  } else if (persona.tone === 'creative') {
    return `✨ [${persona.name}]: Imagine this: ${getDynamicAnswer(userMessage, persona)}! We can shape this in vibrant, unexpected ways.`;
  } else {
    // Professional / Friendly
    return `👋 [${persona.name}]: ${getDynamicAnswer(userMessage, persona)}\n\nI am tailored with the role of "${persona.role}". Let me know what step we should tackle next!`;
  }
}

function getDynamicAnswer(question: string, persona: AgentPersona): string {
  if (question.toLowerCase().includes('who are you') || question.toLowerCase().includes('what can you do')) {
    return `I am ${persona.name}, customized as a ${persona.role}. My core instruction is: "${persona.systemPrompt}".`;
  }
  if (question.toLowerCase().includes('firebase') || question.toLowerCase().includes('data')) {
    return `I'm backed by Firebase Cloud Firestore for real-time synchronization, linked uniquely to your user account!`;
  }
  return `I have processed your query through my persona lens (${persona.systemPrompt}). I'm ready to collaborate further on this.`;
}

// Seed starter agents for immediate exploration
export function getDefaultStarterAgents(userId: string): AgentPersona[] {
  return [
    {
      id: 'agent_coder_default',
      userId,
      name: 'CyberArchitect',
      role: 'Full-Stack Mobile Engineer',
      avatar: '💻',
      systemPrompt: 'You are an elite React Native and Android mobile engineer specializing in Firebase architectures, high-performance UI, and clean code.',
      temperature: 0.4,
      tone: 'technical',
      tags: ['Coding', 'Mobile', 'Android', 'Firebase'],
      createdAt: Date.now() - 100000,
      updatedAt: Date.now() - 100000,
    },
    {
      id: 'agent_mentor_default',
      userId,
      name: 'Dr. Socrates AI',
      role: 'Philosophical Coach & Thinker',
      avatar: '🏛️',
      systemPrompt: 'You inspire critical thinking, ask profound questions, and guide decisions using foundational logic and wisdom.',
      temperature: 0.8,
      tone: 'philosophical',
      tags: ['Mentorship', 'Wisdom', 'Philosophy'],
      createdAt: Date.now() - 50000,
      updatedAt: Date.now() - 50000,
    },
    {
      id: 'agent_copy_default',
      userId,
      name: 'Spark Writer',
      role: 'Creative Storyteller & Marketer',
      avatar: '🎨',
      systemPrompt: 'You craft engaging stories, punchy marketing hooks, and vivid descriptions tailored for modern apps.',
      temperature: 0.9,
      tone: 'creative',
      tags: ['Creative', 'Writing', 'Marketing'],
      createdAt: Date.now() - 10000,
      updatedAt: Date.now() - 10000,
    },
  ];
}
