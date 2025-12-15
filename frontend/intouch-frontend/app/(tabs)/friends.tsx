import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { apiService, User } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker } from 'react-native-maps';
import FriendRequestsModal from '@/components/FriendRequestsModal';

const USER_ID_KEY = 'user_id';

// Helper function to get initials from a full name
const getInitials = (name: string): string => {
  const nameParts = name.trim().split(' ');
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  const firstInitial = nameParts[0].charAt(0).toUpperCase();
  const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
};

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestsModalVisible, setRequestsModalVisible] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    loadFriends();
    loadRequestCount();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      
      if (!userId) {
        setError('User not found. Please log in again.');
        setLoading(false);
        return;
      }

      // Set up authenticated API service
      apiService.setAuth(getToken);
      const friendsList = await apiService.getUserFriends(userId);
      setFriends(friendsList);
    } catch (err: any) {
      console.error('Error loading friends:', err);
      setError(err.message || 'Failed to load friends. Please try again.');
      Alert.alert('Error', 'Failed to load friends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadRequestCount = async () => {
    try {
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      
      if (!userId) return;

      apiService.setAuth(getToken);
      const requests = await apiService.getFriendRequests(userId);
      setRequestCount(requests.length);
    } catch (err: any) {
      console.error('Error loading friend requests count:', err);
      // Fail silently for the badge count
    }
  };

  const handleRequestHandled = () => {
    // Refresh friends list and request count when a request is accepted/rejected
    loadFriends();
    loadRequestCount();
  };

  // Filter friends based on search query
  const filteredFriends = friends.filter((friend) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const name = friend.name.toLowerCase();
    const homeCity = friend.homeCity?.toLowerCase() || '';
    const currentCity = friend.currentCity?.toLowerCase() || '';
    
    return name.includes(query) || homeCity.includes(query) || currentCity.includes(query);
  });

  // Calculate map region based on filtered friends with coordinates
  const getMapRegion = () => {
    // Filter friends that have valid coordinates
    const friendsWithCoords = filteredFriends.filter(
      (f) => f.latitude != null && f.longitude != null
    );

    if (friendsWithCoords.length === 0) {
      // Default to US center if no friends have coordinates
      return {
        latitude: 37.7749,
        longitude: -95.4194,
        latitudeDelta: 40,
        longitudeDelta: 40,
      };
    }

    const lats = friendsWithCoords.map((f) => f.latitude!);
    const longs = friendsWithCoords.map((f) => f.longitude!);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLong = Math.min(...longs);
    const maxLong = Math.max(...longs);

    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLong + maxLong) / 2;
    const latitudeDelta = (maxLat - minLat) * 1.5 || 0.1;
    const longitudeDelta = (maxLong - minLong) * 1.5 || 0.1;

    return {
      latitude,
      longitude,
      latitudeDelta: Math.max(latitudeDelta, 0.1),
      longitudeDelta: Math.max(longitudeDelta, 0.1),
    };
  };

  const renderFriendCard = ({ item }: { item: User }) => {
    const city = item.currentCity || item.homeCity;
    
    return (
      <View style={styles.friendCard}>
        <View style={styles.friendAvatar}>
          <Text style={styles.friendAvatarText}>
            {getInitials(item.name)}
          </Text>
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name}</Text>
          {city && <Text style={styles.friendCity}>📍 {city}</Text>}
          {item.currentCity && item.currentCity !== item.homeCity && item.homeCity && (
            <Text style={styles.friendHomeCity}>🏠 From {item.homeCity}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderCustomMarker = (friend: User) => {
    // Only render marker if friend has coordinates
    if (friend.latitude == null || friend.longitude == null) {
      return null;
    }

    const city = friend.currentCity || friend.homeCity || 'Unknown';

    return (
      <Marker
        key={friend.id}
        coordinate={{
          latitude: friend.latitude,
          longitude: friend.longitude,
        }}
        title={friend.name}
        description={city}
      >
        <View style={styles.customMarker}>
          <Text style={styles.markerText}>
            {getInitials(friend.name)}
          </Text>
        </View>
      </Marker>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </View>
    );
  }

  if (error && friends.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadFriends}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Count friends with coordinates for map view
  const friendsWithCoords = filteredFriends.filter(
    (f) => f.latitude != null && f.longitude != null
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Friends</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.requestsButton}
            onPress={() => setRequestsModalVisible(true)}
          >
            <Text style={styles.requestsButtonText}>👥</Text>
            {requestCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{requestCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            loadFriends();
            loadRequestCount();
          }} disabled={loading}>
            <Text style={styles.refreshButton}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends by name or city..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'list' && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode('list')}
        >
          <Text
            style={[
              styles.toggleButtonText,
              viewMode === 'list' && styles.toggleButtonTextActive,
            ]}
          >
            List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'map' && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode('map')}
        >
          <Text
            style={[
              styles.toggleButtonText,
              viewMode === 'map' && styles.toggleButtonTextActive,
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {viewMode === 'list' ? (
        <FlatList
          data={filteredFriends}
          renderItem={renderFriendCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No friends found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search term' : 'Add some friends to get started'}
              </Text>
            </View>
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          {friendsWithCoords.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No location data available</Text>
              <Text style={styles.emptySubtext}>
                Your friends need to add their locations to appear on the map
              </Text>
            </View>
          ) : (
            <>
              <MapView
                style={styles.map}
                region={getMapRegion()}
                showsUserLocation={false}
                showsMyLocationButton={false}
              >
                {filteredFriends.map(renderCustomMarker)}
              </MapView>
              {friendsWithCoords.length < filteredFriends.length && (
                <View style={styles.mapNotice}>
                  <Text style={styles.mapNoticeText}>
                    Showing {friendsWithCoords.length} of {filteredFriends.length} friends with locations
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* Friend Requests Modal */}
      <FriendRequestsModal
        visible={requestsModalVisible}
        onClose={() => {
          setRequestsModalVisible(false);
          loadRequestCount(); // Refresh count when modal closes
        }}
        onRequestHandled={handleRequestHandled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestsButton: {
    position: 'relative',
    padding: 4,
  },
  requestsButtonText: {
    fontSize: 28,
    color: '#007AFF',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  refreshButton: {
    fontSize: 28,
    color: '#007AFF',
    fontWeight: '300',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  friendCity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  friendHomeCity: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  map: {
    flex: 1,
  },
  mapNotice: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapNoticeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  customMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
