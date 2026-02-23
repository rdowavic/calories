export type ChatRole = 'user' | 'assistant' | 'system';
export type ChatContextType = 'onboarding' | 'food_logging' | 'photo_narrowing' | 'general';

export interface ChatMessage {
  id: string;
  user_id: string;
  role: ChatRole;
  content: string;
  context_type: ChatContextType | null;
  food_log_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ChatRequest {
  message: string;
  context_type: ChatContextType;
  metadata?: {
    photo_candidates?: Array<{ name: string; confidence: number; clarifai_id: string }>;
    selected_food?: Record<string, unknown>;
    session_id?: string;
  };
}

export type ChatSSEEventType = 'token' | 'action' | 'done' | 'error';

export interface ChatSSETokenEvent {
  text: string;
}

export interface ChatSSEActionEvent {
  type: 'food_suggestion' | 'narrowing_question' | 'log_confirmed' | 'onboarding_field' | 'onboarding_complete';
  data: Record<string, unknown>;
}
