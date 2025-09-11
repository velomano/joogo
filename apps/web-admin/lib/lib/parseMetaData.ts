// apps/web-admin/src/lib/parseMetaData.ts

export type MetaData = Record<string, unknown> & {
  selling_price?: number | null;
  price?: number | null;
  cost_price?: number | null;
};

/**
 * Safely read a numeric field from unknown JSON.
 * - Uses nullish coalescing to preserve 0 (zero)
 * - Coerces string numbers like "0" or "45000" to number
 * - Returns null when value is null/undefined or cannot be parsed.
 */
export function readNumber(meta: unknown, key: string): number | null {
  if (!meta || typeof meta !== "object") return null;
  const v = (meta as Record<string, unknown>)[key];
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace?.(/,/g, "") ?? v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Extracts prices from metaData while preserving 0.
 * Priority:
 *   selling_price ?? price  → sellingPrice
 *   cost_price              → costPrice
 */
export function parsePriceAdvanced(metaData: MetaData | null | undefined): {
  sellingPrice: number | null;
  costPrice: number | null;
} {
  const selling = (metaData?.selling_price ?? metaData?.price);
  // If selling is not null/undefined and numeric-like, convert; else try fallbacks explicitly
  let sellingPrice: number | null =
    selling !== null && selling !== undefined
      ? readNumber(metaData, "selling_price") ?? readNumber(metaData, "price")
      : readNumber(metaData, "price") ?? readNumber(metaData, "selling_price");

  const costPrice = readNumber(metaData, "cost_price");

  return { sellingPrice, costPrice };
}

/**
 * Enhanced parser that handles both metaData and originalData with fallback logic.
 * Priority: metaData first, then originalData as fallback.
 */
export function parsePriceAdvancedWithFallback(
  metaData: MetaData | null | undefined,
  originalData?: Record<string, unknown> | null
): {
  sellingPrice: number | null;
  costPrice: number | null;
} {
  // Try metaData first
  let sellingPrice = readNumber(metaData, "selling_price") ?? 
                     readNumber(metaData, "price") ?? 
                     readNumber(metaData, "판매가") ?? 
                     readNumber(metaData, "unit_price") ?? 
                     readNumber(metaData, "retail_price") ?? 
                     readNumber(metaData, "sale_price");

  // Try originalData as fallback if metaData didn't have selling price
  if (sellingPrice === null && originalData) {
    sellingPrice = readNumber(originalData, "selling_price") ?? 
                   readNumber(originalData, "price") ?? 
                   readNumber(originalData, "판매가") ?? 
                   readNumber(originalData, "unit_price") ?? 
                   readNumber(originalData, "retail_price") ?? 
                   readNumber(originalData, "sale_price");
  }

  // Cost price extraction (similar logic)
  let costPrice = readNumber(metaData, "cost_price") ?? 
                  readNumber(metaData, "원가") ?? 
                  readNumber(metaData, "purchase_price") ?? 
                  readNumber(metaData, "wholesale_price");

  // Try originalData as fallback for cost price
  if (costPrice === null && originalData) {
    costPrice = readNumber(originalData, "cost_price") ?? 
                readNumber(originalData, "원가") ?? 
                readNumber(originalData, "purchase_price") ?? 
                readNumber(originalData, "wholesale_price");
  }

  return { sellingPrice, costPrice };
}

// --- Tests (doc examples) ---
// parsePriceAdvanced({ selling_price: 0, cost_price: 0 }) -> { sellingPrice: 0, costPrice: 0 }
// parsePriceAdvanced({ selling_price: undefined, price: 1000 }) -> { sellingPrice: 1000, costPrice: null }
// parsePriceAdvanced({ selling_price: "0", cost_price: "6052" }) -> { sellingPrice: 0, costPrice: 6052 }
// parsePriceAdvanced({ price: "45,000" }) -> { sellingPrice: 45000, costPrice: null }
