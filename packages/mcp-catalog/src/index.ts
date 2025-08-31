import express, { Application } from 'express';
import pino from 'pino';
import { config } from 'dotenv';
import { CatalogService } from './services/catalogService';
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
const port = process.env.CATALOG_PORT || 7302;

// Middleware
app.use(express.json());
app.use(authMiddleware);

// Initialize services
const catalogService = new CatalogService(logger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mcp-catalog', timestamp: new Date().toISOString() });
});

// MCP endpoints
app.get('/tools', (req, res) => {
  const tools = [
    { name: 'import_products', description: 'Import products from stage table' },
    { name: 'list_products', description: 'List products with search and pagination' },
    { name: 'upsert_product', description: 'Create or update a product' },
    { name: 'get_product_by_barcode', description: 'Find product by barcode' },
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
      case 'import_products':
        if (!args?.tenantId) {
          return res.status(400).json({ error: 'tenantId is required' });
        }
        result = await catalogService.importProducts(args.tenantId);
        break;
      case 'list_products':
        if (!args?.tenantId) {
          return res.status(400).json({ error: 'tenantId is required' });
        }
        result = await catalogService.listProducts(args.tenantId, args.query, args.limit, args.offset);
        break;
      case 'upsert_product':
        if (!args?.tenantId || !args?.product) {
          return res.status(400).json({ error: 'tenantId and product are required' });
        }
        result = await catalogService.upsertProduct(args.tenantId, args.product);
        break;
      case 'get_product_by_barcode':
        if (!args?.tenantId || !args?.barcode) {
          return res.status(400).json({ error: 'tenantId and barcode are required' });
        }
        result = await catalogService.getProductByBarcode(args.tenantId, args.barcode);
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
  logger.info(`MCP Catalog provider listening on port ${port}`);
});

export default app;

