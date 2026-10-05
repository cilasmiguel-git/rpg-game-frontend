import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { ApiConfig } from '../../core/config/api.config';
import { Theme, ThemeSchema } from '../schemas/theme.schema';
import { z } from 'zod';
import { parseWithZod } from '../../shared/utils/zod-validator';

@Injectable({ providedIn: 'root' })
export class ThemeQueriesService {
  private http = inject(HttpClient);

  private get apiUrl(): string {
    return ApiConfig.getBaseUrl();
  }

  useThemes() {
    return injectQuery(() => ({
      queryKey: ['themes'],
      queryFn: async (): Promise<Theme[]> => {
        const res = await firstValueFrom(this.http.get(`${this.apiUrl}/themes`));
        return parseWithZod(z.array(ThemeSchema), res);
      },
      staleTime: 1000 * 60 * 30, // 30 minutes cache
    }));
  }

  useTheme(key: () => string) {
    return injectQuery(() => ({
      queryKey: ['theme', key()],
      queryFn: async (): Promise<Theme> => {
        const k = key();
        const res = await firstValueFrom(this.http.get(`${this.apiUrl}/themes/${k}`));
        return parseWithZod(ThemeSchema, res);
      },
      enabled: !!key(),
      staleTime: 1000 * 60 * 30,
    }));
  }
}
