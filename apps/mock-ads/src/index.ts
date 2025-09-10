import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

app.get("/api/v1/ads/spend", (c) => {
  const points = [
    {
      ts: new Date().toISOString(),
      channel: "naver",
      campaign_id: "CAMP-001",
      impressions: 1000,
      clicks: 50,
      cost: 15000
    }
  ];
  return c.json({ points, meta: { group_by: "day", channels: ["naver", "coupang", "google", "meta"] } });
});

app.get("/api/v1/ads/campaigns", (c) => {
  const campaigns = [
    { channel: "naver", campaign_id: "CAMP-001", name: "naver-brand-core" },
    { channel: "coupang", campaign_id: "CAMP-001", name: "coupang-brand-core" }
  ];
  return c.json({ campaigns });
});

export default app;