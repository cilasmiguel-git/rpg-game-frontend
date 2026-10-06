import { z, ZodType } from 'zod';

export function parseWithZod<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn('Zod Validation Warning (aplicando dados com fallback):', result.error.format());
    return data as T;
  }
  return result.data;
}
