export const defaultAvatarUrl = "/images/AVATARES/cerebrolector.png";

export const avatarOptions = [
  defaultAvatarUrl,
  "/images/AVATARES/cafeboss.png",
  "/images/AVATARES/ceodespegue.png",
  "/images/AVATARES/ceoprogreso.png",
  "/images/AVATARES/ceotrofeo.png",
  "/images/AVATARES/ideamoney.png",
  "/images/AVATARES/moneyboss.png",
] as const;

export function isCeotecaAvatar(value: string | null | undefined) {
  return avatarOptions.includes(value as (typeof avatarOptions)[number]);
}
