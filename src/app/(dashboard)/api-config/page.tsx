import { redirect } from "next/navigation";

/** Canonical page is `/settings/api-config`. */
export default function LegacyApiConfigRedirect() {
  redirect("/settings/api-config");
}
