"use client";

import { useState, useEffect, useRef } from "react";

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
        getYoutubeTime?: () => number;
    }
}

export default function VideoPlay() {
    // --- State: URL Inputs ---
    const [url1, setUrl1] = useState("");
    const [url2, setUrl2] = useState("");

    // --- State: Active Video IDs ---
    const [videoId1, setVideoId1] = useState<string | null>(null);
    const [videoId2, setVideoId2] = useState<string | null>(null);

    // --- State: Input Errors ---
    const [error1, setError1] = useState("");
    const [error2, setError2] = useState("");

    // --- State: Active Timing Source ---
    // User can select which video drives the "Get Time" clock
    // 1 = Left Video, 2 = Right Video
    const [activeClockSource, setActiveClockSource] = useState<1 | 2>(1);

    // --- Refs ---
    const player1Ref = useRef<any>(null);
    const player2Ref = useRef<any>(null);
    const container1Ref = useRef<HTMLDivElement>(null);
    const container2Ref = useRef<HTMLDivElement>(null);

    // --- Helper: Extract ID ---
    function extractYoutubeId(youtubeUrl: string): string | null {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = youtubeUrl.match(regex);
        return match ? match[1] : null;
    }

    // --- Effect: Load YouTube API ---
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }
    }, []);

    // --- Initialization Helper ---
    const initPlayer = (
        pRef: React.MutableRefObject<any>,
        cRef: React.MutableRefObject<HTMLDivElement | null>,
        vId: string
    ) => {
        if (!window.YT || !cRef.current) return;

        // Destroy existing instance in this container if any
        if (pRef.current && typeof pRef.current.destroy === 'function') {
            try { pRef.current.destroy(); } catch (e) { /* ignore */ }
        }

        pRef.current = new window.YT.Player(cRef.current, {
            height: '100%',
            width: '100%',
            videoId: vId,
            playerVars: {
                'playsinline': 1,
            }
        });
    };

    // --- Effect: Init Player 1 ---
    useEffect(() => {
        if (!videoId1 || !window.YT) return;

        if (window.YT && window.YT.Player) {
            initPlayer(player1Ref, container1Ref, videoId1);
        } else {
            const prev = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (prev) prev();
                initPlayer(player1Ref, container1Ref, videoId1);
            };
        }
    }, [videoId1]);

    // --- Effect: Init Player 2 ---
    useEffect(() => {
        if (!videoId2 || !window.YT) return;

        if (window.YT && window.YT.Player) {
            initPlayer(player2Ref, container2Ref, videoId2);
        }
    }, [videoId2]);


    // --- Effect: Global Time Exposer (Switchable) ---
    useEffect(() => {
        window.getYoutubeTime = () => {
            const activePlayer = activeClockSource === 1 ? player1Ref.current : player2Ref.current;

            if (activePlayer && activePlayer.getCurrentTime) {
                return activePlayer.getCurrentTime();
            }
            return 0;
        };

        return () => {
            delete window.getYoutubeTime;
        };
    }, [activeClockSource, videoId1, videoId2]); // Re-bind when source changes


    // --- Effect: Load from LocalStorage on Mount ---
    useEffect(() => {
        const savedId1 = localStorage.getItem("tally_video1");
        const savedId2 = localStorage.getItem("tally_video2");
        if (savedId1) setVideoId1(savedId1);
        if (savedId2) setVideoId2(savedId2);
    }, []);

    // --- Handlers ---
    const handleLoad1 = (e: React.FormEvent) => {
        e.preventDefault();
        const id = extractYoutubeId(url1);
        if (!id) { setError1("Invalid URL"); return; }
        setError1("");
        setVideoId1(id);
        localStorage.setItem("tally_video1", id);
    };

    const handleClear1 = () => {
        setVideoId1(null);
        setUrl1("");
        localStorage.removeItem("tally_video1");
    };

    const handleLoad2 = (e: React.FormEvent) => {
        e.preventDefault();
        const id = extractYoutubeId(url2);
        if (!id) { setError2("Invalid URL"); return; }
        setError2("");
        setVideoId2(id);
        localStorage.setItem("tally_video2", id);
    };

    const handleClear2 = () => {
        setVideoId2(null);
        setUrl2("");
        localStorage.removeItem("tally_video2");
    };

    return (
        <section className="w-full h-full flex gap-4 bg-black p-4 rounded-xl shadow-2xl overflow-hidden">

            {/* --- VIDEO 1 (LEFT) --- */}
            <div className="flex-1 flex flex-col gap-2 relative group h-full">
                {/* Header / Controls */}
                <div className="flex justify-between items-center text-white px-2 h-8 shrink-0">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Main Feed
                        {activeClockSource === 1 && <span className="ml-2 bg-red-600 text-white px-1.5 py-0.5 rounded text-[9px]">TIMING SOURCE</span>}
                    </span>
                    <div className="flex gap-2">
                        {videoId1 && (
                            <button
                                onClick={handleClear1}
                                className="text-[10px] px-2 py-1 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
                            >
                                Change Video
                            </button>
                        )}
                        <button
                            onClick={() => setActiveClockSource(1)}
                            className={`text-[10px] px-2 py-1 rounded transition-colors ${activeClockSource === 1 ? 'bg-red-900 text-red-200 cursor-default' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            {activeClockSource === 1 ? 'Tracking Time' : 'Set as Time Source'}
                        </button>
                    </div>
                </div>

                {/* Player Box */}
                <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-inner flex-1">
                    {videoId1 ? (
                        <div ref={container1Ref} className="w-full h-full" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                            <form onSubmit={handleLoad1} className="flex gap-2 bg-black/80 p-2 rounded-full border border-gray-700 shadow-xl">
                                <input
                                    type="text"
                                    placeholder="YouTube URL 1"
                                    value={url1}
                                    onChange={(e) => setUrl1(e.target.value)}
                                    className="bg-transparent text-white text-xs px-3 py-1.5 outline-none w-48"
                                />
                                <button type="submit" className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-red-500">
                                    Load
                                </button>
                            </form>
                            {error1 && <div className="absolute bottom-4 text-red-500 text-xs font-bold">{error1}</div>}
                        </div>
                    )}
                </div>
            </div>


            {/* --- VIDEO 2 (RIGHT) --- */}
            <div className="flex-1 flex flex-col gap-2 relative group h-full">
                {/* Header / Controls */}
                <div className="flex justify-between items-center text-white px-2 h-8 shrink-0">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Tactical Feed
                        {activeClockSource === 2 && <span className="ml-2 bg-red-600 text-white px-1.5 py-0.5 rounded text-[9px]">TIMING SOURCE</span>}
                    </span>
                    <div className="flex gap-2">
                        {videoId2 && (
                            <button
                                onClick={handleClear2}
                                className="text-[10px] px-2 py-1 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
                            >
                                Change Video
                            </button>
                        )}
                        <button
                            onClick={() => setActiveClockSource(2)}
                            className={`text-[10px] px-2 py-1 rounded transition-colors ${activeClockSource === 2 ? 'bg-red-900 text-red-200 cursor-default' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            {activeClockSource === 2 ? 'Tracking Time' : 'Set as Time Source'}
                        </button>
                    </div>
                </div>

                {/* Player Box */}
                <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-inner flex-1">
                    {videoId2 ? (
                        <div ref={container2Ref} className="w-full h-full" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                            <form onSubmit={handleLoad2} className="flex gap-2 bg-black/80 p-2 rounded-full border border-gray-700 shadow-xl">
                                <input
                                    type="text"
                                    placeholder="YouTube URL 2"
                                    value={url2}
                                    onChange={(e) => setUrl2(e.target.value)}
                                    className="bg-transparent text-white text-xs px-3 py-1.5 outline-none w-48"
                                />
                                <button type="submit" className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-red-500">
                                    Load
                                </button>
                            </form>
                            {error2 && <div className="absolute bottom-4 text-red-500 text-xs font-bold">{error2}</div>}
                        </div>
                    )}
                </div>
            </div>

        </section>
    );
}
