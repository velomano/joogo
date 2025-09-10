import { Hono } from "hono";
import { orders, products } from "./fixtures";
import { PageParams } from "./types";
import { applyFields, slice } from "./utils";

const app = new Hono();

// Root
app.get("/", (c) => c.json({ 
  service: "Mock Cafe24 Provider", 
  version: "0.1.0",
  endpoints: {
    health: "/health",
    products: "/api/v2/admin/products",
    orders: "/api/v2/admin/orders"
  }
}));

// Health
app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

// Cafe24-like Admin endpoints (subset)

// GET /api/v2/admin/products
app.get("/api/v2/admin/products", (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const embed = c.req.query("embed") || "";
    const fields = c.req.query("fields");
    
    const base = embed.includes("variants") || embed.includes("inventories")
      ? products
      : products.map(p => ({ ...p, variants: [], inventories: [] }));
    const paged = slice(base, limit, offset);
    const data = applyFields(paged as any[], fields);
    return c.json({ products: data, pagination: { limit, offset, total: products.length } });
  } catch (error) {
    console.error("Products endpoint error:", error);
    return c.json({ error: "Invalid parameters" }, 400);
  }
});

// GET /api/v2/admin/products/:product_no
app.get("/api/v2/admin/products/:product_no", (c) => {
  try {
    const query = Object.fromEntries(c.req.query());
    const qp = PageParams.parse(query);
    const id = Number(c.req.param("product_no"));
    const found = products.find(p => p.product_no === id);
    if (!found) return c.json({ error: "not_found" }, 404);
    const embed = qp.embed?.split(",") ?? [];
    const dto = {
      ...found,
      variants: embed.includes("variants") ? found.variants : [],
      inventories: embed.includes("inventories") ? found.inventories : []
    };
    return c.json({ product: dto });
  } catch (error) {
    console.error("Product detail endpoint error:", error);
    return c.json({ error: "Invalid parameters" }, 400);
  }
});

// GET /api/v2/admin/orders
app.get("/api/v2/admin/orders", (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const fields = c.req.query("fields");
    
    const paged = slice(orders, limit, offset);
    const data = applyFields(paged as any[], fields);
    return c.json({ orders: data, pagination: { limit, offset, total: orders.length } });
  } catch (error) {
    console.error("Orders endpoint error:", error);
    return c.json({ error: "Invalid parameters" }, 400);
  }
});

// GET /api/v2/admin/orders/:order_no
app.get("/api/v2/admin/orders/:order_no", (c) => {
  try {
    const id = Number(c.req.param("order_no"));
    const found = orders.find(o => o.order_no === id);
    if (!found) return c.json({ error: "not_found" }, 404);
    return c.json({ order: found });
  } catch (error) {
    console.error("Order detail endpoint error:", error);
    return c.json({ error: "Invalid parameters" }, 400);
  }
});

export default app;
