import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { apiService, User } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAuthedFetch } from '@/lib/api';

const USER_ID_KEY = 'user_id';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { getToken, user: clerkUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [currentCity, setCurrentCity] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // First, ensure user is synced with backend
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      
      if (!userId) {
        // User not synced yet, trigger sync
        const token = await getToken();
        if (token) {
          const authedFetch = createAuthedFetch(getToken);
          const syncResponse = await authedFetch(`${API_BASE_URL}/api/sync-user`, {
            method: 'POST',
          });
          
          if (syncResponse.ok) {
            const syncedUser = await syncResponse.json();
            await AsyncStorage.setItem(USER_ID_KEY, syncedUser.id);
            setUser(syncedUser);
            populateForm(syncedUser);
            setLoading(false);
            return;
          }
        }
      }
      
      // Load user from backend
      if (userId) {
        // Set up authenticated API service
        apiService.setAuth(getToken);
        const userData = await apiService.getUserById(userId);
        setUser(userData);
        populateForm(userData);
      } else {
        // Fallback: use Clerk user data if available
        if (clerkUser) {
          const clerkEmail = clerkUser.emailAddresses[0]?.emailAddress || '';
          const clerkName = clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
            : clerkUser.firstName || clerkUser.lastName || clerkUser.username || '';
          
          setName(clerkName);
          setEmail(clerkEmail);
          setEditing(true);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (userData: User) => {
    setName(userData.name || '');
    setEmail(userData.email || '');
    setCompany(userData.company || '');
    setHomeCity(userData.homeCity || '');
    setCurrentCity(userData.currentCity || '');
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Validation Error', 'Name and email are required.');
      return;
    }

    try {
      setSaving(true);
      
      // Ensure API service is authenticated
      apiService.setAuth(getToken);

      if (user) {
        // Update existing user
        const updatedUser = await apiService.updateUser(user.id, {
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || undefined,
          homeCity: homeCity.trim() || undefined,
          currentCity: currentCity.trim() || undefined,
        });
        
        setUser(updatedUser);
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        // This shouldn't happen if sync worked, but handle it anyway
        // Try to sync user first
        const token = await getToken();
        if (token) {
          const authedFetch = createAuthedFetch(getToken);
          const syncResponse = await authedFetch(`${API_BASE_URL}/api/sync-user`, {
            method: 'POST',
          });
          
          if (syncResponse.ok) {
            const syncedUser = await syncResponse.json();
            await AsyncStorage.setItem(USER_ID_KEY, syncedUser.id);
            
            // Now update the synced user
            const updatedUser = await apiService.updateUser(syncedUser.id, {
              name: name.trim(),
              email: email.trim(),
              company: company.trim() || undefined,
              homeCity: homeCity.trim() || undefined,
              currentCity: currentCity.trim() || undefined,
            });
            
            setUser(updatedUser);
            setEditing(false);
            Alert.alert('Success', 'Profile updated successfully!');
          } else {
            throw new Error('Failed to sync user');
          }
        } else {
          throw new Error('Not authenticated');
        }
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Profile</Text>
        {user && !editing && (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            editable={editing}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={editing}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Company</Text>
          <TextInput
            style={styles.input}
            value={company}
            onChangeText={setCompany}
            placeholder="Where do you work?"
            editable={editing}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Home City</Text>
          <TextInput
            style={styles.input}
            value={homeCity}
            onChangeText={setHomeCity}
            placeholder="Where are you based?"
            editable={editing}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Current City</Text>
          <TextInput
            style={styles.input}
            value={currentCity}
            onChangeText={setCurrentCity}
            placeholder="Where are you now?"
            editable={editing}
          />
        </View>

        {editing && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save</Text>
              )}
            </TouchableOpacity>

            {user && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  populateForm(user);
                  setEditing(false);
                }}
                disabled={saving}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  editButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  form: {
    gap: 20,
  },
  field: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    marginTop: 8,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
