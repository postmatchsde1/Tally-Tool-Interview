"use client";

import React, { useState } from "react";
import { MatchEvent } from "../Utils/EventFactory";

export default function MasterDownload() {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleMasterDownload = () => {
        setIsDownloading(true);
        try {
            // 1. Load Configuration
            let matchData: any = {};
            const savedConfig = localStorage.getItem("match_data_v1");
            if (savedConfig) {
                try {
                    matchData = JSON.parse(savedConfig);
                } catch (e) { console.error(e); }
            }

            // 2. Load Passing Events
            let passingEvents: MatchEvent[] = [];
            const raw = localStorage.getItem("match_events_draft_passing");
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        passingEvents = parsed;
                    }
                } catch (e) { console.error(e); }
            }

            // 3. Construct Payload
            const finalPayload = {
                matchInfo: matchData,
                events: passingEvents
            };

            // 4. Download
            const jsonString = JSON.stringify(finalPayload, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `MATCH_PASSING_LOG_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Download failed", error);
            alert("Failed to disable.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <section className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-2xl z-50">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Download Data</h3>
                    <p className="text-sm text-gray-500">Export Match Info & Passing Events</p>
                </div>
                <button
                    onClick={handleMasterDownload}
                    disabled={isDownloading}
                    className="px-8 py-3 bg-black text-white rounded-xl font-bold text-lg shadow-lg hover:bg-gray-800 active:scale-95 transition-all flex items-center gap-2"
                >
                    {isDownloading ? "Processing..." : "Download JSON"}
                </button>
            </div>
        </section>
    );
}
