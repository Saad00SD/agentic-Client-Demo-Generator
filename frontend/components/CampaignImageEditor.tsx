"use client";

import { useEffect, useRef, useState } from "react";
import { Move } from "lucide-react";

export default function CampaignImageEditor({ source, onSave, onClose, outputWidth = 1280, outputHeight = 720 }: {
  outputWidth?: number; outputHeight?: number;
  source: string; onSave: (image: string) => void; onClose: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [mode, setMode] = useState("fit");
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const drag = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const scale = image ? (mode === "fit" ? Math.min : Math.max)(outputWidth / image.naturalWidth, outputHeight / image.naturalHeight) * zoom : 1;
  const width = image ? image.naturalWidth * scale : 0;
  const height = image ? image.naturalHeight * scale : 0;
  const moveImage = (dx: number, dy: number) => {
    const limitX = Math.abs(outputWidth - width) / 2;
    const limitY = Math.abs(outputHeight - height) / 2;
    setPosition(previous => ({
      x: Math.max(-limitX, Math.min(limitX, previous.x + dx)),
      y: Math.max(-limitY, Math.min(limitY, previous.y + dy))
    }));
  };
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
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, outputWidth, outputHeight);
    context.drawImage(image, (outputWidth - width) / 2 + position.x, (outputHeight - height) / 2 + position.y, width, height);
  }, [image, width, height, position, outputWidth, outputHeight]);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="image-editor-title" className="bg-gray-900 text-white rounded-xl p-5 w-full max-w-2xl max-h-[95vh] overflow-auto border border-gray-700">
        <h2 id="image-editor-title" className="text-lg font-semibold flex items-center gap-2"><Move className="w-5 h-5 text-blue-400" /> Adjust campaign image</h2>
        <p className="text-sm text-gray-400 my-2">Drag the image to move it. Use Crop and Zoom to frame the area you want. You can also focus the preview and use the arrow keys.</p>
        <canvas ref={canvas} width={outputWidth} height={outputHeight}
          tabIndex={0} aria-label="Campaign image preview. Drag to move or use arrow keys."
          className={`w-full bg-white rounded-lg touch-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onPointerDown={event => {
            if (!image || event.button !== 0 || drag.current) return;
            event.currentTarget.focus();
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
            setIsDragging(true);
          }}
          onPointerMove={event => {
            const previous = drag.current;
            if (!previous || previous.pointerId !== event.pointerId) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            if (!bounds.width || !bounds.height) return;
            moveImage((event.clientX - previous.x) * outputWidth / bounds.width, (event.clientY - previous.y) * outputHeight / bounds.height);
            drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
          }}
          onPointerUp={event => {
            if (drag.current?.pointerId !== event.pointerId) return;
            drag.current = null;
            setIsDragging(false);
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => { drag.current = null; setIsDragging(false); }}
          onLostPointerCapture={() => { drag.current = null; setIsDragging(false); }}
          onKeyDown={event => {
            if (!image) return;
            const step = event.shiftKey ? 20 : 5;
            const directions: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
            const delta = directions[event.key];
            if (delta) { event.preventDefault(); moveImage(...delta); }
          }}
        />
        {error && <p role="alert" className="text-red-400">{error}</p>}
        <label className="block mt-4 text-sm">Image layout
          <select autoFocus value={mode} onChange={e => { setMode(e.target.value); setZoom(1); setPosition({ x: 0, y: 0 }); }} className="ml-3 bg-gray-800 p-2 rounded">
            <option value="fit">Fit full image</option><option value="crop">Crop to fill</option>
          </select>
        </label>
        {mode === "crop" && <div className="grid gap-3 mt-4">
          <label>Zoom <input aria-label="Zoom" className="w-full" type="range" min="1" max="3" step="0.01" value={zoom} onChange={e => { setZoom(Number(e.target.value)); setPosition({ x: 0, y: 0 }); }} /></label>
        </div>}
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded">Cancel</button>
          <button disabled={!image || !!error} onClick={() => { if (canvas.current) onSave(canvas.current.toDataURL("image/png")); }} className="px-4 py-2 bg-blue-600 rounded disabled:opacity-40">Use image</button>
        </div>
      </section>
    </div>
  );
}
