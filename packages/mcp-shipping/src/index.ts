import express from 'express';
import pino from 'pino';
import { config } from 'dotenv';
import { ShippingService } from './services/shippingService';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
config();

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    },
  },
});

const app = express();
const port = process.env.SHIPPING_PORT || 7304;

// Middleware
app.use(express.json());
app.use(authMiddleware);

// Initialize services
const shippingService = new ShippingService(logger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mcp-shipping', timestamp: new Date().toISOString() });
});

// MCP endpoints
app.get('/tools', (req, res) => {
  const tools = [
    { name: 'create_shipment', description: 'Create a shipment for an order' },
    { name: 'render_label', description: 'Generate shipping label PDF' },
    { name: 'print_label', description: 'Print shipping label (mock)' },
  ];
  res.json(tools);
});

app.post('/run', async (req, res, next) => {
  try {
    const { tool, args } = req.body;
    
    if (!tool) {
      return res.status(400).json({ error: 'Tool name is required' });
    }

    let result;
    switch (tool) {
      case 'create_shipment':
        if (!args?.tenantId || !args?.orderId || !args?.carrier) {
          return res.status(400).json({ error: 'tenantId, orderId, and carrier are required' });
        }
        result = await shippingService.createShipment(args.tenantId, args.orderId, args.carrier);
        break;
      case 'render_label':
        if (!args?.tenantId || !args?.shipmentId) {
          return res.status(400).json({ error: 'tenantId and shipmentId are required' });
        }
        result = await shippingService.renderLabel(args.tenantId, args.shipmentId, args.format);
        break;
      case 'print_label':
        if (!args?.tenantId || !args?.shipmentId) {
          return res.status(400).json({ error: 'tenantId and shipmentId are required' });
        }
        result = await shippingService.printLabel(args.tenantId, args.shipmentId, args.target);
        break;
      default:
        return res.status(400).json({ error: `Unknown tool: ${tool}` });
    }

    res.json({ result });
  } catch (error) {
    next(error);
  }
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`MCP Shipping provider listening on port ${port}`);
});

export default app;

