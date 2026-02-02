"use client";

import React, { useState, useMemo } from "react";
import { createPassEvent, MatchEvent } from "../Utils/EventFactory";
import { useVideoTime, useMatchData, useDraftEvents } from "../Utils/LoggerHooks";

// --- Types ---
type PassLength = "LONG" | "SHORT";
type PassResult = "SUCCESSFUL" | "UNSUCCESSFUL";
type PassCategory = "NORMAL" | "PROGRESSIVE" | "CROSS" | "ASSIST";
type PassFailureType = "OFFSIDE" | "BLOCK" | "INTERCEPTION" | "BALL_COLLECTION" | "UNSUCCESSFUL_CROSS" | "TACKLE" | "CLEARANCE";

export default function Passing() {
    // --- Global Hooks ---
    const { getCurrentVideoTime } = useVideoTime();
    const { matchData, getTeam } = useMatchData();
    const { events, setEvents } = useDraftEvents<MatchEvent>("match_events_draft_passing");

    // --- State: Progression ---
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [fromPlayerId, setFromPlayerId] = useState<string | null>(null);

    // Step 1: Basic Attributes
    const [passLength, setPassLength] = useState<PassLength | null>(null);
    const [passResult, setPassResult] = useState<PassResult | null>(null);

    // Step 2A: Successful Flow
    const [toPlayerId, setToPlayerId] = useState<string | null>(null);
    const [passCategory, setPassCategory] = useState<PassCategory | null>(null);

    // Success Details
    const [isOutplaying, setIsOutplaying] = useState<boolean | null>(null);
    const [outplayPlayers, setOutplayPlayers] = useState<number>(0);
    const [outplayLines, setOutplayLines] = useState<number>(0);
    const [isKeyPass, setIsKeyPass] = useState<boolean | null>(null);

    // Step 2B: Unsuccessful Flow
    const [passFailureType, setPassFailureType] = useState<PassFailureType | null>(null);
    const [opponentPlayerId, setOpponentPlayerId] = useState<string | null>(null);

    // Unsuccessful Details
    const [isHighPress, setIsHighPress] = useState<boolean | null>(null);
    const [isBallRecovery, setIsBallRecovery] = useState<boolean | null>(null);

    // --- Helpers ---
    const opponentTeam = useMemo(() => {
        if (!selectedTeamId || !matchData.teams) return null;
        return matchData.teams.find(t => t.teamId !== selectedTeamId) || null;
    }, [selectedTeamId, matchData.teams]);

    const resetFlow = () => {
        setFromPlayerId(null);
        setPassLength(null);
        setPassResult(null);
        setToPlayerId(null);
        setPassCategory(null);
        setIsOutplaying(null);
        setOutplayPlayers(0);
        setOutplayLines(0);
        setIsKeyPass(null);
        setPassFailureType(null);
        setOpponentPlayerId(null);
        setIsHighPress(null);
        setIsBallRecovery(null);
    };

    const fullReset = () => {
        setSelectedTeamId(null);
        resetFlow();
    };

    // --- Submit Logic (Unchanged Logic, purely styling updates) ---
    const handleSubmit = (overrides?: any) => {
        if (!selectedTeamId || !fromPlayerId || !passLength || !passResult) return;

        const basePayload = {
            passLength,
            passResult,
            toPlayerId: overrides?.toPlayerId ?? toPlayerId,
            opponentPlayerId: overrides?.opponentPlayerId ?? opponentPlayerId,
        };

        // Populate Success Args
        let successArgs = {};
        if (passResult === 'SUCCESSFUL') {
            const cat = overrides?.passCategory ?? passCategory ?? 'NORMAL';
            successArgs = {
                isProgressive: cat === 'PROGRESSIVE',
                isCross: cat === 'CROSS',
                isAssist: cat === 'ASSIST',
                isKeyPass: overrides?.isKeyPass ?? isKeyPass ?? false,
                outplay: overrides?.isOutplaying ?? isOutplaying ?? false,
                outplayPlayers: overrides?.outplayPlayers ?? outplayPlayers,
                outplayLines: overrides?.outplayLines ?? outplayLines
            };
        }

        // Populate Failure Args
        let failureArgs = {};
        if (passResult === 'UNSUCCESSFUL') {
            const failType = overrides?.passFailureType ?? passFailureType;
            failureArgs = {
                passFailureType: failType,
                highPress: overrides?.isHighPress ?? isHighPress ?? false,
                ballRecovery: (overrides?.isBallRecovery ?? isBallRecovery) ? 'SUCCESSFUL' : 'UNSUCCESSFUL'
            };
        }

        const newEvent = createPassEvent(
            selectedTeamId,
            fromPlayerId,
            getCurrentVideoTime(),
            {
                ...basePayload,
                ...successArgs,
                ...failureArgs
            } as any
        );

        setEvents([...events, newEvent]);
        resetFlow();
    };


    // --- Renderers ---

    // Colorful Button Helper
    const ChoiceBtn = ({ label, onClick, className = "", subLabel = "", active = false, color = "blue" }: any) => {
        const baseColors: any = {
            blue: "bg-white text-blue-900 border-blue-100 hover:bg-blue-50 hover:border-blue-300",
            green: "bg-white text-green-800 border-green-100 hover:bg-green-50 hover:border-green-300",
            red: "bg-white text-red-800 border-red-100 hover:bg-red-50 hover:border-red-300",
            purple: "bg-white text-purple-800 border-purple-100 hover:bg-purple-50 hover:border-purple-300",
            dark: "bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
        };

        const activeColors: any = {
            blue: "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200",
            green: "bg-green-600 text-white border-green-600 ring-2 ring-green-200",
            red: "bg-red-600 text-white border-red-600 ring-2 ring-red-200",
            purple: "bg-purple-600 text-white border-purple-600 ring-2 ring-purple-200",
            dark: "bg-slate-800 text-white border-slate-800 ring-2 ring-slate-200"
        };

        return (
            <button
                onClick={onClick}
                className={`py-3 px-2 rounded-xl border-2 font-black text-xs sm:text-sm active:scale-95 transition-all flex flex-col items-center justify-center uppercase tracking-wide shadow-sm
                ${active ? activeColors[color] : baseColors[color]} ${className}`}
            >
                <span>{label}</span>
                {subLabel && <span className={`text-[9px] font-normal mt-0.5 normal-case ${active ? 'text-white/80' : 'text-gray-400'}`}>{subLabel}</span>}
            </button>
        );
    };

    // Compact Player Grid - heavily inspired by ChancesCreated reference
    const renderPlayerGrid = (teamId: string, onSelect: (id: string) => void, excludeId?: string | null, activeId?: string | null) => {
        const team = getTeam(teamId);
        if (!team) return null;
        return (
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 p-1">
                {team.squad.map(p => (
                    <button
                        key={p.playerId}
                        onClick={() => onSelect(p.playerId)}
                        disabled={p.playerId === excludeId}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center border transition-all shadow-sm
                            ${p.playerId === activeId
                                ? 'bg-indigo-600 text-white border-indigo-600 scale-105 z-10'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:shadow-md'
                            }
                            ${p.playerId === excludeId ? 'opacity-20 cursor-not-allowed bg-slate-50 border-transparent shadow-none' : ''}
                        `}
                    >
                        <span className="text-xs font-bold">{p.jerseyNumber}</span>
                    </button>
                ))}
            </div>
        );
    };

    // --- Main View ---
    return (
        <div className="flex flex-col h-full bg-slate-50 pb-10">

            {/* HEADER */}
            <div className="bg-white px-4 py-3 flex justify-between items-center z-10 sticky top-0 mx-4 mt-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Passing Logger</h2>
                </div>
                {(selectedTeamId || fromPlayerId) ? (
                    <button onClick={fullReset} className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100">
                        RESET
                    </button>
                ) : <span className="text-[10px] text-slate-400 font-medium">Ready</span>}
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 content-center">
                <div className="max-w-2xl mx-auto w-full">

                    {/* 0. TEAM SELECTION */}
                    {!selectedTeamId && (
                        <div className="grid grid-cols-2 gap-4 animate-in zoom-in-95 duration-200">
                            {matchData.teams.map((t, idx) => (
                                <button
                                    key={t.teamId}
                                    onClick={() => setSelectedTeamId(t.teamId)}
                                    className={`py-12 rounded-2xl border-2 bg-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all group flex flex-col items-center justify-center gap-3
                                        ${idx === 0 ? 'border-primary-100 hover:border-indigo-500' : 'border-rose-100 hover:border-rose-500'}
                                    `}
                                >
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-2
                                        ${idx === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}
                                    `}>
                                        {t.teamName.substr(0, 1)}
                                    </div>
                                    <div className="text-2xl font-black text-slate-800 uppercase tracking-tight">{t.teamName}</div>
                                    <div className="text-[10px] font-bold tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full group-hover:bg-slate-800 group-hover:text-white transition-colors">SELECT</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 1. PASSER SELECTION */}
                    {selectedTeamId && !fromPlayerId && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xl">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 text-center tracking-widest">Who is passing?</h3>
                                {renderPlayerGrid(selectedTeamId, setFromPlayerId)}
                            </div>
                        </div>
                    )}

                    {/* 2. FLOW WIZARD */}
                    {selectedTeamId && fromPlayerId && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">

                            {/* Context Bar */}
                            <div className="bg-white p-3 rounded-xl flex items-center justify-between border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-200">
                                        {getTeam(selectedTeamId)?.squad.find(p => p.playerId === fromPlayerId)?.jerseyNumber}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Passer</span>
                                        <span className="text-sm font-bold text-slate-800 truncate max-w-[120px]">{getTeam(selectedTeamId)?.squad.find(p => p.playerId === fromPlayerId)?.playerName}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {passLength && <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200">{passLength}</span>}
                                    {passResult === 'SUCCESSFUL' && <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-[10px] font-bold border border-green-100">SUCCESS</span>}
                                    {passResult === 'UNSUCCESSFUL' && <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-md text-[10px] font-bold border border-red-100">FAIL</span>}
                                </div>
                            </div>

                            {/* 2.1 Pass Length */}
                            {!passLength && (
                                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2">
                                    <ChoiceBtn label="SHORT PASS" onClick={() => setPassLength('SHORT')} color="blue" />
                                    <ChoiceBtn label="LONG PASS" onClick={() => setPassLength('LONG')} color="dark" />
                                </div>
                            )}

                            {/* 2.2 Result */}
                            {passLength && !passResult && (
                                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2">
                                    <ChoiceBtn label="SUCCESSFUL" onClick={() => setPassResult('SUCCESSFUL')} color="green" />
                                    <ChoiceBtn label="UNSUCCESSFUL" onClick={() => setPassResult('UNSUCCESSFUL')} color="red" />
                                </div>
                            )}

                            {/* === SUCCESS BRANCH === */}
                            {passResult === 'SUCCESSFUL' && (
                                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-lg space-y-5 animate-in zoom-in-95">

                                    {/* 2.3 Receiver */}
                                    {!toPlayerId && (
                                        <>
                                            <h3 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Select Receiver</h3>
                                            {renderPlayerGrid(selectedTeamId, setToPlayerId, fromPlayerId)}
                                        </>
                                    )}

                                    {/* 2.4 Category */}
                                    {toPlayerId && !passCategory && (
                                        <>
                                            <h3 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Pass Category</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <ChoiceBtn label="NORMAL" onClick={() => setPassCategory('NORMAL')} color="dark" />
                                                <ChoiceBtn label="PROGRESSIVE" onClick={() => setPassCategory('PROGRESSIVE')} color="purple" />
                                                <ChoiceBtn label="CROSS" onClick={() => setPassCategory('CROSS')} color="blue" />
                                                <ChoiceBtn label="ASSIST" onClick={() => setPassCategory('ASSIST')} color="green" />
                                            </div>
                                        </>
                                    )}

                                    {/* 2.5 Logic Branches */}
                                    {passCategory && (
                                        <div className="pt-4 border-t border-slate-100">

                                            {/* NORMAL / PROGRESSIVE -> OUTPLAY? */}
                                            {(passCategory === 'NORMAL' || passCategory === 'PROGRESSIVE') && isOutplaying === null && (
                                                <>
                                                    <h3 className="text-center text-xs font-bold text-slate-400 uppercase mb-3">Did it outplay opponents?</h3>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <ChoiceBtn label="YES" onClick={() => setIsOutplaying(true)} color="purple" />
                                                        <ChoiceBtn label="NO" onClick={() => handleSubmit({ isOutplaying: false })} subLabel="(FINISH)" color="dark" />
                                                    </div>
                                                </>
                                            )}

                                            {/* OUTPLAY INPUTS */}
                                            {isOutplaying === true && (
                                                <div className="animate-in fade-in space-y-4">
                                                    <h3 className="text-center text-xs font-bold text-purple-600 uppercase tracking-wider">Outplay Stats</h3>
                                                    <div className="flex gap-4">
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 text-center">Players</label>
                                                            <input type="number" min="0" value={outplayPlayers} onChange={e => setOutplayPlayers(parseInt(e.target.value) || 0)}
                                                                className="w-full text-center p-3 text-xl font-black bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 ring-purple-200 outline-none transition-all" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 text-center">Lines</label>
                                                            <input type="number" min="0" value={outplayLines} onChange={e => setOutplayLines(parseInt(e.target.value) || 0)}
                                                                className="w-full text-center p-3 text-xl font-black bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 ring-purple-200 outline-none transition-all" />
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleSubmit()} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-100 transition-all active:scale-95">
                                                        CONFIRM STATS
                                                    </button>
                                                </div>
                                            )}

                                            {/* CROSS / ASSIST -> KEY PASS? */}
                                            {(passCategory === 'CROSS' || passCategory === 'ASSIST') && (
                                                <div className="animate-in fade-in">
                                                    <h3 className="text-center text-xs font-bold text-slate-400 uppercase mb-3">Key Pass?</h3>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <ChoiceBtn label="YES" onClick={() => handleSubmit({ isKeyPass: true })} color="green" />
                                                        <ChoiceBtn label="NO" onClick={() => handleSubmit({ isKeyPass: false })} subLabel="(FINISH)" color="dark" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            )}

                            {/* === UNSUCCESSFUL BRANCH === */}
                            {passResult === 'UNSUCCESSFUL' && (
                                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-lg space-y-5 animate-in zoom-in-95">

                                    {/* 2.3 Failure Type */}
                                    {!passFailureType && (
                                        <>
                                            <h3 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Failure Outcome</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                <ChoiceBtn label="OFFSIDE" onClick={() => handleSubmit({ passFailureType: 'OFFSIDE' })} subLabel="(FINISH)" color="dark" />
                                                <ChoiceBtn label="BLOCK" onClick={() => setPassFailureType('BLOCK')} color="red" />
                                                <ChoiceBtn label="INTERCEPTION" onClick={() => setPassFailureType('INTERCEPTION')} color="red" />
                                                <ChoiceBtn label="BALL COLLECTION" onClick={() => setPassFailureType('BALL_COLLECTION')} color="red" />
                                                <ChoiceBtn label="UNSUCCESSFUL CROSS" onClick={() => setPassFailureType('UNSUCCESSFUL_CROSS')} color="red" />
                                                <ChoiceBtn label="TACKLE" onClick={() => setPassFailureType('TACKLE')} color="red" />
                                                <ChoiceBtn label="CLEARANCE" onClick={() => setPassFailureType('CLEARANCE')} color="red" />
                                            </div>
                                        </>
                                    )}

                                    {/* 2.4 Post-Defensive Flow */}
                                    {passFailureType && passFailureType !== 'OFFSIDE' && (
                                        <div className="space-y-4 pt-4 border-t border-slate-100">

                                            {/* Opponent Selection */}
                                            {!opponentPlayerId && (
                                                <>
                                                    <h3 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Who Intervened?</h3>
                                                    {opponentTeam
                                                        ? renderPlayerGrid(opponentTeam.teamId, setOpponentPlayerId)
                                                        : <div className="text-center text-slate-400 italic py-4">No opponent team loaded</div>
                                                    }
                                                    <button onClick={() => setOpponentPlayerId('UNKNOWN')} className="w-full py-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg text-xs font-bold transition-colors">SKIP / UNKNOWN</button>
                                                </>
                                            )}

                                            {/* High Press ? */}
                                            {opponentPlayerId && isHighPress === null && (
                                                <>
                                                    <h3 className="text-center text-xs font-bold text-slate-400 uppercase mb-3">Was it High Press?</h3>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <ChoiceBtn label="YES" onClick={() => setIsHighPress(true)} active={isHighPress === true} color="red" />
                                                        <ChoiceBtn label="NO" onClick={() => setIsHighPress(false)} active={isHighPress === false} color="dark" />
                                                    </div>
                                                </>
                                            )}

                                            {/* Ball Recovery ? */}
                                            {isHighPress !== null && isBallRecovery === null && (
                                                <>
                                                    <h3 className="text-center text-xs font-bold text-slate-400 uppercase mb-3">Ball Recovered?</h3>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <ChoiceBtn label="YES" onClick={() => handleSubmit({ isBallRecovery: true })} subLabel="(FINISH)" color="green" />
                                                        <ChoiceBtn label="NO" onClick={() => handleSubmit({ isBallRecovery: false })} subLabel="(FINISH)" color="red" />
                                                    </div>
                                                </>
                                            )}

                                        </div>
                                    )}

                                </div>
                            )}

                        </div>
                    )}

                </div>
            </div>

            {/* FOOTER STREAM */}
            <div className="bg-white border-t border-slate-100 p-4 h-28 overflow-x-auto whitespace-nowrap flex items-center gap-3 mx-4 rounded-xl shadow-lg safe-area-pb">
                {events.slice().reverse().map((e, i) => (
                    <div key={e.eventId} className="inline-flex flex-col justify-between min-w-[130px] bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm h-20 shrink-0 relative overflow-hidden">
                        {i === 0 && <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-bl-lg"></div>}
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono">
                            <span>{e.time}</span>
                            <span className={e.passResult === 'SUCCESSFUL' ? 'text-green-600' : 'text-red-500'}>{e.passResult === 'SUCCESSFUL' ? 'SUCC' : 'FAIL'}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <span className="text-xs font-black text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-sm">
                                {getTeam(e.teamId)?.squad.find(x => x.playerId === e.fromPlayerId)?.jerseyNumber}
                            </span>
                            <span className="text-slate-300">➜</span>
                            {e.passResult === 'SUCCESSFUL' ? (
                                <span className="text-xs font-black text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-sm">
                                    {getTeam(e.teamId)?.squad.find(x => x.playerId === e.toPlayerId)?.jerseyNumber}
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-red-300">X</span>
                            )}
                        </div>
                    </div>
                ))}
                {events.length === 0 && <div className="text-slate-400 text-xs font-bold px-4 italic w-full text-center">No events logged yet</div>}
            </div>

        </div>
    );
}
