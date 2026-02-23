import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import Button from '../common/Button';

interface ConsentModalProps {
  visible: boolean;
  onAccept: (consent: boolean) => void;
}

interface BulletPointProps {
  text: string;
}

function BulletPoint({ text }: BulletPointProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.bulletRow, { marginBottom: spacing.sm }]}>
      <Ionicons
        name="checkmark-circle-outline"
        size={18}
        color={colors.primary}
        style={{ marginTop: 2 }}
      />
      <Text
        style={[
          typography.caption,
          { color: colors.textSecondary, marginLeft: spacing.sm, flex: 1 },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

export default function ConsentModal({ visible, onAccept }: ConsentModalProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            {
              backgroundColor: colors.surfaceElevated,
              borderRadius: borderRadius.xl,
              marginHorizontal: spacing.xl,
              maxHeight: '80%',
              ...(Platform.OS === 'ios'
                ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.15,
                    shadowRadius: 24,
                  }
                : { elevation: 12 }),
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={{
              padding: spacing.xl,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: colors.primaryLight,
                  borderRadius: borderRadius.full,
                  width: 64,
                  height: 64,
                  alignSelf: 'center',
                  marginBottom: spacing.xl,
                },
              ]}
            >
              <Ionicons name="shield-checkmark-outline" size={32} color={colors.primary} />
            </View>

            {/* Title */}
            <Text
              style={[
                typography.h2,
                { color: colors.text, textAlign: 'center' },
              ]}
            >
              Your Privacy Matters
            </Text>

            <Text
              style={[
                typography.body,
                {
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: spacing.sm,
                  marginBottom: spacing.xl,
                },
              ]}
            >
              Help us improve your experience by allowing anonymous usage analytics.
            </Text>

            {/* What we track */}
            <Text
              style={[
                typography.captionBold,
                {
                  color: colors.text,
                  marginBottom: spacing.md,
                },
              ]}
            >
              What we collect:
            </Text>

            <BulletPoint text="Time-to-log speed (how quickly meals are logged)" />
            <BulletPoint text="Feature usage patterns (which screens you use most)" />
            <BulletPoint text="App performance metrics (load times, errors)" />
            <BulletPoint text="Meal logging frequency and preferred input methods" />

            {/* What we DON'T track */}
            <Text
              style={[
                typography.captionBold,
                {
                  color: colors.text,
                  marginTop: spacing.lg,
                  marginBottom: spacing.md,
                },
              ]}
            >
              What we never collect:
            </Text>

            <View style={[styles.bulletRow, { marginBottom: spacing.sm }]}>
              <Ionicons
                name="close-circle-outline"
                size={18}
                color={colors.error}
                style={{ marginTop: 2 }}
              />
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textSecondary,
                    marginLeft: spacing.sm,
                    flex: 1,
                  },
                ]}
              >
                Personal health data, specific foods, or weight entries
              </Text>
            </View>
            <View style={[styles.bulletRow, { marginBottom: spacing.sm }]}>
              <Ionicons
                name="close-circle-outline"
                size={18}
                color={colors.error}
                style={{ marginTop: 2 }}
              />
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textSecondary,
                    marginLeft: spacing.sm,
                    flex: 1,
                  },
                ]}
              >
                Your identity, name, email, or location
              </Text>
            </View>

            {/* Note */}
            <Text
              style={[
                typography.small,
                {
                  color: colors.textTertiary,
                  textAlign: 'center',
                  marginTop: spacing.xl,
                  marginBottom: spacing.lg,
                },
              ]}
            >
              You can change this anytime in Settings. The app works fully without analytics.
            </Text>

            {/* Buttons */}
            <View style={[styles.buttons, { gap: spacing.md }]}>
              <Button
                title="Allow Analytics"
                onPress={() => onAccept(true)}
                variant="primary"
                size="lg"
                icon="analytics-outline"
                style={{ flex: 1 }}
              />
              <Button
                title="No Thanks"
                onPress={() => onAccept(false)}
                variant="ghost"
                size="lg"
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  buttons: {},
});
