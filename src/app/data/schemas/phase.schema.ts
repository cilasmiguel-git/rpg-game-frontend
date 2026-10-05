import { z } from 'zod';

export const PhaseStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'COMPLETED']);

export const PhaseSchema = z.object({
  id: z.string(),
  partyId: z.string(),
  phaseNumber: z.number().default(1),
  title: z.string(),
  masterNotes: z.string().default(''),
  formattedNarration: z.string().default(''),
  aiAtmosphere: z.string().nullable().optional(),
  imagePrompt: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  suggestedHooks: z.array(z.string()).default([]),
  status: PhaseStatusSchema.default('PUBLISHED'),
});

export const CreatePhaseInputSchema = z.object({
  title: z.string().min(3, 'Título da fase deve ter pelo menos 3 caracteres'),
  masterNotes: z.string().min(10, 'Anotações do mestre devem conter detalhes do cenário e desafio'),
  autoGenerateImage: z.boolean().default(true),
});

export type Phase = z.infer<typeof PhaseSchema>;
export type PhaseStatus = z.infer<typeof PhaseStatusSchema>;
export type CreatePhaseInput = z.infer<typeof CreatePhaseInputSchema>;
