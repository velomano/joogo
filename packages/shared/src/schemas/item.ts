import { z } from 'zod';

export const ItemSchema = z.object({
	barcode: z.string().min(1),
	productName: z.string().min(1),
	qty: z.number().int().nonnegative(),
	tenant_id: z.string().min(1),
});

export type Item = z.infer<typeof ItemSchema>;
