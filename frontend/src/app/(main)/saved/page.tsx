"use client";

import { useState } from "react";
import { Bookmark, TrendingDown, TrendingUp, Heart } from "lucide-react";

// const savedFlights = [
//     {
//         id: 1,
//         route: "Delhi → Dubai",
//         airline: "Air India",
//         price: "₹18,450",
//         originalPrice: "₹21,200",
//         date: "Dec 20, 2024",
//         time: "07:30 - 10:10",
//         duration: "4h 40m",
//         stops: 0,
//         priceChange: "-12%",
//         trend: "down",
//         saved: true,
//     },
//     {
//         id: 2,
//         route: "Mumbai → London",
//         airline: "British Airways",
//         price: "₹45,600",
//         originalPrice: "₹42,000",
//         date: "Jan 5, 2025",
//         time: "14:20 - 19:45",
//         duration: "9h 25m",
//         stops: 0,
//         priceChange: "+8%",
//         trend: "up",
//         saved: true,
//     },
//     {
//         id: 3,
//         route: "Bangalore → Singapore",
//         airline: "Singapore Airlines",
//         price: "₹12,800",
//         originalPrice: "₹14,200",
//         date: "Feb 10, 2025",
//         time: "06:00 - 14:30",
//         duration: "5h 30m",
//         stops: 0,
//         priceChange: "-10%",
//         trend: "down",
//         saved: true,
//     },
//     {
//         id: 4,
//         route: "Delhi → Tokyo",
//         airline: "ANA",
//         price: "₹38,900",
//         originalPrice: "₹38,900",
//         date: "Mar 15, 2025",
//         time: "23:15 - 11:30+1",
//         duration: "7h 15m",
//         stops: 0,
//         priceChange: "0%",
//         trend: "stable",
//         saved: true,
//     },
// ];

type SavedFlight = {
    id: number;
    route: string;
    airline: string;
    price: string;
    originalPrice: string;
    date: string;
    time: string;
    duration: string;
    stops: number;
    priceChange: string;
    trend: "down" | "up" | "stable" | string;
    saved: boolean;
};

export default function SavedFlightsPage() {
    const [flights, setFlights] = useState<SavedFlight[]>([]);

    const toggleSave = (id: number) => {
        setFlights(flights.map(f => f.id === id ? { ...f, saved: !f.saved } : f));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9]">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-8">
                <div style={{ animation: "fadeIn 0.5s ease-out" }}>
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center">
                            <Bookmark className="w-5 h-5 text-[#1D4ED8]" />
                        </div>
                        <h1 className="text-[#0A2140]" style={{ fontSize: "24px", fontWeight: "700" }}>
                            Saved Flights
                        </h1>
                    </div>
                    <p className="text-[#6B7280] text-sm sm:text-base mb-6 sm:mb-8 sm:ml-[52px]">
                        Track price changes on your saved flights
                    </p>

                    {/* Saved Flights */}
                    <div className="space-y-3">
                        {flights.map((flight, idx) => (
                            <div
                                key={flight.id}
                                className="bg-white rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] transition-all p-4 sm:p-5 animate-slide-up"
                                style={{ animationDelay: `${idx * 0.1}s` }}
                            >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                        <h3 className="text-[#0A2140] mb-1" style={{ fontSize: "16px", fontWeight: "600" }}>
                                            {flight.route}
                                        </h3>
                                        <p className="text-[#6B7280] text-sm">
                                            {flight.airline} • {flight.date}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => toggleSave(flight.id)}
                                        className={`p-2 rounded-lg transition-colors cursor-pointer border-none ${flight.saved ? "bg-[#FEF2F2] text-[#EF4444]" : "bg-[#F3F4F6] text-[#9CA3AF]"
                                            }`}
                                    >
                                        <Heart className={`w-5 h-5 ${flight.saved ? "fill-current" : ""}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <div className="flex items-center gap-4 sm:gap-6 text-sm">
                                        <div>
                                            <p className="text-[#6B7280] text-xs mb-0.5">Time</p>
                                            <p className="text-[#374151]" style={{ fontWeight: "500" }}>{flight.time}</p>
                                        </div>
                                        <div>
                                            <p className="text-[#6B7280] text-xs mb-0.5">Duration</p>
                                            <p className="text-[#374151]" style={{ fontWeight: "500" }}>{flight.duration}</p>
                                        </div>
                                        <div>
                                            <p className="text-[#6B7280] text-xs mb-0.5">Stops</p>
                                            <p className="text-[#374151]" style={{ fontWeight: "500" }}>{flight.stops === 0 ? "Non-stop" : `${flight.stops} stop`}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-[#0A2140]" style={{ fontSize: "18px", fontWeight: "600" }}>
                                                {flight.price}
                                            </p>
                                            {flight.originalPrice !== flight.price && (
                                                <p className="text-[#9CA3AF] text-xs line-through">{flight.originalPrice}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {flight.trend === "down" ? (
                                                <TrendingDown className="w-4 h-4 text-[#10B981]" />
                                            ) : flight.trend === "up" ? (
                                                <TrendingUp className="w-4 h-4 text-[#EF4444]" />
                                            ) : null}
                                            <span
                                                className={`text-xs font-medium ${flight.trend === "down" ? "text-[#10B981]" : flight.trend === "up" ? "text-[#EF4444]" : "text-[#6B7280]"
                                                    }`}
                                            >
                                                {flight.priceChange}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
