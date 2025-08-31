import express, { Application } from 'express';
import pino from 'pino';
import { config } from 'dotenv';
import { OrdersService } from './services/ordersService';
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

const app: Application = express();
const port = process.env.ORDERS_PORT || 7303;

// Middleware
app.use(express.json());
app.use(authMiddleware);

// Initialize services
const ordersService = new OrdersService(logger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mcp-orders', timestamp: new Date().toISOString() });
});

// MCP endpoints
app.get('/tools', (req, res) => {
  const tools = [
    { name: 'import_orders', description: 'Import orders from stage table' },
    { name: 'list_orders', description: 'List orders with search and pagination' },
    { name: 'list_order_items', description: 'List items for a specific order' },
    { name: 'sync_orders', description: 'Sync orders from external channels' },
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
      case 'import_orders':
        if (!args?.tenantId) {
          return res.status(400).json({ error: 'tenantId is required' });
        }
        result = await ordersService.importOrders(args.tenantId);
        break;
      case 'list_orders':
        if (!args?.tenantId) {
          return res.status(400).json({ error: 'tenantId is required' });
        }
        result = await ordersService.listOrders(args.tenantId, args.status, args.query, args.limit, args.offset);
        break;
      case 'list_order_items':
        if (!args?.tenantId || !args?.orderId) {
          return res.status(400).json({ error: 'tenantId and orderId are required' });
        }
        result = await ordersService.listOrderItems(args.tenantId, args.orderId);
        break;
      case 'sync_orders':
        if (!args?.tenantId || !args?.channel) {
          return res.status(400).json({ error: 'tenantId and channel are required' });
        }
        result = await ordersService.syncOrders(args.tenantId, args.channel, args.since);
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
  logger.info(`MCP Orders provider listening on port ${port}`);
});

export default app;

