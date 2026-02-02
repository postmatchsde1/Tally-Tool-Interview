"use client";

import React, { useState, useMemo } from "react";
import { createPassEvent, MatchEvent } from "../Utils/EventFactory";
import { useVideoTime, useMatchData, useDraftEvents } from "../Utils/LoggerHooks";

// --- Types ---
type PassLength = "LONG" | "SHORT";
type PassResult = "SUCCESSFUL" | "UNSUCCESSFUL";

// Primary Branches (UI Helper)
type PassCategory = "NORMAL" | "PROGRESSIVE" | "CROSS" | "ASSIST";

// Failure Types
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

    // Sub-questions for Successful
    const [isOutplaying, setIsOutplaying] = useState<boolean | null>(null); // For Normal/Progressive
    const [outplayPlayers, setOutplayPlayers] = useState<number>(0);
    const [outplayLines, setOutplayLines] = useState<number>(0);

    const [isKeyPass, setIsKeyPass] = useState<boolean | null>(null); // For Cross/Assist

    // Step 2B: Unsuccessful Flow
    const [passFailureType, setPassFailureType] = useState<PassFailureType | null>(null);
    const [opponentPlayerId, setOpponentPlayerId] = useState<string | null>(null); // Opponent involved

    // Sub-questions for Interception/Block/Clearance/Tackle
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
        setDefensiveAction("None"); // Reconcile state naming
        setIsHighPress(null);
        setIsBallRecovery(null);
    };

    const fullReset = () => {
        setSelectedTeamId(null);
        resetFlow();
    };

    // --- Submit Logic ---
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
                // Key Pass logic: Either explicit from Cross/Assist flow, or implied?
                isKeyPass: overrides?.isKeyPass ?? isKeyPass ?? false,

                // Outplay logic
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

        // Slightly different reset behavior: keep team, reset passer
        resetFlow();
    };

    // Reconcile naming from previous file during copy-paste safety check
    const setDefensiveAction = (val: any) => { /* no-op wrapper if needed by residual naming */ };


    // --- Renderers ---
    const ChoiceBtn = ({ label, onClick, colorClass = "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700", subLabel = "", active = false }: any) => (
        <button
            onClick={onClick}
            className={`py-4 rounded-xl border-2 font-black text-sm active:scale-95 transition-all flex flex-col items-center justify-center uppercase tracking-wide
            ${active ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-blue-500 border-blue-500 bg-blue-900/30 text-blue-400' : colorClass}`}
        >
            <span className="text-sm">{label}</span>
            {subLabel && <span className="text-[9px] font-normal opacity-70 mt-0.5 normal-case">{subLabel}</span>}
        </button>
    );

    const renderPlayerGrid = (teamId: string, onSelect: (id: string) => void, excludeId?: string | null) => {
        const team = getTeam(teamId);
        if (!team) return null;
        return (
            <div className="grid grid-cols-6 gap-1.5 p-1">
                {team.squad.map(p => (
                    <button
                        key={p.playerId}
                        onClick={() => onSelect(p.playerId)}
                        disabled={p.playerId === excludeId}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center border-2 transition-all shadow-sm ${p.playerId === excludeId
                            ? 'opacity-20 cursor-not-allowed border-gray-800 bg-gray-900'
                            : 'bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-700 text-gray-200 font-bold'
                            }`}
                    >
                        <span className="text-sm">{p.jerseyNumber}</span>
                    </button>
                ))}
            </div>
        );
    };

    // --- Main View ---
    return (
        <div className="flex flex-col h-full bg-transparent font-sans text-gray-100 pb-10">

            {/* HEADER */}
            <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex justify-between items-center shadow-lg z-10 sticky top-0 rounded-t-xl mx-2 mt-2">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-black text-gray-100 uppercase tracking-wider">Pass Logger</h2>
                </div>
                {(selectedTeamId || fromPlayerId) ? (
                    <button onClick={fullReset} className="text-[10px] font-bold text-red-400 hover:bg-red-900/30 px-3 py-1.5 rounded transition-colors border border-red-900/50">
                        RESET FLOW
                    </button>
                ) : <span className="text-[10px] text-gray-500 italic">Select Team to start</span>}
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 content-center bg-black/40 mx-2 mb-2 backdrop-blur-sm rounded-b-xl border-x border-b border-gray-800">
                <div className="max-w-2xl mx-auto w-full">

                    {/* 0. TEAM SELECTION */}
                    {!selectedTeamId && (
                        <div className="grid grid-cols-2 gap-4 animate-in zoom-in-95 duration-200">
                            {matchData.teams.map(t => (
                                <button
                                    key={t.teamId}
                                    onClick={() => setSelectedTeamId(t.teamId)}
                                    className="py-12 rounded-2xl border-2 border-gray-800 bg-gray-900 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all group"
                                >
                                    <div className="text-2xl font-black text-gray-200 group-hover:text-blue-400 uppercase mb-2">{t.teamName}</div>
                                    <div className="text-xs text-gray-500 font-bold tracking-widest">SELECT TEAM</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 1. PASSER SELECTION */}
                    {selectedTeamId && !fromPlayerId && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-800 p-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-4 text-center">Select Passer</h3>
                                {renderPlayerGrid(selectedTeamId, setFromPlayerId)}
                            </div>
                        </div>
                    )}

                    {/* 2. FLOW WIZARD */}
                    {selectedTeamId && fromPlayerId && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">

                            {/* Context Bar */}
                            <div className="bg-gray-800 text-white p-3 rounded-xl flex items-center justify-between shadow-lg border border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="bg-black/30 w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg border border-white/10">
                                        {getTeam(selectedTeamId)?.squad.find(p => p.playerId === fromPlayerId)?.jerseyNumber}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-white/50 font-bold uppercase">Current Passer</span>
                                        <span className="text-sm font-bold">{getTeam(selectedTeamId)?.squad.find(p => p.playerId === fromPlayerId)?.playerName}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {passLength && <span className="px-2 py-1 bg-blue-600 rounded text-[10px] font-bold shadow-lg shadow-blue-900/20">{passLength}</span>}
                                    {passResult === 'SUCCESSFUL' && <span className="px-2 py-1 bg-green-600 rounded text-[10px] font-bold shadow-lg shadow-green-900/20">SUCCESS</span>}
                                    {passResult === 'UNSUCCESSFUL' && <span className="px-2 py-1 bg-red-600 rounded text-[10px] font-bold shadow-lg shadow-red-900/20">FAIL</span>}
                                </div>
                            </div>

                            {/* 2.1 Pass Length */}
                            {!passLength && (
                                <div className="grid grid-cols-2 gap-3 animate-in fade-in">
                                    <ChoiceBtn label="SHORT PASS" onClick={() => setPassLength('SHORT')} />
                                    <ChoiceBtn label="LONG PASS" onClick={() => setPassLength('LONG')} />
                                </div>
                            )}

                            {/* 2.2 Result */}
                            {passLength && !passResult && (
                                <div className="grid grid-cols-2 gap-3 animate-in fade-in">
                                    <ChoiceBtn label="SUCCESSFUL" onClick={() => setPassResult('SUCCESSFUL')} colorClass="bg-green-900/20 text-green-400 border-green-900/50 hover:bg-green-900/40 border-2" />
                                    <ChoiceBtn label="UNSUCCESSFUL" onClick={() => setPassResult('UNSUCCESSFUL')} colorClass="bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/40 border-2" />
                                </div>
                            )}

                            {/* === SUCCESS BRANCH === */}
                            {passResult === 'SUCCESSFUL' && (
                                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 shadow-sm space-y-4 animate-in zoom-in-95">

                                    {/* 2.3 Receiver */}
                                    {!toPlayerId && (
                                        <>
                                            <h3 className="text-center text-xs font-bold text-gray-500 uppercase">Select Receiver</h3>
                                            {renderPlayerGrid(selectedTeamId, setToPlayerId, fromPlayerId)}
                                        </>
                                    )}

                                    {/* 2.4 Category */}
                                    {toPlayerId && !passCategory && (
                                        <>
                                            <h3 className="text-center text-xs font-bold text-gray-500 uppercase">Pass Category</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <ChoiceBtn label="NORMAL" onClick={() => setPassCategory('NORMAL')} />
                                                <ChoiceBtn label="PROGRESSIVE" onClick={() => setPassCategory('PROGRESSIVE')} colorClass="bg-purple-900/20 text-purple-400 border-purple-900/50 hover:bg-purple-900/40" />
                                                <ChoiceBtn label="CROSS" onClick={() => setPassCategory('CROSS')} />
                                                <ChoiceBtn label="ASSIST" onClick={() => setPassCategory('ASSIST')} colorClass="bg-yellow-900/20 text-yellow-400 border-yellow-900/50 hover:bg-yellow-900/40" />
                                            </div>
                                        </>
                                    )}

                                    {/* 2.5 Logic Branches */}
                                    {passCategory && (
                                        <div className="pt-4 border-t border-gray-800">

                                            {/* NORMAL / PROGRESSIVE -> OUTPLAY? */}
                                            {(passCategory === 'NORMAL' || passCategory === 'PROGRESSIVE') && isOutplaying === null && (
                                                <>
                                                    <h3 className="text-center text-xs font-bold text-gray-500 uppercase mb-3">Did it outplay opponents?</h3>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <ChoiceBtn label="YES" onClick={() => setIsOutplaying(true)} colorClass="bg-indigo-900/20 text-indigo-400 border-indigo-900/50 hover:bg-indigo-900/40" />
                                                        <ChoiceBtn label="NO" onClick={() => handleSubmit({ isOutplaying: false })} subLabel="(FINISH)" />
                                                    </div>
                                                </>
                                            )}

                                            {/* OUTPLAY INPUTS */}
                                            {isOutplaying === true && (
                                                <div className="animate-in fade-in space-y-4">
                                                    <h3 className="text-center text-xs font-bold text-indigo-400 uppercase">Outplay Details</h3>
                                                    <div className="flex gap-4">
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 text-center">Players</label>
                                                            <input type="number" min="0" value={outplayPlayers} onChange={e => setOutplayPlayers(parseInt(e.target.value) || 0)}
                                                                className="w-full text-center p-3 text-xl font-black bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 ring-indigo-500 outline-none" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 text-center">Lines</label>
                                                            <input type="number" min="0" value={outplayLines} onChange={e => setOutplayLines(parseInt(e.target.value) || 0)}
                                                                className="w-full text-center p-3 text-xl font-black bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 ring-indigo-500 outline-none" />
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleSubmit()} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/50 transition-all active:scale-95">
                                                        CONFIRM STATS
                                                    </button>
                                                </div>
                                            )}

                                            {/* CROSS / ASSIST -> KEY PASS? */}
                                            {(passCategory === 'CROSS' || passCategory === 'ASSIST') && (
                                                <div className="animate-in fade-in">
                                                    <h3 className="text-center text-xs font-bold text-gray-500 uppercase mb-3">Key Pass?</h3>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <ChoiceBtn label="YES" onClick={() => handleSubmit({ isKeyPass: true })} colorClass="bg-yellow-900/20 text-yellow-500 border-yellow-900/50 hover:bg-yellow-900/40" />
                                                        <ChoiceBtn label="NO" onClick={() => handleSubmit({ isKeyPass: false })} subLabel="(FINISH)" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            )}

                            {/* === UNSUCCESSFUL BRANCH === */}
                            {passResult === 'UNSUCCESSFUL' && (
                                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 shadow-sm space-y-4 animate-in zoom-in-95">

                                    {/* 2.3 Failure Type */}
                                    {!passFailureType && (
                                        <>
                                            <h3 className="text-center text-xs font-bold text-gray-500 uppercase">Failure Outcome</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                <ChoiceBtn label="OFFSIDE" onClick={() => handleSubmit({ passFailureType: 'OFFSIDE' })} subLabel="(FINISH)" />
                                                <ChoiceBtn label="BLOCK" onClick={() => setPassFailureType('BLOCK')} />
                                                <ChoiceBtn label="INTERCEPTION" onClick={() => setPassFailureType('INTERCEPTION')} />
                                                <ChoiceBtn label="BALL COLLECTION" onClick={() => setPassFailureType('BALL_COLLECTION')} />
                                                <ChoiceBtn label="UNSUCCESSFUL CROSS" onClick={() => setPassFailureType('UNSUCCESSFUL_CROSS')} />
                                                <ChoiceBtn label="TACKLE" onClick={() => setPassFailureType('TACKLE')} />
                                                <ChoiceBtn label="CLEARANCE" onClick={() => setPassFailureType('CLEARANCE')} />
                                            </div>
                                        </>
                                    )}

                                    {/* 2.4 Post-Defensive Flow */}
                                    {passFailureType && passFailureType !== 'OFFSIDE' && (
                                        <div className="space-y-4 pt-4 border-t border-gray-800">

                                            {/* Opponent Selection */}
                                            {!opponentPlayerId && (
                                                <>
                                                    <h3 className="text-center text-xs font-bold text-gray-500 uppercase">Opponent Player? {opponentTeam?.teamName}</h3>
                                                    {opponentTeam
                                                        ? renderPlayerGrid(opponentTeam.teamId, setOpponentPlayerId)
                                                        : <div className="text-center text-gray-500 italic py-4">No opponent team loaded</div>
                                                    }
                                                    <button onClick={() => setOpponentPlayerId('UNKNOWN')} className="w-full py-2 bg-gray-800 text-gray-400 hover:text-white rounded text-xs font-bold transition-colors">SKIP / UNKNOWN</button>
                                                </>
                                            )}

                                            {/* High Press ? */}
                                            {opponentPlayerId && isHighPress === null && (
                                                <>
                                                    <h3 className="text-center text-xs font-bold text-gray-500 uppercase">High Press?</h3>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <ChoiceBtn label="YES" onClick={() => setIsHighPress(true)} active={isHighPress === true} />
                                                        <ChoiceBtn label="NO" onClick={() => setIsHighPress(false)} active={isHighPress === false} />
                                                    </div>
                                                </>
                                            )}

                                            {/* Ball Recovery ? */}
                                            {isHighPress !== null && isBallRecovery === null && (
                                                <>
                                                    <h3 className="text-center text-xs font-bold text-gray-500 uppercase">Ball Recovered?</h3>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <ChoiceBtn label="YES" onClick={() => handleSubmit({ isBallRecovery: true })} colorClass="bg-green-900/20 text-green-400 border-green-900/50 hover:bg-green-900/40" subLabel="(FINISH)" />
                                                        <ChoiceBtn label="NO" onClick={() => handleSubmit({ isBallRecovery: false })} subLabel="(FINISH)" />
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
            <div className="bg-gray-900 border-t border-gray-800 p-2 h-24 overflow-x-auto whitespace-nowrap flex items-center gap-2 mx-2 rounded-xl mb- safe-area-pb">
                {events.slice().reverse().map((e, i) => (
                    <div key={e.eventId} className="inline-flex flex-col justify-center min-w-[120px] bg-gray-800 border border-gray-700 rounded-lg p-2 shadow-sm h-20 shrink-0">
                        <div className="flex justify-between text-[10px] text-gray-500 font-bold mb-1">
                            <span>{e.time}</span>
                            <span className={e.passResult === 'SUCCESSFUL' ? 'text-green-400' : 'text-red-400'}>{e.passResult?.[0]}</span>
                        </div>
                        <div className="text-center text-xs font-black text-white">
                            P{getTeam(e.teamId)?.squad.find(x => x.playerId === e.fromPlayerId)?.jerseyNumber} <span className="text-gray-500">➜</span>
                            {e.passResult === 'SUCCESSFUL'
                                ? ` P${getTeam(e.teamId)?.squad.find(x => x.playerId === e.toPlayerId)?.jerseyNumber}`
                                : ` FAIL`
                            }
                        </div>
                        {i === 0 && <div className="mt-1 text-[9px] text-center text-blue-400 font-bold uppercase tracking-widest">Just Now</div>}
                    </div>
                ))}
                {events.length === 0 && <div className="text-gray-600 text-xs font-bold px-4 italic">No events logged yet</div>}
            </div>

        </div>
    );
}
