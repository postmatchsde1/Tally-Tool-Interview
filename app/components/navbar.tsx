"use client";

import React from "react";
import Link from "next/link";
import { useMatchData } from "../Utils/LoggerHooks";

export default function Navbar() {
    const { matchData } = useMatchData();

    return (
        <nav className="fixed top-0 left-0 w-full h-16 bg-black border-b border-gray-800 z-50 flex items-center justify-between px-6 shadow-lg backdrop-blur-md bg-opacity-90">
            <div className="flex items-center gap-8">
                <Link href="/" className="text-xl font-black text-white tracking-tighter hover:text-blue-500 transition-colors">
                    TALLY<span className="text-blue-500">TOOL</span>
                </Link>

                <div className="h-6 w-px bg-gray-700"></div>

                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Current Match</span>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-200">
                        {matchData.teams[0]?.teamName || "Home"} <span className="text-gray-600">vs</span> {matchData.teams[1]?.teamName || "Away"}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <Link href="/information" className="text-xs font-bold text-gray-400 hover:text-white uppercase transition-colors">
                    Match Configuration
                </Link>
                <div className="px-3 py-1 bg-gray-900 rounded border border-gray-800 text-xs font-mono text-gray-400">
                    {matchData.league.leagueName}
                </div>
            </div>
        </nav>
    );
}