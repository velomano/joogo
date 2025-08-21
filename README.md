# Joogo WMS/OMS MVP

A comprehensive Warehouse Management System (WMS) and Order Management System (OMS) built with MCP providers and Supabase as the single source of truth.

## 🏗️ Architecture

- **Monorepo**: pnpm workspaces with TypeScript
- **Frontend**: Next.js 15 with App Router, Tailwind CSS
- **Backend**: MCP (Model Context Protocol) providers as microservices
- **Database**: Supabase with PostgreSQL, Row Level Security (RLS)
- **Authentication**: Supabase Auth with multi-tenant support
- **File Storage**: Supabase Storage for shipping labels

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0 (또는 npm 최신)
- Supabase CLI (optional, for local development)

### 1. Clone and Install

```bash
git clone <repository-url>
cd joogo-wms-oms
pnpm install # 또는 npm i
```

### 2. Environment Setup

Copy the environment file and configure your Supabase credentials:

```bash
cp env.example .env
```

Edit `.env` with your Supabase project details:

```env
# MCP Provider Ports
FILES_PORT=7301
CATALOG_PORT=7302
ORDERS_PORT=7303
SHIPPING_PORT=7304

# Development Token
DEV_TOKEN=dev-tenant

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key_here

# Next.js Public Environment Variables
NEXT_PUBLIC_FILES_PORT=7301
NEXT_PUBLIC_CATALOG_PORT=7302
NEXT_PUBLIC_ORDERS_PORT=7303
NEXT_PUBLIC_SHIPPING_PORT=7304
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Supabase Storage
SUPABASE_STORAGE_BUCKET=labels
```

### 3. Database Setup

#### Option A: Using Supabase CLI (Recommended)

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push the schema
pnpm db:push
```

#### Option B: Manual SQL Execution

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Execute the SQL files in order:
   - `supabase/schema/001_core.sql`
   - `supabase/schema/002_rls.sql`
   - `supabase/seed/seed.sql`

### 4. Create Storage Bucket

In your Supabase dashboard:
1. Go to Storage
2. Create a new bucket called `labels`
3. Set it to public

### 5. Start Development

```bash
# Start all services (MCP providers + web admin)
pnpm dev:all # 또는 npm run dev:all

# Or start individually:
pnpm dev:providers  # Start MCP providers (npm run dev:providers)
pnpm dev:web        # Start Next.js app (npm run dev:web)
pnpm dev:db         # Start local Supabase (if using CLI)
```

Open http://localhost:3000 to access the web admin.

## 🔎 Health Check

- Aggregated: `curl http://localhost:3000/api/health`
- Individual services:
  - Files: `curl http://localhost:7301/health`
  - Catalog: `curl http://localhost:7302/health`
  - Orders: `curl http://localhost:7303/health`
  - Shipping: `curl http://localhost:7304/health`

## 📁 Project Structure

```
joogo-wms-oms/
├── apps/
│   └── web-admin/           # Next.js 15 web application
├── packages/
│   ├── shared/              # Zod schemas, types, utilities
│   ├── mcp-files/           # CSV processing provider
│   ├── mcp-catalog/         # Product catalog provider
│   ├── mcp-orders/          # Order management provider
│   └── mcp-shipping/        # Shipping & labels provider
├── supabase/
│   ├── schema/              # Database schema files
│   └── seed/                # Seed data
├── samples/                  # Sample CSV files
└── root config files
```

## 🔧 MCP Providers

### MCP Files (Port 7301)
- CSV template management
- CSV validation
- CSV upload to stage tables

### MCP Catalog (Port 7302)
- Product import from stage tables
- Product search and management
- Barcode lookup

### MCP Orders (Port 7303)
- Order import from stage tables
- Order listing and search
- Mock order generation for testing

### MCP Shipping (Port 7304)
- Shipment creation
- PDF label generation
- Mock printing operations

## 📊 Database Schema

### Core Tables
- `tenants` - Multi-tenant support
- `products` - Product catalog
- `orders` - Customer orders
- `order_items` - Order line items
- `shipments` - Shipping information
- `shipment_items` - Shipment contents

### Stage Tables
- `stage_products` - CSV import staging
- `stage_orders` - CSV import staging

### Operations
- `jobs` - Background job tracking

## 🔐 Security Features

- **Row Level Security (RLS)** on all tables
- **Multi-tenant isolation** via `tenant_id`
- **Service role keys** for MCP providers only
- **Bearer token authentication** for MCP APIs

## 📚 문서 운영 규칙
- **프로젝트 안내**: README.md
- **버전별 기록**: CHANGELOG.md
- **아키텍처/구조**: docs/ARCHITECTURE.md
- **로드맵**: docs/ROADMAP.md
- **운영/트러블슈팅**: docs/RUNBOOK.md

## 🧪 Testing the System

### 1. Product Import
1. Go to `/catalog`
2. Paste sample CSV content from `samples/products.csv`
3. Click "Validate" → "Upload" → "Import"

### 2. Order Import
1. Go to `/orders`
2. Paste sample CSV content from `samples/orders.csv`
3. Click "Validate" → "Upload" → "Import"

### 3. Mock Order Generation
1. Go to `/orders`
2. Click "Mock Sync (7 days)"
3. View generated orders

### 4. Shipping Labels
1. Go to `/shipping`
2. Select an order
3. Create shipment → Generate label → Print (mock)

## 🚀 Production Deployment

### Environment Variables
- Set `NODE_ENV=production`
- Use production Supabase credentials
- Configure proper CORS settings
- Set up proper logging

### Scaling
- Deploy MCP providers as separate services
- Use load balancers for MCP providers
- Implement proper health checks
- Set up monitoring and alerting

## 🛠️ Development Commands

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Formatting
pnpm format

# Building
pnpm build

# Clean
pnpm clean
```

## 📝 API Documentation

### MCP Provider Endpoints

Each MCP provider exposes:
- `GET /health` - Health check
- `GET /tools` - List available tools
- `POST /run` - Execute a tool

### Authentication
All MCP requests require:
```
Authorization: Bearer dev-tenant
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the existing issues
2. Create a new issue with detailed information
3. Include logs and error messages

## 🔮 Roadmap

- [ ] Real carrier integrations (FedEx, UPS, DHL)
- [ ] Advanced inventory management
- [ ] Barcode scanning integration
- [ ] Mobile app for warehouse operations
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Advanced user roles and permissions

