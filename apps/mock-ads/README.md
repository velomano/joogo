# Mock Ads Provider

광고비 데이터를 시뮬레이션하는 Mock API 서버

## Endpoints
- `GET /api/v1/ads/spend?start&end&group_by=hour|day&channel&campaign_id` - 광고비 데이터
- `GET /api/v1/ads/campaigns` - 캠페인 목록

## Run
```bash
pnpm -F @joogo/mock-ads dev
# -> http://127.0.0.1:8789
```
