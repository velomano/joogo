import express, { Application } from 'express';
import pino from 'pino';
import { config } from 'dotenv';
import { FilesService } from './services/filesService';
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
const port = process.env.FILES_PORT || 7301;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));
app.use(authMiddleware);

// Initialize services
const filesService = new FilesService(logger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mcp-files', timestamp: new Date().toISOString() });
});

// MCP endpoints
app.get('/tools', (req, res) => {
  const tools = [
    { name: 'list_templates', description: 'List available CSV templates' },
    { name: 'get_template', description: 'Get CSV template headers' },
    { name: 'validate_csv', description: 'Validate CSV content' },
    { name: 'upload_csv', description: 'Upload and process CSV data' },
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
      case 'list_templates':
        result = await filesService.listTemplates();
        break;
      case 'get_template':
        if (!args?.name) {
          return res.status(400).json({ error: 'Template name is required' });
        }
        result = await filesService.getTemplate(args.name);
        break;
      case 'validate_csv':
        if (!args?.name || !args?.content) {
          return res.status(400).json({ error: 'Template name and content are required' });
        }
        result = await filesService.validateCsv(args.name, args.content);
        break;
      case 'upload_csv':
        if (!args?.name || !args?.content || !args?.tenantId) {
          return res.status(400).json({ error: 'Template name, content, and tenantId are required' });
        }
        result = await filesService.uploadCsv(args.name, args.content, args.tenantId);
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
  logger.info(`MCP Files provider listening on port ${port}`);
});

export default app;

