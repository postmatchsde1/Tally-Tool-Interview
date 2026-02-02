"use client";

import "../globals.css";
import React, { useState, useEffect } from "react";
import dummyData from "../../dummy-data/pre-match-dummy-data.json";
import { MatchData, Team, Player } from "../Utils/LoggerHooks";
import Navbar from "../components/navbar";

export default function InformationPage() {
    const [data, setData] = useState<MatchData>(dummyData as any);
    const [isLoaded, setIsLoaded] = useState(false);

    // Bootstrap & Hydrate
    useEffect(() => {
        const saved = localStorage.getItem("match_data_v1");
        if (saved) {
            try {
                setData(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved match data", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Live Save
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("match_data_v1", JSON.stringify(data));
        }
    }, [data, isLoaded]);

    const updateLeague = (field: keyof MatchData['league'], value: string) => {
        setData(prev => ({
            ...prev,
            league: { ...prev.league, [field]: value }
        }));
    };

    const updateTeamName = (teamIndex: number, name: string) => {
        const newTeams = [...data.teams];
        newTeams[teamIndex] = { ...newTeams[teamIndex], teamName: name };
        setData(prev => ({ ...prev, teams: newTeams }));
    };

    const updatePlayer = (teamIndex: number, playerIndex: number, field: keyof Player, value: any) => {
        const newTeams = [...data.teams];
        const newSquad = [...newTeams[teamIndex].squad];
        newSquad[playerIndex] = { ...newSquad[playerIndex], [field]: value };
        newTeams[teamIndex] = { ...newTeams[teamIndex], squad: newSquad };
        setData(prev => ({ ...prev, teams: newTeams }));
    };

    if (!isLoaded) return <div className="p-10 text-gray-500 font-medium">Loading configuration...</div>;

    return (
        <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-14 pb-32">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Match Configuration</h1>
                        <p className="text-gray-500 mt-1">Live editing enabled. All changes are auto-saved locally.</p>
                    </div>
                    <div className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        AUTO-SAVE ACTIVE
                    </div>
                </div>

                {/* League Info */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                        League Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group">
                            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">League Name</label>
                            <input
                                type="text"
                                value={data.league.leagueName}
                                onChange={(e) => updateLeague('leagueName', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-bold text-gray-800"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">Sub League / Season</label>
                            <input
                                type="text"
                                value={data.league.subLeague}
                                onChange={(e) => updateLeague('subLeague', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-bold text-gray-800"
                            />
                        </div>
                    </div>
                </section>

                {/* Teams Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {data.teams.map((team, tIdx) => (
                        <section key={team.teamId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[800px]">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className={`w-1 h-6 rounded-full ${tIdx === 0 ? 'bg-indigo-600' : 'bg-rose-600'}`}></span>
                                    {tIdx === 0 ? 'Home Team' : 'Away Team'}
                                </h2>
                                <div className="group">
                                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider group-focus-within:text-black transition-colors">Team Name</label>
                                    <input
                                        type="text"
                                        value={team.teamName}
                                        onChange={(e) => updateTeamName(tIdx, e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-bold text-xl text-gray-900"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-gray-200">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20 text-center">No.</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Player Name</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {team.squad.map((player, pIdx) => (
                                            <tr key={player.playerId} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-4 py-2 text-center">
                                                    <input
                                                        type="number"
                                                        value={player.jerseyNumber}
                                                        onChange={(e) => updatePlayer(tIdx, pIdx, 'jerseyNumber', parseInt(e.target.value) || 0)}
                                                        className="w-12 bg-gray-100 text-center text-gray-900 p-1 rounded focus:bg-white focus:ring-2 ring-indigo-200 outline-none font-bold border border-transparent focus:border-indigo-300"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={player.playerName}
                                                        onChange={(e) => updatePlayer(tIdx, pIdx, 'playerName', e.target.value)}
                                                        className="w-full bg-transparent text-gray-700 p-1 focus:bg-white focus:ring-2 ring-indigo-200 rounded px-2 outline-none font-medium transition-all"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ))}
                </div>
            </main>
        </div>
    );
}
