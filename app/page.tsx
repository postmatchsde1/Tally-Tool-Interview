"use client";

import "./globals.css";
import { useState } from "react";
import VideoPlay from "./components/videoplay";
import Navbar from "./components/navbar";
import Passing from "./components/Passing";
import MasterDownload from "./components/MatchDownload";

export default function Page() {

  return (
    <>
      <Navbar />
      <main className="mt-20 pb-32">
        {/* Full Width Video Section */}
        <div className="w-full px-4 mb-6">
          <div className="w-full h-[85vh] flex justify-center bg-black rounded-xl overflow-hidden shadow-2xl border-4 border-slate-900">
            <VideoPlay />
          </div>
        </div>
        <Passing />
        <MasterDownload />
      </main>

    </>
  );
}
