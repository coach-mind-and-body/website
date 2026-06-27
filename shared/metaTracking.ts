import { z } from "zod";

export const metaTrackingInputSchema = z.object({
  fbc: z.string().optional(),
  fbp: z.string().optional(),
  eventId: z.string().optional(),
});

export type MetaTrackingInput = z.infer<typeof metaTrackingInputSchema>;
