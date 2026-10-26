"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogIn, Settings, UserRound } from "lucide-react";

export default function UserAccountMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label="User account options"
        aria-expanded={isOpen}
        aria-controls="user-account-options"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900 p-1.5 text-gray-300 transition hover:border-blue-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400 sm:pr-3"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/15 text-blue-300">
          <UserRound aria-hidden="true" className="h-4 w-4" />
        </span>
        <span className="hidden text-xs font-medium sm:inline">Guest</span>
        <ChevronDown aria-hidden="true" className={`hidden h-3.5 w-3.5 transition-transform sm:block ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          id="user-account-options"
          className="absolute right-0 top-full mt-3 w-64 overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl shadow-black/40"
        >
          <div className="border-b border-gray-800 px-4 py-3">
            <p className="text-sm font-semibold text-white">Guest account</p>
            <p className="mt-1 text-xs text-gray-400">You’re browsing as a guest.</p>
          </div>
          <div className="space-y-1 p-2">
            {[
              { label: "Sign in", icon: LogIn },
              { label: "My profile", icon: UserRound },
              { label: "Account settings", icon: Settings },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-gray-500"
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                {label}
                <span className="ml-auto text-[10px] text-gray-500">Soon</span>
              </button>
            ))}
          </div>
          <p className="border-t border-gray-800 px-4 py-3 text-[11px] leading-5 text-gray-400">
            Login and account features are coming soon.
          </p>
        </div>
      )}
    </div>
  );
}
