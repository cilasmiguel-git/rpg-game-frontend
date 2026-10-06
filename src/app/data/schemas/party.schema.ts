import { z } from 'zod';
import { CharacterSchema } from './character.schema';

export const PartyStatusSchema = z.enum(['LOBBY', 'IN_PROGRESS', 'FINISHED']);

export const PartySchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  themeKey: z.string().optional().default('medieval'),
  themeTitle: z.string().optional().default('Aventura Épica'),
  status: PartyStatusSchema.default('IN_PROGRESS'),
  currentPhaseNumber: z.number().default(1),
  masterId: z.string().optional().default(''),
  characters: z.array(CharacterSchema).optional().default([]),
});

export const CreatePartyInputSchema = z.object({
  title: z.string().min(3, 'O título da campanha deve ter pelo menos 3 caracteres'),
  themeKey: z.string().min(1, 'Selecione uma temática'),
  description: z.string().optional(),
  password: z.string().optional(),
});

export type Party = z.infer<typeof PartySchema>;
export type PartyStatus = z.infer<typeof PartyStatusSchema>;
export type CreatePartyInput = z.infer<typeof CreatePartyInputSchema>;
