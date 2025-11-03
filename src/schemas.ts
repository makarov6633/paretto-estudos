import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const sortSchema = z
  .record(z.string(), z.enum(["asc", "desc"]))
  .default({});

export const itemsQuerySchema = z
  .object({
    q: z.string().optional(),
    tags: z
      .union([z.string(), z.array(z.string())])
      .transform((v) => (Array.isArray(v) ? v : v ? v.split(",") : []))
      .default([]),
  })
  .and(paginationSchema)
  .and(z.object({ sort: sortSchema }).partial());

export const telemetrySchema = z.object({
  name: z.string().min(1),
  ts: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
  userId: z.string().optional(),
  props: z.record(z.string(), z.unknown()).optional(),
});

export const recommendationsBodySchema = z.object({
  prefs: z.object({
    tags: z.array(z.string()).default([]),
  }),
  limit: z.number().int().positive().max(50).default(10),
});
