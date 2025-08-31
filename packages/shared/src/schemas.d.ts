import { z } from 'zod';
export declare const uuidSchema: z.ZodString;
export declare const tenantIdSchema: z.ZodString;
export declare const timestampSchema: z.ZodString;
export declare const productSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
    sku: z.ZodString;
    barcode: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    option: z.ZodOptional<z.ZodString>;
    pack_info: z.ZodOptional<z.ZodString>;
    image_url: z.ZodOptional<z.ZodString>;
    unit: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    tenant_id?: string;
    sku?: string;
    barcode?: string;
    name?: string;
    option?: string;
    pack_info?: string;
    image_url?: string;
    unit?: string;
}, {
    id?: string;
    tenant_id?: string;
    sku?: string;
    barcode?: string;
    name?: string;
    option?: string;
    pack_info?: string;
    image_url?: string;
    unit?: string;
}>;
export declare const productUpdateSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tenant_id: z.ZodOptional<z.ZodString>;
    sku: z.ZodOptional<z.ZodString>;
    barcode: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    name: z.ZodOptional<z.ZodString>;
    option: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    pack_info: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    image_url: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    unit: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "tenant_id">, "strip", z.ZodTypeAny, {
    id?: string;
    sku?: string;
    barcode?: string;
    name?: string;
    option?: string;
    pack_info?: string;
    image_url?: string;
    unit?: string;
}, {
    id?: string;
    sku?: string;
    barcode?: string;
    name?: string;
    option?: string;
    pack_info?: string;
    image_url?: string;
    unit?: string;
}>;
export declare const orderSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
    channel_id: z.ZodOptional<z.ZodString>;
    channel_order_no: z.ZodString;
    buyer: z.ZodString;
    ordered_at: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["new", "confirmed", "canceled", "fulfilled"]>>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    tenant_id?: string;
    status?: "new" | "confirmed" | "canceled" | "fulfilled";
    channel_id?: string;
    channel_order_no?: string;
    buyer?: string;
    ordered_at?: string;
}, {
    id?: string;
    tenant_id?: string;
    status?: "new" | "confirmed" | "canceled" | "fulfilled";
    channel_id?: string;
    channel_order_no?: string;
    buyer?: string;
    ordered_at?: string;
}>;
export declare const orderUpdateSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tenant_id: z.ZodOptional<z.ZodString>;
    channel_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    channel_order_no: z.ZodOptional<z.ZodString>;
    buyer: z.ZodOptional<z.ZodString>;
    ordered_at: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["new", "confirmed", "canceled", "fulfilled"]>>>;
}, "tenant_id">, "strip", z.ZodTypeAny, {
    id?: string;
    status?: "new" | "confirmed" | "canceled" | "fulfilled";
    channel_id?: string;
    channel_order_no?: string;
    buyer?: string;
    ordered_at?: string;
}, {
    id?: string;
    status?: "new" | "confirmed" | "canceled" | "fulfilled";
    channel_id?: string;
    channel_order_no?: string;
    buyer?: string;
    ordered_at?: string;
}>;
export declare const orderItemSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    order_id: z.ZodOptional<z.ZodString>;
    sku: z.ZodString;
    qty: z.ZodNumber;
    option: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    sku?: string;
    option?: string;
    order_id?: string;
    qty?: number;
    price?: number;
}, {
    id?: string;
    sku?: string;
    option?: string;
    order_id?: string;
    qty?: number;
    price?: number;
}>;
export declare const orderItemUpdateSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    order_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sku: z.ZodOptional<z.ZodString>;
    qty: z.ZodOptional<z.ZodNumber>;
    option: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    price: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "order_id">, "strip", z.ZodTypeAny, {
    id?: string;
    sku?: string;
    option?: string;
    qty?: number;
    price?: number;
}, {
    id?: string;
    sku?: string;
    option?: string;
    qty?: number;
    price?: number;
}>;
export declare const channelSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
    name: z.ZodString;
    type: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["active", "inactive"]>>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    tenant_id?: string;
    name?: string;
    type?: string;
    status?: "active" | "inactive";
}, {
    id?: string;
    tenant_id?: string;
    name?: string;
    type?: string;
    status?: "active" | "inactive";
}>;
export declare const channelUpdateSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tenant_id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["active", "inactive"]>>>;
}, "tenant_id">, "strip", z.ZodTypeAny, {
    id?: string;
    name?: string;
    type?: string;
    status?: "active" | "inactive";
}, {
    id?: string;
    name?: string;
    type?: string;
    status?: "active" | "inactive";
}>;
export declare const channelCredentialSchema: z.ZodObject<{
    channel: z.ZodEnum<["mock", "coupang", "naver"]>;
    credentials_json: z.ZodUnknown;
    refreshed_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    channel?: "mock" | "coupang" | "naver";
    credentials_json?: unknown;
    refreshed_at?: string;
}, {
    channel?: "mock" | "coupang" | "naver";
    credentials_json?: unknown;
    refreshed_at?: string;
}>;
export declare const shipmentSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
    order_id: z.ZodOptional<z.ZodString>;
    carrier: z.ZodString;
    tracking_no: z.ZodOptional<z.ZodString>;
    label_format: z.ZodDefault<z.ZodEnum<["pdf", "zpl"]>>;
    label_url: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["created", "processing", "shipped", "delivered"]>>;
    printed_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    tenant_id?: string;
    status?: "created" | "processing" | "shipped" | "delivered";
    order_id?: string;
    carrier?: string;
    tracking_no?: string;
    label_format?: "pdf" | "zpl";
    label_url?: string;
    printed_at?: string;
}, {
    id?: string;
    tenant_id?: string;
    status?: "created" | "processing" | "shipped" | "delivered";
    order_id?: string;
    carrier?: string;
    tracking_no?: string;
    label_format?: "pdf" | "zpl";
    label_url?: string;
    printed_at?: string;
}>;
export declare const shipmentUpdateSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tenant_id: z.ZodOptional<z.ZodString>;
    order_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    carrier: z.ZodOptional<z.ZodString>;
    tracking_no: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    label_format: z.ZodOptional<z.ZodDefault<z.ZodEnum<["pdf", "zpl"]>>>;
    label_url: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["created", "processing", "shipped", "delivered"]>>>;
    printed_at: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "tenant_id">, "strip", z.ZodTypeAny, {
    id?: string;
    status?: "created" | "processing" | "shipped" | "delivered";
    order_id?: string;
    carrier?: string;
    tracking_no?: string;
    label_format?: "pdf" | "zpl";
    label_url?: string;
    printed_at?: string;
}, {
    id?: string;
    status?: "created" | "processing" | "shipped" | "delivered";
    order_id?: string;
    carrier?: string;
    tracking_no?: string;
    label_format?: "pdf" | "zpl";
    label_url?: string;
    printed_at?: string;
}>;
export declare const shipmentItemSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    shipment_id: z.ZodOptional<z.ZodString>;
    sku: z.ZodString;
    qty: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id?: string;
    sku?: string;
    qty?: number;
    shipment_id?: string;
}, {
    id?: string;
    sku?: string;
    qty?: number;
    shipment_id?: string;
}>;
export declare const shipmentItemUpdateSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    shipment_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sku: z.ZodOptional<z.ZodString>;
    qty: z.ZodOptional<z.ZodNumber>;
}, "shipment_id">, "strip", z.ZodTypeAny, {
    id?: string;
    sku?: string;
    qty?: number;
}, {
    id?: string;
    sku?: string;
    qty?: number;
}>;
export declare const productCsvRowSchema: z.ZodObject<{
    sku: z.ZodString;
    barcode: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    option: z.ZodOptional<z.ZodString>;
    pack_info: z.ZodOptional<z.ZodString>;
    image_url: z.ZodOptional<z.ZodString>;
    unit: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sku?: string;
    barcode?: string;
    name?: string;
    option?: string;
    pack_info?: string;
    image_url?: string;
    unit?: string;
}, {
    sku?: string;
    barcode?: string;
    name?: string;
    option?: string;
    pack_info?: string;
    image_url?: string;
    unit?: string;
}>;
export declare const orderCsvRowSchema: z.ZodObject<{
    channel_order_no: z.ZodString;
    buyer: z.ZodString;
    ordered_at: z.ZodString;
    sku: z.ZodString;
    qty: z.ZodNumber;
    option: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sku?: string;
    option?: string;
    channel_order_no?: string;
    buyer?: string;
    ordered_at?: string;
    qty?: number;
    price?: number;
}, {
    sku?: string;
    option?: string;
    channel_order_no?: string;
    buyer?: string;
    ordered_at?: string;
    qty?: number;
    price?: number;
}>;
export declare const validationErrorSchema: z.ZodObject<{
    row: z.ZodNumber;
    msg: z.ZodString;
}, "strip", z.ZodTypeAny, {
    row?: number;
    msg?: string;
}, {
    row?: number;
    msg?: string;
}>;
export declare const validationResultSchema: z.ZodObject<{
    ok: z.ZodBoolean;
    errors: z.ZodArray<z.ZodObject<{
        row: z.ZodNumber;
        msg: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        row?: number;
        msg?: string;
    }, {
        row?: number;
        msg?: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    ok?: boolean;
    errors?: {
        row?: number;
        msg?: string;
    }[];
}, {
    ok?: boolean;
    errors?: {
        row?: number;
        msg?: string;
    }[];
}>;
export declare const mcpToolSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    inputSchema: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    inputSchema?: unknown;
}, {
    name?: string;
    description?: string;
    inputSchema?: unknown;
}>;
export declare const mcpRunRequestSchema: z.ZodObject<{
    tool: z.ZodString;
    args: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    tool?: string;
    args?: Record<string, unknown>;
}, {
    tool?: string;
    args?: Record<string, unknown>;
}>;
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
