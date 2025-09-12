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
  const from = c.req.query("from") || "2025-01-01";
  const to = c.req.query("to") || "2025-01-07";
  const channel = c.req.query("channel");
  
  const start = new Date(from);
  const end = new Date(to);
  const days = Math.ceil((+end - +start) / 86400000) + 1;
  
  const channels = channel ? [channel] : ["naver", "coupang", "google", "meta"];
  const points = [];
  
  // 시드 기반 랜덤 생성기
  function seedRand(seed: number) {
    let s = seed;
    return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  }
  
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(+start + i * 86400000);
    const dateStr = currentDate.toISOString();
    
    for (const ch of channels) {
      const rng = seedRand(i * 1000 + ch.charCodeAt(0));
      
      // 채널별 기본 광고비
      const baseCosts = {
        'naver': 150000,
        'coupang': 200000,
        'google': 300000,
        'meta': 100000
      };
      
      const baseCost = baseCosts[ch as keyof typeof baseCosts] || 150000;
      const randomFactor = 0.7 + rng() * 0.6; // 0.7 ~ 1.3
      const cost = Math.round(baseCost * randomFactor);
      
      // 노출수, 클릭수 계산
      const impressions = Math.round(cost * (80 + rng() * 40)); // 80-120 per 1원
      const ctr = 0.01 + rng() * 0.02; // 1-3% CTR
      const clicks = Math.round(impressions * ctr);
      
      points.push({
        ts: dateStr,
        channel: ch,
        campaign_id: `CAMP-${String(i % 3 + 1).padStart(3, '0')}`,
        impressions,
        clicks,
        cost
      });
    }
  }
  
  return c.json({ points, meta: { group_by: "day", channels } });
});

// Mock Sales API
app.get("/api/sales", (c) => {
  const from = c.req.query("from") || "2025-01-01";
  const to = c.req.query("to") || "2025-01-07";
  const granularity = c.req.query("g") || "day";
  
  const start = new Date(from);
  const end = new Date(to);
  const days = Math.ceil((+end - +start) / 86400000) + 1;
  
  const salesData = [];
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(+start + i * 86400000);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // 시드 기반 랜덤 생성기 (일관된 데이터를 위해)
    function seedRand(seed: number) {
      let s = seed;
      return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
    }
    
    const rng = seedRand(i * 1000);
    const baseRevenue = 1000000; // 100만원 기본값
    const variation = 0.5 + rng() * 1.0; // 0.5 ~ 1.5 배
    const revenue = Math.round(baseRevenue * variation);
    
    salesData.push({
      ts: dateStr,
      value: revenue
    });
  }
  
  return c.json(salesData);
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