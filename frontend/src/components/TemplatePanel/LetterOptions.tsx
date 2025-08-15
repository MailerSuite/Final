import React from 'react'

export const LETTERS = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(65 + i),
)

interface Props {
  onSelect?: (letter: string) => void
}

export default function LetterOptions({ onSelect }: Props) {
  return (
    <div className="max-h-60 overflow-y-auto grid grid-cols-5 gap-2 p-2">
      {LETTERS.map((l) => (
        <button
          key={l}
          onClick={() => onSelect?.(l)}
          className="rounded border px-2 py-1 text-sm hover:bg-accent"
        >
          {l}
        </button>
      ))}
    </div>
  )
}
