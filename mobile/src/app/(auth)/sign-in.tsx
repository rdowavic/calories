import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../theme';
import {
  signInWithGoogle,
  handleGoogleAuthCode,
  devSignIn,
  isExpoGo,
} from '../../services/authService';

export default function SignInScreen() {
  const { colors, typography, spacing } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigateAfterAuth = (result: { is_new_user: boolean; user: { onboarding_completed: boolean } }) => {
    if (result.is_new_user || !result.user.onboarding_completed) {
      router.replace('/(onboarding)/chat');
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (isExpoGo()) {
        // In Expo Go: use dev sign-in (Google OAuth not supported)
        console.log('[SignIn] Using dev sign-in (Expo Go detected)');
        const result = await devSignIn();
        navigateAfterAuth(result);
      } else {
        // In dev builds / production: use real Google OAuth
        const authResult = await signInWithGoogle();
        if (!authResult) {
          setIsLoading(false);
          return;
        }
        const result = await handleGoogleAuthCode(authResult.code, authResult.codeVerifier);
        navigateAfterAuth(result);
      }
    } catch (err: any) {
      console.error('[SignIn] Error:', err);
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.iconText, { color: colors.primary }]}>C</Text>
          </View>
          <Text style={[typography.h1, { color: colors.text, marginTop: spacing.lg }]}>
            Calories
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
            Track your meals effortlessly with AI-powered food recognition and smart logging.
          </Text>
        </View>

        <View style={styles.bottomSection}>
          {isExpoGo() && (
            <View style={[styles.devBanner, { backgroundColor: '#FFF3CD' }]}>
              <Text style={[typography.caption, { color: '#856404' }]}>
                Dev Mode — Using test sign-in (Google OAuth requires a development build)
              </Text>
            </View>
          )}

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]}>
              <Text style={[typography.caption, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.googleButton, { backgroundColor: colors.text }]}
            onPress={handleSignIn}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Text style={[styles.googleIcon]}>G</Text>
                <Text style={[typography.bodyBold, { color: colors.background, marginLeft: spacing.sm }]}>
                  {isExpoGo() ? 'Sign in (Dev Mode)' : 'Sign in with Google'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[typography.small, { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg }]}>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 48,
  },
  heroSection: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 36,
    fontWeight: '700',
  },
  bottomSection: {
    width: '100%',
  },
  devBanner: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
