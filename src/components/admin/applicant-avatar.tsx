"use client";

import { avatarTint, initials } from "@/lib/applicant-status";
import { cn } from "@/lib/utils";
import { useApplicantAvatar } from "@/hooks/use-applicant-avatar";

type ApplicantAvatarProps = {
  userId: number;
  /** Used for initials + deterministic tint when no avatar is available. */
  name: string;
  profilePictureUrl: string | null;
  /** Backend signal when URL is absent but an avatar file exists. */
  hasAvatar?: boolean;
  /** Always attempt download (e.g. open user detail panel). */
  attemptFetch?: boolean;
  /** Tailwind size class for the circle, e.g. "size-7", "size-12". */
  sizeClass?: string;
  /** Initials font-size class. */
  textClass?: string;
  /** Card-colored ring — used in overlapping avatar stacks. */
  ring?: boolean;
  title?: string;
};

/**
 * Applicant avatar: shows the uploaded profile image when one exists, otherwise
 * falls back to a tinted initials chip. The image is fetched with the admin's
 * Bearer token (see `useApplicantAvatar`) since `<img src>` can't carry auth.
 */
export function ApplicantAvatar({
  userId,
  name,
  profilePictureUrl,
  hasAvatar,
  attemptFetch,
  sizeClass = "size-7",
  textClass = "text-[0.7rem]",
  ring = false,
  title,
}: ApplicantAvatarProps) {
  const { displayUrl } = useApplicantAvatar(userId, profilePictureUrl, {
    hasAvatar,
    attemptFetch,
  });

  const base = cn(
    "flex shrink-0 items-center justify-center overflow-hidden rounded-full",
    sizeClass,
    ring && "border-2 border-card",
  );

  if (displayUrl) {
    return (
      <span className={base} title={title}>
        {/* Blob/object URL from authenticated avatar fetch — next/image cannot use these. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={displayUrl} alt="" className="size-full object-cover" loading="lazy" />
      </span>
    );
  }

  return (
    <span
      className={cn(base, "font-semibold", textClass, avatarTint(name))}
      title={title}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
