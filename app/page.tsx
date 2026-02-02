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
      <main className="mt-14 pb-12 bg-gray-50 min-h-screen">
        {/* Full Width Video Section */}
        <div className="w-full px-4 pt-4 mb-2">
          <div className="w-full h-[85vh] flex justify-center bg-black rounded-2xl overflow-hidden border border-slate-200 shadow-2xl">
            <VideoPlay />
          </div>
        </div>
        <Passing />
      </main>

    </>
  );
}
