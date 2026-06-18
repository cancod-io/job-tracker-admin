import { redirect } from "next/navigation";

/** Legacy path — API Configuration lives at `/api-config` like other admin pages. */
export default function LegacyApiConfigRedirect() {
  redirect("/api-config");
}
