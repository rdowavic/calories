import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useChatStore } from '../../stores/chatStore';
import { API_BASE_URL } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/common/Button';

export default function PhotoCaptureScreen() {
  const { colors, typography, spacing } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo) {
        // Compress for upload and get base64 in one step
        const manipulated = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        setPhotoUri(manipulated.uri);
        setPhotoBase64(manipulated.base64 ?? null);
      }
    } catch (error) {
      console.warn('Photo capture failed:', error);
      Alert.alert('Capture Failed', 'Could not take photo. Please try again.');
    }
  };

  const usePhoto = async () => {
    if (!photoUri) return;
    setIsAnalyzing(true);

    try {
      if (!photoBase64) {
        throw new Error('No base64 image data available');
      }

      const token = useAuthStore.getState().token;

      const res = await fetch(`${API_BASE_URL}/photos/recognize-base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageBase64: photoBase64,
          mimeType: 'image/jpeg',
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const response = await res.json();

      // Server returns { success, data: { candidates, session_id } }
      const result = response?.data ?? response;
      const candidates = result.candidates ?? [];
      const candidateNames = candidates
        .filter((c: any) => c.confidence >= 0.3)
        .map((c: any) => `${c.name} (${Math.round(c.confidence * 100)}%)`)
        .join(', ');

      // Build user-facing message and the message we send to Claude
      const hasDetections = candidateNames.length > 0;
      const userVisibleText = hasDetections
        ? `📸 Photo captured — detected: ${candidateNames}`
        : '📸 Photo captured';
      const claudeMessage = hasDetections
        ? `I took a photo of my food. The image recognition detected: ${candidateNames}. Please search for this food, show me the nutrition info, and ask me about the portion size so we can log it.`
        : 'I took a photo of my food but the image recognition couldn\'t identify it. Can you ask me what I\'m eating so we can log it?';

      // Add photo message to chat (with photo thumbnail + detection summary)
      useChatStore.getState().addMessage({
        id: `photo-${Date.now()}`,
        role: 'user',
        content: userVisibleText,
        timestamp: Date.now(),
        metadata: { photoUrl: photoUri },
      });

      router.replace('/(tabs)/chat');

      // Send to Claude — skip adding another user message since we just added the photo one
      const { sendChatMessage } = await import('../../services/chatService');
      sendChatMessage({
        message: claudeMessage,
        contextType: 'food_logging',
        skipUserMessage: true,
      });
    } catch (error: any) {
      console.error('[PhotoCapture] Analysis error:', error?.message);

      // Fall back gracefully — skip photo analysis and ask Claude directly
      useChatStore.getState().addMessage({
        id: `photo-${Date.now()}`,
        role: 'user',
        content: '📸 Photo captured',
        timestamp: Date.now(),
        metadata: { photoUrl: photoUri },
      });

      router.replace('/(tabs)/chat');

      const { sendChatMessage } = await import('../../services/chatService');
      sendChatMessage({
        message: 'I took a photo of my food but the image analysis had a connection issue. Can you ask me what I\'m eating so we can log it?',
        contextType: 'food_logging',
        skipUserMessage: true,
      });
    }
  };

  if (!permission?.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContent}>
          <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
          <Text style={[typography.h4, { color: colors.text, marginTop: spacing.lg, textAlign: 'center' }]}>
            Camera Access Needed
          </Text>
          <View style={{ marginTop: spacing.xl, width: '100%' }}>
            <Button title="Grant Camera Access" onPress={requestPermission} />
          </View>
        </View>
      </View>
    );
  }

  if (isAnalyzing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.analyzingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.h4, { color: colors.text, marginTop: spacing.lg }]}>
            Analyzing your food...
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            Our AI is identifying what's on your plate
          </Text>
        </View>
      </View>
    );
  }

  if (photoUri) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.previewButtons}>
            <TouchableOpacity
              style={[styles.previewButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => { setPhotoUri(null); setPhotoBase64(null); }}
            >
              <Ionicons name="refresh" size={24} color="#FFFFFF" />
              <Text style={[typography.captionBold, { color: '#FFFFFF', marginTop: 4 }]}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.previewButton, { backgroundColor: colors.primary }]}
              onPress={usePhoto}
            >
              <Ionicons name="checkmark" size={24} color="#FFFFFF" />
              <Text style={[typography.captionBold, { color: '#FFFFFF', marginTop: 4 }]}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} />
      <View style={styles.cameraOverlay}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.captureSection}>
          <Text style={[typography.body, { color: '#FFFFFF', textAlign: 'center', marginBottom: spacing.lg }]}>
            Take a photo of your meal
          </Text>
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  analyzingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureSection: {
    alignItems: 'center',
    paddingBottom: 80,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingBottom: 80,
  },
  previewButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
});
