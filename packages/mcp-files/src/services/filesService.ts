import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import {
  productCsvRowSchema,
  orderCsvRowSchema,
  ValidationResult,
  ProductCsvRow,
  OrderCsvRow,
} from '@joogo/shared';

export class FilesService {
  private supabase;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async listTemplates(): Promise<string[]> {
    return ['products.csv', 'orders.csv'];
  }

  async getTemplate(name: string): Promise<string> {
    switch (name) {
      case 'products.csv':
        return 'sku,barcode,name,option,pack_info,image_url,unit';
      case 'orders.csv':
        return 'channel_order_no,buyer,ordered_at,sku,qty,option,price';
      default:
        throw new Error(`Unknown template: ${name}`);
    }
  }

  async validateCsv(name: string, content: string): Promise<ValidationResult> {
    try {
      const errors: Array<{ row: number; msg: string }> = [];
      
      // Parse CSV content
      const records = await this.parseCsvContent(content);
      
      // Validate based on template type
      switch (name) {
        case 'products.csv':
          for (let i = 0; i < records.length; i++) {
            const result = productCsvRowSchema.safeParse(records[i]);
            if (!result.success) {
              errors.push({
                row: i + 2, // +2 because CSV is 1-indexed and we skip header
                msg: result.error.errors.map(e => e.message).join(', '),
              });
            }
          }
          break;
          
        case 'orders.csv':
          for (let i = 0; i < records.length; i++) {
            const result = orderCsvRowSchema.safeParse(records[i]);
            if (!result.success) {
              errors.push({
                row: i + 2,
                msg: result.error.errors.map(e => e.message).join(', '),
              });
            }
          }
          break;
          
        default:
          throw new Error(`Unknown template: ${name}`);
      }
      
      return {
        ok: errors.length === 0,
        errors,
      };
    } catch (error) {
      this.logger.error('CSV validation error:', error);
      return {
        ok: false,
        errors: [{ row: 0, msg: `Validation failed: ${error}` }],
      };
    }
  }

  async uploadCsv(name: string, content: string, tenantId: string): Promise<{ success: boolean; rowsProcessed: number }> {
    try {
      // First validate the CSV
      const validation = await this.validateCsv(name, content);
      if (!validation.ok) {
        throw new Error(`CSV validation failed: ${JSON.stringify(validation.errors)}`);
      }

      // Parse CSV content
      const records = await this.parseCsvContent(content);
      
      let rowsProcessed = 0;
      
      switch (name) {
        case 'products.csv':
          rowsProcessed = await this.uploadProducts(records as ProductCsvRow[], tenantId);
          break;
          
        case 'orders.csv':
          rowsProcessed = await this.uploadOrders(records as OrderCsvRow[], tenantId);
          break;
          
        default:
          throw new Error(`Unknown template: ${name}`);
      }
      
      this.logger.info(`Successfully uploaded ${rowsProcessed} rows from ${name}`);
      
      return {
        success: true,
        rowsProcessed,
      };
    } catch (error) {
      this.logger.error('CSV upload error:', error);
      throw error;
    }
  }

  private async parseCsvContent(content: string): Promise<Record<string, any>[]> {
    return new Promise((resolve, reject) => {
      parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (err, records) => {
        if (err) {
          reject(err);
        } else {
          resolve(records);
        }
      });
    });
  }

  private async uploadProducts(records: ProductCsvRow[], tenantId: string): Promise<number> {
    const { error } = await this.supabase
      .from('stage_products')
      .insert(
        records.map(record => ({
          tenant_id: tenantId,
          ...record,
        }))
      );

    if (error) {
      throw new Error(`Failed to upload products: ${error.message}`);
    }

    return records.length;
  }

  private async uploadOrders(records: OrderCsvRow[], tenantId: string): Promise<number> {
    const { error } = await this.supabase
      .from('stage_orders')
      .insert(
        records.map(record => ({
          tenant_id: tenantId,
          ...record,
        }))
      );

    if (error) {
      throw new Error(`Failed to upload orders: ${error.message}`);
    }

    return records.length;
  }
}

