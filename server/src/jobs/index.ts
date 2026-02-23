import cron from 'node-cron';
import * as notificationService from '../services/notification.service';
import { logger } from '../config/logger';

export function startScheduledJobs() {
  // Lunch logging nudge - 1:30 PM daily
  cron.schedule('30 13 * * *', async () => {
    logger.info('Running lunch nudge job');
    // Implementation would query users who haven't logged lunch and send nudges
  });

  // Dinner logging nudge - 7:30 PM daily
  cron.schedule('30 19 * * *', async () => {
    logger.info('Running dinner nudge job');
  });

  // Weekly weight prompt - Sunday 9 AM
  cron.schedule('0 9 * * 0', async () => {
    logger.info('Running weekly weight prompt job');
  });

  // Weekly summary generation - Monday 6 AM
  cron.schedule('0 6 * * 1', async () => {
    logger.info('Running weekly summary generation job');
  });

  logger.info('Scheduled jobs initialized');
}
