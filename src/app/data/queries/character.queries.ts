import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { ApiConfig } from '../../core/config/api.config';
import { Character, CharacterSchema, CreateCharacterInput } from '../schemas/character.schema';
import { z } from 'zod';
import { parseWithZod } from '../../shared/utils/zod-validator';

@Injectable({ providedIn: 'root' })
export class CharacterQueriesService {
  private http = inject(HttpClient);
  private queryClient = inject(QueryClient);

  private get apiUrl(): string {
    return ApiConfig.getBaseUrl();
  }

  useCharacters(partyId: () => string) {
    return injectQuery(() => {
      const id = partyId();
      return {
        queryKey: ['characters', id],
        queryFn: async (): Promise<Character[]> => {
          if (!id) return [];
          const res = await firstValueFrom(this.http.get(`${this.apiUrl}/parties/${id}/characters`));
          return parseWithZod(z.array(CharacterSchema), res);
        },
        enabled: !!id,
        refetchInterval: !id ? false : 3000,
      };
    });
  }

  useCreateCharacterMutation() {
    return injectMutation(() => ({
      mutationFn: async ({
        partyId,
        character,
      }: {
        partyId: string;
        character: CreateCharacterInput;
      }): Promise<Character> => {
        const res = await firstValueFrom(
          this.http.post(`${this.apiUrl}/parties/${partyId}/characters`, character)
        );
        return parseWithZod(CharacterSchema, res);
      },
      onSuccess: (_data, variables) => {
        this.queryClient.invalidateQueries({ queryKey: ['characters', variables.partyId] });
        this.queryClient.invalidateQueries({ queryKey: ['party'] });
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
        this.queryClient.invalidateQueries({ queryKey: ['characters'] });
      },
    }));
  }
}
