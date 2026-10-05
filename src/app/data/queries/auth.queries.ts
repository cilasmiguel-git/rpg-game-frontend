import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { ApiConfig } from '../../core/config/api.config';
import { StorageService } from '../../core/services/storage.service';
import {
  AuthResponse,
  AuthResponseSchema,
  GuestJoinInput,
  MasterLoginInput,
  MasterRegisterInput,
  PlayerLoginInput,
  PlayerRegisterInput,
  User,
  UserSchema,
} from '../schemas/auth.schema';
import { parseWithZod } from '../../shared/utils/zod-validator';

@Injectable({ providedIn: 'root' })
export class AuthQueriesService {
  private http = inject(HttpClient);
  private queryClient = inject(QueryClient);
  private storage = inject(StorageService);

  private get apiUrl(): string {
    return ApiConfig.getBaseUrl();
  }

  useCurrentUser() {
    return injectQuery(() => ({
      queryKey: ['auth', 'me'],
      queryFn: async (): Promise<User | null> => {
        if (!this.storage.isAuthenticated()) return null;
        try {
          const res = await firstValueFrom(this.http.get(`${this.apiUrl}/auth/me`));
          const user = parseWithZod(UserSchema, res);
          this.storage.setUser(user);
          return user;
        } catch {
          return null;
        }
      },
      enabled: this.storage.isAuthenticated(),
    }));
  }

  useLoginMasterMutation() {
    return injectMutation(() => ({
      mutationFn: async (payload: MasterLoginInput): Promise<AuthResponse> => {
        const res = await firstValueFrom(this.http.post(`${this.apiUrl}/auth/login-master`, payload));
        const data = parseWithZod(AuthResponseSchema, res);
        this.storage.setToken(data.accessToken);
        this.storage.setUser(data.user);
        return data;
      },
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: ['auth'] });
      },
    }));
  }

  useRegisterMasterMutation() {
    return injectMutation(() => ({
      mutationFn: async (payload: MasterRegisterInput): Promise<AuthResponse> => {
        const res = await firstValueFrom(this.http.post(`${this.apiUrl}/auth/register-master`, payload));
        const data = parseWithZod(AuthResponseSchema, res);
        this.storage.setToken(data.accessToken);
        this.storage.setUser(data.user);
        return data;
      },
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: ['auth'] });
      },
    }));
  }

  useJoinGuestMutation() {
    return injectMutation(() => ({
      mutationFn: async (payload: GuestJoinInput): Promise<AuthResponse> => {
        const res = await firstValueFrom(this.http.post(`${this.apiUrl}/auth/join-guest`, payload));
        const data = parseWithZod(AuthResponseSchema, res);
        const partyId = data.party?.id ?? data.partyId ?? '';
        const partyCode = data.party?.code ?? payload.partyCode;
        // Sessão do convidado substitui qualquer sessão anterior neste navegador
        this.storage.clearSession();
        this.storage.setToken(data.accessToken);
        this.storage.setUser({
          ...data.user,
          role: 'GUEST',
          playerName: data.user.playerName ?? data.user.username ?? payload.playerName,
          partyId,
          partyCode,
        });
        this.storage.setActiveParty(partyId, partyCode);
        return { ...data, party: { id: partyId, code: partyCode } };
      },
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: ['auth'] });
      },
    }));
  }

  useRegisterPlayerMutation() {
    return injectMutation(() => ({
      mutationFn: async (payload: PlayerRegisterInput): Promise<AuthResponse> => {
        const res = await firstValueFrom(this.http.post(`${this.apiUrl}/auth/register-player`, payload));
        return this.completePlayerAuth(parseWithZod(AuthResponseSchema, res), payload);
      },
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: ['auth'] });
      },
    }));
  }

  useLoginPlayerMutation() {
    return injectMutation(() => ({
      mutationFn: async (payload: PlayerLoginInput): Promise<AuthResponse> => {
        const res = await firstValueFrom(this.http.post(`${this.apiUrl}/auth/login-player`, payload));
        return this.completePlayerAuth(parseWithZod(AuthResponseSchema, res), payload);
      },
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: ['auth'] });
      },
    }));
  }

  private completePlayerAuth(
    data: AuthResponse,
    payload: PlayerLoginInput | PlayerRegisterInput,
  ): AuthResponse {
    const partyId = data.party?.id ?? data.partyId ?? '';
    const partyCode = data.party?.code ?? payload.partyCode;
    this.storage.clearSession();
    this.storage.setToken(data.accessToken);
    this.storage.setUser({
      ...data.user,
      role: 'PLAYER',
      playerName: data.user.playerName ?? data.user.username ?? payload.username,
      partyId,
      partyCode,
    });
    this.storage.setActiveParty(partyId, partyCode);
    return { ...data, party: { id: partyId, code: partyCode } };
  }
}
