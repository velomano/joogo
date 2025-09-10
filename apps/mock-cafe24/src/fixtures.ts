import type { Product, Order } from "./types";

// Tiny deterministic dataset for demos
// Feel free to extend later or generate on the fly.

export const products: Product[] = [
  {
    product_no: 101,
    product_code: "P000A101",
    product_name: "Airy Tee",
    retail_price: 19900,
    created_date: "2025-06-01T10:00:00+09:00",
    variants: [
      { variant_code: "A101-BLK-M", option_name: "BLACK / M", price: 19900, stock_quantity: 120 },
      { variant_code: "A101-BLK-L", option_name: "BLACK / L", price: 19900, stock_quantity: 90 }
    ],
    inventories: [
      { sku: "A101-BLK-M", location: "S1", quantity: 80 },
      { sku: "A101-BLK-L", location: "S1", quantity: 60 }
    ]
  },
  {
    product_no: 102,
    product_code: "P000A102",
    product_name: "Breeze Pants",
    retail_price: 39900,
    created_date: "2025-06-03T09:30:00+09:00",
    variants: [
      { variant_code: "A102-GRY-30", option_name: "GRAY / 30", price: 39900, stock_quantity: 70 },
      { variant_code: "A102-GRY-32", option_name: "GRAY / 32", price: 39900, stock_quantity: 55 }
    ],
    inventories: [
      { sku: "A102-GRY-30", location: "S2", quantity: 40 },
      { sku: "A102-GRY-32", location: "S2", quantity: 30 }
    ]
  }
];

export const orders: Order[] = [
  {
    order_id: "O-2025-90001",
    order_no: 90001,
    order_date: "2025-08-28T11:05:00+09:00",
    status: "PAID",
    currency: "KRW",
    lines: [
      { product_no: 101, variant_code: "A101-BLK-M", quantity: 2, unit_price: 19900 },
      { product_no: 102, variant_code: "A102-GRY-32", quantity: 1, unit_price: 39900 }
    ],
    totals: { items: 79700, shipping: 3000, discount: 0, grand_total: 82700 }
  },
  {
    order_id: "O-2025-90002",
    order_no: 90002,
    order_date: "2025-08-29T14:42:00+09:00",
    status: "SHIPPED",
    currency: "KRW",
    lines: [
      { product_no: 101, variant_code: "A101-BLK-L", quantity: 1, unit_price: 19900 }
    ],
    totals: { items: 19900, shipping: 3000, discount: 2000, grand_total: 20900 }
  }
];
