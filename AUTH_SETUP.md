# Authentication Setup Guide

This document explains the complete authentication system built with Clerk for the inTouch app.

## 📁 File Structure

### Frontend Files Created/Updated

#### Auth Screens
- **`app/(auth)/_layout.tsx`** - Layout wrapper for auth screens
- **`app/(auth)/sign-in.tsx`** - Sign-in screen with email/password and OAuth
- **`app/(auth)/sign-up.tsx`** - Sign-up screen with email verification flow

#### OAuth Callback
- **`app/oauth-callback.tsx`** - Handles OAuth deep link redirects

#### Reusable Components
- **`components/auth/AuthInput.tsx`** - Styled text input component
- **`components/auth/AuthButton.tsx`** - Primary/secondary button component
- **`components/auth/OAuthButton.tsx`** - Google/Apple OAuth button with icons
- **`components/auth/RequireAuth.tsx`** - Wrapper component for protected routes

#### API Helpers
- **`lib/api.ts`** - Authenticated fetch helper using Clerk tokens
- **`services/api.ts`** - Updated to support Clerk authentication

#### Layout Files
- **`app/_layout.tsx`** - Updated with ClerkProvider and SecureStore token cache
- **`app/index.tsx`** - Updated to handle auth redirects
- **`app/(tabs)/_layout.tsx`** - Wrapped with RequireAuth for protection

### Backend Files Updated

- **`backend/src/index.js`** - Added Clerk JWT verification middleware

## 🔧 Setup Instructions

### 1. Environment Variables

#### Frontend (`.env` or `app.json`)
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://localhost:5001
```

#### Backend (`.env`)
```env
CLERK_SECRET_KEY=sk_test_...
PORT=5001
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install @clerk/clerk-sdk-node
```

### 3. Configure Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Enable Google OAuth provider
3. Enable Apple OAuth provider (for iOS)
4. Add redirect URL: `intouchfrontend://oauth-callback`
5. Copy your publishable key and secret key

### 4. Deep Linking Setup

The app uses the scheme `intouchfrontend://` (defined in `app.json`). Make sure this matches your Clerk redirect URL configuration.

## 🎯 Features Implemented

### Sign-In Screen (`app/(auth)/sign-in.tsx`)
- ✅ Email/password authentication
- ✅ Google OAuth button
- ✅ Apple OAuth button (iOS only)
- ✅ Link to sign-up screen
- ✅ Error handling and display
- ✅ Loading states
- ✅ Redirects to `/(tabs)` on success

### Sign-Up Screen (`app/(auth)/sign-up.tsx`)
- ✅ Email/password registration
- ✅ Email verification code flow (6-digit code)
- ✅ Google OAuth button
- ✅ Apple OAuth button (iOS only)
- ✅ Link to sign-in screen
- ✅ Error handling and display
- ✅ Loading states
- ✅ Redirects to `/(tabs)` on success

### OAuth Flow
- ✅ Deep linking support via `intouchfrontend://oauth-callback`
- ✅ Handles Google and Apple OAuth redirects
- ✅ Automatic session creation and activation

### Protected Routes
- ✅ `RequireAuth` component wraps protected screens
- ✅ Automatic redirect to sign-in if not authenticated
- ✅ Tabs layout is protected

### API Integration
- ✅ `authedFetch` helper automatically includes Clerk JWT tokens
- ✅ API service updated to support authenticated requests
- ✅ Backend middleware verifies Clerk JWTs

## 🔐 Security Features

1. **Secure Token Storage**: Uses `expo-secure-store` for JWT storage on mobile
2. **JWT Verification**: Backend verifies all Clerk JWTs before processing requests
3. **Protected Routes**: All tab screens require authentication
4. **Automatic Redirects**: Unauthenticated users are redirected to sign-in

## 📱 Usage Examples

### Using Authenticated API Calls

```typescript
import { useAuth } from '@clerk/clerk-expo';
import { createAuthedFetch } from '@/lib/api';
import { apiService } from '@/services/api';

function MyComponent() {
  const { getToken } = useAuth();
  
  // Set auth for API service
  useEffect(() => {
    apiService.setAuth(getToken);
  }, [getToken]);
  
  // Or use authedFetch directly
  const fetch = createAuthedFetch(getToken);
  
  const loadData = async () => {
    const response = await fetch('/users');
    const data = await response.json();
  };
}
```

### Checking Auth Status

```typescript
import { useAuth } from '@clerk/clerk-expo';

function MyComponent() {
  const { isSignedIn, userId, user } = useAuth();
  
  if (!isSignedIn) {
    return <Text>Please sign in</Text>;
  }
  
  return <Text>Welcome, {user?.emailAddresses[0].emailAddress}</Text>;
}
```

### Signing Out

```typescript
import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';

function SignOutButton() {
  const { signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };
  
  return <Button title="Sign Out" onPress={handleSignOut} />;
}
```

## 🐛 Troubleshooting

### OAuth Not Working
- Check that redirect URL matches in Clerk dashboard
- Verify `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
- Ensure deep linking is configured in `app.json`

### Backend Auth Errors
- Verify `CLERK_SECRET_KEY` is set in backend `.env`
- Check that `@clerk/clerk-sdk-node` is installed
- Ensure middleware is applied to protected routes

### Token Storage Issues
- Verify `expo-secure-store` is installed
- Check that SecureStore permissions are granted on device

## 📚 Additional Resources

- [Clerk Expo Documentation](https://clerk.com/docs/quickstarts/expo)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Expo SecureStore Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/)

