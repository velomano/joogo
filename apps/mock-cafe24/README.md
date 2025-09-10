# Mock Cafe24 Provider

Cafe24 Admin API-like mock server for Joogo development.

## Run locally
```bash
pnpm --filter @joogo/mock-cafe24 install
pnpm --filter @joogo/mock-cafe24 dev
# -> http://127.0.0.1:8787
curl http://127.0.0.1:8787/health
curl "http://127.0.0.1:8787/api/v2/admin/products?limit=1&embed=variants,inventories"
```

## Endpoints

- `GET /` - 서비스 정보 및 엔드포인트 목록
- `GET /health` - 헬스체크
- `GET /api/v2/admin/products?limit&offset&fields&embed=variants,inventories` - 상품 목록
- `GET /api/v2/admin/products/:product_no?embed=...` - 상품 상세
- `GET /api/v2/admin/orders?limit&offset&fields=...` - 주문 목록
- `GET /api/v2/admin/orders/:order_no` - 주문 상세
