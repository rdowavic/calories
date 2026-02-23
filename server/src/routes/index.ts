import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import foodRoutes from './food.routes';
import photoRoutes from './photo.routes';
import chatRoutes from './chat.routes';
import logRoutes from './log.routes';
import weightRoutes from './weight.routes';
import projectionRoutes from './projection.routes';
import recipeRoutes from './recipe.routes';
import notificationRoutes from './notification.routes';
import exportRoutes from './export.routes';
import analyticsRoutes from './analytics.routes';
import adminRoutes from './admin.routes';

export const routes = Router();

// Public routes
routes.use('/auth', authRoutes);

// Authenticated routes
routes.use('/users', authMiddleware, userRoutes);
routes.use('/foods', authMiddleware, foodRoutes);
routes.use('/photos', authMiddleware, photoRoutes);
routes.use('/chat', authMiddleware, chatRoutes);
routes.use('/logs', authMiddleware, logRoutes);
routes.use('/weight', authMiddleware, weightRoutes);
routes.use('/projections', authMiddleware, projectionRoutes);
routes.use('/recipes', authMiddleware, recipeRoutes);
routes.use('/notifications', authMiddleware, notificationRoutes);
routes.use('/export', authMiddleware, exportRoutes);
routes.use('/analytics', authMiddleware, analyticsRoutes);

// Admin routes (auth + admin)
routes.use('/admin', authMiddleware, adminMiddleware, adminRoutes);
