import { Injectable, signal } from '@angular/core';

export interface AuthUser {
  id: string;
  username?: string;
  email?: string;
  playerName?: string;
  role: 'MASTER' | 'PLAYER' | 'GUEST';
  partyCode?: string;
  partyId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly TOKEN_KEY = 'rpg_auth_token';
  private readonly USER_KEY = 'rpg_auth_user';
  private readonly ACTIVE_PARTY_KEY = 'rpg_active_party';

  currentUser = signal<AuthUser | null>(this.getStoredUser());

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setUser(user: AuthUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  getUser(): AuthUser | null {
    return this.currentUser();
  }

  private getStoredUser(): AuthUser | null {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setActiveParty(partyId: string, partyCode: string): void {
    localStorage.setItem(this.ACTIVE_PARTY_KEY, JSON.stringify({ partyId, partyCode }));
  }

  getActiveParty(): { partyId: string; partyCode: string } | null {
    try {
      const data = localStorage.getItem(this.ACTIVE_PARTY_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ACTIVE_PARTY_KEY);
    this.currentUser.set(null);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isMaster(): boolean {
    return this.currentUser()?.role === 'MASTER';
  }
}
