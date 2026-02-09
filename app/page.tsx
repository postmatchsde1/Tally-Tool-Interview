"use client";

import "./globals.css";
import React from "react";
import VideoPlay from "./components/videoplay";
import Navbar from "./components/navbar";
import Passing from "./components/Passing";

export default function Page() {

  return (
    <>
      <Navbar />
      <main className="mt-14 w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-gray-50 flex">
        {/* Left: Video Section (80%) */}
        <div className="w-[80%] h-full p-4">
          <div className="w-full h-full bg-black rounded-2xl overflow-hidden border border-slate-200 shadow-2xl">
            <VideoPlay />
          </div>
        </div>

        {/* Right: Logger Section (20%) */}
        <div className="w-[20%] h-full p-4 pl-0">
          <div className="w-full h-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <Passing />
          </div>
        </div>
      </main>

    </>
  );
}
