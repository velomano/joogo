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
    orders: "/api/v2/admin/orders",
    ads: "/api/v1/ads/spend",
    weather: "/api/v1/weather/hourly"
  }
}));

// Health
app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

// Cafe24 Products
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

// Cafe24 Orders
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

// Mock Ads (통합)
app.get("/api/v1/ads/spend", (c) => {
  const points = [
    {
      ts: new Date().toISOString(),
      channel: "naver",
      campaign_id: "CAMP-001",
      impressions: 1000,
      clicks: 50,
      cost: 15000
    },
    {
      ts: new Date(Date.now() - 3600000).toISOString(),
      channel: "coupang",
      campaign_id: "CAMP-002",
      impressions: 800,
      clicks: 40,
      cost: 12000
    }
  ];
  return c.json({ points, meta: { group_by: "day", channels: ["naver", "coupang", "google", "meta"] } });
});

// Mock Weather (통합)
app.get("/api/v1/weather/hourly", (c) => {
  const loc = c.req.query("location") || "Seoul";
  const hourly = [
    {
      ts: new Date().toISOString(),
      location: loc,
      temp_c: 22,
      humidity: 65,
      rain_mm: 0,
      wind_mps: 2.5
    },
    {
      ts: new Date(Date.now() - 3600000).toISOString(),
      location: loc,
      temp_c: 20,
      humidity: 70,
      rain_mm: 2,
      wind_mps: 3.1
    }
  ];
  return c.json({ hourly });
});

export default app;