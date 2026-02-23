import { create } from 'zustand';
import { ChatContextType } from '@calories/shared';

export interface ChatMessageUI {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    foodCards?: Array<{
      food_name: string;
      brand_name?: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      serving_unit: string;
      external_food_id?: string;
      food_source?: string;
    }>;
    narrowingQuestion?: {
      question: string;
      options: string[];
    };
    logConfirmed?: boolean;
    photoUrl?: string;
    foodCardsDismissed?: boolean;
  };
}

interface ChatState {
  messages: ChatMessageUI[];
  isStreaming: boolean;
  streamingText: string;
  contextType: ChatContextType;
  sessionId: string | null;
  addMessage: (message: ChatMessageUI) => void;
  setMessages: (messages: ChatMessageUI[]) => void;
  setStreaming: (isStreaming: boolean) => void;
  appendStreamingText: (text: string) => void;
  clearStreamingText: () => void;
  setContextType: (type: ChatContextType) => void;
  setSessionId: (id: string | null) => void;
  dismissFoodCards: (messageId: string) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  streamingText: '',
  contextType: 'general',
  sessionId: null,

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),

  setMessages: (messages) => set({ messages }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  appendStreamingText: (text) => set((state) => ({
    streamingText: state.streamingText + text,
  })),

  clearStreamingText: () => set({ streamingText: '' }),

  setContextType: (contextType) => set({ contextType }),

  setSessionId: (sessionId) => set({ sessionId }),

  dismissFoodCards: (messageId) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === messageId
        ? { ...msg, metadata: { ...msg.metadata, foodCardsDismissed: true } }
        : msg
    ),
  })),

  clearChat: () => set({ messages: [], streamingText: '', sessionId: null }),
}));
