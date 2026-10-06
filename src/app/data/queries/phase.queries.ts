import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { ApiConfig } from '../../core/config/api.config';
import { CreatePhaseInput, Phase, PhaseSchema } from '../schemas/phase.schema';
import { parseWithZod } from '../../shared/utils/zod-validator';

@Injectable({ providedIn: 'root' })
export class PhaseQueriesService {
  private http = inject(HttpClient);
  private queryClient = inject(QueryClient);

  private get apiUrl(): string {
    return ApiConfig.getBaseUrl();
  }

  useCurrentPhase(partyId: () => string) {
    return injectQuery(() => {
      const id = partyId();
      return {
        queryKey: ['phase', 'current', id],
        queryFn: async (): Promise<Phase | null> => {
          if (!id) return null;
          try {
            const data = await firstValueFrom(
              this.http.get<any>(`${this.apiUrl}/parties/${id}/phases/current`)
            );
            if (!data) return null;
            const phaseObj = data?.phase ? data.phase : data;
            if (!phaseObj || typeof phaseObj !== 'object' || (!phaseObj.id && !phaseObj.title)) {
              return null;
            }
            return parseWithZod(PhaseSchema, phaseObj);
          } catch {
            return null;
          }
        },
        enabled: !!id,
        refetchInterval: !id ? false : 5000,
      };
    });
  }

  useCreatePhaseMutation() {
    return injectMutation(() => ({
      mutationFn: async ({
        partyId,
        phase,
      }: {
        partyId: string;
        phase: CreatePhaseInput;
      }): Promise<Phase> => {
        const res = await firstValueFrom(
          this.http.post(`${this.apiUrl}/parties/${partyId}/phases`, phase)
        );
        return parseWithZod(PhaseSchema, res);
      },
      onSuccess: (_data, vars) => {
        this.queryClient.invalidateQueries({ queryKey: ['phase', 'current', vars.partyId] });
        this.queryClient.invalidateQueries({ queryKey: ['party'] });
      },
    }));
  }

  useGenerateImageMutation() {
    return injectMutation(() => ({
      mutationFn: async (phaseId: string): Promise<Phase> => {
        const res = await firstValueFrom(
          this.http.post(`${this.apiUrl}/phases/${phaseId}/generate-image`, {})
        );
        return parseWithZod(PhaseSchema, res);
      },
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: ['phase'] });
      },
    }));
  }

  usePublishPhaseMutation() {
    return injectMutation(() => ({
      mutationFn: async (phaseId: string): Promise<Phase> => {
        const res = await firstValueFrom(
          this.http.patch(`${this.apiUrl}/phases/${phaseId}/publish`, {})
        );
        return parseWithZod(PhaseSchema, res);
      },
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: ['phase'] });
      },
    }));
  }
}
