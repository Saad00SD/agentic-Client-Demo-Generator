"use client";

import { useEffect, useRef } from "react";
import { Layers, RefreshCw } from "lucide-react";

export default function GenerationModal({ clientName }: { clientName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;

    dialog?.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="generation-title"
      aria-describedby="generation-description"
      onCancel={(event) => event.preventDefault()}
      className="generation-dialog fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-8 text-center text-gray-100 shadow-2xl"
    >
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
        <Layers aria-hidden="true" className="h-7 w-7 text-white" />
      </div>
      <h2 id="generation-title" tabIndex={-1} autoFocus className="text-xl font-bold outline-none">
        Generating your client demo
      </h2>
      <p id="generation-description" className="mt-3 break-words text-sm leading-6 text-gray-400">
        We’re preparing {clientName}’s demo with your branding and content.
        This window will close automatically when it’s ready.
      </p>
      <div className="mt-7" role="status" aria-live="polite">
        <div className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-blue-300">
          <RefreshCw aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />
          Generating demo…
        </div>
        <div
          role="progressbar"
          aria-label="Client demo generation in progress"
          className="h-2 overflow-hidden rounded-full bg-gray-800"
        >
          <div className="generation-progress h-full w-1/3 rounded-full bg-gradient-to-r from-blue-500 to-teal-400" />
        </div>
      </div>
      <p className="mt-4 text-xs text-gray-500">Please keep this page open.</p>
    </dialog>
  );
}
