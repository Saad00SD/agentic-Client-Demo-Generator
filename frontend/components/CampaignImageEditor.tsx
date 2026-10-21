"use client";

import { useEffect, useRef, useState } from "react";

export default function CampaignImageEditor({ source, onSave, onClose, outputWidth = 1280, outputHeight = 720 }: {
  outputWidth?: number; outputHeight?: number;
  source: string; onSave: (image: string) => void; onClose: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [mode, setMode] = useState("fit");
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [error, setError] = useState("");
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImage(img);
    img.onerror = () => setError("This image could not be opened. Choose another image.");
    img.src = source;
    return () => { img.onload = null; img.onerror = null; };
  }, [source]);
  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context || !image) return;
    const scale = (mode === "fit" ? Math.min : Math.max)(outputWidth / image.naturalWidth, outputHeight / image.naturalHeight) * zoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, outputWidth, outputHeight);
    context.drawImage(image, (outputWidth - width) * x / 100, (outputHeight - height) * y / 100, width, height);
  }, [image, mode, zoom, x, y, outputWidth, outputHeight]);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="image-editor-title" className="bg-gray-900 text-white rounded-xl p-5 w-full max-w-2xl max-h-[95vh] overflow-auto border border-gray-700">
        <h2 id="image-editor-title" className="text-lg font-semibold">Adjust campaign image</h2>
        <p className="text-sm text-gray-400 my-2">Fit keeps the entire image visible. Crop lets you choose which area to show. White space is included in the saved image.</p>
        <canvas ref={canvas} width={outputWidth} height={outputHeight} aria-label="Campaign image preview" className="w-full bg-white rounded-lg" />
        {error && <p role="alert" className="text-red-400">{error}</p>}
        <label className="block mt-4 text-sm">Image layout
          <select autoFocus value={mode} onChange={e => { setMode(e.target.value); setZoom(1); setX(50); setY(50); }} className="ml-3 bg-gray-800 p-2 rounded">
            <option value="fit">Fit full image</option><option value="crop">Crop to fill</option>
          </select>
        </label>
        {mode === "crop" && <div className="grid gap-3 mt-4">
          <label>Zoom <input aria-label="Zoom" className="w-full" type="range" min="1" max="3" step="0.01" value={zoom} onChange={e => setZoom(Number(e.target.value))} /></label>
          <label>Horizontal position <input aria-label="Horizontal position" className="w-full" type="range" min="0" max="100" value={x} onChange={e => setX(Number(e.target.value))} /></label>
          <label>Vertical position <input aria-label="Vertical position" className="w-full" type="range" min="0" max="100" value={y} onChange={e => setY(Number(e.target.value))} /></label>
        </div>}
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded">Cancel</button>
          <button disabled={!image || !!error} onClick={() => { if (canvas.current) onSave(canvas.current.toDataURL("image/png")); }} className="px-4 py-2 bg-blue-600 rounded disabled:opacity-40">Use image</button>
        </div>
      </section>
    </div>
  );
}
