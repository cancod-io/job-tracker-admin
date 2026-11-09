"use client";

import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  profilePictureUrl?: string | null;
  sizeClass?: string;
  textClass?: string;
};

export function UserAvatar({
  name,
  profilePictureUrl,
  sizeClass = "size-9",
  textClass = "text-sm",
}: UserAvatarProps) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";

  if (profilePictureUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profilePictureUrl}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", sizeClass)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-foreground",
        sizeClass,
        textClass,
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}
