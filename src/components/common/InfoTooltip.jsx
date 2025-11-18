import React from "react";

/**
 * Simple info tooltip with larger, readable text.
 * Usage: <InfoTooltip text="Helpful explanation here" />
 */
export default function InfoTooltip({ text, className = "" }) {
  return (
    <span className={`relative group inline-flex items-center ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4 text-gray-500 hover:text-gray-700"
        aria-hidden="true"
        role="img"
      >
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-.001 15a1 1 0 0 1-1-1v-5a1 1 0 1 1 2 0v5a1 1 0 0 1-1 1zm0-8a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
      </svg>
      <span
        className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg bg-gray-900 text-white text-base leading-snug max-w-sm w-80 p-3 rounded-lg z-50"
        role="tooltip"
      >
        {text}
      </span>
    </span>
  );
}
