const API_BASE_URL = 'http://localhost:5001'; // Change to your backend URL if different

export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  homeCity?: string;
  currentCity?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  lastUpdated: string;
  friendshipId?: string; // Only present when returned from getUserFriends
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // User endpoints
  async createUser(userData: {
    name: string;
    email: string;
    company?: string;
    homeCity?: string;
    currentCity?: string;
  }): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserById(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async getAllUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getUserFriends(userId: string): Promise<User[]> {
    return this.request<User[]>(`/users/${userId}/friends`);
  }

  async updateUser(id: string, userData: {
    name?: string;
    email?: string;
    company?: string;
    homeCity?: string;
    currentCity?: string;
  }): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.request<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
  }

  // Friend endpoints
  async addFriend(userId: string, friendId: string): Promise<{ id: string; userId: string; friendId: string }> {
    return this.request('/friends', {
      method: 'POST',
      body: JSON.stringify({ userId, friendId }),
    });
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    return this.request('/friends', {
      method: 'DELETE',
      body: JSON.stringify({ userId, friendId }),
    });
  }
}

export const apiService = new ApiService();

