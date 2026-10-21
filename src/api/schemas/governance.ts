import { z } from 'zod';

export const LogWipSchema = z.object({
  hours: z.number().positive(),
  weekStartDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'El parámetro "weekStartDate" debe tener formato YYYY-MM-DD.')
    .optional(),
});

export type LogWipInput = z.infer<typeof LogWipSchema>;
