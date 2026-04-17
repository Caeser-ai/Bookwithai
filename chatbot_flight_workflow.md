# Flight Chatbot Workflow

This bot is now flight-focused. It should answer from existing history/tool data first, and call fresh search tools only when required.

## 1) Incoming Message

1. Receive user message + chat history + `recent_flights` from frontend.
2. Build/resolve session and user context.

## 2) Planner-First Pass

File: `backend/services/ai_planner.py`

1. Try `plan_chat_response(...)`.
2. If `recent_flights` exists, prefer reusing them:
   - compare options
   - cheapest/fastest/nonstop
   - baggage/meal/wifi filters
   - airline include/exclude filters
   - currency conversion (tool call is allowed; no fresh flight search)
   - weather/map follow-ups based on the selected route
3. Only call `search_flights` when user asks for a new search (new route/date/passenger context).

## 3) Route-Level Flight Boundary

File: `backend/api/routes.py`

If planner returns no response:

1. Try direct shortcuts:
   - weather query
   - map/directions query
   - flight status query
2. If message is not flight-domain, return boundary response:
   - "I currently handle only flight-related help..."
3. Do not continue to open-domain chat behavior.

## 4) Flight Search Path

When search is required:

1. Parse intent (`parse_flight_search_intent`).
2. Validate sufficiency (origin, destination, trip type, departure date).
3. Execute `search_flights` via deterministic tool layer.
4. Normalize + rank + enrich + return top display flights.
5. Keep full fetched set in `all_flights` for follow-up reuse.

## 5) Follow-Up Reuse Policy (Important)

Default policy:

- If user asks about current options, do **not** call fresh search.
- Reuse `recent_flights` / `all_flights` and answer directly.
- Fresh search is only for explicit new search intent.

## 6) Key Files to Modify

- `backend/api/routes.py` -> boundary + route orchestration
- `backend/services/ai_planner.py` -> reuse-first planning logic
- `backend/services/tools/search_flights.py` -> search tool schema
- `backend/services/flight_search.py` -> ranking/filter/enrichment engine
- `backend/services/flight_ai.py` -> intent parsing and legacy chat behavior

## 7) Quick Change Ideas

- Tighten/loosen flight-domain regex in `routes.py`.
- Add more follow-up filters in `ai_planner.py` (aircraft type, departure window, refundable-only, etc.).
- Add structured debug flags in planner response (example: `reused_recent_results=true`).
