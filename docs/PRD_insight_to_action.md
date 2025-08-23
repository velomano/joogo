# Insight-to-Action PRD (joogo)

## Background
Operators need decisions: when to reorder, what to discontinue, how events/weather impact demand. We standardize on a single file "데이터 분석 - RawData.csv" (wide). Ingestion & normalization are working.

## Goals
- Turn reports into **actionable recommendations** with one-click execution and explainability.

## Use cases
1) **Reorder Copilot** – recommend qty & timing to avoid stockouts.
2) **Discontinue Radar** – surface stale SKUs with drain strategies.
3) **Event Planner** – forecast uplift, needed stock & budget for promos.
4) **Weather/Seasonality Guard** – short-term signals → actionable adjustments.
5) **Autopilot rules** – guarded pre-PO drafts based on coverage thresholds.

## Data contract (post-ingestion)
- `fact.sales_daily(tenant_id, sku_id, sales_date, qty, …)`
- `fact.inventory_snapshot(tenant_id, sku_id, snapshot_date, on_hand, …)`
- `ml.v_demand_basics(tenant_id, sku_id, d_hat_56, sigma_56)`
- `fact.v_abc_recent30(tenant_id, sku_id, qty_30d, abc_class)`
- `fact.v_inactive_90(tenant_id, sku_id, on_hand, last_sale_date)`

## KPIs (initial)
- Stockout rate ↓ **30%**
- Excess inventory days ↓ **20%**
- Promo stockout rate ↓ **50%**
- Recommendation approval rate ≥ **40%**

## UX principles
- Action Queue first. Each card has clear **reason/effect/risk** + **Explain** panel and **CTAs**.

## Milestones
- **Sprint B**: Action Queue (API + minimal UI)
- **Sprint C**: Reorder simulate & approve (CSV PO draft)
- **Sprint D**: Event Planner & Weather Guard (baseline)
- **Sprint E**: Autopilot (rule-based) + audit



