import type { Metadata } from "next";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Confirm your email address for the TrackCod admin console.",
};

export default function AdminVerifyEmailPage() {
  return (
    <main id="main-content" tabIndex={-1} className="w-full max-w-lg outline-none">
      <VerifyEmailForm />
    </main>
  );
}
