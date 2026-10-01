'use client';

import React from 'react';

/** Tách chuỗi note nối bằng • ; | \n thành mảng dòng sạch (RULES §5A / SKILLS §6A). */
export function splitNoteLines(note?: string | null): string[] {
  if (!note) return [];
  return note
    .replace(/^📝?\s*Ghi chú:\s*/i, '')
    .split(/•|;|\||\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Ghi chú đa dòng cho màn hình tối (KDS/POS): chữ cam/vàng + bullet. */
export function NoteLinesDark({ note, className = '' }: { note?: string | null; className?: string }) {
  const lines = splitNoteLines(note);
  if (lines.length === 0) return null;
  return (
    <div className={`space-y-0.5 ${className}`}>
      {lines.map((line, idx) => (
        <div key={idx} className="flex items-start gap-1 leading-tight text-xs text-amber-300">
          <span className="text-orange-400/70 font-bold select-none">•</span>
          <span>{line}</span>
        </div>
      ))}
    </div>
  );
}

/** Ghi chú đa dòng cho bill in nhiệt: chữ đen `- xxx`. */
export function NoteLinesPrint({ note, className = '' }: { note?: string | null; className?: string }) {
  const lines = splitNoteLines(note);
  if (lines.length === 0) return null;
  return (
    <div className={className}>
      {lines.map((line, nIdx) => (
        <div key={nIdx} className="leading-tight text-xs text-black">
          - {line}
        </div>
      ))}
    </div>
  );
}

export default splitNoteLines;
