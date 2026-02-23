import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useChatStore, ChatMessageUI } from '../../stores/chatStore';
import { useUserProfileStore } from '../../stores/userProfileStore';
import { sendChatMessage } from '../../services/chatService';
import ChatBubble from '../../components/chat/ChatBubble';
import ChatInput from '../../components/chat/ChatInput';
import TypingIndicator from '../../components/chat/TypingIndicator';
import ConsentModal from '../../components/onboarding/ConsentModal';

export default function OnboardingChatScreen() {
  const { colors, spacing } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [showConsent, setShowConsent] = useState(false);
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingText = useChatStore((s) => s.streamingText);
  const setContextType = useChatStore((s) => s.setContextType);

  useEffect(() => {
    // Clear any stale messages and start fresh for onboarding
    useChatStore.getState().clearChat();
    setContextType('onboarding');

    const welcomeMessage: ChatMessageUI = {
      id: 'welcome',
      role: 'assistant',
      content: "Hey there! I'm your calorie tracking assistant. Let's get you set up — it'll only take a couple of minutes.\n\nFirst, what should I call you?",
      timestamp: Date.now(),
    };
    useChatStore.getState().addMessage(welcomeMessage);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, streamingText]);

  // Check if onboarding is complete from chat actions
  const profile = useUserProfileStore((s) => s.profile);
  useEffect(() => {
    if (profile?.onboarding_completed) {
      setShowConsent(true);
    }
  }, [profile?.onboarding_completed]);

  const handleSend = (text: string) => {
    sendChatMessage({
      message: text,
      contextType: 'onboarding',
    });
  };

  const handleConsent = (consent: boolean) => {
    setShowConsent(false);
    // Navigate to main app
    router.replace('/(tabs)/home');
  };

  const renderItem = ({ item, index }: { item: ChatMessageUI; index: number }) => {
    const isLast = index === messages.length - 1;
    return (
      <ChatBubble
        message={item}
        isStreaming={isLast && isStreaming}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.messageList, { paddingHorizontal: spacing.lg }]}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isStreaming && streamingText ? (
              <ChatBubble
                message={{
                  id: 'streaming',
                  role: 'assistant',
                  content: streamingText,
                  timestamp: Date.now(),
                }}
                isStreaming
              />
            ) : isStreaming ? (
              <View style={{ paddingVertical: spacing.sm }}>
                <TypingIndicator />
              </View>
            ) : null
          }
        />
        <ChatInput
          onSend={handleSend}
          disabled={isStreaming}
          placeholder="Type your answer..."
        />
      </KeyboardAvoidingView>

      <ConsentModal visible={showConsent} onAccept={handleConsent} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  messageList: {
    paddingTop: 16,
    paddingBottom: 8,
  },
});
