import { createClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import { generateId } from '@joogo/shared';
import { LabelGenerator } from '../utils/labelGenerator';

export class ShippingService {
  private supabase;
  private logger: Logger;
  private labelGenerator: LabelGenerator;

  constructor(logger: Logger) {
    this.logger = logger;
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.labelGenerator = new LabelGenerator();
  }

  async createShipment(tenantId: string, orderId: string, carrier: string): Promise<{ shipmentId: string }> {
    try {
      this.logger.info(`Creating shipment for order: ${orderId}, carrier: ${carrier}`);

      // Verify order exists and belongs to tenant
      const { data: order, error: orderError } = await this.supabase
        .from('orders')
        .select('id, channel_order_no')
        .eq('id', orderId)
        .eq('tenant_id', tenantId)
        .single();

      if (orderError || !order) {
        throw new Error('Order not found or access denied');
      }

      // Get order items
      const { data: orderItems, error: itemsError } = await this.supabase
        .from('order_items')
        .select('sku, qty')
        .eq('order_id', orderId);

      if (itemsError) {
        throw new Error(`Failed to fetch order items: ${itemsError.message}`);
      }

      if (!orderItems || orderItems.length === 0) {
        throw new Error('Order has no items');
      }

      // Create shipment
      const shipmentId = generateId();
      const { error: shipmentError } = await this.supabase
        .from('shipments')
        .insert({
          id: shipmentId,
          tenant_id: tenantId,
          order_id: orderId,
          carrier,
          tracking_no: `TRK-${Date.now()}`,
          status: 'created',
        });

      if (shipmentError) {
        throw new Error(`Failed to create shipment: ${shipmentError.message}`);
      }

      // Create shipment items
      const shipmentItems = orderItems.map(item => ({
        id: generateId(),
        shipment_id: shipmentId,
        sku: item.sku,
        qty: item.qty,
      }));

      const { error: itemsInsertError } = await this.supabase
        .from('shipment_items')
        .insert(shipmentItems);

      if (itemsInsertError) {
        throw new Error(`Failed to create shipment items: ${itemsInsertError.message}`);
      }

      this.logger.info(`Shipment created successfully: ${shipmentId}`);
      
      return { shipmentId };
    } catch (error) {
      this.logger.error('Create shipment error:', error);
      throw error;
    }
  }

  async renderLabel(tenantId: string, shipmentId: string, format: string = 'pdf'): Promise<{ labelUrl: string }> {
    try {
      this.logger.info(`Rendering label for shipment: ${shipmentId}, format: ${format}`);

      // Verify shipment exists and belongs to tenant
      const { data: shipment, error: shipmentError } = await this.supabase
        .from('shipments')
        .select(`
          *,
          orders!inner(channel_order_no, buyer),
          shipment_items(sku, qty)
        `)
        .eq('id', shipmentId)
        .eq('tenant_id', tenantId)
        .single();

      if (shipmentError || !shipment) {
        throw new Error('Shipment not found or access denied');
      }

      // Generate label
      const labelBuffer = await this.labelGenerator.generateLabel(shipment, format);
      
      // Upload to Supabase Storage
      const fileName = `labels/${tenantId}/${shipmentId}.${format}`;
      const { error: uploadError } = await this.supabase.storage
        .from('labels')
        .upload(fileName, labelBuffer, {
          contentType: format === 'pdf' ? 'application/pdf' : 'text/plain',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload label: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('labels')
        .getPublicUrl(fileName);

      // Update shipment with label URL
      const { error: updateError } = await this.supabase
        .from('shipments')
        .update({ label_url: urlData.publicUrl })
        .eq('id', shipmentId);

      if (updateError) {
        this.logger.warn(`Failed to update shipment label URL: ${updateError.message}`);
      }

      this.logger.info(`Label rendered successfully: ${urlData.publicUrl}`);
      
      return { labelUrl: urlData.publicUrl };
    } catch (error) {
      this.logger.error('Render label error:', error);
      throw error;
    }
  }

  async printLabel(tenantId: string, shipmentId: string, target: string = 'local'): Promise<{ success: boolean }> {
    try {
      this.logger.info(`Printing label for shipment: ${shipmentId}, target: ${target}`);

      // Verify shipment exists and belongs to tenant
      const { data: shipment, error: shipmentError } = await this.supabase
        .from('shipments')
        .select('id')
        .eq('id', shipmentId)
        .eq('tenant_id', tenantId)
        .single();

      if (shipmentError || !shipment) {
        throw new Error('Shipment not found or access denied');
      }

      // Mock print operation - log to jobs table
      const { error: jobError } = await this.supabase
        .from('jobs')
        .insert({
          tenant_id: tenantId,
          type: 'print_label',
          status: 'completed',
          data: { shipmentId, target },
          result: { success: true, printedAt: new Date().toISOString() },
          completed_at: new Date().toISOString(),
        });

      if (jobError) {
        this.logger.warn(`Failed to log print job: ${jobError.message}`);
      }

      // Update shipment as printed
      const { error: updateError } = await this.supabase
        .from('shipments')
        .update({ 
          status: 'printed',
          printed_at: new Date().toISOString(),
        })
        .eq('id', shipmentId);

      if (updateError) {
        this.logger.warn(`Failed to update shipment status: ${updateError.message}`);
      }

      this.logger.info(`Label printed successfully: ${shipmentId}`);
      
      return { success: true };
    } catch (error) {
      this.logger.error('Print label error:', error);
      throw error;
    }
  }
}

