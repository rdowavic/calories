# Calories

A full-stack calorie tracking application with an AI-powered chat assistant, multi-source food database search, photo recognition, and weight projections.

## Features

- **AI Chat Assistant** - Claude-powered conversational interface for onboarding and food logging
- **Multi-Source Food Search** - Aggregates results from FatSecret, USDA, Nutritionix, and OpenFoodFacts
- **Photo Recognition** - Identify foods from photos via Clarifai
- **Barcode Scanning** - Scan product barcodes for instant nutritional data
- **Weight Tracking & Projections** - Log weight and project goal dates using the Hall model
- **Recipe Management** - Create and save custom recipes
- **Weekly Summaries** - Auto-generated weekly nutrition overviews
- **Push Notifications** - Meal logging reminders
- **Admin Dashboard** - User engagement analytics and insights

## Tech Stack

| Component | Stack |
|-----------|-------|
| **Server** | Node.js, Express, TypeScript, PostgreSQL, Knex.js |
| **Mobile** | React Native, Expo, Expo Router, Zustand |
| **Admin** | React, Vite, Tailwind CSS, Recharts |
| **Shared** | TypeScript types, Zod validators, utility functions |

## Project Structure

```
calories/
├── server/          # Express API server
├── mobile/          # React Native (Expo) mobile app
├── admin/           # Admin dashboard (React + Vite)
├── shared/          # Shared types, constants, and utilities
├── package.json     # Root workspace config
└── tsconfig.base.json
```

## Prerequisites

- Node.js 18+
- PostgreSQL
- API keys (see [Environment Variables](#environment-variables))

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your credentials

# Set up the database
npm run db:migrate

# Start the server (port 3000)
npm run server

# Start the mobile app (Expo)
npm run mobile

# Start the admin dashboard (port 3001)
npm run admin
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run server` | Start the API server with hot reload |
| `npm run mobile` | Start the Expo dev server |
| `npm run admin` | Start the admin dashboard dev server |
| `npm run build:shared` | Build shared types package |
| `npm run db:migrate` | Run database migrations |
| `npm run db:rollback` | Rollback last migration batch |

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `GOOGLE_CLIENT_ID_WEB` | Google OAuth client ID (web) |
| `GOOGLE_CLIENT_ID_IOS` | Google OAuth client ID (iOS) |
| `GOOGLE_CLIENT_ID_ANDROID` | Google OAuth client ID (Android) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `FATSECRET_CONSUMER_KEY` | FatSecret API consumer key |
| `FATSECRET_CONSUMER_SECRET` | FatSecret API consumer secret |
| `USDA_API_KEY` | USDA FoodData Central API key |
| `CLARIFAI_PAT` | Clarifai personal access token |
| `FEATURE_NUTRITIONIX` | Enable Nutritionix integration (`true`/`false`) |
| `FEATURE_CLARIFAI` | Enable Clarifai photo recognition (`true`/`false`) |
| `FEATURE_USDA` | Enable USDA food search (`true`/`false`) |

## Database

The server uses PostgreSQL with Knex.js migrations. Tables include:

- `users` - User profiles and preferences
- `food_logs` - Daily food entries with nutrition data
- `chat_messages` - Conversation history
- `weight_entries` - Weight tracking
- `recipes` / `recipe_ingredients` - Custom recipes
- `favorite_foods` - Saved foods
- `weekly_summaries` - Generated weekly overviews
- `analytics_events` - Engagement tracking
- `push_tokens` - Push notification subscriptions

## License

Private
