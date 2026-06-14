import { akunService } from './akunService.js';
import { IAkunSession } from '../types/ITs_Akun.js';
import { browserStorage } from '../utils/browserStorage.js';

/**
 * SERVICES/AUTHSERVICE.TS
 * Specialized service for Authentication and Session Management.
 * Re-routed to use akunService for direct database authentication.
 */

class AuthService {
  private TOKEN_KEY = 'token';
  private USER_KEY = 'active_user';

  /**
   * Login using credentials from the 'akun' table.
   */
  async login(credentials: { kode_akses: string; password_plain: string }): Promise<{ success: boolean; session?: IAkunSession; error?: string }> {
    const result = await akunService.authenticate(credentials.kode_akses, credentials.password_plain);
    return result;
  }

  /**
   * Standard logout.
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      browserStorage.remove(this.TOKEN_KEY);
      browserStorage.remove(this.USER_KEY);
      // Use relative path for redirection to maintain environment safety (AGENTS.md)
      window.location.href = '/login';
    }
  }

  /**
   * Check if user is authenticated locally.
   */
  isAuthenticated(): boolean {
    return !!browserStorage.get(this.TOKEN_KEY);
  }

  /**
   * Get active session data.
   */
  getSession(): IAkunSession | null {
    return akunService.getCurrentSession();
  }

  /**
   * Verify session validity (Can be extended to check DB if needed).
   */
  async checkSession(): Promise<boolean> {
    const session = this.getSession();
    if (!session) {
      this.logout();
      return false;
    }
    // Logic can be extended here to verify user status in DB
    return true;
  }
}

export const authService = new AuthService();
