# inTouch

## Purpose

inTouch is a lightweight, privacy-conscious social connection app designed to help people meaningfully reconnect when geography brings them close. The app enables passive updates about where friends are based, notifies users when they visit a city where friends live, and facilitates low-friction outreach with location-based suggestions and AI-generated message drafts.

## Goal

Build a modular, scalable mobile app that:
- Allows users to create a profile with location, company, and favorite spots
- Notifies users when they enter a city where a friend is based
- Suggests context-aware places to go and messages to send
- Helps people stay in touch with minimal ongoing effort

## Tech Stack

### Frontend
- **React Native** (via Expo)
- **Expo Router** (file-based routing)
- **TypeScript**
- **React 19.0.0**
- **Metro bundler** (Expo's default)
- **Clerk** (authentication)
- Cross-platform: iOS, Android, and Web

### Backend
- **Node.js**
- **Express.js** (REST API)
- **Prisma ORM** (database toolkit)
- **CORS** enabled
- **dotenv** for environment config

### Database
- **Prisma** (check `schema.prisma` for database type)

### Development Tools
- **nodemon** (backend live reload)
- **Cursor** (AI development assist)
- **Windsurf** (feature expansion assist)
- **Git** (version control)

## Development Principles

- Build in modular, testable slices
- Keep backend and frontend logic cleanly separated
- Prioritize simple, intentional UX
- Ruthlessly test each feature before expanding

## Notes

If the tech stack changes, update this file immediately.
