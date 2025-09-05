import { createClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import {
  orderSchema,
  orderItemSchema,
  Order,
  OrderItem,
  OrderCsvRow,
} from '@joogo/shared';
// MockOrderAdapter 제거 - 실제 데이터만 사용

export class OrdersService {
  private supabase;
  private logger: Logger;
  // Mock 어댑터 제거

  constructor(logger: Logger) {
    this.logger = logger;
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async importOrders(tenantId: string): Promise<{ imported: number; errors: string[] }> {
    try {
      this.logger.info(`Starting order import for tenant: ${tenantId}`);
      
      // Get orders from stage table
      const { data: stageOrders, error: stageError } = await this.supabase
        .from('stage_orders')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('ordered_at', { ascending: true });

      if (stageError) {
        throw new Error(`Failed to fetch stage orders: ${stageError.message}`);
      }

      if (!stageOrders || stageOrders.length === 0) {
        return { imported: 0, errors: ['No orders found in stage table'] };
      }

      let imported = 0;
      const errors: string[] = [];

      // Group stage orders by channel_order_no
      const orderGroups = this.groupStageOrders(stageOrders);

      for (const [orderNo, items] of Object.entries(orderGroups)) {
        try {
          const firstItem = items[0];
          
          // Create order
          const orderData = {
            tenant_id: tenantId,
            channel_order_no: orderNo,
            buyer: firstItem.buyer,
            ordered_at: firstItem.ordered_at,
            status: 'new' as const,
          };

          const validatedOrder = orderSchema.parse(orderData);

          const { data: order, error: orderError } = await this.supabase
            .from('orders')
            .upsert(validatedOrder, {
              onConflict: 'tenant_id,channel_id,channel_order_no',
            })
            .select()
            .single();

          if (orderError) {
            errors.push(`Failed to create order ${orderNo}: ${orderError.message}`);
            continue;
          }

          // Create order items
          for (const item of items) {
            try {
              const itemData = {
                order_id: order.id,
                sku: item.sku,
                qty: item.qty,
                option: item.option,
                price: item.price,
              };

              const validatedItem = orderItemSchema.parse(itemData);

              const { error: itemError } = await this.supabase
                .from('order_items')
                .insert(validatedItem);

              if (itemError) {
                errors.push(`Failed to create item for order ${orderNo}: ${itemError.message}`);
              }
            } catch (validationError) {
              errors.push(`Validation failed for item in order ${orderNo}: ${validationError}`);
            }
          }

          imported++;
        } catch (validationError) {
          errors.push(`Validation failed for order ${orderNo}: ${validationError}`);
        }
      }

      // Clear stage table after successful import
      if (imported > 0) {
        const { error: clearError } = await this.supabase
          .from('stage_orders')
          .delete()
          .eq('tenant_id', tenantId);

        if (clearError) {
          this.logger.warn(`Failed to clear stage table: ${clearError.message}`);
        }
      }

      this.logger.info(`Order import completed: ${imported} imported, ${errors.length} errors`);
      
      return { imported, errors };
    } catch (error) {
      this.logger.error('Order import error:', error);
      throw error;
    }
  }

  async listOrders(
    tenantId: string,
    status?: string,
    query?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ orders: Order[]; total: number }> {
    try {
      let supabaseQuery = this.supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId);

      // Apply status filter
      if (status) {
        supabaseQuery = supabaseQuery.eq('status', status);
      }

      // Apply search filter
      if (query) {
        supabaseQuery = supabaseQuery.or(
          `channel_order_no.ilike.%${query}%,buyer.ilike.%${query}%`
        );
      }

      // Apply pagination
      supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

      const { data: orders, error, count } = await supabaseQuery;

      if (error) {
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }

      return {
        orders: orders || [],
        total: count || 0,
      };
    } catch (error) {
      this.logger.error('List orders error:', error);
      throw error;
    }
  }

  async listOrderItems(tenantId: string, orderId: string): Promise<OrderItem[]> {
    try {
      // First verify the order belongs to the tenant
      const { data: order, error: orderError } = await this.supabase
        .from('orders')
        .select('id')
        .eq('id', orderId)
        .eq('tenant_id', tenantId)
        .single();

      if (orderError || !order) {
        throw new Error('Order not found or access denied');
      }

      // Get order items
      const { data: items, error } = await this.supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) {
        throw new Error(`Failed to fetch order items: ${error.message}`);
      }

      return items || [];
    } catch (error) {
      this.logger.error('List order items error:', error);
      throw error;
    }
  }

  async syncOrders(tenantId: string, channel: string, since?: string): Promise<{ synced: number }> {
    try {
      this.logger.info(`Starting order sync for tenant: ${tenantId}, channel: ${channel}`);

      // Mock 데이터 생성 제거 - 실제 데이터만 사용
      this.logger.warn(`Order sync not supported for channel: ${channel}. Only real data uploads are supported.`);
      
      return { synced: 0 };
    } catch (error) {
      this.logger.error('Order sync error:', error);
      throw error;
    }
  }

  private groupStageOrders(stageOrders: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    for (const order of stageOrders) {
      if (!groups[order.channel_order_no]) {
        groups[order.channel_order_no] = [];
      }
      groups[order.channel_order_no].push(order);
    }
    
    return groups;
  }
}

