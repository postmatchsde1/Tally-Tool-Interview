"use client";
import "../globals.css";
import React, { useState, useEffect } from "react";
import dummyData from "../../dummy-data/pre-match-dummy-data.json";
import { MatchData, Team, Player } from "../Utils/LoggerHooks";

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

    if (!isLoaded) return <div className="p-10 text-white">Loading configuration...</div>;

    return (
        <div className="min-h-screen bg-black text-white font-sans p-8 pb-32">
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Match Configuration
            </h1>

            {/* League Info */}
            <section className="bg-gray-900 p-6 rounded-2xl mb-8 border border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-gray-400">League Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">League Name</label>
                        <input
                            type="text"
                            value={data.league.leagueName}
                            onChange={(e) => updateLeague('leagueName', e.target.value)}
                            className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">Sub League / Season</label>
                        <input
                            type="text"
                            value={data.league.subLeague}
                            onChange={(e) => updateLeague('subLeague', e.target.value)}
                            className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </section>

            {/* Teams */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {data.teams.map((team, tIdx) => (
                    <section key={team.teamId} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden flex flex-col">
                        <div className="p-6 bg-gray-800 border-b border-gray-700">
                            <label className="block text-xs uppercase text-gray-500 mb-1">Team Name</label>
                            <input
                                type="text"
                                value={team.teamName}
                                onChange={(e) => updateTeamName(tIdx, e.target.value)}
                                className="w-full bg-gray-900 text-white font-black text-2xl p-2 rounded border border-transparent focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="p-2 overflow-y-auto max-h-[600px]">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-gray-900 z-10">
                                    <tr>
                                        <th className="p-3 text-xs text-gray-500 uppercase font-bold w-16">No.</th>
                                        <th className="p-3 text-xs text-gray-500 uppercase font-bold">Player Name</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {team.squad.map((player, pIdx) => (
                                        <tr key={player.playerId} className="hover:bg-gray-800/50 transition-colors">
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    value={player.jerseyNumber}
                                                    onChange={(e) => updatePlayer(tIdx, pIdx, 'jerseyNumber', parseInt(e.target.value) || 0)}
                                                    className="w-12 bg-gray-800 text-center text-white p-1 rounded focus:ring-2 ring-blue-500 outline-none font-mono"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={player.playerName}
                                                    onChange={(e) => updatePlayer(tIdx, pIdx, 'playerName', e.target.value)}
                                                    className="w-full bg-transparent text-gray-300 p-1 focus:text-white outline-none border-b border-transparent focus:border-blue-500"
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

            <div className="fixed bottom-0 left-0 w-full bg-green-900/90 text-center py-2 text-xs font-bold text-green-200 backdrop-blur">
                ALL CHANGES AUTO-SAVED TO LOCAL STORAGE
            </div>
        </div>
    );
}
