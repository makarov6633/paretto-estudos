"use client";

import React from "react";

type AmbientBackgroundProps = {
  className?: string;
};

export function AmbientBackground({ className }: AmbientBackgroundProps) {
  return (
    <div
      className={
        "absolute inset-0 -z-10 pointer-events-none " + (className ?? "")
      }
    >
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.35,
          background: "radial-gradient(var(--ambient-dot) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.22,
          background: "linear-gradient(to right, var(--ambient-line) 1px, transparent 1px), linear-gradient(to bottom, var(--ambient-line) 1px, transparent 1px)",
          backgroundSize: "120px 1px, 1px 120px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--overlay-strong)] via-transparent to-[color:var(--overlay-strong)]" />
    </div>
  );
}

export default AmbientBackground;
