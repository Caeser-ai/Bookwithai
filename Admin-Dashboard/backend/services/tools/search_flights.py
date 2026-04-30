"""Async wrapper around the unified flight search domain engine."""

from __future__ import annotations

from pydantic import BaseModel, Field

from services.flight_search import UnifiedSearchParams, unified_flight_search
from services.tools.async_base import AsyncBaseTool
from services.tools.context import ToolExecutionContext


class SearchFlightsInput(BaseModel):
    origin: str
    destination: str
    departure_date: str
    return_date: str | None = None
    passengers: int = Field(default=1, ge=1, le=9)
    currency: str = "INR"
    budget: float | None = None
    cabin_class: str | None = "economy"
    ranking_goal: str | None = None
    preferred_airlines: list[str] = Field(default_factory=list)
    excluded_airlines: list[str] = Field(default_factory=list)
    meal_preference: str | None = None
    seat_preference: str | None = None
    time_window: str | None = None
    nonstop_only: bool = False
    baggage_required: bool = False
    refundable_only: bool = False
    user_lat: float | None = None
    user_lng: float | None = None
    # Number of flights to return in the compact display list.
    # Full fetched set is returned separately for follow-up reasoning.
    max_results: int = Field(default=5, ge=1, le=15)


class SearchFlightsTool(AsyncBaseTool[SearchFlightsInput]):
    name = "search_flights"
    description = "Search, normalize, enrich, and rank live flight results."
    input_model = SearchFlightsInput

    async def run(
        self,
        payload: SearchFlightsInput,
        context: ToolExecutionContext,
    ) -> dict:
        flights, search_info = await unified_flight_search(
            UnifiedSearchParams(
                origin=payload.origin,
                destination=payload.destination,
                depart_date=payload.departure_date,
                return_date=payload.return_date,
                passengers=payload.passengers,
                currency=payload.currency.upper(),
                budget=payload.budget,
                cabin=payload.cabin_class,
                preference=payload.ranking_goal,
                preferred_airlines=payload.preferred_airlines,
                excluded_airlines=payload.excluded_airlines,
                meal_preference=payload.meal_preference,
                seat_preference=payload.seat_preference,
                time_window=payload.time_window,
                nonstop_only=payload.nonstop_only,
                baggage_required=payload.baggage_required,
                refundable_only=payload.refundable_only,
                user_lat=payload.user_lat,
                user_lng=payload.user_lng,
            )
        )

        display = flights[: payload.max_results]
        return {
            # Keep full fetched records in context so follow-up prompts
            # (cheapest/expensive/latest/etc.) can reuse data without refetch.
            "flights": flights,
            "display_flights": display,
            "search_info": search_info,
            "search": {
                "origin": payload.origin,
                "destination": payload.destination,
                "departure_date": payload.departure_date,
                "return_date": payload.return_date,
                "passengers": payload.passengers,
                "currency": payload.currency.upper(),
                "cabin_class": payload.cabin_class,
                "preferred_airlines": payload.preferred_airlines,
                "excluded_airlines": payload.excluded_airlines,
                "time_window": payload.time_window,
                "nonstop_only": payload.nonstop_only,
                "baggage_required": payload.baggage_required,
                "refundable_only": payload.refundable_only,
            },
        }
