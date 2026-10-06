import { z } from 'zod';

export const CharacterAppearanceSchema = z.object({
  sex: z.enum(['MASCULINO', 'FEMININO', 'ANDROGINO', 'OUTRO']).or(z.string()).default('MASCULINO'),
  race: z.string().default('Humano'),
  skinColor: z.string().default('#e4b590'),
  hairStyle: z.string().default('curto_desalinhado'),
  hairColor: z.string().default('#7b4c27'),
  eyeColor: z.string().default('#3b82f6'),
  bodyType: z.string().default('atletico'),
  facialFeatures: z.string().nullable().optional(),
  outfitType: z.string().default('traje_couro_batido'),
  outfitPrimaryColor: z.string().default('#1e293b'),
  outfitSecondaryColor: z.string().nullable().optional(),
  mainWeapon: z.string().nullable().optional(),
  headgear: z.string().nullable().optional(),
  accessory: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});

export const CharacterSchema = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      return {
        ...val,
        health: val.health ?? val.stats?.health ?? 100,
        maxHealth: val.maxHealth ?? val.stats?.maxHealth ?? 100,
        energy: val.energy ?? val.stats?.energy ?? 50,
        bio: val.bio ?? val.stats?.bio ?? null,
      };
    }
    return val;
  },
  z.object({
    id: z.string(),
    partyId: z.string(),
    userId: z.string().nullable().optional(),
    playerName: z.string(),
    name: z.string(),
    characterClass: z.string().nullable().optional(),
    appearance: CharacterAppearanceSchema,
    health: z.number().default(100),
    maxHealth: z.number().default(100),
    energy: z.number().default(50),
    bio: z.string().nullable().optional(),
    isReady: z.boolean().default(false),
    gridPosition: z
      .object({
        x: z.number(),
        y: z.number(),
      })
      .optional(),
  })
);

export const CreateCharacterInputSchema = z.object({
  playerName: z.string().min(2, 'Nome do jogador deve ter pelo menos 2 caracteres'),
  name: z.string().min(2, 'Nome do personagem deve ter pelo menos 2 caracteres'),
  characterClass: z.string().optional(),
  appearance: CharacterAppearanceSchema,
  stats: z
    .object({
      health: z.number().default(100),
      maxHealth: z.number().default(100),
      energy: z.number().default(50),
      bio: z.string().optional(),
    })
    .optional(),
});

export type CharacterAppearance = z.infer<typeof CharacterAppearanceSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type CreateCharacterInput = z.infer<typeof CreateCharacterInputSchema>;
