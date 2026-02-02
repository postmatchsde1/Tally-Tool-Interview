"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMatchData } from "../Utils/LoggerHooks";
import { MatchEvent } from "../Utils/EventFactory";

export default function Navbar() {
    const { matchData } = useMatchData();
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = () => {
        setIsDownloading(true);
        try {
            const savedConfig = localStorage.getItem("match_data_v1");
            const matchInfo = savedConfig ? JSON.parse(savedConfig) : {};

            let passingEvents: MatchEvent[] = [];
            const rawEvents = localStorage.getItem("match_events_draft_passing");
            if (rawEvents) passingEvents = JSON.parse(rawEvents);

            const payload = { matchInfo, events: passingEvents };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `MATCH_PASSING_LOG_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) { console.error(e); }
        finally { setIsDownloading(false); }
    };

    return (
        <nav className="fixed top-0 left-0 w-full h-14 bg-white border-b-2 border-black z-50 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-6">
                <Link href="/" className="text-xl font-black text-black tracking-tighter hover:opacity-75 transition-opacity">
                    TALLY<span className="text-black">TOOL</span>
                </Link>

                <div className="h-6 w-0.5 bg-black/10"></div>

                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Match</span>
                    <div className="flex items-center gap-2 text-sm font-bold text-black">
                        {matchData.teams[0]?.teamName || "Home"} <span className="text-gray-400">vs</span> {matchData.teams[1]?.teamName || "Away"}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Link href="/information" className="text-xs font-bold text-gray-500 hover:text-black uppercase transition-colors">
                    Config
                </Link>
                <div className="px-3 py-1 bg-gray-100 rounded border border-gray-200 text-xs font-mono text-gray-600 font-bold">
                    {matchData.league.leagueName}
                </div>
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="bg-black text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                    {isDownloading ? "..." : "DOWNLOAD JSON"}
                </button>
            </div>
        </nav>
    );
}