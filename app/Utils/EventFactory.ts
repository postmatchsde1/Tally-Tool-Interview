import { generateUUID } from "./uuid";
// Define Event Types
export type EventType = "PASS";

// Match Event Interface
export interface MatchEvent {
    eventId: string;
    eventType: EventType;
    teamId: string;

    // Time Fields
    time: string;           // HH:MM:SS formatted video time
    videoTimeSec: number;   // Raw video timestamp in seconds

    // PASS Specific Fields
    passLength?: "LONG" | "SHORT";
    passResult?: "SUCCESSFUL" | "UNSUCCESSFUL";

    // Successful Pass Fields
    passSuccessType?: "PROGRESSIVE" | "NORMAL" | "CROSS" | "ASSIST" | "KEY_PASS" | "None";

    // Flattened Attributes for new logic
    isProgressive?: boolean;
    isCross?: boolean;
    isAssist?: boolean;
    isKeyPass?: boolean;

    outplay?: boolean;
    outplayPlayers?: number;
    outplayLines?: number;

    // Unsuccessful Pass Fields
    passFailureType?: "OFFSIDE" | "BLOCK" | "INTERCEPTION" | "BALL_COLLECTION" | "UNSUCCESSFUL_CROSS" | "TACKLE" | "CLEARANCE";
    defensiveAction?: "HIGH_PRESS" | "BALL_RECOVERY" | "None";

    highPress?: boolean;
    ballRecovery?: "SUCCESSFUL" | "UNSUCCESSFUL";

    // Players
    fromPlayerId?: string;
    toPlayerId?: string;      // Receiver (Same team)
    opponentPlayerId?: string; // Interceptor/Tackler (Opponent team)

    // Derived
    passCategories?: string[];
}

/**
 * Validates and formats seconds into HH:MM:SS
 */
function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

/**
 * Specialized Factory for PASS events
 */
export function createPassEvent(
    teamId: string,
    fromPlayerId: string,
    videoTimeSeconds: number,
    data: {
        passLength: "LONG" | "SHORT";
        passResult: "SUCCESSFUL" | "UNSUCCESSFUL";

        // Successful args
        toPlayerId?: string;

        isProgressive?: boolean;
        isCross?: boolean;
        isAssist?: boolean;
        isKeyPass?: boolean;

        outplay?: boolean;
        outplayPlayers?: number;
        outplayLines?: number;

        // Unsuccessful args
        opponentPlayerId?: string;
        passFailureType?: "OFFSIDE" | "BLOCK" | "INTERCEPTION" | "BALL_COLLECTION" | "UNSUCCESSFUL_CROSS" | "TACKLE" | "CLEARANCE";

        highPress?: boolean;
        ballRecovery?: "SUCCESSFUL" | "UNSUCCESSFUL";
    }
): MatchEvent {
    const timeString = formatTime(videoTimeSeconds);

    // Derived logic for legacy 'passCategories'
    const passCategories: string[] = [];
    if (data.isProgressive) passCategories.push("PROGRESSIVE_PASS");
    if (data.isKeyPass || data.isAssist) passCategories.push("KEY_PASS");
    if (data.isAssist) passCategories.push("ASSIST");
    if (data.isCross) passCategories.push("CROSS");

    return {
        eventId: generateUUID(),
        eventType: "PASS",
        teamId,
        fromPlayerId,
        time: timeString,
        videoTimeSec: videoTimeSeconds,

        passLength: data.passLength,
        passResult: data.passResult,

        // Successful
        toPlayerId: data.toPlayerId,
        isProgressive: data.isProgressive,
        isCross: data.isCross,
        isAssist: data.isAssist,
        isKeyPass: data.isKeyPass,
        outplay: data.outplay,
        outplayPlayers: data.outplayPlayers,
        outplayLines: data.outplayLines,

        // Unsuccessful
        opponentPlayerId: data.opponentPlayerId,
        passFailureType: data.passFailureType,
        highPress: data.highPress,
        ballRecovery: data.ballRecovery,

        // Derived
        passCategories: passCategories.length > 0 ? passCategories : undefined
    };
}

