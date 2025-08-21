import { z } from 'zod';

// Base schemas
export const uuidSchema = z.string().uuid();
export const tenantIdSchema = uuidSchema;
export const timestampSchema = z.string().datetime();

// Product schemas
export const productSchema = z.object({
  id: uuidSchema.optional(),
  tenant_id: tenantIdSchema,
  sku: z.string().min(1),
  barcode: z.string().optional(),
  name: z.string().min(1),
  option: z.string().optional(),
  pack_info: z.string().optional(),
  image_url: z.string().url().optional(),
  unit: z.string().optional(),
});

export const productUpdateSchema = productSchema.partial().omit({ tenant_id: true });

// Order schemas
export const orderSchema = z.object({
  id: uuidSchema.optional(),
  tenant_id: tenantIdSchema,
  channel_id: uuidSchema.optional(),
  channel_order_no: z.string().min(1),
  buyer: z.string().min(1),
  ordered_at: timestampSchema,
  status: z.enum(['new', 'confirmed', 'canceled', 'fulfilled']).default('new'),
});

export const orderUpdateSchema = orderSchema.partial().omit({ tenant_id: true });

// Order item schemas
export const orderItemSchema = z.object({
  id: uuidSchema.optional(),
  order_id: uuidSchema.optional(),
  sku: z.string().min(1),
  qty: z.number().int().positive(),
  option: z.string().optional(),
  price: z.number().positive().optional(),
});

export const orderItemUpdateSchema = orderItemSchema.partial().omit({ order_id: true });

// Channel schemas
export const channelSchema = z.object({
  id: uuidSchema.optional(),
  tenant_id: tenantIdSchema,
  name: z.string().min(1),
  type: z.string().min(1),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const channelUpdateSchema = channelSchema.partial().omit({ tenant_id: true });

// Channel credential schemas
export const channelCredentialSchema = z.object({
  channel: z.enum(['mock', 'coupang', 'naver']),
  credentials_json: z.unknown(),
  refreshed_at: timestampSchema.optional(),
});

// Shipment schemas
export const shipmentSchema = z.object({
  id: uuidSchema.optional(),
  tenant_id: tenantIdSchema,
  order_id: uuidSchema.optional(),
  carrier: z.string().min(1),
  tracking_no: z.string().optional(),
  label_format: z.enum(['pdf', 'zpl']).default('pdf'),
  label_url: z.string().url().optional(),
  status: z.enum(['created', 'processing', 'shipped', 'delivered']).default('created'),
  printed_at: timestampSchema.optional(),
});

export const shipmentUpdateSchema = shipmentSchema.partial().omit({ tenant_id: true });

// Shipment item schemas
export const shipmentItemSchema = z.object({
  id: uuidSchema.optional(),
  shipment_id: uuidSchema.optional(),
  sku: z.string().min(1),
  qty: z.number().int().positive(),
});

export const shipmentItemUpdateSchema = shipmentItemSchema.partial().omit({ shipment_id: true });

// CSV row schemas
export const productCsvRowSchema = z.object({
  sku: z.string().min(1),
  barcode: z.string().optional(),
  name: z.string().min(1),
  option: z.string().optional(),
  pack_info: z.string().optional(),
  image_url: z.string().url().optional(),
  unit: z.string().optional(),
});

export const orderCsvRowSchema = z.object({
  channel_order_no: z.string().min(1),
  buyer: z.string().min(1),
  ordered_at: timestampSchema,
  sku: z.string().min(1),
  qty: z.number().int().positive(),
  option: z.string().optional(),
  price: z.number().positive().optional(),
});

// Validation result schemas
export const validationErrorSchema = z.object({
  row: z.number(),
  msg: z.string(),
});

export const validationResultSchema = z.object({
  ok: z.boolean(),
  errors: z.array(validationErrorSchema),
});

// MCP tool schemas
export const mcpToolSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  inputSchema: z.unknown().optional(),
});

export const mcpRunRequestSchema = z.object({
  tool: z.string(),
  args: z.record(z.unknown()).optional(),
});

// Type exports
export type Product = z.infer<typeof productSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderUpdate = z.infer<typeof orderUpdateSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type OrderItemUpdate = z.infer<typeof orderItemUpdateSchema>;
export type Channel = z.infer<typeof channelSchema>;
export type ChannelUpdate = z.infer<typeof channelUpdateSchema>;
export type ChannelCredential = z.infer<typeof channelCredentialSchema>;
export type Shipment = z.infer<typeof shipmentSchema>;
export type ShipmentUpdate = z.infer<typeof shipmentUpdateSchema>;
export type ShipmentItem = z.infer<typeof shipmentItemSchema>;
export type ShipmentItemUpdate = z.infer<typeof shipmentItemUpdateSchema>;
export type ProductCsvRow = z.infer<typeof productCsvRowSchema>;
export type OrderCsvRow = z.infer<typeof orderCsvRowSchema>;
export type ValidationError = z.infer<typeof validationErrorSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;
export type McpTool = z.infer<typeof mcpToolSchema>;
export type McpRunRequest = z.infer<typeof mcpRunRequestSchema>;

