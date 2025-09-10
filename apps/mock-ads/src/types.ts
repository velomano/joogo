import { z } from "zod";

export const Page = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  group_by: z.enum(["hour","day"]).default("day"),
  channel: z.string().optional(),
  campaign_id: z.string().optional()
});
export type Page = z.infer<typeof Page>;

export const AdPoint = z.object({
  ts: z.string(),
  channel: z.string(),
  campaign_id: z.string(),
  impressions: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
  cost: z.number().nonnegative(),
});
export type AdPoint = z.infer<typeof AdPoint>;
