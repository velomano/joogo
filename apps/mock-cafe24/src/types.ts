import { z } from "zod";

// Minimal Cafe24-like shapes (subset, enough for analytics ingestion)

export const Variant = z.object({
  variant_code: z.string(),
  option_name: z.string(),
  price: z.number().nonnegative(),
  stock_quantity: z.number().int()
});
export type Variant = z.infer<typeof Variant>;

export const Inventory = z.object({
  sku: z.string(),
  location: z.string().default("default"),
  quantity: z.number().int()
});
export type Inventory = z.infer<typeof Inventory>;

export const Product = z.object({
  product_no: z.number().int(),
  product_code: z.string(),        // Cafe24 style code
  product_name: z.string(),
  retail_price: z.number().nonnegative(),
  created_date: z.string(),
  variants: z.array(Variant).default([]),
  inventories: z.array(Inventory).default([])
});
export type Product = z.infer<typeof Product>;

export const OrderLine = z.object({
  product_no: z.number().int(),
  variant_code: z.string().optional(),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative()
});
export type OrderLine = z.infer<typeof OrderLine>;

export const Order = z.object({
  order_id: z.string(),            // internal id
  order_no: z.number().int(),      // human-facing no.
  order_date: z.string(),
  status: z.enum(["PAID","CANCELLED","SHIPPED","DELIVERED","REFUNDED"]).default("PAID"),
  currency: z.string().default("KRW"),
  lines: z.array(OrderLine),
  totals: z.object({
    items: z.number().nonnegative(),
    shipping: z.number().nonnegative().default(0),
    discount: z.number().nonnegative().default(0),
    grand_total: z.number().nonnegative()
  })
});
export type Order = z.infer<typeof Order>;

export const PageParams = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  fields: z.string().optional(),
  embed: z.string().optional()
});
export type PageParams = z.infer<typeof PageParams>;
