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
    const { uiTime, getCurrentVideoTime } = useVideoTime();
    const { matchData, getTeam } = useMatchData();
    const { events, setEvents, clearEvents } = useDraftEvents<MatchEvent>("match_events_draft_passing");

    // --- State: Progression ---
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [fromPlayerId, setFromPlayerId] = useState<string | null>(null);

    // Step 1: Basic Attributes
    const [passLength, setPassLength] = useState<PassLength | null>(null);
    const [passResult, setPassResult] = useState<PassResult | null>(null);

    // Step 2A: Successful Flow
    const [toPlayerId, setToPlayerId] = useState<string | null>(null);
    const [passCategory, setPassCategory] = useState<"NORMAL" | "PROGRESSIVE" | "NONE" | null>(null);

    // Sub: Progressive Type (Successful)
    const [progressiveSubType, setProgressiveSubType] = useState<"ASSIST" | "CROSS" | "NONE" | null>(null);

    // Sub: Unsuccessful SubType (Interception -> Ball Collection, etc.)
    const [unsuccessfulSubType, setUnsuccessfulSubType] = useState<string | null>(null);

    // Sub: Outplays
    const [isOutplaying, setIsOutplaying] = useState<boolean | null>(null);
    const [outplayPlayers, setOutplayPlayers] = useState<number>(0);
    const [outplayLines, setOutplayLines] = useState<number>(0);

    const [isKeyPass, setIsKeyPass] = useState<boolean | null>(null); // Kept for logic compatibility

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
        setProgressiveSubType(null);
        setUnsuccessfulSubType(null);
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
            const isProgressive = passCategory === 'PROGRESSIVE';

            // Progressive Sub-Logic
            const subType = overrides?.progressiveSubType ?? progressiveSubType;
            const isAssist = isProgressive && subType === 'ASSIST';
            const isCross = isProgressive && subType === 'CROSS';

            // Key Pass Logic (Assist or Cross triggers this)
            const isKeyPass = overrides?.isKeyPass ?? (isAssist || isCross);

            // Outplay Logic
            const outplay = overrides?.isOutplaying ?? isOutplaying ?? false;

            successArgs = {
                isProgressive,
                isCross,
                isAssist,
                isKeyPass,
                outplay,
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
                failureSubtype: overrides?.failureSubtype ?? unsuccessfulSubType,
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

        setEvents(prev => [...prev, newEvent]);
        resetFlow();
    };


    // --- Renderers ---
    const ChoiceBtn = ({ label, onClick, colorClass = "bg-white text-slate-600 border-slate-200", subLabel = "", active = false }: any) => (
        <button
            onClick={onClick}
            className={`py-2 rounded border font-black text-[10px] hover:brightness-95 active:scale-95 transition-all flex flex-col items-center justify-center uppercase tracking-wide
            ${active ? 'ring-1 ring-offset-1 ring-blue-400 border-blue-500 bg-blue-50 text-blue-700' : colorClass}`}
        >
            <span className="text-[10px]">{label}</span>
            {subLabel && <span className="text-[8px] font-normal opacity-70 mt-0.5 normal-case max-w-full truncate px-1">{subLabel}</span>}
        </button>
    );

    const renderPlayerGrid = (teamId: string, onSelect: (id: string) => void, excludeId?: string | null) => {
        const team = getTeam(teamId);
        if (!team) return null;
        return (
            <div className="grid grid-cols-5 gap-0.5 p-0.5">
                {team.squad.map(p => (
                    <button
                        key={p.playerId}
                        onClick={() => onSelect(p.playerId)}
                        disabled={p.playerId === excludeId}
                        className={`aspect-square rounded flex flex-col items-center justify-center border transition-all active:scale-95 p-0.5 ${p.playerId === excludeId
                            ? 'opacity-20 cursor-not-allowed border-slate-100 bg-slate-50'
                            : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-sm text-slate-700 font-bold'
                            }`}
                    >
                        <span className="text-[10px]">{p.jerseyNumber}</span>
                    </button>
                ))}
            </div>
        );
    };

    // --- Main View ---
    return (
        <div className="flex flex-col h-full bg-slate-50 font-sans">

            {/* HEADER */}
            <div className="bg-white border-b border-slate-200 px-2 py-1.5 flex justify-between items-center shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-2">
                    <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Pass Logger</h2>
                    <span className="bg-slate-100 text-slate-500 text-[9px] font-mono px-1 py-0.5 rounded border border-slate-200">
                        {new Date(uiTime * 1000).toISOString().substr(11, 8)}
                    </span>
                </div>
                {(selectedTeamId || fromPlayerId) ? (
                    <button onClick={fullReset} className="text-[9px] font-bold text-red-500 hover:bg-red-50 px-1 py-0.5 rounded transition-colors uppercase">
                        Reset
                    </button>
                ) : <span className="text-[9px] text-slate-400 italic">Select Team</span>}
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-2 content-start">
                <div className="w-full flex flex-col gap-2">

                    {/* 0. TEAM SELECTION */}
                    {!selectedTeamId && (
                        <div className="grid grid-cols-1 gap-2 animate-in zoom-in-95 duration-200">
                            {matchData.teams.map(t => (
                                <button
                                    key={t.teamId}
                                    onClick={() => setSelectedTeamId(t.teamId)}
                                    className="py-4 rounded border border-slate-200 bg-white hover:border-blue-500 hover:shadow-md transition-all group flex items-center justify-between px-4"
                                >
                                    <div className="text-xs font-black text-slate-700 group-hover:text-blue-600 uppercase">{t.teamName}</div>
                                    <div className="text-[9px] text-slate-400 font-bold tracking-widest">SELECT</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 1. PASSER SELECTION */}
                    {selectedTeamId && !fromPlayerId && (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <div className="bg-white rounded shadow-sm border border-slate-200 p-1.5">
                                <h3 className="text-[9px] font-bold text-slate-400 uppercase mb-1 text-center">Select Passer</h3>
                                {renderPlayerGrid(selectedTeamId, setFromPlayerId)}
                            </div>
                        </div>
                    )}

                    {/* 2. FLOW WIZARD */}
                    {selectedTeamId && fromPlayerId && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-right-4">

                            {/* Context Bar */}
                            <div className="bg-slate-800 text-white p-1.5 rounded flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-2">
                                    <div className="bg-white/10 w-6 h-6 rounded flex items-center justify-center font-black text-xs">
                                        #{getTeam(selectedTeamId)?.squad.find(p => p.playerId === fromPlayerId)?.jerseyNumber}
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-[9px] font-bold truncate max-w-[80px]">{getTeam(selectedTeamId)?.squad.find(p => p.playerId === fromPlayerId)?.playerName}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {passLength && <span className="px-1 py-0.5 bg-blue-500 rounded text-[8px] font-bold">{passLength[0]}</span>}
                                    {passResult === 'SUCCESSFUL' && <span className="px-1 py-0.5 bg-emerald-500 rounded text-[8px] font-bold">SUC</span>}
                                    {passResult === 'UNSUCCESSFUL' && <span className="px-1 py-0.5 bg-red-500 rounded text-[8px] font-bold">FL</span>}
                                </div>
                            </div>

                            {/* 2.1 Pass Length */}
                            {!passLength && (
                                <div className="grid grid-cols-2 gap-1.5 animate-in fade-in">
                                    <ChoiceBtn label="SHORT" onClick={() => setPassLength('SHORT')} />
                                    <ChoiceBtn label="LONG" onClick={() => setPassLength('LONG')} />
                                </div>
                            )}

                            {/* 2.2 Result */}
                            {passLength && !passResult && (
                                <div className="grid grid-cols-2 gap-1.5 animate-in fade-in">
                                    <ChoiceBtn label="SUCCESS" onClick={() => setPassResult('SUCCESSFUL')} colorClass="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 border" />
                                    <ChoiceBtn label="FAIL" onClick={() => setPassResult('UNSUCCESSFUL')} colorClass="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 border" />
                                </div>
                            )}

                            {/* === SUCCESS BRANCH === */}
                            {passResult === 'SUCCESSFUL' && (
                                <div className="bg-white rounded border border-slate-200 p-2 shadow-sm space-y-2 animate-in zoom-in-95">

                                    {/* 2.3 Receiver */}
                                    {!toPlayerId && (
                                        <>
                                            <h3 className="text-center text-[9px] font-bold text-slate-400 uppercase">Select Receiver</h3>
                                            {renderPlayerGrid(selectedTeamId, setToPlayerId, fromPlayerId)}
                                        </>
                                    )}

                                    {/* 2.4 Category: Normal / Progressive / None */}
                                    {toPlayerId && !passCategory && (
                                        <>
                                            <h3 className="text-center text-[9px] font-bold text-slate-400 uppercase">Pass Type</h3>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                <ChoiceBtn label="NORMAL" onClick={() => setPassCategory('NORMAL')} />
                                                <ChoiceBtn label="PROGRESSIVE" onClick={() => setPassCategory('PROGRESSIVE')} colorClass="bg-purple-50 text-purple-700 border-purple-200" />
                                                <ChoiceBtn label="NONE" onClick={() => handleSubmit({ passCategory: 'NONE' })} subLabel="(FINISH)" />
                                            </div>
                                        </>
                                    )}

                                    {/* BRANCH: NORMAL PASS */}
                                    {passCategory === 'NORMAL' && isOutplaying === null && (
                                        <div className="animate-in fade-in">
                                            <h3 className="text-center text-[9px] font-bold text-slate-400 uppercase mb-1">Outplays?</h3>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <ChoiceBtn label="YES" onClick={() => setIsOutplaying(true)} colorClass="bg-indigo-50 text-indigo-700 border-indigo-200" />
                                                <ChoiceBtn label="NO" onClick={() => handleSubmit({ isOutplaying: false })} subLabel="(FINISH)" />
                                            </div>
                                        </div>
                                    )}

                                    {/* BRANCH: PROGRESSIVE PASS */}
                                    {passCategory === 'PROGRESSIVE' && !progressiveSubType && (
                                        <div className="animate-in fade-in">
                                            <h3 className="text-center text-[9px] font-bold text-slate-400 uppercase mb-1">Prog Type</h3>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                <ChoiceBtn label="ASSIST" onClick={() => setProgressiveSubType('ASSIST')} colorClass="bg-amber-50 text-amber-700 border-amber-200" />
                                                <ChoiceBtn label="CROSS" onClick={() => setProgressiveSubType('CROSS')} />
                                                <ChoiceBtn label="NONE" onClick={() => handleSubmit({ progressiveSubType: 'NONE' })} subLabel="(FINISH)" />
                                            </div>
                                        </div>
                                    )}

                                    {/* BRANCH: KEY PASS LOGIC (From Assist/Cross) */}
                                    {(progressiveSubType === 'ASSIST' || progressiveSubType === 'CROSS') && isOutplaying === null && (
                                        <div className="animate-in fade-in">
                                            <h3 className="text-center text-[9px] font-bold text-slate-400 uppercase mb-1">KP: Outplays?</h3>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                <ChoiceBtn label="YES" onClick={() => setIsOutplaying(true)} colorClass="bg-indigo-50 text-indigo-700 border-indigo-200" />
                                                <ChoiceBtn label="NO" onClick={() => handleSubmit({ isOutplaying: false })} subLabel="(FINISH)" />
                                                <ChoiceBtn label="STOP" onClick={() => handleSubmit({ isOutplaying: false })} subLabel="(FINISH)" />
                                            </div>
                                        </div>
                                    )}

                                    {/* FINAL: OUTPLAY DETAILS INPUT */}
                                    {isOutplaying === true && (
                                        <div className="animate-in fade-in space-y-2">
                                            <h3 className="text-center text-[9px] font-bold text-indigo-500 uppercase">Details</h3>
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5 text-center">Plyrs</label>
                                                    <input type="number" min="0" value={outplayPlayers} onChange={e => setOutplayPlayers(parseInt(e.target.value) || 0)}
                                                        className="w-full text-center p-1.5 text-sm font-black bg-indigo-50 border border-indigo-200 rounded text-indigo-900 focus:ring-1 ring-indigo-500 outline-none" />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5 text-center">Lines</label>
                                                    <input type="number" min="0" value={outplayLines} onChange={e => setOutplayLines(parseInt(e.target.value) || 0)}
                                                        className="w-full text-center p-1.5 text-sm font-black bg-indigo-50 border border-indigo-200 rounded text-indigo-900 focus:ring-1 ring-indigo-500 outline-none" />
                                                </div>
                                            </div>
                                            <button onClick={() => handleSubmit()} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded shadow-sm text-[10px]">
                                                CONFIRM
                                            </button>
                                        </div>
                                    )}

                                </div>
                            )}

                            {/* === UNSUCCESSFUL BRANCH === */}
                            {passResult === 'UNSUCCESSFUL' && (
                                <div className="bg-white rounded border border-slate-200 p-2 shadow-sm space-y-2 animate-in zoom-in-95">

                                    {/* 2.3 Failure Type (Level 1) */}
                                    {!passFailureType && (
                                        <>
                                            <h3 className="text-center text-[9px] font-bold text-slate-400 uppercase">Outcome</h3>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                <ChoiceBtn label="OFFSIDE" onClick={() => handleSubmit({ passFailureType: 'OFFSIDE' })} subLabel="(FINISH)" />
                                                <ChoiceBtn label="INTERCEPT" onClick={() => setPassFailureType('INTERCEPTION')} />
                                                <ChoiceBtn label="BLOCK" onClick={() => setPassFailureType('BLOCK')} />
                                                <ChoiceBtn label="CLEARANCE" onClick={() => setPassFailureType('CLEARANCE')} />
                                                <ChoiceBtn label="NONE" onClick={() => handleSubmit({ passFailureType: 'NONE' })} subLabel="(FINISH)" />
                                            </div>
                                        </>
                                    )}

                                    {/* BRANCH 2: INTERCEPTION */}
                                    {passFailureType === 'INTERCEPTION' && !unsuccessfulSubType && isHighPress === null && (
                                        <div className="animate-in fade-in">
                                            <h3 className="text-center text-[9px] font-bold text-slate-400 uppercase mb-1">Action?</h3>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                <ChoiceBtn label="BALL COLL" onClick={() => setUnsuccessfulSubType('BALL_COLLECTION')} />
                                                <ChoiceBtn label="HIGH PRESS" onClick={() => setIsHighPress(true)} />
                                                <ChoiceBtn label="STOP" onClick={() => handleSubmit()} subLabel="(FINISH)" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Sub-Branch: Ball Collection (From Interception) */}
                                    {passFailureType === 'INTERCEPTION' && unsuccessfulSubType === 'BALL_COLLECTION' && (
                                        <div className="animate-in fade-in">
                                            <h3 className="text-center text-[9px] font-bold text-slate-400 uppercase mb-1">Collection Type</h3>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                <ChoiceBtn label="BAD CROSS" onClick={() => handleSubmit({ failureSubtype: 'UNSUCCESSFUL_CROSS' })} subLabel="(FINISH)" />
                                                <ChoiceBtn label="NONE" onClick={() => handleSubmit()} subLabel="(FINISH)" />
                                            </div>
                                        </div>
                                    )}

                                    {/* BRANCH 3: BLOCK */}
                                    {passFailureType === 'BLOCK' && !unsuccessfulSubType && isHighPress === null && (
                                        <div className="animate-in fade-in">
                                            <h3 className="text-center text-[9px] font-bold text-slate-400 uppercase mb-1">Action?</h3>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                <ChoiceBtn label="HIGH PRESS" onClick={() => setIsHighPress(true)} />
                                                <ChoiceBtn label="TACKLE" onClick={() => handleSubmit({ failureSubtype: 'TACKLE' })} subLabel="(FINISH)" />
                                                <ChoiceBtn label="STOP" onClick={() => handleSubmit({ failureSubtype: 'NONE' })} subLabel="(FINISH)" />
                                            </div>
                                        </div>
                                    )}

                                    {/* BRANCH 4: CLEARANCE */}
                                    {passFailureType === 'CLEARANCE' && (
                                        <div className="animate-in fade-in">
                                            <h3 className="text-center text-[9px] font-bold text-slate-400 uppercase mb-1">Action?</h3>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                <ChoiceBtn label="TACKLE" onClick={() => handleSubmit({ failureSubtype: 'TACKLE' })} subLabel="(FINISH)" />
                                                <ChoiceBtn label="STOP" onClick={() => handleSubmit()} subLabel="(FINISH)" />
                                            </div>
                                        </div>
                                    )}

                                    {/* LEVEL 4: HIGH PRESS (From Interception or Block) */}
                                    {isHighPress === true && isBallRecovery === null && (
                                        <div className="animate-in fade-in space-y-2">

                                            {/* Opponent who pressed (Implicitly asked in failure flow?) - Adding generic opponent selector if missing */}
                                            {!opponentPlayerId && (
                                                <>
                                                    <h3 className="text-center text-[9px] font-bold text-slate-400 uppercase">Who Pressed?</h3>
                                                    {opponentTeam
                                                        ? renderPlayerGrid(opponentTeam.teamId, setOpponentPlayerId)
                                                        : <div className="text-center text-slate-400 italic py-2 text-[10px]">No opponent team</div>
                                                    }
                                                    <button onClick={() => setOpponentPlayerId('UNKNOWN')} className="w-full py-1.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold">SKIP</button>
                                                </>
                                            )}

                                            {/* (Wait for opponent selection if desired, or skip. Currently parallel) */}

                                            <h3 className="text-center text-[9px] font-bold text-slate-400 uppercase mb-1">Recov?</h3>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <ChoiceBtn label="YES" onClick={() => handleSubmit({ isBallRecovery: true })} colorClass="bg-emerald-50 text-emerald-700 border-emerald-200" />
                                                <ChoiceBtn label="NO" onClick={() => handleSubmit({ isBallRecovery: false })} subLabel="(FINISH)" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    )}

                </div>
            </div>

            {/* FOOTER STREAM */}
            <div className="bg-slate-100 border-t border-slate-200 p-1 min-h-[50px] overflow-x-auto whitespace-nowrap flex items-center gap-1">
                {events.slice().reverse().map(e => (
                    <div key={e.eventId} className="inline-flex flex-col justify-between min-w-[70px] bg-white border border-slate-200 rounded p-1 shadow-sm h-10">
                        <div className="flex justify-between text-[7px] text-slate-400 font-bold leading-none">
                            <span>{e.time}</span>
                            <span className={e.passResult === 'SUCCESSFUL' ? 'text-green-500' : 'text-red-500'}>{e.passResult?.[0]}</span>
                        </div>
                        <div className="text-center text-[8px] font-black text-slate-700 leading-none">
                            #{getTeam(e.teamId)?.squad.find(x => x.playerId === e.fromPlayerId)?.jerseyNumber} ➜
                            {e.passResult === 'SUCCESSFUL'
                                ? ` #${getTeam(e.teamId)?.squad.find(x => x.playerId === e.toPlayerId)?.jerseyNumber}`
                                : ` X`
                            }
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
