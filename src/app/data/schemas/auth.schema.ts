import { z } from 'zod';

export const MasterRegisterSchema = z.object({
  username: z.string().min(3, 'Username deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const MasterLoginSchema = z.object({
  identifier: z.string().min(3, 'Email ou username obrigatório'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export const GuestJoinSchema = z.object({
  playerName: z.string().min(2, 'Seu nome de aventureiro deve ter no mínimo 2 caracteres'),
  partyCode: z.string().min(4, 'Código da sala inválido'),
  partyPassword: z.string().optional(),
});

export const PlayerRegisterSchema = z.object({
  username: z.string().min(3, 'Username deve ter no mínimo 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  partyCode: z.string().min(4, 'Código da sala inválido'),
  partyPassword: z.string().optional(),
});

export const PlayerLoginSchema = z.object({
  username: z.string().min(3, 'Username deve ter no mínimo 3 caracteres'),
  password: z.string().min(1, 'Senha obrigatória'),
  partyCode: z.string().min(4, 'Código da sala inválido'),
  partyPassword: z.string().optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  username: z.string().optional(),
  email: z.string().optional(),
  playerName: z.string().optional(),
  // Backend retorna 'PLAYER' para convidados; 'GUEST' mantido por compatibilidade
  role: z.enum(['MASTER', 'PLAYER', 'GUEST']),
  partyId: z.string().optional(),
  partyCode: z.string().optional(),
});

export const AuthResponseSchema = z.object({
  user: UserSchema,
  accessToken: z.string(),
  partyId: z.string().optional(),
  party: z
    .object({
      id: z.string(),
      code: z.string(),
      title: z.string().optional(),
    })
    .optional(),
});

export type MasterRegisterInput = z.infer<typeof MasterRegisterSchema>;
export type MasterLoginInput = z.infer<typeof MasterLoginSchema>;
export type GuestJoinInput = z.infer<typeof GuestJoinSchema>;
export type PlayerRegisterInput = z.infer<typeof PlayerRegisterSchema>;
export type PlayerLoginInput = z.infer<typeof PlayerLoginSchema>;
export type User = z.infer<typeof UserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
