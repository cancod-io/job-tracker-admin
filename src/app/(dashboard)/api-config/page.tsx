import { redirect } from "next/navigation";

export default function LegacyApiConfigRedirect() {
  redirect("/settings/api-config");
}
