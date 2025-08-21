import { createClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import {
  productSchema,
  Product,
  ProductCsvRow,
  ProductSearchParams,
} from '@joogo/shared';

export class CatalogService {
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

  async importProducts(tenantId: string): Promise<{ imported: number; errors: string[] }> {
    try {
      this.logger.info(`Starting product import for tenant: ${tenantId}`);
      
      // Get products from stage table
      const { data: stageProducts, error: stageError } = await this.supabase
        .from('stage_products')
        .select('*')
        .eq('tenant_id', tenantId);

      if (stageError) {
        throw new Error(`Failed to fetch stage products: ${stageError.message}`);
      }

      if (!stageProducts || stageProducts.length === 0) {
        return { imported: 0, errors: ['No products found in stage table'] };
      }

      let imported = 0;
      const errors: string[] = [];

      // Process each stage product
      for (const stageProduct of stageProducts) {
        try {
          // Validate with Zod schema
          const validatedProduct = productSchema.parse({
            ...stageProduct,
            tenant_id: tenantId,
          });

          // Upsert to products table
          const { error: upsertError } = await this.supabase
            .from('products')
            .upsert(validatedProduct, {
              onConflict: 'tenant_id,sku',
            });

          if (upsertError) {
            errors.push(`Failed to upsert product ${stageProduct.sku}: ${upsertError.message}`);
          } else {
            imported++;
          }
        } catch (validationError) {
          errors.push(`Validation failed for product ${stageProduct.sku}: ${validationError}`);
        }
      }

      // Clear stage table after successful import
      if (imported > 0) {
        const { error: clearError } = await this.supabase
          .from('stage_products')
          .delete()
          .eq('tenant_id', tenantId);

        if (clearError) {
          this.logger.warn(`Failed to clear stage table: ${clearError.message}`);
        }
      }

      this.logger.info(`Product import completed: ${imported} imported, ${errors.length} errors`);
      
      return { imported, errors };
    } catch (error) {
      this.logger.error('Product import error:', error);
      throw error;
    }
  }

  async listProducts(
    tenantId: string,
    query?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ products: Product[]; total: number }> {
    try {
      let supabaseQuery = this.supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId);

      // Apply search filter
      if (query) {
        supabaseQuery = supabaseQuery.or(
          `sku.ilike.%${query}%,barcode.ilike.%${query}%,name.ilike.%${query}%`
        );
      }

      // Apply pagination
      supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

      const { data: products, error, count } = await supabaseQuery;

      if (error) {
        throw new Error(`Failed to fetch products: ${error.message}`);
      }

      return {
        products: products || [],
        total: count || 0,
      };
    } catch (error) {
      this.logger.error('List products error:', error);
      throw error;
    }
  }

  async upsertProduct(tenantId: string, productData: Partial<Product>): Promise<Product> {
    try {
      // Validate product data
      const validatedProduct = productSchema.parse({
        ...productData,
        tenant_id: tenantId,
      });

      // Upsert product
      const { data: product, error } = await this.supabase
        .from('products')
        .upsert(validatedProduct, {
          onConflict: 'tenant_id,sku',
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to upsert product: ${error.message}`);
      }

      this.logger.info(`Product upserted successfully: ${product.sku}`);
      
      return product;
    } catch (error) {
      this.logger.error('Upsert product error:', error);
      throw error;
    }
  }

  async getProductByBarcode(tenantId: string, barcode: string): Promise<Product | null> {
    try {
      const { data: product, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('barcode', barcode)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Failed to fetch product: ${error.message}`);
      }

      return product;
    } catch (error) {
      this.logger.error('Get product by barcode error:', error);
      throw error;
    }
  }
}

