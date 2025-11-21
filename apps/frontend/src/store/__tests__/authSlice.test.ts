// src/store/__tests__/authSlice.test.ts
import { setupStore, type AppStore } from './testUtils';
import authReducer, {
  login,
  signup,
  logout,
  checkAuth,
  refreshUser,
  clearError,
  setToken,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from '../slices/authSlice';
import { authAPI } from '../../services/api';

// Mock the authAPI
jest.mock('../../services/api', () => ({
  authAPI: {
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

describe('authSlice', () => {
  let store: AppStore;

  beforeEach(() => {
    store = setupStore();
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state).toEqual({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    });
  });

  describe('reducers', () => {
    it('should handle clearError', () => {
      // Set an error first
      store = setupStore({
        auth: {
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: 'Test error',
        },
      } as any);

      store.dispatch(clearError());
      const state = store.getState().auth;
      expect(state.error).toBeNull();
    });

    it('should handle setToken', () => {
      const token = 'test-token-123';
      store.dispatch(setToken(token));
      const state = store.getState().auth;
      expect(state.token).toBe(token);
    });
  });

  describe('login async thunk', () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'traveler' as const,
      created_at: '2025-01-01',
    };

    it('should handle successful login', async () => {
      (authAPI.login as jest.Mock).mockResolvedValue({ user: mockUser });

      await store.dispatch(
        login({ email: 'test@example.com', password: 'password123' })
      );

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle login failure', async () => {
      const errorMessage = 'Invalid credentials';
      (authAPI.login as jest.Mock).mockRejectedValue({
        response: { data: { error: errorMessage } },
      });

      await store.dispatch(
        login({ email: 'test@example.com', password: 'wrong' })
      );

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should set loading to true while login is pending', () => {
      (authAPI.login as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      store.dispatch(
        login({ email: 'test@example.com', password: 'password123' })
      );

      const state = store.getState().auth;
      expect(state.loading).toBe(true);
    });
  });

  describe('signup async thunk', () => {
    const mockUser = {
      id: '123',
      name: 'New User',
      email: 'new@example.com',
      role: 'owner' as const,
      created_at: '2025-01-01',
    };

    it('should handle successful signup', async () => {
      (authAPI.signup as jest.Mock).mockResolvedValue({ user: mockUser });

      await store.dispatch(
        signup({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
          role: 'owner',
        })
      );

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle signup failure', async () => {
      const errorMessage = 'Email already exists';
      (authAPI.signup as jest.Mock).mockRejectedValue({
        response: { data: { error: errorMessage } },
      });

      await store.dispatch(
        signup({
          name: 'New User',
          email: 'existing@example.com',
          password: 'password123',
          role: 'traveler',
        })
      );

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('logout async thunk', () => {
    it('should handle successful logout', async () => {
      // Set up initial authenticated state
      store = setupStore({
        auth: {
          user: {
            id: '123',
            name: 'Test User',
            email: 'test@example.com',
            role: 'traveler',
            created_at: '2025-01-01',
          },
          token: 'test-token',
          isAuthenticated: true,
          loading: false,
          error: null,
        },
      } as any);

      (authAPI.logout as jest.Mock).mockResolvedValue({ message: 'Logged out' });

      await store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should clear state even if logout API fails', async () => {
      // Set up initial authenticated state
      store = setupStore({
        auth: {
          user: {
            id: '123',
            name: 'Test User',
            email: 'test@example.com',
            role: 'traveler',
            created_at: '2025-01-01',
          },
          token: 'test-token',
          isAuthenticated: true,
          loading: false,
          error: null,
        },
      } as any);

      (authAPI.logout as jest.Mock).mockRejectedValue(new Error('Network error'));

      await store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('checkAuth async thunk', () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'traveler' as const,
      created_at: '2025-01-01',
    };

    it('should handle successful auth check', async () => {
      (authAPI.getCurrentUser as jest.Mock).mockResolvedValue({ user: mockUser });

      await store.dispatch(checkAuth());

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
    });

    it('should handle failed auth check', async () => {
      (authAPI.getCurrentUser as jest.Mock).mockRejectedValue(
        new Error('Not authenticated')
      );

      await store.dispatch(checkAuth());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
    });
  });

  describe('refreshUser async thunk', () => {
    const mockUser = {
      id: '123',
      name: 'Updated User',
      email: 'updated@example.com',
      role: 'owner' as const,
      created_at: '2025-01-01',
    };

    it('should handle successful user refresh', async () => {
      (authAPI.getCurrentUser as jest.Mock).mockResolvedValue({ user: mockUser });

      await store.dispatch(refreshUser());

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle failed user refresh', async () => {
      (authAPI.getCurrentUser as jest.Mock).mockRejectedValue(
        new Error('Failed to refresh')
      );

      await store.dispatch(refreshUser());

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
    });
  });

  describe('selectors', () => {
    const mockState = {
      auth: {
        user: {
          id: '123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'traveler' as const,
          created_at: '2025-01-01',
        },
        token: 'test-token',
        isAuthenticated: true,
        loading: false,
        error: 'Test error',
      },
    };

    it('should select user', () => {
      expect(selectUser(mockState)).toEqual(mockState.auth.user);
    });

    it('should select isAuthenticated', () => {
      expect(selectIsAuthenticated(mockState)).toBe(true);
    });

    it('should select loading', () => {
      expect(selectAuthLoading(mockState)).toBe(false);
    });

    it('should select error', () => {
      expect(selectAuthError(mockState)).toBe('Test error');
    });
  });
});

