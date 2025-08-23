# Technical Design

## Assumptions
- Upload pipeline for "데이터 분석 - RawData.csv" is functional and populates facts/MVs.

## Baseline formulas
- `d_hat = avg(qty last 56d)`, `sigma = stddev(last 56d)`
- `ROP = d_hat * L + z * sigma * sqrt(L)`
- Safety stock = `z * sigma * sqrt(L)`
- ABC via cumulative share thresholds (80/15/5)
- Discontinue score = zero-sales weeks %, negative trend, margin/returns/substitution (as available)

## Recommendations
- **Reorder**: A-class, `d_hat>0`, `OnHand < ROP` → recommend qty to reach `ROP + cycle_stock` (or coverage target)
- **Discontinue**: inactive 90d & `on_hand > 0`
- **Event/Weather**: baseline uplift rules (later ML-ready)

## APIs (to implement now)
- **GET** `/api/actions/queue?tenant_id=...` → list of cards
- **POST** `/api/replenishment/simulate` → curves + recommended qty
- **POST** `/api/replenishment/approve` → returns **CSV** (PO draft) + audit
- **GET** `/api/event/plan` + **GET** `/api/weather/guard` (baseline)
- **POST** `/api/jobs/run-autopilot` (later)

## Explainability
- Return inputs `{d_hat, sigma, L, z, OnHand}`, derived `{ROP, SafetyStock}`, data-quality flags, last sale date.

## Perf
- Queue < 800ms for 10k rows, Simulate < 1.5s.



