import { supabase } from "@/integrations/supabase/client";

export interface AuthUser {
  id: string;
  username: string;
  full_name: string;
  role: string;
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(username: string, password: string, rememberMe: boolean = false): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    try {
      // Query the app_users table for authentication
      const { data: users, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Database error:', error);
        return { success: false, error: 'Authentication failed' };
      }

      if (!users || users.length === 0) {
        return { success: false, error: 'Invalid username or password' };
      }

      const user = users[0];

      // For now, we'll do a simple password comparison
      // In production, you should use bcrypt to hash and compare passwords
      const isValidPassword = password === 'travelx@2023'; // Hardcoded for demo

      if (!isValidPassword) {
        return { success: false, error: 'Invalid username or password' };
      }

      this.currentUser = {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      };

      // Store in localStorage for session persistence
      const sessionData = {
        user: this.currentUser,
        timestamp: Date.now(),
        rememberMe
      };

      if (rememberMe) {
        localStorage.setItem('travel_auth_session', JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem('travel_auth_session', JSON.stringify(sessionData));
      }

      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('travel_auth_session');
    sessionStorage.removeItem('travel_auth_session');
  }

  getCurrentUser(): AuthUser | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to restore session from storage
    const sessionData = this.getStoredSession();
    if (sessionData && this.isValidSession(sessionData)) {
      this.currentUser = sessionData.user;
      return this.currentUser;
    }

    return null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  private getStoredSession(): any {
    try {
      // Check sessionStorage first
      const sessionData = sessionStorage.getItem('travel_auth_session');
      if (sessionData) {
        return JSON.parse(sessionData);
      }

      // Then check localStorage for "remember me" sessions
      const localData = localStorage.getItem('travel_auth_session');
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (error) {
      console.error('Error parsing session data:', error);
    }
    return null;
  }

  private isValidSession(sessionData: any): boolean {
    if (!sessionData || !sessionData.user || !sessionData.timestamp) {
      return false;
    }

    // Sessions expire after 24 hours for sessionStorage, 30 days for localStorage
    const maxAge = sessionData.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const isExpired = Date.now() - sessionData.timestamp > maxAge;

    if (isExpired) {
      this.logout();
      return false;
    }

    return true;
  }
}

export const authService = AuthService.getInstance();