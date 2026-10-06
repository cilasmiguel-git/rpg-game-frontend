import { z } from 'zod';

export const PhaseStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'COMPLETED']);

export const PhaseSchema = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      return {
        ...val,
        title: val.title || 'Fase Inicial',
        phaseNumber: Number(val.phaseNumber) || 1,
        masterNotes: val.masterNotes ?? '',
        formattedNarration: val.formattedNarration ?? val.narration ?? '',
        suggestedHooks: Array.isArray(val.suggestedHooks) ? val.suggestedHooks : [],
        status: val.status || 'PUBLISHED',
      };
    }
    return val;
  },
  z.object({
    id: z.string().optional().default(() => 'phase_' + Date.now()),
    partyId: z.string().optional().default(''),
    phaseNumber: z.number().default(1),
    title: z.string().default('Fase Inicial'),
    masterNotes: z.string().default(''),
    formattedNarration: z.string().default(''),
    aiAtmosphere: z.string().nullable().optional(),
    imagePrompt: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    suggestedHooks: z.array(z.string()).default([]),
    status: PhaseStatusSchema.or(z.string()).default('PUBLISHED'),
  })
);

export const CreatePhaseInputSchema = z.object({
  title: z.string().min(3, 'Título da fase deve ter pelo menos 3 caracteres'),
  masterNotes: z.string().min(10, 'Anotações do mestre devem conter detalhes do cenário e desafio'),
  autoGenerateImage: z.boolean().default(true),
});

export type Phase = z.infer<typeof PhaseSchema>;
export type PhaseStatus = z.infer<typeof PhaseStatusSchema>;
export type CreatePhaseInput = z.infer<typeof CreatePhaseInputSchema>;
