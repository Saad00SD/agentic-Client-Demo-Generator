"use client";

import React, { useState } from "react";
import { X, ExternalLink, Download, RefreshCw, Monitor, Smartphone } from "lucide-react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewUrl: string;
  downloadUrl: string;
  clientName: string;
  platformName: string;
}

export default function PreviewModal({
  isOpen,
  onClose,
  previewUrl,
  downloadUrl,
  clientName,
  platformName
}: PreviewModalProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [iframeKey, setIframeKey] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-6xl h-[92vh] glass-panel bg-gray-900/95 border border-gray-700/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950/80">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Live Preview: <span className="text-blue-400">{clientName}</span> {platformName}
              </h2>
              <p className="text-xs text-gray-400">Isolated generated static demo environment</p>
            </div>
          </div>

          {/* Device Controls & Actions */}
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-800/80 p-1 rounded-lg border border-gray-700/60">
              <button
                onClick={() => setDevice("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  device === "desktop"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Desktop (1440px)
              </button>
              <button
                onClick={() => setDevice("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  device === "mobile"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile (390px)
              </button>
            </div>

            <button
              onClick={() => setIframeKey((prev) => prev + 1)}
              className="p-2 text-gray-400 hover:text-white bg-gray-800/60 hover:bg-gray-700/60 rounded-lg transition"
              title="Refresh Preview"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition border border-gray-700"
            >
              <ExternalLink className="w-3.5 h-3.5" /> New Tab
            </a>

            <a
              href={downloadUrl}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-md shadow-emerald-900/30"
            >
              <Download className="w-4 h-4" /> Download ZIP
            </a>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Frame Container */}
        <div className="flex-1 bg-gray-950 flex items-center justify-center p-4 overflow-hidden relative">
          <div
            className={`transition-all duration-300 h-full flex flex-col bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 ${
              device === "mobile" ? "w-[390px] h-[780px]" : "w-full"
            }`}
          >
            <iframe
              key={iframeKey}
              src={previewUrl}
              className="w-full h-full border-0 bg-white"
              title={`${clientName} Preview`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
