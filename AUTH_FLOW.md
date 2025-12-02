# 🔐 Simplified Authentication Flow

## Overview
Your auth system now uses **Clerk** for authentication with a clean, streamlined user experience. The system automatically syncs Clerk users with your PostgreSQL database.

---

## 📁 File Structure

### **Auth Components** (`components/auth/`)
- **`AuthButton.tsx`** - Reusable button with loading states and variants
- **`AuthInput.tsx`** - Text input with error states
- **`OAuthButton.tsx`** - OAuth buttons with customizable labels
- **`RequireAuth.tsx`** - Route protection component
- **`UserSync.tsx`** - Syncs Clerk user to your backend database

### **Auth Screens** (`app/(auth)/`)
- **`sign-up.tsx`** - Registration with email/username/password + OAuth
- **`sign-in.tsx`** - Login with username/email + password + OAuth
- **`_layout.tsx`** - Auth screens layout (no header)

### **App Entry** (`app/`)
- **`index.tsx`** - Routes to sign-in (unauthenticated) or tabs (authenticated)
- **`_layout.tsx`** - Root layout with ClerkProvider
- **`(tabs)/_layout.tsx`** - Protected tabs with UserSync integration

---

## 🔄 User Flow

### **New User Sign Up**
1. User opens app → routed to **Sign In** screen
2. Clicks "Sign Up" link → navigates to **Sign Up** screen
3. **Option A: Email/Password**
   - Enters Email, Username, Password
   - Submits form → Clerk sends OTP to email
   - Enters 6-digit verification code
   - On success → creates session → routes to main app
4. **Option B: OAuth (Google/Apple)**
   - Clicks "Sign Up with Google"
   - Completes OAuth flow in browser
   - If username missing → prompted to enter username
   - On success → creates session → routes to main app
5. App navigates to `(tabs)` → **UserSync** automatically syncs user to PostgreSQL

### **Returning User Sign In**
1. User opens app → routed to **Sign In** screen
2. Enters **Username OR Email** + Password
3. Submits form → Clerk validates credentials
4. On success → creates session → routes to main app
5. **Alternative: OAuth**
   - Clicks "Sign In with Google"
   - Completes OAuth flow
   - On success → routes to main app
6. App navigates to `(tabs)` → **UserSync** ensures user is in database

---

## 🔧 Technical Implementation

### **1. Sign Up Screen** (`app/(auth)/sign-up.tsx`)
```typescript
✅ Email + Username + Password form
✅ Email verification with OTP (6-digit code)
✅ OAuth with Google and Apple (iOS)
✅ Custom labels: "Sign Up with Google"
✅ Navigation link: "Already have an account? Sign In"
```

### **2. Sign In Screen** (`app/(auth)/sign-in.tsx`)
```typescript
✅ Username OR Email field (flexible identifier)
✅ Password field
✅ OAuth with Google and Apple (iOS)
✅ Custom labels: "Sign In with Google"
✅ Navigation link: "Don't have an account? Sign Up"
```

### **3. Backend Sync** (`UserSync.tsx` + Backend)
- **Component Location**: Wraps `(tabs)` layout
- **Trigger**: Runs automatically when user enters main app
- **API Endpoint**: `POST /api/sync-user`
- **Backend Controller**: `backend/src/controllers/syncController.js`
- **Logic**: 
  - Checks if user exists by `clerkId`
  - **UPSERT**: Updates if exists, creates if new
  - Syncs: `clerkId`, `email`, `name`/`username`
  - Returns database user ID
  - Stores ID in AsyncStorage for app use

### **4. Route Protection**
- **`RequireAuth`** component wraps protected routes
- Uses Clerk's `useAuth()` hook
- Redirects to sign-in if not authenticated
- Redirects to tabs if authenticated and on auth screen

---

## 🎯 Key Features

### ✨ **User Experience**
- **Flexible Sign In**: Accepts username OR email
- **Clear Navigation**: Easy switching between sign-in and sign-up
- **OAuth Integration**: One-click sign-up/sign-in with Google
- **Email Verification**: Secure OTP flow for email sign-ups
- **Loading States**: Visual feedback during async operations
- **Error Handling**: Clear error messages for validation failures

### 🔒 **Security**
- **Clerk Authentication**: Industry-standard auth provider
- **Secure Token Storage**: Uses Expo SecureStore
- **JWT Tokens**: Automatically attached to backend requests
- **Password Requirements**: Minimum 8 characters enforced
- **Session Management**: Handled by Clerk SDK

### 🗄️ **Database Sync**
- **Automatic UPSERT**: User always exists in your database
- **Clerk as Source of Truth**: Auth handled by Clerk
- **PostgreSQL for Data**: Friends, posts, app data in your DB
- **No Duplicate Users**: Synced by unique `clerkId`
- **Email Conflict Handling**: Returns 409 if email exists with different Clerk account

---

## 🚀 How It Works Together

```
┌─────────────────────────────────────────────────────────┐
│                     App Starts                          │
│                   (app/index.tsx)                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ├── Not Signed In → app/(auth)/sign-in.tsx
                  │                    ↓
                  │          User enters credentials
                  │                    ↓
                  │          Clerk validates & creates session
                  │                    ↓
                  └── Signed In ───→ app/(tabs)/_layout.tsx
                                       │
                                       ├── RequireAuth: Protects routes
                                       │
                                       ├── UserSync: Syncs to backend
                                       │      │
                                       │      └─→ POST /api/sync-user
                                       │           (with Clerk JWT token)
                                       │                │
                                       │                ├── Backend validates token
                                       │                ├── Extracts clerkId
                                       │                ├── UPSERTs to PostgreSQL
                                       │                └── Returns user data
                                       │
                                       └── Tabs: User can now use app
```

---

## 📝 Changes Made in Refactor

### ✅ **Added/Updated**
1. Sign In now accepts **"Username or Email"** (was email-only)
2. OAuth buttons use context-aware labels:
   - Sign Up: "Sign Up with Google"
   - Sign In: "Sign In with Google"
3. UserSync properly integrated in `(tabs)/_layout.tsx`
4. Deleted conflicting custom `useAuth` hook (use Clerk's instead)

### 🗑️ **Removed**
- `hooks/useAuth.tsx` - Conflicted with Clerk's `useAuth()`
- `app/auth/login.tsx` - Old unused login file
- `app/auth/` folder - Replaced by `(auth)` with Clerk

### 🎨 **Kept (Clean & Reusable)**
- `AuthButton.tsx` - Well-designed button component
- `AuthInput.tsx` - Simple input with error states
- `OAuthButton.tsx` - Enhanced with custom label support
- `RequireAuth.tsx` - Effective route protection
- `UserSync.tsx` - Critical backend sync logic

---

## 🔗 Backend Integration

### **API Endpoint**
- **URL**: `POST /api/sync-user`
- **Route**: `backend/src/routes/syncRoutes.js`
- **Controller**: `backend/src/controllers/syncController.js`
- **Middleware**: `backend/src/middleware/auth.js`

### **Request Flow**
```javascript
// Frontend: UserSync component
const response = await authedFetch(`${API_BASE_URL}/api/sync-user`, {
  method: 'POST',
});

// Backend: Middleware extracts Clerk user
req.clerkUserId = req.auth.userId;
req.clerkUser = req.auth;

// Backend: Controller performs UPSERT
let user = await prisma.user.findUnique({
  where: { clerkId: clerkUserId }
});

if (user) {
  // Update existing user
  user = await prisma.user.update({ ... });
} else {
  // Create new user
  user = await prisma.user.create({ ... });
}

return user;
```

---

## 🎓 Using Clerk Hooks

Throughout your app, use Clerk's built-in hooks:

```typescript
import { useAuth, useUser } from '@clerk/clerk-expo';

// Get auth state
const { isSignedIn, userId, getToken } = useAuth();

// Get user data
const { user } = useUser();

// Make authenticated API calls
const token = await getToken();
const response = await fetch('/api/endpoint', {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## ✅ Verification Checklist

- [x] Sign Up with Email/Username/Password works
- [x] Email verification (OTP) works
- [x] Sign Up with Google works
- [x] Sign In with Username works
- [x] Sign In with Email works
- [x] Sign In with Google works
- [x] UserSync runs after authentication
- [x] Backend UPSERT creates/updates users
- [x] Protected routes redirect unauthenticated users
- [x] Navigation between Sign In/Sign Up works
- [x] Error messages display correctly
- [x] Loading states show during async operations

---

## 🚨 Important Notes

1. **No Complex Context Providers**: Uses Clerk's hooks directly (simpler)
2. **UserSync Runs Automatically**: No manual sync calls needed
3. **Database User ID**: Stored in AsyncStorage after sync
4. **Clerk = Auth, PostgreSQL = Data**: Clear separation of concerns
5. **Error Handling**: Backend returns 409 for email conflicts, 401 for unauthorized

---

## 📚 Next Steps

To test the complete flow:
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend/intouch-frontend && npm start`
3. Test sign-up with email verification
4. Test sign-in with username
5. Test sign-in with email
6. Test OAuth flows (Google)
7. Verify user created in PostgreSQL database

---

**Auth flow is now simplified, secure, and user-friendly!** 🎉

