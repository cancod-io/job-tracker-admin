import type { Metadata } from "next";
import { UserLoginForm } from "@/components/auth/user-login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Shopify Job Tracker.",
};

export default function UserLoginPage() {
  return (
    <main id="main-content" tabIndex={-1} className="w-full max-w-lg outline-none">
      <UserLoginForm />
    </main>
  );
}
