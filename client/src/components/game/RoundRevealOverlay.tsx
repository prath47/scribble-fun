interface RoundRevealOverlayProps {
  word: string
}

export function RoundRevealOverlay({ word }: RoundRevealOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-black/60 text-white backdrop-blur-sm">
      <p className="text-sm font-medium text-white/80">The word was</p>
      <p className="text-3xl font-black capitalize">{word}</p>
      <p className="mt-2 text-sm text-white/70">Next round starting…</p>
    </div>
  )
}
