import { z } from 'zod';

export const UploadRowSchema = z.object({
  sale_date: z.string().min(1), // 날짜 형식 검증 완화
  sku: z.string().min(1),
  category: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  channel: z.string().optional().nullable(),
  revenue: z.coerce.number().nonnegative().default(0),
  qty: z.coerce.number().nonnegative().default(0),
});

export type UploadRow = z.infer<typeof UploadRowSchema>;
