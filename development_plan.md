# Tool Phase-Wise Development Plan

## Status

- `[x]` completed
- `[~]` in progress
- `[ ]` not started

## Goal

Build the deterministic tool layer first, thoroughly test it, and only then place the AI planner/reviewer layer on top.

This plan is specifically for creating the tools themselves.

## Build Order

Recommended implementation order:

1. shared tool foundation
2. `get_user_context`
3. `search_flights`
4. `convert_currency`a
5. `get_weather`
6. `get_map_info`
7. `generate_link`
8. cross-tool hardening and evaluation

## Why This Order

- `get_user_context` and `search_flights` are the core of the product
- `convert_currency` is frequently needed for presentation
- `get_weather` and `get_map_info` enrich many travel decisions
- `generate_link` depends on stable entity/session structure

## Phase 0: Tool Capability Lock

### Objective

Finalize exactly what each tool must support before coding.

### Work

- [x] complete provider capability matrix
- [x] decide provider ownership for every output field
- [x] classify each feature as:
  - must-have
  - nice-to-have
  - deferred
- [x] lock input/output contracts for all tools

### Deliverables

- [x] final tool contracts
- [x] provider-to-tool mapping
- [x] fallback rules

### Exit Criteria

- [x] each tool has a fixed schema
- [x] each field has a known source

### Notes

- `get_user_context`: PostgreSQL-backed user profile, travel preference, masked document data, recent trips, recent chat summary
- `search_flights`: existing ownership split is Amadeus + SerpAPI with normalization/dedup/ranking in our backend
- `convert_currency`: deferred provider choice, schema locked to amount(s), source/target currency, rate timestamp, provider freshness
- `get_weather`: current reuse path is `backend/services/weather.py`
- `get_map_info`: current reuse path is `backend/services/maps.py`
- `generate_link`: internal entity-to-approved-URL generation only

## Phase 1: Shared Tool Foundation

### Objective

Build the reusable framework all tools will use.

### Work

- [x] create `BaseTool`
- [x] create `ToolResult`
- [x] create `ToolExecutionContext`
- [x] create `ToolRegistry`
- [x] create validation wrappers
- [x] create timeout/retry wrappers
- [x] create structured error model
- [x] create trace logging hooks

### Deliverables

- [x] common tool runtime
- [x] common schema package
- [x] common error handling

### Exit Criteria

- [x] any tool can be registered and executed consistently

### Implementation

- Added shared runtime under `backend/services/tools/`
- Added unit coverage for registry execution and structured validation errors

## Phase 2: `get_user_context`

### Objective

Create the safest and simplest tool first.

### Scope

This tool should read approved data from PostgreSQL and return structured user/chat context.

### Build Steps

1. [x] define approved user-context fields
2. [x] create DB models/repositories needed for profile and chat context
3. [x] create response schema
4. [x] implement repository-backed service
5. [x] wrap it as `get_user_context`
6. [x] add tests for:
   - missing profile
   - partial profile
   - recent chat summary
   - privacy filtering

### Old System Reuse

- `chat/profile_store.py`
- `chat/session_store.py`
- `chat/context_resolver.py`
- `chat/memory.py`

### Deliverables

- [x] working `get_user_context`
- [x] repository tests
- [x] tool execution tests

### Exit Criteria

- [x] tool returns only approved fields
- [x] tool behaves correctly with missing or partial data

### Implementation

- Added `backend/services/tools/get_user_context.py`
- Approved output currently includes masked document fields only; raw passport and TSA values are intentionally excluded
- Tool reads from user DB + chat DB through a repository boundary so the planner layer can call it without knowing storage details

## Phase 3: `search_flights` Foundation

### Objective

Create the most important tool as a domain engine, not a thin wrapper.

### Scope

This phase builds the base exact-search capability first.

### Build Steps

1. [x] define normalized flight schemas
2. [x] create provider adapter interfaces
3. [x] migrate/adapt existing search providers from old code
4. [x] implement provider normalization
5. [x] implement deduplication
6. [x] implement base ranking
7. [x] implement base provider coverage metadata
8. [x] wrap as `search_flights`

### Old System Reuse

- `models.py`
- `search_amadeus.py`
- `search_serpapi.py`
- `ranker.py`
- `price_confirm.py`
- `chat/search_runtime.py`

### Deliverables

- [x] exact-route exact-date flight search
- [x] multi-provider aggregation
- [x] normalized ranked results

### Exit Criteria

- [x] one request can search all configured providers
- [x] duplicates are handled
- [x] failures from one provider do not break the tool

### Implementation

- Added async tool wrapper `backend/services/tools/search_flights.py`
- Planner now calls the tool and returns the top 5 display results while preserving the full fetched ranked set for grounded follow-up questions

## Phase 4: `search_flights` Expansion

### Objective

Extend `search_flights` to support open-ended travel asks.

### Scope

This is where the tool becomes broad enough for AI-driven travel exploration.

### Build Steps

1. [x] add ranking-objective support:
   - cheapest
   - fastest
   - best overall
   - airline-first
   - convenience-first
2. [x] add `max_results`
3. [~] add airline include/exclude filters
4. [x] add nonstop/max-stops support
5. [ ] add nearby-airport expansion
6. [~] add flexible-date/date-range search
7. [~] add optional price confirmation stage
8. [x] add ranking rationale metadata

### Important Note

This phase should be split carefully because flexible dates and nearby-airport expansion can multiply API calls.

### Deliverables

- [~] advanced flight exploration
- [x] dynamic ranking support
- [x] exploration metadata

### Exit Criteria

- [~] tool can support broad prompts without changing its external contract

### Notes

- Follow-up prompts like `cheapest`, `fastest`, `nonstop`, baggage, meal, and Wi-Fi now reuse the full fetched result set instead of inventing answers
- Nearby-airport expansion and stronger flexible-date exploration still need another pass

## Phase 5: `convert_currency`

### Objective

Add reliable currency normalization and display support.

### Build Steps

1. choose currency provider
2. define conversion schema
3. implement provider adapter
4. implement caching strategy
5. implement rate timestamping
6. wrap as `convert_currency`
7. add tests for:
   - single amount
   - multiple amounts
   - unsupported currency
   - stale provider response

### Deliverables

- working `convert_currency`
- cached conversion layer

### Exit Criteria

- tool returns reproducible conversion output with timestamps

## Phase 6: `get_weather`

### Objective

Support weather-aware travel decisions.

### Build Steps

1. [x] choose weather provider
2. [x] define location resolution strategy
3. [x] support single-date weather lookup
4. [ ] support date-range weather lookup
5. [~] add travel-weather scoring
6. [x] wrap as `get_weather`
7. [ ] add tests for:
   - exact date
   - date range
   - airport-to-city resolution
   - missing forecast coverage

### Old System Reuse

- `enrich_weather.py`

### Deliverables

- [x] working `get_weather`
- [~] normalized forecast schema

### Exit Criteria

- [x] tool supports weather-informed planning output

### Implementation

- Added async tool wrapper `backend/services/tools/weather_info.py`
- Planner can fetch destination weather as part of follow-up answers without falling back to unguided chat

## Phase 7: `get_map_info`

### Objective

Support airport access and map-related travel context.

### Build Steps

1. [x] choose maps provider
2. [x] define route schema
3. [x] implement route-to-airport support
4. [x] implement airport convenience metadata if available
5. [ ] support nearby airport helper service if needed
6. [x] wrap as `get_map_info`
7. [ ] add tests for:
   - user location present
   - fallback location
   - route duration
   - suggested leave-by calculation

### Old System Reuse

- `enrich_maps.py`

### Deliverables

- [x] working `get_map_info`
- [x] route and access metadata

### Exit Criteria

- [x] tool can provide useful airport access context for travel recommendations

### Implementation

- Added async tool wrapper `backend/services/tools/map_info.py`
- Planner can answer airport-access follow-ups from structured map and convenience data

## Phase 8: `generate_link`

### Objective

Generate safe, valid product links from internal entities.

### Build Steps

1. define supported link types
2. define entity reference rules
3. create link template or signing service
4. implement validation logic
5. wrap as `generate_link`
6. add tests for:
   - valid link generation
   - invalid entity
   - expired link policy
   - signed link behavior if needed

### Deliverables

- working `generate_link`
- validated link output

### Exit Criteria

- tool returns only approved URLs and metadata

## Phase 9: Flight Enrichment Subsystems

### Objective

Add deeper optional enrichments that improve answer quality.

### Subsystems

- price confirmation
- seat map enrichment
- branded fares and baggage enrichment
- flight status enrichment

### Old System Reuse

- `price_confirm.py`
- `enrich_seatmap.py`
- `enrich_branded_fares.py`
- `enrich_flightaware.py`

### Recommendation

Treat these as internal enrichments under `search_flights`, not separate LLM-visible tools.

### Deliverables

- enrichment services integrated into the flight domain engine

### Exit Criteria

- enrichments improve result quality without changing tool surface area

## Phase 10: Cross-Tool Testing

### Objective

Prove the deterministic layer is reliable before AI orchestration begins.

### Test Types

- unit tests for every tool
- provider adapter tests with mocked responses
- schema validation tests
- fallback tests
- partial-failure tests
- latency-budget tests

### Critical Test Scenarios

- provider outage during flight search
- partial data from one provider
- flexible-date flight exploration
- nearby-airport flight exploration
- weather date comparison
- currency conversion for multiple results
- map route fallback
- user context with sparse data
- invalid link generation request

### Deliverables

- deterministic tool test suite
- stable mocked fixtures

### Exit Criteria

- tools are reliable enough that AI orchestration can trust them

## Phase 11: Tool Performance and Hardening

### Objective

Make the tool layer production-ready.

### Work

- optimize parallel provider calls
- add caching where allowed
- add circuit-breaker style protection if needed
- add per-provider metrics
- add latency tracing
- document rate-limit strategy
- add fallback behavior notes

### Deliverables

- hardened tool layer
- provider runbooks

### Exit Criteria

- tools meet acceptable latency and reliability targets

## Phase 12: Ready for AI Layer

### Objective

Freeze the deterministic tool contracts and hand them to the orchestration layer.

### Work

- [x] confirm final tool schemas
- [x] confirm tool descriptions for planner visibility
- [x] document tool selection guidance
- [x] define planner-facing capability descriptions

### Deliverables

- [x] AI-ready tool registry contracts
- [~] final tool reference doc

### Exit Criteria

- [~] planner/reviewer can now be designed against stable, proven tools

### Implementation

- Added `backend/services/ai_planner.py`
- `/api/chat` now attempts a tool-first planner pass before falling back to legacy prompt-heavy chat logic
- Frontend chat state now preserves the full fetched flight set so follow-up ranking uses the original search data, not only the visible cards

## Tool-by-Tool Summary

| Tool | Priority | Complexity | Depends On |
|---|---|---|---|
| `get_user_context` | Highest | Low to medium | PostgreSQL models, repositories |
| `search_flights` | Highest | Very high | flight providers, ranking, normalization, enrichments |
| `convert_currency` | High | Low to medium | currency provider, cache |
| `get_weather` | High | Medium | weather provider, location resolution |
| `get_map_info` | Medium | Medium | maps provider, airport metadata |
| `generate_link` | Medium | Low | entity model, link rules |

## Recommended First Coding Sprint

Start with:

1. Phase 1
2. Phase 2
3. Phase 3

That means:

- shared tool foundation
- `get_user_context`
- base `search_flights`

This is the highest-value starting point.

## Final Recommendation

We should now code the tool layer in this order:

- foundation first
- user context second
- base flight engine third
- advanced flight exploration fourth
- remaining tools after that

Once that deterministic base is solid, we move back to the AI orchestration layer.
