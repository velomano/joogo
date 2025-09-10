export const runtime = "edge";
import { supa } from "../../../lib/db";

export async function GET(req: Request) {
  const client = supa();
  
  const [salesResult, adsResult, weatherResult] = await Promise.all([
    client.from("analytics.fact_sales_hourly").select("order_hour").order("order_hour", { ascending: false }).limit(1),
    client.from("analytics.marketing_ad_spend").select("ts").order("ts", { ascending: false }).limit(1),
    client.from("analytics.weather_hourly").select("ts").order("ts", { ascending: false }).limit(1)
  ]);

  return new Response(JSON.stringify({
    last_sales: salesResult.data?.[0]?.order_hour ?? null,
    last_ads: adsResult.data?.[0]?.ts ?? null,
    last_weather: weatherResult.data?.[0]?.ts ?? null
  }), { headers: { "content-type": "application/json" }});
}