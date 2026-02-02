"use client";

import { useState, useEffect, useCallback } from "react";
import dummyData from "../../dummy-data/pre-match-dummy-data.json";

// --- Shared Types ---
export type Player = {
    playerId: string;
    playerName: string;
    jerseyNumber: number;
};

export type Team = {
    teamId: string;
    teamName: string;
    squad: Player[];
};

export type League = {
    leagueId: string;
    leagueName: string;
    subLeague: string;
};

export type MatchData = {
    league: League;
    teams: Team[];
};

// --- Hooks ---

/**
 * Hook to poll the YouTube player time.
 */
export function useVideoTime(refreshRate = 500) {
    const [uiTime, setUiTime] = useState(0);

    const getCurrentVideoTime = () => {
        if (typeof window !== 'undefined' && (window as any).getYoutubeTime) {
            return (window as any).getYoutubeTime();
        }
        return 0;
    };

    useEffect(() => {
        setUiTime(getCurrentVideoTime());
        const interval = setInterval(() => {
            setUiTime(getCurrentVideoTime());
        }, refreshRate);
        return () => clearInterval(interval);
    }, [refreshRate]);

    return { uiTime, getCurrentVideoTime };
}

/**
 * Hook to load and manage the Match Configuration (Teams, Players, etc.)
 * Handles hydration from 'match_data_v1' or falls back to dummy data.
 */
export function useMatchData() {
    const [matchData, setMatchData] = useState<MatchData>(dummyData as any);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = () => {
            const savedData = localStorage.getItem("match_data_v1");
            if (savedData) {
                try {
                    setMatchData(JSON.parse(savedData));
                } catch (e) {
                    console.error("Failed to load match configuration", e);
                }
            }
            setLoading(false);
        };
        loadData();
    }, []);

    // Simple getters, mostly for potential UI use
    const getTeam = (id: string | null) => {
        if (!id) return undefined;
        return matchData.teams.find((t) => t.teamId === id);
    };

    const getPlayer = (teamId: string | null, playerId: string | null) => {
        if (!teamId || !playerId) return undefined;
        return getTeam(teamId)?.squad.find((p) => p.playerId === playerId);
    };

    return { matchData, getTeam, getPlayer, loading };
}

/**
 * Hook to manage a list of events with automatic localStorage persistence.
 * @param storageKey The unique key for localStorage.
 */
export function useDraftEvents<T>(storageKey: string) {
    const [events, setEvents] = useState<T[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                setEvents(JSON.parse(saved));
            } catch (e) {
                console.error(`Failed to recover draft data for ${storageKey}`, e);
            }
        }
    }, [storageKey]);

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(events));
    }, [events, storageKey]);

    const clearEvents = (confirmMessage: string = "Are you sure you want to clear all events?") => {
        if (confirm(confirmMessage)) {
            setEvents([]);
            localStorage.removeItem(storageKey);
        }
    };

    return { events, setEvents, clearEvents };
}

