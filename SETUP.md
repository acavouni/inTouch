# inTouch - Setup & Development Guide

## Project Overview

**inTouch** is a social connection app that helps people reconnect when they're in the same city. The project consists of:

- **Backend**: Node.js/Express API with PostgreSQL database (Prisma ORM)
- **Frontend**: React Native app using Expo

## Project Structure

```
inTouch/
├── backend/              # Express API server
│   ├── src/
│   │   ├── index.js     # Main server entry point
│   │   ├── routes/      # API route definitions
│   │   └── controllers/ # Business logic
│   └── prisma/          # Database schema and migrations
│
└── frontend/
    └── intouch-frontend/ # Expo React Native app
        ├── app/          # App screens (Expo Router)
        │   ├── (tabs)/   # Tab navigation screens
        │   └── auth/     # Authentication screens
        └── hooks/        # Custom React hooks
```

## Prerequisites

Before you begin, make sure you have installed:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **PostgreSQL** - [Download](https://www.postgresql.org/download/)
3. **npm** or **yarn** (comes with Node.js)
4. **Expo CLI** (optional, but helpful) - `npm install -g expo-cli`

## Setup Instructions

### 1. Database Setup

First, create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE intouch;

# Exit psql
\q
```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend/` directory:
   ```bash
   touch .env
   ```

4. Add the following to `.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/intouch?schema=public"
   PORT=5001
   ```
   
   **Replace `username` and `password` with your PostgreSQL credentials.**

5. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

6. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```
   
   Or if you want to reset the database:
   ```bash
   npx prisma migrate reset
   ```

7. (Optional) Open Prisma Studio to view/edit your database:
   ```bash
   npx prisma studio
   ```

8. Start the backend server:
   ```bash
   npm run dev
   ```
   
   The server should start on `http://localhost:5001` 🚀

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend/intouch-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```
   
   This will open Expo DevTools in your browser. You can:
   - Press `i` to open iOS simulator (requires Xcode on Mac)
   - Press `a` to open Android emulator (requires Android Studio)
   - Scan QR code with Expo Go app on your phone
   - Press `w` to open in web browser

## Current Project State

### Backend API Endpoints

The backend currently has these endpoints:

- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create a new user
- `GET /users/:id/friends` - Get friends of a user
- `GET /friends` - (Check friendRoutes.js for details)

### Frontend Screens

The app has a tab-based navigation with:

- **Profile** (`app/(tabs)/profile.tsx`) - User profile screen
- **Friends** (`app/(tabs)/friends.tsx`) - Friends list
- **Alerts** (`app/(tabs)/notifications.tsx`) - Notifications/alerts
- **Settings** (`app/(tabs)/settings.tsx`) - App settings
- **Login** (`app/auth/login.tsx`) - Authentication (currently mock)

### Database Schema

The database has two main models:

- **User**: Stores user information (name, email, company, homeCity, currentCity, location)
- **Friendship**: Manages relationships between users

## Development Workflow

1. **Start the database** (if not running as a service)
2. **Start the backend**: `cd backend && npm run dev`
3. **Start the frontend**: `cd frontend/intouch-frontend && npm start`
4. Make changes and see them hot-reload automatically!

## Troubleshooting

### Backend Issues

- **Database connection error**: Check your `.env` file has the correct `DATABASE_URL`
- **Prisma errors**: Run `npx prisma generate` again
- **Port already in use**: Change `PORT` in `.env` or kill the process using port 5001

### Frontend Issues

- **Expo not starting**: Try clearing cache: `npx expo start -c`
- **Module not found**: Delete `node_modules` and run `npm install` again
- **Metro bundler issues**: Reset with `npm start -- --reset-cache`

## Next Steps

Based on the current code, here are some areas that might need work:

1. **Authentication**: Currently using mock tokens - needs real JWT implementation
2. **API Integration**: Frontend needs to connect to backend API endpoints
3. **Location Services**: Implement location tracking for city detection
4. **Notifications**: Build the notification system for city-based alerts
5. **UI Polish**: Most screens are placeholder - need full implementation

## Useful Commands

### Backend
- `npm run dev` - Start development server with nodemon
- `npx prisma studio` - Open database GUI
- `npx prisma migrate dev` - Create new migration
- `npx prisma generate` - Regenerate Prisma Client

### Frontend
- `npm start` - Start Expo dev server
- `npm run ios` - Start iOS simulator
- `npm run android` - Start Android emulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint

## Need Help?

Check the main `README.md` for project goals and tech stack details.

