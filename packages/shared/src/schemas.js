"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpRunRequestSchema = exports.mcpToolSchema = exports.validationResultSchema = exports.validationErrorSchema = exports.orderCsvRowSchema = exports.productCsvRowSchema = exports.shipmentItemUpdateSchema = exports.shipmentItemSchema = exports.shipmentUpdateSchema = exports.shipmentSchema = exports.channelCredentialSchema = exports.channelUpdateSchema = exports.channelSchema = exports.orderItemUpdateSchema = exports.orderItemSchema = exports.orderUpdateSchema = exports.orderSchema = exports.productUpdateSchema = exports.productSchema = exports.timestampSchema = exports.tenantIdSchema = exports.uuidSchema = void 0;
const zod_1 = require("zod");
// Base schemas
exports.uuidSchema = zod_1.z.string().uuid();
exports.tenantIdSchema = exports.uuidSchema;
exports.timestampSchema = zod_1.z.string().datetime();
// Product schemas
exports.productSchema = zod_1.z.object({
    id: exports.uuidSchema.optional(),
    tenant_id: exports.tenantIdSchema,
    sku: zod_1.z.string().min(1),
    barcode: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1),
    option: zod_1.z.string().optional(),
    pack_info: zod_1.z.string().optional(),
    image_url: zod_1.z.string().url().optional(),
    unit: zod_1.z.string().optional(),
});
exports.productUpdateSchema = exports.productSchema.partial().omit({ tenant_id: true });
// Order schemas
exports.orderSchema = zod_1.z.object({
    id: exports.uuidSchema.optional(),
    tenant_id: exports.tenantIdSchema,
    channel_id: exports.uuidSchema.optional(),
    channel_order_no: zod_1.z.string().min(1),
    buyer: zod_1.z.string().min(1),
    ordered_at: exports.timestampSchema,
    status: zod_1.z.enum(['new', 'confirmed', 'canceled', 'fulfilled']).default('new'),
});
exports.orderUpdateSchema = exports.orderSchema.partial().omit({ tenant_id: true });
// Order item schemas
exports.orderItemSchema = zod_1.z.object({
    id: exports.uuidSchema.optional(),
    order_id: exports.uuidSchema.optional(),
    sku: zod_1.z.string().min(1),
    qty: zod_1.z.number().int().positive(),
    option: zod_1.z.string().optional(),
    price: zod_1.z.number().positive().optional(),
});
exports.orderItemUpdateSchema = exports.orderItemSchema.partial().omit({ order_id: true });
// Channel schemas
exports.channelSchema = zod_1.z.object({
    id: exports.uuidSchema.optional(),
    tenant_id: exports.tenantIdSchema,
    name: zod_1.z.string().min(1),
    type: zod_1.z.string().min(1),
    status: zod_1.z.enum(['active', 'inactive']).default('active'),
});
exports.channelUpdateSchema = exports.channelSchema.partial().omit({ tenant_id: true });
// Channel credential schemas
exports.channelCredentialSchema = zod_1.z.object({
    channel: zod_1.z.enum(['mock', 'coupang', 'naver']),
    credentials_json: zod_1.z.unknown(),
    refreshed_at: exports.timestampSchema.optional(),
});
// Shipment schemas
exports.shipmentSchema = zod_1.z.object({
    id: exports.uuidSchema.optional(),
    tenant_id: exports.tenantIdSchema,
    order_id: exports.uuidSchema.optional(),
    carrier: zod_1.z.string().min(1),
    tracking_no: zod_1.z.string().optional(),
    label_format: zod_1.z.enum(['pdf', 'zpl']).default('pdf'),
    label_url: zod_1.z.string().url().optional(),
    status: zod_1.z.enum(['created', 'processing', 'shipped', 'delivered']).default('created'),
    printed_at: exports.timestampSchema.optional(),
});
exports.shipmentUpdateSchema = exports.shipmentSchema.partial().omit({ tenant_id: true });
// Shipment item schemas
exports.shipmentItemSchema = zod_1.z.object({
    id: exports.uuidSchema.optional(),
    shipment_id: exports.uuidSchema.optional(),
    sku: zod_1.z.string().min(1),
    qty: zod_1.z.number().int().positive(),
});
exports.shipmentItemUpdateSchema = exports.shipmentItemSchema.partial().omit({ shipment_id: true });
// CSV row schemas
exports.productCsvRowSchema = zod_1.z.object({
    sku: zod_1.z.string().min(1),
    barcode: zod_1.z.string().optional(),
    name: zod_1.z.string().min(1),
    option: zod_1.z.string().optional(),
    pack_info: zod_1.z.string().optional(),
    image_url: zod_1.z.string().url().optional(),
    unit: zod_1.z.string().optional(),
});
exports.orderCsvRowSchema = zod_1.z.object({
    channel_order_no: zod_1.z.string().min(1),
    buyer: zod_1.z.string().min(1),
    ordered_at: exports.timestampSchema,
    sku: zod_1.z.string().min(1),
    qty: zod_1.z.number().int().positive(),
    option: zod_1.z.string().optional(),
    price: zod_1.z.number().positive().optional(),
});
// Validation result schemas
exports.validationErrorSchema = zod_1.z.object({
    row: zod_1.z.number(),
    msg: zod_1.z.string(),
});
exports.validationResultSchema = zod_1.z.object({
    ok: zod_1.z.boolean(),
    errors: zod_1.z.array(exports.validationErrorSchema),
});
// MCP tool schemas
exports.mcpToolSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    inputSchema: zod_1.z.unknown().optional(),
});
exports.mcpRunRequestSchema = zod_1.z.object({
    tool: zod_1.z.string(),
    args: zod_1.z.record(zod_1.z.unknown()).optional(),
});
