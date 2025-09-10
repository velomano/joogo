import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

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
    }
  ];
  return c.json({ hourly });
});

export default app;