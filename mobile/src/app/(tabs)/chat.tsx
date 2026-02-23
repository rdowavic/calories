import React, { useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../theme';
import { useChatStore, ChatMessageUI } from '../../stores/chatStore';
import { sendChatMessage } from '../../services/chatService';
import ChatBubble from '../../components/chat/ChatBubble';
import ChatInput from '../../components/chat/ChatInput';
import TypingIndicator from '../../components/chat/TypingIndicator';

export default function ChatScreen() {
  const { colors, spacing } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingText = useChatStore((s) => s.streamingText);
  const setContextType = useChatStore((s) => s.setContextType);

  useEffect(() => {
    setContextType('food_logging');
    // Show welcome if first time on chat tab
    if (messages.length === 0) {
      const welcome: ChatMessageUI = {
        id: 'chat-welcome',
        role: 'assistant',
        content: "What would you like to log? You can describe your meal, take a photo, or scan a barcode. I'll help you find the right match and get an accurate calorie count.",
        timestamp: Date.now(),
      };
      useChatStore.getState().addMessage(welcome);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, streamingText]);

  const handleSend = (text: string) => {
    sendChatMessage({
      message: text,
      contextType: 'food_logging',
    });
  };

  const handleCameraPress = () => {
    router.push('/(modals)/photo-capture');
  };

  const handleBarcodePress = () => {
    router.push('/(modals)/barcode-scanner');
  };

  const handleFoodCardSelect = (food: any, messageId: string) => {
    // Dismiss the food cards so they can't be re-selected
    useChatStore.getState().dismissFoodCards(messageId);
    // Navigate to food detail with the food data prefetched
    router.push({
      pathname: '/(modals)/food-detail',
      params: {
        foodId: food.external_food_id || food.food_name,
        source: food.food_source || 'manual',
        prefetchedFood: JSON.stringify(food),
      },
    });
  };

  const handleNarrowingSelect = (option: string) => {
    sendChatMessage({
      message: option,
      contextType: 'food_logging',
    });
  };

  const handleTypeInstead = (messageId: string) => {
    // Dismiss the food cards so they can't be re-selected
    useChatStore.getState().dismissFoodCards(messageId);
    // Send a message telling Claude the user wants to type manually
    sendChatMessage({
      message: 'None of these match. Let me describe what I had instead.',
      contextType: 'food_logging',
    });
  };

  const renderItem = ({ item, index }: { item: ChatMessageUI; index: number }) => {
    const isLast = index === messages.length - 1;
    return (
      <ChatBubble
        message={item}
        isStreaming={isLast && isStreaming}
        onFoodCardSelect={(food) => handleFoodCardSelect(food, item.id)}
        onNarrowingSelect={handleNarrowingSelect}
        onTypeInstead={() => handleTypeInstead(item.id)}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
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
          onCameraPress={handleCameraPress}
          onBarcodePress={handleBarcodePress}
          disabled={isStreaming}
        />
      </KeyboardAvoidingView>
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
