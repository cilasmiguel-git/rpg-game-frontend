import { z, ZodType } from 'zod';

export function parseWithZod<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error('Zod Validation Error:', result.error.format());
    throw new Error(`Data validation failed: ${result.error.issues.map((i) => i.message).join(', ')}`);
  }
  return result.data;
}
