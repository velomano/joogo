// Deterministic realtime simulation for Cafe24-like orders/inventory
// No external deps; reproducible via seed + time window.

import { orders as FIX_ORDERS, products as FIX_PRODUCTS } from "./fixtures";
import type { Order, Product } from "./types";

const MS_PER_MIN = 60_000;

// Simple seeded PRNG (xmur3 -> mulberry32)
function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seeded(seed: string) {
  const h = xmur3(seed)();
  return mulberry32(h);
}

// Poisson via thinning (expect small lambda per minute)
function poisson(lambda: number, rng: () => number) {
  const L = Math.exp(-lambda);
  let p = 1.0;
  let k = 0;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

export type SimConfig = {
  seed: string;
  startMs: number;
  nowMs: number;
  lambdaPerHour: number;
};

type SoldLine = { sku: string; qty: number };

function pickOne<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function nextOrderNo(base = 91000, idx = 0) {
  return base + idx;
}

function genOrdersWindow(cfg: SimConfig): Order[] {
  // Minute-level process, Poisson arrivals per minute
  const rng0 = seeded(cfg.seed);
  const lambdaPerMin = cfg.lambdaPerHour / 60;
  const startMin = Math.floor(cfg.startMs / MS_PER_MIN);
  const endMin = Math.floor(cfg.nowMs / MS_PER_MIN);
  const products = FIX_PRODUCTS;

  const orders: Order[] = [];
  let ordinal = 0;

  for (let m = startMin; m <= endMin; m++) {
    // Derive per-minute RNG from seed + minute index (stable)
    const rng = seeded(`${cfg.seed}:${m}`);
    const arrivals = poisson(lambdaPerMin, rng);
    for (let i = 0; i < arrivals; i++) {
      const p = pickOne(products, rng);
      // 1~2 lines
      const multi = rng() < 0.25 ? 2 : 1;
      const lines = [];
      for (let j = 0; j < multi; j++) {
        const v = p.variants.length ? pickOne(p.variants, rng) : null;
        const qty = 1 + Math.floor(rng() * 2); // 1~2
        const unit = v ? v.price : p.retail_price;
        lines.push({
          product_no: p.product_no,
          variant_code: v ? v.variant_code : undefined,
          quantity: qty,
          unit_price: unit,
        });
      }
      const items = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
      const shipping = items >= 50_000 ? 0 : 3000;
      const discount = rng() < 0.1 ? Math.floor(items * 0.05) : 0;
      const total = items + shipping - discount;
      const ts = new Date(m * MS_PER_MIN + Math.floor(rng() * MS_PER_MIN)).toISOString();
      const statuses: Order["status"][] = ["PAID", "SHIPPED", "DELIVERED"];
      const status = statuses[Math.floor(rng() * statuses.length)];

      orders.push({
        order_id: `O-${ts}-${ordinal}`,
        order_no: nextOrderNo(91000, ordinal),
        order_date: ts,
        status,
        currency: "KRW",
        lines,
        totals: { items, shipping, discount, grand_total: total },
      });
      ordinal++;
    }
  }
  return orders;
}

function sumSoldSince(orders: Order[]): Record<string, number> {
  const sold: Record<string, number> = {};
  for (const o of orders) {
    if (o.status === "CANCELLED" || o.status === "REFUNDED") continue;
    for (const l of o.lines) {
      const key = l.variant_code ?? `P${l.product_no}`;
      sold[key] = (sold[key] ?? 0) + l.quantity;
    }
  }
  return sold;
}

export function getSimulatedOrders(sinceIso?: string, untilIso?: string, cfgEnv?: Partial<SimConfig>): Order[] {
  const envCfg: SimConfig = {
    seed: (cfgEnv?.seed ?? "joogo-mock-seed") as string,
    startMs: Date.parse(cfgEnv?.startMs ? String(cfgEnv.startMs) : (process.env.SIM_START_ISO as string) || "2025-08-28T00:00:00+09:00"),
    nowMs: Date.now(),
    lambdaPerHour: Number(process.env.SIM_ORDERS_PER_HOUR || 12),
  };
  const startMs = sinceIso ? Date.parse(sinceIso) : envCfg.startMs;
  const endMs = untilIso ? Date.parse(untilIso) : envCfg.nowMs;
  return genOrdersWindow({ ...envCfg, startMs, nowMs: endMs });
}

export function getDynamicProducts(orders: Order[]): Product[] {
  const sold = sumSoldSince(orders);
  // Deep copy products and decrement inventory quantities
  return FIX_PRODUCTS.map((p) => {
    const cloned = JSON.parse(JSON.stringify(p)) as Product;
    for (const v of cloned.variants) {
      const key = v.variant_code;
      if (key && sold[key]) {
        v.stock_quantity = Math.max(0, v.stock_quantity - sold[key]);
        // reflect inventories too
        const inv = cloned.inventories.find((i) => i.sku === key);
        if (inv) inv.quantity = Math.max(0, inv.quantity - sold[key]);
      }
    }
    return cloned;
  });
}

// Legacy fallback for one-shot fixtures
export const FIXTURE_ORDERS = FIX_ORDERS;
export const FIXTURE_PRODUCTS = FIX_PRODUCTS;
