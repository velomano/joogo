// MCP 타입 정의
interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
}

interface McpRunRequest {
  tool: string;
  args?: Record<string, any>;
}

const DEV_TOKEN = process.env.NEXT_PUBLIC_DEV_TOKEN || 'dev-tenant';

export class McpClient {
  private baseUrls: Record<string, string>;

  constructor() {
    this.baseUrls = {
      files: `http://localhost:${process.env.NEXT_PUBLIC_FILES_PORT || 7301}`,
      catalog: `http://localhost:${process.env.NEXT_PUBLIC_CATALOG_PORT || 7302}`,
      orders: `http://localhost:${process.env.NEXT_PUBLIC_ORDERS_PORT || 7303}`,
      shipping: `http://localhost:${process.env.NEXT_PUBLIC_SHIPPING_PORT || 7304}`,
    };
  }

  private async makeRequest(provider: string, endpoint: string, data?: any) {
    const url = `${this.baseUrls[provider]}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEV_TOKEN}`,
    };

    try {
      const response = await fetch(url, {
        method: data ? 'POST' : 'GET',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`MCP ${provider} request failed:`, error);
      throw error;
    }
  }

  async getTools(provider: string): Promise<McpTool[]> {
    return this.makeRequest(provider, '/tools');
  }

  async runTool(provider: string, request: McpRunRequest): Promise<any> {
    return this.makeRequest(provider, '/run', request);
  }

  async checkHealth(provider: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(provider, '/health');
      return response.status === 'ok';
    } catch {
      return false;
    }
  }

  // Files provider methods
  async listTemplates(): Promise<string[]> {
    const result = await this.runTool('files', { tool: 'list_templates' });
    return result.result;
  }

  async getTemplate(name: string): Promise<string> {
    const result = await this.runTool('files', { 
      tool: 'get_template', 
      args: { name } 
    });
    return result.result;
  }

  async validateCsv(name: string, content: string): Promise<any> {
    const result = await this.runTool('files', { 
      tool: 'validate_csv', 
      args: { name, content } 
    });
    return result.result;
  }

  async uploadCsv(name: string, content: string, tenantId: string): Promise<any> {
    const result = await this.runTool('files', { 
      tool: 'upload_csv', 
      args: { name, content, tenantId } 
    });
    return result.result;
  }

  // Catalog provider methods
  async importProducts(tenantId: string): Promise<any> {
    const result = await this.runTool('catalog', { 
      tool: 'import_products', 
      args: { tenantId } 
    });
    return result.result;
  }

  async listProducts(tenantId: string, query?: string, limit?: number, offset?: number): Promise<any> {
    const result = await this.runTool('catalog', { 
      tool: 'list_products', 
      args: { tenantId, query, limit, offset } 
    });
    return result.result;
  }

  async upsertProduct(tenantId: string, product: any): Promise<any> {
    const result = await this.runTool('catalog', { 
      tool: 'upsert_product', 
      args: { tenantId, product } 
    });
    return result.result;
  }

  async getProductByBarcode(tenantId: string, barcode: string): Promise<any> {
    const result = await this.runTool('catalog', { 
      tool: 'get_product_by_barcode', 
      args: { tenantId, barcode } 
    });
    return result.result;
  }

  // Orders provider methods
  async importOrders(tenantId: string): Promise<any> {
    const result = await this.runTool('orders', { 
      tool: 'import_orders', 
      args: { tenantId } 
    });
    return result.result;
  }

  async listOrders(tenantId: string, status?: string, query?: string, limit?: number, offset?: number): Promise<any> {
    const result = await this.runTool('orders', { 
      tool: 'list_orders', 
      args: { tenantId, status, query, limit, offset } 
    });
    return result.result;
  }

  async listOrderItems(tenantId: string, orderId: string): Promise<any> {
    const result = await this.runTool('orders', { 
      tool: 'list_order_items', 
      args: { tenantId, orderId } 
    });
    return result.result;
  }

  async syncOrders(tenantId: string, channel: string, since?: string): Promise<any> {
    const result = await this.runTool('orders', { 
      tool: 'sync_orders', 
      args: { tenantId, channel, since } 
    });
    return result.result;
  }

  // Shipping provider methods
  async createShipment(tenantId: string, orderId: string, carrier: string): Promise<any> {
    const result = await this.runTool('shipping', { 
      tool: 'create_shipment', 
      args: { tenantId, orderId, carrier } 
    });
    return result.result;
  }

  async renderLabel(tenantId: string, shipmentId: string, format?: string): Promise<any> {
    const result = await this.runTool('shipping', { 
      tool: 'render_label', 
      args: { tenantId, shipmentId, format } 
    });
    return result.result;
  }

  async printLabel(tenantId: string, shipmentId: string, target?: string): Promise<any> {
    const result = await this.runTool('shipping', { 
      tool: 'print_label', 
      args: { tenantId, shipmentId, target } 
    });
    return result.result;
  }
}

// Export singleton instance
export const mcpClient = new McpClient();

