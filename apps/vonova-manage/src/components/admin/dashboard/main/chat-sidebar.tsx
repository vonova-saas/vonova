import React from "react";

interface ChatSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function ChatSidebar({ open, onClose }: ChatSidebarProps) {
  return (
    <div
      className={`fixed inset-0 z-50 transition-all ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      {/* Sidebar */}
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-xl transition-transform duration-300 flex flex-col items-center justify-center ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <button
          className="absolute top-4 right-4 text-lg p-2 rounded hover:bg-muted"
          onClick={onClose}
          aria-label="Close chat sidebar"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-center">Chat part</h2>
      </aside>
    </div>
  );
}
