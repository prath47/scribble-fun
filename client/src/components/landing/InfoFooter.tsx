import { HelpCircle, Newspaper, Pencil } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const COLUMNS = [
  {
    icon: HelpCircle,
    title: "About",
    body: "Scribble is a free real-time multiplayer drawing and guessing game. Draw the secret word while everyone else races to guess it in chat.",
  },
  {
    icon: Newspaper,
    title: "News",
    body: "Landing page and room lobby are live. Word choice, drawing, and scoring are coming in the next update.",
  },
  {
    icon: Pencil,
    title: "How to play",
    body: "Each round one player draws a secret word. Guess it correctly before time runs out to earn points — the faster you guess, the more you earn.",
  },
] as const

export function InfoFooter() {
  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-3 px-4 pb-12">
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {COLUMNS.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="border-white/10 bg-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Icon className="size-5" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-white/80">{body}</CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-white/50">
        Avatars by{" "}
        <a href="https://www.freepik.com" target="_blank" rel="noreferrer" className="underline hover:text-white/80">
          Kubanek / Freepik
        </a>
      </p>
    </div>
  )
}
