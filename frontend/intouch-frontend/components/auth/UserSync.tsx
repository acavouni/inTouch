import { useEffect, useState, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { createAuthedFetch } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = 'user_id';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

interface UserSyncProps {
  children: React.ReactNode;
  onSyncComplete?: (userId: string) => void;
}

/**
 * Component that syncs Clerk user to backend database
 * Should be used inside RequireAuth or after authentication is confirmed
 */
export function UserSync({ children, onSyncComplete }: UserSyncProps) {
  const { isSignedIn, getToken, userId } = useAuth();
  const { user } = useUser();
  const [synced, setSynced] = useState(false);
  const syncingRef = useRef(false); // Prevent concurrent syncs

  useEffect(() => {
    const syncUser = async () => {
      // Prevent concurrent syncs or re-syncing after completion
      if (!isSignedIn || !userId || !user || synced || syncingRef.current) return;
      
      // Mark sync as in progress
      syncingRef.current = true;

      try {
        const token = await getToken();
        if (!token) {
          console.warn('No token available for user sync');
          return;
        }

        // Extract user data from Clerk
        const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;
        const username = user.username;
        const firstName = user.firstName;
        const lastName = user.lastName;
        const name = firstName && lastName 
          ? `${firstName} ${lastName}`.trim()
          : firstName || lastName || username || email?.split('@')[0] || 'User';

        if (!email) {
          console.warn('No email found for user - skipping sync');
          setSynced(true);
          return;
        }

        const bodyData = {
          clerkId: userId,
          email,
          name,
          username,
        };

        console.log('Syncing user to backend:', bodyData);
        console.log('Request body (stringified):', JSON.stringify(bodyData));

        const authedFetch = createAuthedFetch(getToken);
        const response = await authedFetch(`${API_BASE_URL}/api/sync-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Sync failed:', response.status, errorData);
          throw new Error(`Sync failed: ${response.status}`);
        }

        const dbUser = await response.json();
        console.log('User synced successfully:', dbUser);
        
        // Store the database user ID for use in other screens
        await AsyncStorage.setItem(USER_ID_KEY, dbUser.id);
        
        setSynced(true);
        onSyncComplete?.(dbUser.id);
      } catch (error) {
        console.error('Error syncing user:', error);
        // Don't block the UI if sync fails - user can still use the app
        setSynced(true);
      } finally {
        // Always clear the syncing flag when done (success or error)
        syncingRef.current = false;
      }
    };

    syncUser();
  }, [isSignedIn, userId, user, getToken, synced, onSyncComplete]);

  return <>{children}</>;
}

