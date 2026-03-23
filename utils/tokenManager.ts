import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Token Manager - Handle token and user data storage
 * Falls back to in-memory storage if AsyncStorage fails
 */

const TOKEN_KEY = "userToken";
const USER_DATA_KEY = "userData";

// Fallback in-memory storage for when AsyncStorage fails
let memoryStorage: { [key: string]: string } = {};
let useMemoryStorage = false;

export interface UserData {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  avatar?: string | null;
  role: "user" | "admin";
  isActive?: boolean;
  isEmailVerified?: boolean;
  authProvider?: "local" | "google";
  createdAt?: string;
  updatedAt?: string;
}

export const TokenManager = {
  /**
   * Save authentication token
   */
  saveToken: async (token: string): Promise<void> => {
    try {
      if (useMemoryStorage) {
        memoryStorage[TOKEN_KEY] = token;
      } else {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      }
    } catch (error) {
      // console.warn("AsyncStorage failed, using memory storage");
      useMemoryStorage = true;
      memoryStorage[TOKEN_KEY] = token;
    }
  },

  /**
   * Get authentication token
   */
  getToken: async (): Promise<string | null> => {
    try {
      if (useMemoryStorage) {
        return memoryStorage[TOKEN_KEY] || null;
      }
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      // console.warn("AsyncStorage failed, using memory storage");
      useMemoryStorage = true;
      return memoryStorage[TOKEN_KEY] || null;
    }
  },

  /**
   * Remove token and user data (logout)
   */
  removeToken: async (): Promise<void> => {
    try {
      if (useMemoryStorage) {
        delete memoryStorage[TOKEN_KEY];
        delete memoryStorage[USER_DATA_KEY];
      } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_DATA_KEY);
      }
    } catch (error) {
      // console.warn("AsyncStorage failed, using memory storage");
      useMemoryStorage = true;
      delete memoryStorage[TOKEN_KEY];
      delete memoryStorage[USER_DATA_KEY];
    }
  },

  /**
   * Save user data
   */
  saveUserData: async (user: UserData): Promise<void> => {
    try {
      if (useMemoryStorage) {
        memoryStorage[USER_DATA_KEY] = JSON.stringify(user);
      } else {
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      }
    } catch (error) {
      // console.warn("AsyncStorage failed, using memory storage");
      useMemoryStorage = true;
      memoryStorage[USER_DATA_KEY] = JSON.stringify(user);
    }
  },

  /**
   * Get user data
   */
  getUserData: async (): Promise<UserData | null> => {
    try {
      if (useMemoryStorage) {
        const data = memoryStorage[USER_DATA_KEY];
        return data ? JSON.parse(data) : null;
      }
      const data = await AsyncStorage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // console.warn("AsyncStorage failed, using memory storage");
      useMemoryStorage = true;
      const data = memoryStorage[USER_DATA_KEY];
      return data ? JSON.parse(data) : null;
    }
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn: async (): Promise<boolean> => {
    try {
      if (useMemoryStorage) {
        return !!memoryStorage[TOKEN_KEY];
      }
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return !!token;
    } catch (error) {
      // console.warn("AsyncStorage failed, using memory storage");
      useMemoryStorage = true;
      return !!memoryStorage[TOKEN_KEY];
    }
  },

  /**
   * Save both token and user data
   */
  saveAuthData: async (token: string, user: UserData): Promise<void> => {
    try {
      if (useMemoryStorage) {
        memoryStorage[TOKEN_KEY] = token;
        memoryStorage[USER_DATA_KEY] = JSON.stringify(user);
      } else {
        await AsyncStorage.setItem(TOKEN_KEY, token);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      }
    } catch (error) {
      // console.warn("AsyncStorage failed, using memory storage");
      useMemoryStorage = true;
      memoryStorage[TOKEN_KEY] = token;
      memoryStorage[USER_DATA_KEY] = JSON.stringify(user);
    }
  },

  /**
   * Clear all auth data
   */
  clearAuthData: async (): Promise<void> => {
    try {
      if (useMemoryStorage) {
        delete memoryStorage[TOKEN_KEY];
        delete memoryStorage[USER_DATA_KEY];
      } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_DATA_KEY);
      }
    } catch (error) {
      // console.warn("AsyncStorage failed, using memory storage");
      useMemoryStorage = true;
      delete memoryStorage[TOKEN_KEY];
      delete memoryStorage[USER_DATA_KEY];
    }
  },
};
