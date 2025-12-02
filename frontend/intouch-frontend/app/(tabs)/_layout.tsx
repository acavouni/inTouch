import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { UserSync } from '@/components/auth/UserSync';

export default function TabLayout() {
  return (
    <RequireAuth>
      <UserSync>
        <Tabs screenOptions={{ headerShown: false }}>
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-circle-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="friends"
            options={{
              title: 'Friends',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="people-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="notifications"
            options={{
              title: 'Alerts',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="notifications-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="settings-outline" size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </UserSync>
    </RequireAuth>
  );
}
