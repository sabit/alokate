import { z } from 'zod';

export const authSchema = z.object({ pin: z.string().min(4) });

const configSchema = z.object({
  faculty: z.array(z.any()),
  subjects: z.array(z.any()),
  sections: z.array(z.any()),
  timeslots: z.array(z.any()),
  rooms: z.array(z.any()),
  buildings: z.array(z.any()),
});

const preferenceSchema = z.object({
  facultySubject: z.record(z.record(z.number())),
  facultyTimeslot: z.record(z.record(z.number())),
  facultyBuilding: z.record(z.record(z.number())),
  mobility: z.record(z.number()),
});

const scheduleEntrySchema = z.object({
  sectionId: z.string(),
  facultyId: z.string(),
  timeslotId: z.string(),
  roomId: z.string(),
  locked: z.boolean().default(false),
  scoreBreakdown: z
    .object({
      preference: z.number(),
      mobility: z.number(),
      seniority: z.number(),
      total: z.number(),
    })
    .partial()
    .optional(),
});

const settingsSchema = z.object({
  weights: z.object({
    mobility: z.number(),
    seniority: z.number(),
    preference: z.number(),
  }),
  theme: z.enum(['light', 'dark']),
  optimizerSeed: z.number().optional(),
});

export const snapshotDataSchema = z.object({
  config: configSchema,
  preferences: preferenceSchema,
  schedule: z.array(scheduleEntrySchema),
  settings: settingsSchema,
});

export const snapshotSchema = z.object({
  id: z.string(),
  snapshotName: z.string().optional(),
  timestamp: z.string(),
  hash: z.string().optional(),
  data: snapshotDataSchema.optional(),
});

export const unifiedStateSchema = z.object({
  config: configSchema,
  preferences: preferenceSchema,
  schedule: z.array(scheduleEntrySchema),
  snapshots: z.array(snapshotSchema.omit({ data: true })),
  settings: settingsSchema,
});

export const diffRequestSchema = z.object({
  fromId: z.string(),
  toId: z.string(),
});

export type UnifiedState = z.infer<typeof unifiedStateSchema>;
export type SnapshotData = z.infer<typeof snapshotDataSchema>;
export type SnapshotRecord = z.infer<typeof snapshotSchema>;
export type DiffRequest = z.infer<typeof diffRequestSchema>;
