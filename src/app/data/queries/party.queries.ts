import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { ApiConfig } from '../../core/config/api.config';
import { CreatePartyInput, Party, PartySchema, PartyStatus } from '../schemas/party.schema';
import { parseWithZod } from '../../shared/utils/zod-validator';

export interface DatabaseHealth {
  status: string;
  database: string;
  connected: boolean;
  latencyMs?: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class PartyQueriesService {
  private http = inject(HttpClient);
  private queryClient = inject(QueryClient);

  private get apiUrl(): string {
    return ApiConfig.getBaseUrl();
  }

  useHealth() {
    return injectQuery(() => ({
      queryKey: ['health', 'db'],
      queryFn: async (): Promise<DatabaseHealth> => {
        const res = await firstValueFrom(this.http.get<DatabaseHealth>(`${this.apiUrl}/health/db`));
        return res;
      },
      refetchInterval: (query) => query.state.status === 'error' ? 30000 : 15000,
      retry: false,
    }));
  }

  useParty(partyCode: () => string) {
    return injectQuery(() => {
      const code = partyCode();
      return {
        queryKey: ['party', code],
        queryFn: async (): Promise<Party> => {
          if (!code) throw new Error('Código de sala não informado');
          const data = await firstValueFrom(this.http.get<any>(`${this.apiUrl}/parties/code/${code}`));
          const partyObj = data?.party ? { ...data.party, characters: data.characters || [] } : data;
          return parseWithZod(PartySchema, partyObj);
        },
        enabled: !!code,
        refetchInterval: !code
          ? false
          : (query: { state: { status: string } }) =>
              query.state.status === 'error' ? 30000 : 3000,
        retry: false,
      };
    });
  }

  useMyHostedParties() {
    return injectQuery(() => ({
      queryKey: ['parties', 'my-hosted'],
      queryFn: async (): Promise<Party[]> => {
        try {
          const res = await firstValueFrom(this.http.get<any>(`${this.apiUrl}/parties/my-hosted`));
          const list = Array.isArray(res) ? res : res?.parties || [];
          return list.map((p: any) => ({
            ...p,
            characters: p.characters || [],
            themeTitle: p.themeTitle || p.theme?.title || p.themeKey,
          }));
        } catch (err) {
          console.warn('Não foi possível carregar salas do mestre:', err);
          return [];
        }
      },
      refetchInterval: (query: { state: { status: string } }) =>
        query.state.status === 'error' ? 30000 : 5000,
      retry: 1,
    }));
  }

  useCreatePartyMutation() {
    return injectMutation(() => ({
      mutationFn: async (payload: CreatePartyInput): Promise<Party> => {
        const res = await firstValueFrom(this.http.post<any>(`${this.apiUrl}/parties`, payload));
        const partyObj = res?.party || res;
        return parseWithZod(PartySchema, partyObj);
      },
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: ['party'] });
        this.queryClient.invalidateQueries({ queryKey: ['parties', 'my-hosted'] });
      },
    }));
  }

  useUpdatePartyStatusMutation() {
    return injectMutation(() => ({
      mutationFn: async ({ partyId, status }: { partyId: string; status: PartyStatus }) => {
        return firstValueFrom(
          this.http.patch(`${this.apiUrl}/parties/${partyId}/status`, { status })
        );
      },
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: ['party'] });
        this.queryClient.invalidateQueries({ queryKey: ['parties', 'my-hosted'] });
      },
    }));
  }

  useToggleReadyMutation() {
    return injectMutation(() => ({
      mutationFn: async (characterId: string) => {
        return firstValueFrom(
          this.http.patch(`${this.apiUrl}/characters/${characterId}/ready`, {})
        );
      },
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: ['party'] });
        this.queryClient.invalidateQueries({ queryKey: ['parties', 'my-hosted'] });
      },
    }));
  }
}
