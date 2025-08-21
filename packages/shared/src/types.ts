// Database types
export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          tenant_id: string;
          sku: string;
          barcode: string | null;
          name: string;
          option: string | null;
          pack_info: string | null;
          image_url: string | null;
          unit: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          sku: string;
          barcode?: string | null;
          name: string;
          option?: string | null;
          pack_info?: string | null;
          image_url?: string | null;
          unit?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          sku?: string;
          barcode?: string | null;
          name?: string;
          option?: string | null;
          pack_info?: string | null;
          image_url?: string | null;
          unit?: string | null;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          tenant_id: string;
          channel_id: string | null;
          channel_order_no: string;
          buyer: string;
          ordered_at: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          channel_id?: string | null;
          channel_order_no: string;
          buyer: string;
          ordered_at: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          channel_id?: string | null;
          channel_order_no?: string;
          buyer?: string;
          ordered_at?: string;
          status?: string;
          created_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          sku: string;
          qty: number;
          option: string | null;
          price: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          sku: string;
          qty: number;
          option?: string | null;
          price?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          sku?: string;
          qty?: number;
          option?: string | null;
          price?: number | null;
          created_at?: string;
        };
      };
      shipments: {
        Row: {
          id: string;
          tenant_id: string;
          order_id: string;
          carrier: string;
          tracking_no: string | null;
          label_format: string;
          label_url: string | null;
          status: string;
          printed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          order_id: string;
          carrier: string;
          tracking_no?: string | null;
          label_format?: string;
          label_url?: string | null;
          status?: string;
          printed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          order_id?: string;
          carrier?: string;
          tracking_no?: string | null;
          label_format?: string;
          label_url?: string | null;
          status?: string;
          printed_at?: string | null;
          created_at?: string;
        };
      };
      shipment_items: {
        Row: {
          id: string;
          shipment_id: string;
          sku: string;
          qty: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          sku: string;
          qty: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          shipment_id?: string;
          sku?: string;
          qty?: number;
          created_at?: string;
        };
      };
      stage_products: {
        Row: {
          id: string;
          tenant_id: string;
          sku: string;
          barcode: string | null;
          name: string;
          option: string | null;
          pack_info: string | null;
          image_url: string | null;
          unit: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          sku: string;
          barcode?: string | null;
          name: string;
          option?: string | null;
          pack_info?: string | null;
          image_url?: string | null;
          unit?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          sku?: string;
          barcode?: string | null;
          name?: string;
          option?: string | null;
          pack_info?: string | null;
          image_url?: string | null;
          unit?: string | null;
          created_at?: string;
        };
      };
      stage_orders: {
        Row: {
          id: string;
          tenant_id: string;
          channel_order_no: string;
          buyer: string;
          ordered_at: string;
          sku: string;
          qty: number;
          option: string | null;
          price: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          channel_order_no: string;
          buyer: string;
          ordered_at: string;
          sku: string;
          qty: number;
          option?: string | null;
          price?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          channel_order_no?: string;
          buyer?: string;
          ordered_at?: string;
          sku?: string;
          qty?: number;
          option?: string | null;
          price?: number | null;
          created_at?: string;
        };
      };
    };
  };
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// MCP provider types
export interface McpProvider {
  name: string;
  port: number;
  baseUrl: string;
  health: () => Promise<boolean>;
}

// MCP types are now defined in schemas.ts

export interface McpRunResponse {
  result: unknown;
  error?: string;
}

// CSV processing types
export interface CsvValidationResult {
  ok: boolean;
  errors: Array<{
    row: number;
    msg: string;
  }>;
}

export interface CsvUploadResult {
  success: boolean;
  rowsProcessed: number;
  errors: Array<{
    row: number;
    msg: string;
  }>;
}

// Search and filter types
export interface ProductSearchParams {
  query?: string;
  limit?: number;
  offset?: number;
}

export interface OrderSearchParams {
  status?: string;
  query?: string;
  limit?: number;
  offset?: number;
}

// Mock data types
export interface MockOrderGenerator {
  generateOrders(count: number, since?: Date): Promise<void>;
}

export interface MockShippingProvider {
  createShipment(orderId: string): Promise<string>;
  generateLabel(shipmentId: string): Promise<string>;
  printLabel(shipmentId: string): Promise<void>;
}
