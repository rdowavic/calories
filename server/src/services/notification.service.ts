import axios from 'axios';
import { db } from '../config/database';
import { logger } from '../config/logger';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Maximum number of notifications per batch request to Expo Push API.
 */
const EXPO_BATCH_SIZE = 100;

interface PushToken {
  id: string;
  user_id: string;
  token: string;
  device_id: string | null;
  platform: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PushNotificationPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
}

/**
 * Registers or updates a push notification token for a user.
 */
export async function registerToken(
  userId: string,
  token: string,
  deviceId?: string,
  platform?: string
): Promise<void> {
  await db('push_tokens')
    .insert({
      user_id: userId,
      token,
      device_id: deviceId ?? null,
      platform: platform ?? null,
      is_active: true,
    })
    .onConflict(['user_id', 'token'])
    .merge({
      is_active: true,
      device_id: deviceId ?? null,
      platform: platform ?? null,
      updated_at: db.fn.now(),
    });

  logger.debug({ userId, platform }, 'Push token registered');
}

/**
 * Marks a push token as inactive (unregisters it).
 */
export async function unregisterToken(
  userId: string,
  token: string
): Promise<void> {
  await db('push_tokens')
    .where({ user_id: userId, token })
    .update({
      is_active: false,
      updated_at: db.fn.now(),
    });

  logger.debug({ userId }, 'Push token unregistered');
}

/**
 * Sends a push notification to all of a user's active devices.
 */
export async function sendNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const tokens: PushToken[] = await db('push_tokens')
    .where({ user_id: userId, is_active: true });

  if (tokens.length === 0) {
    logger.debug({ userId }, 'No active push tokens for user');
    return;
  }

  const messages: PushNotificationPayload[] = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    data,
    sound: 'default' as const,
    priority: 'high' as const,
  }));

  await sendToExpo(messages);
  logger.debug({ userId, deviceCount: tokens.length }, 'Push notification sent');
}

/**
 * Sends bulk notifications to multiple users.
 */
export async function sendBulkNotifications(
  notifications: Array<{
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }>
): Promise<void> {
  if (notifications.length === 0) return;

  // Collect all user IDs
  const userIds = notifications.map((n) => n.userId);

  // Fetch all active tokens for these users in one query
  const allTokens: PushToken[] = await db('push_tokens')
    .whereIn('user_id', userIds)
    .where({ is_active: true });

  // Build a map of userId -> tokens
  const tokenMap = new Map<string, PushToken[]>();
  for (const token of allTokens) {
    if (!tokenMap.has(token.user_id)) {
      tokenMap.set(token.user_id, []);
    }
    tokenMap.get(token.user_id)!.push(token);
  }

  // Build all messages
  const messages: PushNotificationPayload[] = [];
  for (const notification of notifications) {
    const userTokens = tokenMap.get(notification.userId) ?? [];
    for (const token of userTokens) {
      messages.push({
        to: token.token,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: 'default',
        priority: 'high',
      });
    }
  }

  if (messages.length === 0) {
    logger.debug('No active tokens found for bulk notifications');
    return;
  }

  // Send in batches
  for (let i = 0; i < messages.length; i += EXPO_BATCH_SIZE) {
    const batch = messages.slice(i, i + EXPO_BATCH_SIZE);
    await sendToExpo(batch);
  }

  logger.info(
    { userCount: notifications.length, messageCount: messages.length },
    'Bulk push notifications sent'
  );
}

/**
 * Sends notification payloads to the Expo Push API.
 * Handles token invalidation on error responses.
 */
async function sendToExpo(
  messages: PushNotificationPayload[]
): Promise<void> {
  try {
    const response = await axios.post(EXPO_PUSH_URL, messages, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      timeout: 15_000,
    });

    const { data } = response.data as { data: Array<Record<string, unknown>> };

    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        const result = data[i];
        if (result.status === 'error') {
          const errorDetails = result.details as Record<string, unknown> | undefined;

          // Handle invalid/expired tokens
          if (errorDetails?.error === 'DeviceNotRegistered') {
            const token = messages[i].to;
            await db('push_tokens')
              .where({ token })
              .update({ is_active: false, updated_at: db.fn.now() });

            logger.info({ token: token.substring(0, 20) + '...' }, 'Deactivated invalid push token');
          } else {
            logger.warn(
              { error: result.message, token: messages[i].to.substring(0, 20) + '...' },
              'Expo push error'
            );
          }
        }
      }
    }
  } catch (error) {
    logger.error({ error, messageCount: messages.length }, 'Failed to send Expo push notifications');
    throw error;
  }
}
