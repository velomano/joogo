import { createClient } from '@supabase/supabase-js';
import { generateId } from '@joogo/shared';

export class MockOrderAdapter {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async generateOrders(tenantId: string, since?: string): Promise<number> {
    try {
      // Generate 5-10 mock orders
      const orderCount = Math.floor(Math.random() * 6) + 5;
      const orders = [];
      const orderItems = [];

      for (let i = 0; i < orderCount; i++) {
        const orderId = generateId();
        const orderNo = `MOCK-${Date.now()}-${i + 1}`;
        const buyer = this.getRandomBuyer();
        const orderedAt = this.getRandomDate(since);
        const itemCount = Math.floor(Math.random() * 3) + 1;

        orders.push({
          id: orderId,
          tenant_id: tenantId,
          channel_order_no: orderNo,
          buyer,
          ordered_at: orderedAt.toISOString(),
          status: 'new',
        });

        // Generate order items
        for (let j = 0; j < itemCount; j++) {
          const item = this.getRandomOrderItem();
          orderItems.push({
            id: generateId(),
            order_id: orderId,
            ...item,
          });
        }
      }

      // Insert orders
      const { error: orderError } = await this.supabase
        .from('orders')
        .upsert(orders, {
          onConflict: 'tenant_id,channel_id,channel_order_no',
        });

      if (orderError) {
        throw new Error(`Failed to insert mock orders: ${orderError.message}`);
      }

      // Insert order items
      if (orderItems.length > 0) {
        const { error: itemError } = await this.supabase
          .from('order_items')
          .insert(orderItems);

        if (itemError) {
          throw new Error(`Failed to insert mock order items: ${itemError.message}`);
        }
      }

      return orderCount;
    } catch (error) {
      throw new Error(`Mock order generation failed: ${error}`);
    }
  }

  private getRandomBuyer(): string {
    const buyers = [
      'Alice Johnson',
      'Bob Smith',
      'Carol Davis',
      'David Wilson',
      'Eva Brown',
      'Frank Miller',
      'Grace Lee',
      'Henry Taylor',
      'Iris Garcia',
      'Jack Martinez',
    ];
    return buyers[Math.floor(Math.random() * buyers.length)];
  }

  private getRandomOrderItem() {
    const products = [
      { sku: 'PROD-001', option: 'Dark Roast', price: 12.99 },
      { sku: 'PROD-002', option: 'Green Tea', price: 15.99 },
      { sku: 'PROD-003', option: '70% Dark', price: 8.99 },
      { sku: 'PROD-004', option: 'Lavender', price: 6.50 },
      { sku: 'PROD-005', option: 'Raw', price: 18.99 },
    ];

    const product = products[Math.floor(Math.random() * products.length)];
    const qty = Math.floor(Math.random() * 3) + 1;

    return {
      sku: product.sku,
      qty,
      option: product.option,
      price: product.price,
    };
  }

  private getRandomDate(since?: string): Date {
    const now = new Date();
    const sinceDate = since ? new Date(since) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    const timeDiff = now.getTime() - sinceDate.getTime();
    const randomTime = sinceDate.getTime() + Math.random() * timeDiff;
    
    return new Date(randomTime);
  }
}

