import { z } from 'zod';

export const ThemeOptionItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

export const ThemeSchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string(),
  genre: z.string(),
  races: z.array(ThemeOptionItemSchema).default([]),
  hairStyles: z.array(ThemeOptionItemSchema).default([]),
  bodyTypes: z.array(ThemeOptionItemSchema).default([]),
  outfitTypes: z.array(ThemeOptionItemSchema).default([]),
  mainWeapons: z.array(ThemeOptionItemSchema).default([]),
  headgears: z.array(ThemeOptionItemSchema).default([]),
  accessories: z.array(ThemeOptionItemSchema).default([]),
  skinPalettes: z.array(z.string()).default([]),
  hairPalettes: z.array(z.string()).default([]),
  clothingPalettes: z.array(z.string()).default([]),
  aiPromptTone: z.string().optional(),
});

export type Theme = z.infer<typeof ThemeSchema>;
export type ThemeOptionItem = z.infer<typeof ThemeOptionItemSchema>;
