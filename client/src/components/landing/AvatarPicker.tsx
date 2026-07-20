import { ChevronLeft, ChevronRight, Dices } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AVATAR_IDS, avatarSrc, randomAvatarId } from "@/lib/avatars"

interface AvatarPickerProps {
  avatarId: string
  onAvatarChange: (avatarId: string) => void
}

export function AvatarPicker({ avatarId, onAvatarChange }: AvatarPickerProps) {
  const index = Math.max(0, AVATAR_IDS.indexOf(avatarId))

  const cycle = (direction: 1 | -1) => {
    const next = (index + direction + AVATAR_IDS.length) % AVATAR_IDS.length
    onAvatarChange(AVATAR_IDS[next])
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <Button type="button" variant="ghost" size="icon" onClick={() => cycle(-1)} aria-label="Previous avatar">
        <ChevronLeft className="size-5" />
      </Button>

      <div className="relative">
        <img
          src={avatarSrc(avatarId)}
          alt="Your avatar"
          className="size-24 rounded-full border-4 border-white object-cover shadow-lg"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute -bottom-1 -right-1 size-8 rounded-full shadow"
          onClick={() => onAvatarChange(randomAvatarId())}
          aria-label="Randomize avatar"
        >
          <Dices className="size-4" />
        </Button>
      </div>

      <Button type="button" variant="ghost" size="icon" onClick={() => cycle(1)} aria-label="Next avatar">
        <ChevronRight className="size-5" />
      </Button>
    </div>
  )
}
