export const AVATAR_COUNT = 45

export const AVATAR_IDS: string[] = Array.from({ length: AVATAR_COUNT }, (_, i) => String(i + 1).padStart(2, "0"))

export function avatarSrc(avatarId: string): string {
  return `/avatars/avatar-${avatarId}.jpg`
}

export function randomAvatarId(): string {
  return AVATAR_IDS[Math.floor(Math.random() * AVATAR_IDS.length)]
}
