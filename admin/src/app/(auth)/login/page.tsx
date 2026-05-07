import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in · Admin",
  description: "Sign in to the Shopify Job Tracker admin console.",
};

export default function AdminLoginPage() {
  return (
    <main id="main-content" tabIndex={-1} className="w-full max-w-lg outline-none">
      <LoginForm />
    </main>
  );
}
