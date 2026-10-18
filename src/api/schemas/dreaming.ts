import { z } from 'zod';

export const DistillEntitySchema = z.object({
  entityId: z.string().min(1, 'entityId es obligatorio y no puede estar vacío.'),
  canonicalName: z.string().min(1, 'canonicalName es obligatorio y no puede estar vacío.'),
  domain: z.string().optional(),
  currentStatus: z.string().optional(),
  attributes: z.union([z.record(z.string(), z.unknown()), z.string()]).optional(),
});

export const DistillFactSchema = z.object({
  factId: z.string().optional(),
  entityId: z.string().nullable().optional(),
  factStatement: z.string().min(1, 'factStatement es obligatorio y no puede estar vacío.'),
  isCanon: z.boolean().optional(),
  chapterSource: z.string().optional(),
});

export const DistillRequestSchema = z.object({
  chapterSource: z.string().min(1, 'chapterSource es obligatorio y no puede estar vacío.'),
  domain: z.string().optional(),
  text: z.string().optional(),
  entities: z.array(DistillEntitySchema).optional(),
  facts: z.array(DistillFactSchema).optional(),
});

export type DistillRequestDto = z.infer<typeof DistillRequestSchema>;
export type DistillEntityDto = z.infer<typeof DistillEntitySchema>;
export type DistillFactDto = z.infer<typeof DistillFactSchema>;
