import { ChatContextType } from '@calories/shared';
import { API_BASE_URL } from './api';
import { useAuthStore } from '../stores/authStore';
import { useUserProfileStore } from '../stores/userProfileStore';
import { useChatStore, ChatMessageUI } from '../stores/chatStore';
import EventSource from 'react-native-sse';

type ChatSSEEvents = 'token' | 'action' | 'done';

interface ChatSendOptions {
  message: string;
  contextType: ChatContextType;
  metadata?: Record<string, unknown>;
  /** If true, don't add a user message bubble (e.g. when one was already added by the photo flow) */
  skipUserMessage?: boolean;
}

export async function sendChatMessage({ message, contextType, metadata, skipUserMessage }: ChatSendOptions) {
  const token = useAuthStore.getState().token;
  const store = useChatStore.getState();

  // Add user message to store (unless caller already added one)
  if (!skipUserMessage) {
    const userMessage: ChatMessageUI = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    store.addMessage(userMessage);
  }
  store.setStreaming(true);
  store.clearStreamingText();

  let fullText = '';
  let assistantMetadata: ChatMessageUI['metadata'] = {};
  let finished = false;
  let gotDone = false;
  let receivedAnyData = false;

  return new Promise<void>((resolve) => {
    const url = `${API_BASE_URL}/chat/message`;

    const es = new EventSource<ChatSSEEvents>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        context_type: contextType,
        metadata,
        // Send client's local date so food logs are saved for the correct day
        local_date: (() => {
          const d = new Date();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })(),
      }),
    });

    es.addEventListener('token', (event) => {
      receivedAnyData = true;
      try {
        if (event.data) {
          const data = JSON.parse(event.data);
          if (data.text) {
            fullText += data.text;
            useChatStore.getState().appendStreamingText(data.text);
          }
        }
      } catch {
        // Skip malformed JSON
      }
    });

    es.addEventListener('action', (event) => {
      receivedAnyData = true;
      try {
        if (event.data) {
          const data = JSON.parse(event.data);
          handleAction(data, assistantMetadata);
        }
      } catch {
        // Skip malformed JSON
      }
    });

    es.addEventListener('done', () => {
      gotDone = true;
      finish();
    });

    es.addEventListener('error', (event) => {
      // react-native-sse fires 'error' when the connection closes,
      // which is normal after the server finishes streaming.
      // Only treat it as a real error if we haven't received any data.
      if (!finished) {
        if (receivedAnyData || gotDone) {
          // Connection closed after streaming — this is normal, just finish up
          finish();
        } else {
          // Real error — no data received at all
          console.error('Chat SSE error:', event);
          finish();
        }
      }
    });

    function finish() {
      if (finished) return;
      finished = true;
      es.close();

      if (fullText) {
        const assistantMessage: ChatMessageUI = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fullText,
          timestamp: Date.now(),
          metadata: assistantMetadata && Object.keys(assistantMetadata).length > 0
            ? assistantMetadata
            : undefined,
        };
        useChatStore.getState().addMessage(assistantMessage);
      } else if (!receivedAnyData) {
        // Only show error if we truly got nothing
        const errorMessage: ChatMessageUI = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: Date.now(),
        };
        useChatStore.getState().addMessage(errorMessage);
      }

      useChatStore.getState().setStreaming(false);
      useChatStore.getState().clearStreamingText();
      resolve();
    }
  });
}

function handleAction(data: Record<string, unknown>, metadata: ChatMessageUI['metadata']) {
  if (!metadata) return;

  switch (data.type) {
    case 'food_suggestion': {
      if (!metadata.foodCards) metadata.foodCards = [];
      const actionData = data.data as Record<string, unknown>;
      const results = actionData?.results as any[];
      if (results && Array.isArray(results)) {
        for (const food of results) {
          if (food && food.food_name) {
            metadata.foodCards.push(food);
          }
        }
      }
      break;
    }
    case 'narrowing_question':
      metadata.narrowingQuestion = data as any;
      break;
    case 'log_confirmed':
      metadata.logConfirmed = true;
      break;
    case 'onboarding_complete': {
      // Update the user profile store to trigger navigation
      const profileStore = useUserProfileStore.getState();
      const current = profileStore.profile;
      if (current) {
        profileStore.setProfile({
          ...current,
          onboarding_completed: true,
        });
      }
      break;
    }
    case 'onboarding_field': {
      // Update the individual field in the profile store
      const actionData = data.data as Record<string, unknown>;
      const profileStore = useUserProfileStore.getState();
      const current = profileStore.profile;
      if (current && actionData.field) {
        profileStore.setProfile({
          ...current,
          [actionData.field as string]: actionData.value,
        });
      }
      break;
    }
  }
}
